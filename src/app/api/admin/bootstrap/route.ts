import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { getAdminUploadedFiles, getHubData } from "@/lib/data/hubRepository";

export async function GET() {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const [hubData, uploadedFiles] = await Promise.all([getHubData(), getAdminUploadedFiles()]);
  return NextResponse.json({
    agencias: hubData.agencias,
    editais: hubData.editais,
    topicos: hubData.topicos,
    uploadedFiles
  });
}
