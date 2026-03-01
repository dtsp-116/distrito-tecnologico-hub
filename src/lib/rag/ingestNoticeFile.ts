import { chunkText } from "@/lib/rag/chunkText";
import { generateEmbeddingsBatch, toPgVectorLiteral } from "@/lib/rag/embeddings";
import { extractTextFromFile } from "@/lib/rag/extractText";
import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient;

interface IngestNoticeFileInput {
  supabase: DbClient;
  noticeId: string;
  noticeFileId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}

interface IngestNoticeFileResult {
  success: boolean;
  warning?: string;
  status: "ready" | "empty" | "error";
  extractionMethod: "text" | "ocr" | "unknown";
  extractedCharCount: number;
  chunkCount: number;
  errorMessage?: string;
}

function toSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message.slice(0, 400);
  return fallback;
}

async function updateNoticeFileRagStatus(params: {
  supabase: DbClient;
  noticeId: string;
  noticeFileId: string;
  status: "ready" | "empty" | "error";
  extractionMethod: "text" | "ocr" | "unknown";
  extractedCharCount: number;
  chunkCount: number;
  errorMessage?: string;
}) {
  const updatePayload = {
    rag_status: params.status,
    rag_extraction_method: params.extractionMethod,
    rag_extracted_char_count: params.extractedCharCount,
    rag_chunk_count: params.chunkCount,
    rag_last_error: params.errorMessage ?? null,
    rag_processed_at: new Date().toISOString()
  };

  const updateTry = await params.supabase
    .from("notice_files")
    .update(updatePayload)
    .eq("id", params.noticeFileId)
    .eq("notice_id", params.noticeId)
    .select("id")
    .maybeSingle();

  if (updateTry.error || !updateTry.data) {
    // Fallback 1: atualiza pelo id, caso o notice_id nao esteja sincronizado no front.
    const byIdTry = await params.supabase
      .from("notice_files")
      .update(updatePayload)
      .eq("id", params.noticeFileId)
      .select("id")
      .maybeSingle();

    if (!byIdTry.error && byIdTry.data) {
      return;
    }

    // Fallback 2: compatibilidade com schema antigo sem colunas de observabilidade.
    const fallback = await params.supabase
      .from("notice_files")
      .update({})
      .eq("id", params.noticeFileId)
      .eq("notice_id", params.noticeId);
    if (fallback.error) {
      return;
    }
  }
}

export async function ingestNoticeFileRag({
  supabase,
  noticeId,
  noticeFileId,
  fileName,
  mimeType,
  bytes
}: IngestNoticeFileInput): Promise<IngestNoticeFileResult> {
  try {
    const extracted = await extractTextFromFile(fileName, mimeType, bytes);
    const extractedText = extracted.text;
    const extractedCharCount = extractedText.length;
    const extractionMethod = extracted.method;

    if (!extractedText) {
      await updateNoticeFileRagStatus({
        supabase,
        noticeId,
        noticeFileId,
        status: "empty",
        extractionMethod,
        extractedCharCount: 0,
        chunkCount: 0,
        errorMessage: "Arquivo sem texto extraivel."
      });
      return {
        success: false,
        warning: `Arquivo ${fileName} sem texto extraivel.`,
        status: "empty",
        extractionMethod,
        extractedCharCount: 0,
        chunkCount: 0,
        errorMessage: "Arquivo sem texto extraivel."
      };
    }

    const { data: documentRow, error: documentError } = await supabase
      .from("documents")
      .upsert(
        {
          notice_id: noticeId,
          notice_file_id: noticeFileId,
          file_name: fileName,
          content_preview: extractedText.slice(0, 500),
          status: "ready"
        },
        { onConflict: "notice_file_id" }
      )
      .select("id")
      .single();

    if (documentError || !documentRow) {
      const message = documentError?.message || "Falha ao registrar documento no pipeline RAG.";
      await updateNoticeFileRagStatus({
        supabase,
        noticeId,
        noticeFileId,
        status: "error",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: message
      });
      return {
        success: false,
        warning: `Falha ao registrar documento para ${fileName}.`,
        status: "error",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: message
      };
    }

    await supabase.from("document_chunks").delete().eq("document_id", documentRow.id);

    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      await updateNoticeFileRagStatus({
        supabase,
        noticeId,
        noticeFileId,
        status: "empty",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: "Texto extraido sem conteudo util para chunking."
      });
      return {
        success: false,
        warning: `Arquivo ${fileName} sem conteudo util para chunks.`,
        status: "empty",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: "Texto extraido sem conteudo util para chunking."
      };
    }

    let chunkEmbeddings: number[][] = [];
    if (process.env.OPENAI_API_KEY) {
      try {
        chunkEmbeddings = await generateEmbeddingsBatch(chunks.map((chunk) => chunk.content));
      } catch {
        chunkEmbeddings = [];
      }
    }

    const chunksWithEmbedding = chunks.map((chunk, index) => ({
      document_id: documentRow.id,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: chunkEmbeddings[index] ? toPgVectorLiteral(chunkEmbeddings[index]) : null
    }));
    const chunksWithoutEmbedding = chunksWithEmbedding.map((chunk) => ({
      document_id: chunk.document_id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      token_count: chunk.token_count
    }));

    const firstChunkInsert = await supabase.from("document_chunks").insert(chunksWithEmbedding);
    const fallbackChunkInsert =
      firstChunkInsert.error &&
      (firstChunkInsert.error.message.includes("embedding") || firstChunkInsert.error.message.includes("vector"))
        ? await supabase.from("document_chunks").insert(chunksWithoutEmbedding)
        : null;
    const chunksError =
      firstChunkInsert.error && !fallbackChunkInsert ? firstChunkInsert.error : fallbackChunkInsert?.error ?? null;

    if (chunksError) {
      const message = chunksError.message || "Falha ao salvar chunks do documento.";
      await updateNoticeFileRagStatus({
        supabase,
        noticeId,
        noticeFileId,
        status: "error",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: message
      });
      return {
        success: false,
        warning: `Falha ao salvar chunks para ${fileName}.`,
        status: "error",
        extractionMethod,
        extractedCharCount,
        chunkCount: 0,
        errorMessage: message
      };
    }

    await updateNoticeFileRagStatus({
      supabase,
      noticeId,
      noticeFileId,
      status: "ready",
      extractionMethod,
      extractedCharCount,
      chunkCount: chunks.length
    });

    return {
      success: true,
      status: "ready",
      extractionMethod,
      extractedCharCount,
      chunkCount: chunks.length
    };
  } catch (error) {
    const message = toSafeErrorMessage(error, "Falha inesperada no processamento RAG.");
    await updateNoticeFileRagStatus({
      supabase,
      noticeId,
      noticeFileId,
      status: "error",
      extractionMethod: "unknown",
      extractedCharCount: 0,
      chunkCount: 0,
      errorMessage: message
    });
    return {
      success: false,
      warning: `Falha inesperada no processamento RAG de ${fileName}.`,
      status: "error",
      extractionMethod: "unknown",
      extractedCharCount: 0,
      chunkCount: 0,
      errorMessage: message
    };
  }
}
