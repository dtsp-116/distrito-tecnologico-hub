import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { extractTextFromFile } from "@/lib/rag/extractText";
import { chunkText } from "@/lib/rag/chunkText";

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
    .select("id,notice_id,file_name,display_name,size_bytes,created_at")
    .eq("notice_id", noticeId)
    .order("created_at", { ascending: false });

  const fallbackTry =
    firstTry.error && firstTry.error.message.includes("display_name")
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
  }>;

  return NextResponse.json({
    files: dataRows.map((row) => ({
      id: row.id,
      noticeId: row.notice_id,
      fileName: row.file_name,
      displayName: row.display_name ?? row.file_name,
      sizeKb: Math.max(1, Math.round((row.size_bytes ?? 0) / 1024)),
      createdAt: row.created_at
    }))
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
    uploaded_by: auth.user.id
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
    firstInsert.error && firstInsert.error.message.includes("display_name")
      ? await auth.supabase.from("notice_files").insert(recordsFallback)
      : null;
  const metadataError = firstInsert.error && !fallbackInsert ? firstInsert.error : fallbackInsert?.error ?? null;

  if (metadataError) {
    return NextResponse.json({ error: metadataError.message }, { status: 400 });
  }

  const ragWarnings: string[] = [];
  for (const upload of uploads) {
    try {
      const extractedText = await extractTextFromFile(upload.file_name, upload.mime_type, upload.bytes);
      if (!extractedText) {
        ragWarnings.push(`Arquivo ${upload.file_name} sem texto extraivel.`);
        continue;
      }

      const { data: documentRow, error: documentError } = await auth.supabase
        .from("documents")
        .upsert(
          {
            notice_id: upload.notice_id,
            notice_file_id: upload.id,
            file_name: upload.file_name,
            content_preview: extractedText.slice(0, 500),
            status: "ready"
          },
          { onConflict: "notice_file_id" }
        )
        .select("id")
        .single();

      if (documentError || !documentRow) {
        ragWarnings.push(`Falha ao registrar documento para ${upload.file_name}.`);
        continue;
      }

      await auth.supabase.from("document_chunks").delete().eq("document_id", documentRow.id);

      const chunks = chunkText(extractedText);
      if (chunks.length === 0) {
        ragWarnings.push(`Arquivo ${upload.file_name} sem conteudo util para chunks.`);
        continue;
      }

      const { error: chunksError } = await auth.supabase.from("document_chunks").insert(
        chunks.map((chunk) => ({
          document_id: documentRow.id,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          token_count: chunk.tokenCount
        }))
      );

      if (chunksError) {
        ragWarnings.push(`Falha ao salvar chunks para ${upload.file_name}.`);
      }
    } catch {
      ragWarnings.push(`Falha inesperada no processamento RAG de ${upload.file_name}.`);
    }
  }

  return NextResponse.json({ uploaded: uploads.length, ragWarnings }, { status: 201 });
}
