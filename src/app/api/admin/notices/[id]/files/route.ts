import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { ingestNoticeFileRag } from "@/lib/rag/ingestNoticeFile";

const STORAGE_BUCKET = "notice-files";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id: noticeId } = await params;
  const firstTry = await auth.supabase
    .from("notice_files")
    .select(
      "id,notice_id,file_name,display_name,size_bytes,created_at,rag_status,rag_extraction_method,rag_extracted_char_count,rag_chunk_count,rag_last_error,rag_processed_at"
    )
    .eq("notice_id", noticeId)
    .order("created_at", { ascending: false });

  const fallbackTry =
    firstTry.error &&
    (firstTry.error.message.includes("display_name") || firstTry.error.message.includes("rag_status"))
      ? await auth.supabase
          .from("notice_files")
          .select("id,notice_id,file_name,size_bytes,created_at")
          .eq("notice_id", noticeId)
          .order("created_at", { ascending: false })
      : null;

  const dataRows = (firstTry.data ?? fallbackTry?.data ?? []) as Array<{
    id: string;
    notice_id: string;
    file_name: string;
    display_name?: string | null;
    size_bytes: number;
    created_at: string;
    rag_status?: "ready" | "empty" | "error" | null;
    rag_extraction_method?: "text" | "ocr" | "unknown" | null;
    rag_extracted_char_count?: number | null;
    rag_chunk_count?: number | null;
    rag_last_error?: string | null;
    rag_processed_at?: string | null;
  }>;

  // Reconcilia o status exibido com os chunks efetivamente persistidos.
  const chunkRowsResult = await auth.supabase
    .from("document_chunks")
    .select("id,documents!inner(notice_file_id,notice_id)")
    .eq("documents.notice_id", noticeId)
    .limit(5000);
  const chunkCountByFileId = new Map<string, number>();
  if (!chunkRowsResult.error && chunkRowsResult.data) {
    for (const row of chunkRowsResult.data as Array<{
      documents: { notice_file_id?: string | null } | Array<{ notice_file_id?: string | null }>;
    }>) {
      const docData = Array.isArray(row.documents) ? row.documents[0] : row.documents;
      const noticeFileId = docData?.notice_file_id;
      if (!noticeFileId) continue;
      chunkCountByFileId.set(noticeFileId, (chunkCountByFileId.get(noticeFileId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    files: dataRows.map((row) => {
      const persistedChunks = chunkCountByFileId.get(row.id) ?? 0;
      const effectiveChunkCount = Math.max(row.rag_chunk_count ?? 0, persistedChunks);
      const effectiveStatus =
        effectiveChunkCount > 0 ? "ready" : row.rag_status ?? "empty";
      return {
        id: row.id,
        noticeId: row.notice_id,
        fileName: row.file_name,
        displayName: row.display_name ?? row.file_name,
        sizeKb: Math.max(1, Math.round((row.size_bytes ?? 0) / 1024)),
        createdAt: row.created_at,
        ragStatus: effectiveStatus,
        ragExtractionMethod: row.rag_extraction_method ?? "unknown",
        ragExtractedCharCount: row.rag_extracted_char_count ?? 0,
        ragChunkCount: effectiveChunkCount,
        ragLastError: row.rag_last_error ?? null,
        ragProcessedAt: row.rag_processed_at ?? null
      };
    })
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id: noticeId } = await params;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const rawDisplayNames = formData.get("displayNames");
  const displayNames = typeof rawDisplayNames === "string" ? (JSON.parse(rawDisplayNames) as string[]) : [];

  if (!noticeId || files.length === 0) {
    return NextResponse.json({ error: "Notice e arquivos sao obrigatorios." }, { status: 400 });
  }

  const uploads: Array<{
    id: string;
    notice_id: string;
    file_name: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    bytes: Uint8Array;
    display_name: string | null;
  }> = [];

  for (const [index, file] of files.entries()) {
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filePath = `${noticeId}/${crypto.randomUUID()}.${extension}`;
    const bytesArray = new Uint8Array(await file.arrayBuffer());

    const { error: storageError } = await auth.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, bytesArray, { contentType: file.type, upsert: false });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 400 });
    }

    uploads.push({
      id: crypto.randomUUID(),
      notice_id: noticeId,
      file_name: file.name,
      storage_path: filePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      bytes: bytesArray,
      display_name: displayNames[index]?.trim() || null
    });
  }

  const recordsWithDisplayName = uploads.map((item) => ({
    id: item.id,
    notice_id: item.notice_id,
    storage_path: item.storage_path,
    file_name: item.file_name,
    display_name: item.display_name,
    mime_type: item.mime_type,
    size_bytes: item.size_bytes,
    uploaded_by: auth.user.id,
    rag_status: "empty",
    rag_extraction_method: "unknown",
    rag_extracted_char_count: 0,
    rag_chunk_count: 0,
    rag_last_error: null,
    rag_processed_at: null
  }));
  const recordsFallback = recordsWithDisplayName.map((record) => ({
    id: record.id,
    notice_id: record.notice_id,
    storage_path: record.storage_path,
    file_name: record.file_name,
    mime_type: record.mime_type,
    size_bytes: record.size_bytes,
    uploaded_by: record.uploaded_by
  }));

  const firstInsert = await auth.supabase.from("notice_files").insert(recordsWithDisplayName);
  const fallbackInsert =
    firstInsert.error &&
    (firstInsert.error.message.includes("display_name") || firstInsert.error.message.includes("rag_status"))
      ? await auth.supabase.from("notice_files").insert(recordsFallback)
      : null;
  const metadataError = firstInsert.error && !fallbackInsert ? firstInsert.error : fallbackInsert?.error ?? null;

  if (metadataError) {
    return NextResponse.json({ error: metadataError.message }, { status: 400 });
  }

  const ragWarnings: string[] = [];
  for (const upload of uploads) {
    const ingestion = await ingestNoticeFileRag({
      supabase: auth.supabase,
      noticeId: upload.notice_id,
      noticeFileId: upload.id,
      fileName: upload.file_name,
      mimeType: upload.mime_type,
      bytes: upload.bytes
    });
    if (!ingestion.success && ingestion.warning) {
      ragWarnings.push(ingestion.warning);
    }
  }

  return NextResponse.json({ uploaded: uploads.length, ragWarnings }, { status: 201 });
}
