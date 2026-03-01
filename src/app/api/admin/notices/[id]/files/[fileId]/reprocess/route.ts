import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { ingestNoticeFileRag } from "@/lib/rag/ingestNoticeFile";

const STORAGE_BUCKET = "notice-files";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id: noticeId, fileId } = await params;
  const { data: fileRow, error: fileError } = await auth.supabase
    .from("notice_files")
    .select("id,notice_id,file_name,mime_type,storage_path")
    .eq("id", fileId)
    .eq("notice_id", noticeId)
    .maybeSingle();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 });
  }
  if (!fileRow?.storage_path) {
    return NextResponse.json({ error: "Arquivo nao encontrado para reprocessamento." }, { status: 404 });
  }

  const { data: fileBytes, error: downloadError } = await auth.supabase.storage
    .from(STORAGE_BUCKET)
    .download(fileRow.storage_path);
  if (downloadError || !fileBytes) {
    return NextResponse.json({ error: "Nao foi possivel baixar o arquivo no storage." }, { status: 400 });
  }

  const bytes = new Uint8Array(await fileBytes.arrayBuffer());
  const result = await ingestNoticeFileRag({
    supabase: auth.supabase,
    noticeId,
    noticeFileId: fileId,
    fileName: fileRow.file_name,
    mimeType: fileRow.mime_type ?? "application/octet-stream",
    bytes
  });

  return NextResponse.json({
    reprocessed: true,
    status: result.status,
    extractionMethod: result.extractionMethod,
    extractedCharCount: result.extractedCharCount,
    chunkCount: result.chunkCount,
    warning: result.warning ?? null
  });
}
