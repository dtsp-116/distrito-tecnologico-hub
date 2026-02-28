import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";

const patchFileSchema = z.object({
  displayName: z.string().min(1)
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id, fileId } = await params;
  const body = await request.json();
  const parsed = patchFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const updateWithDisplay = await auth.supabase
    .from("notice_files")
    .update({ display_name: parsed.data.displayName.trim() })
    .eq("id", fileId)
    .eq("notice_id", id);

  if (updateWithDisplay.error) {
    if (updateWithDisplay.error.message.includes("display_name")) {
      return NextResponse.json(
        {
          error:
            "Coluna display_name nao encontrada. Execute a migration 202602281730_notice_files_display_name.sql."
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: updateWithDisplay.error.message }, { status: 400 });
  }

  return NextResponse.json({ updated: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id, fileId } = await params;
  const { data: fileRow, error: fileError } = await auth.supabase
    .from("notice_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("notice_id", id)
    .maybeSingle();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 });
  }

  if (fileRow?.storage_path) {
    await auth.supabase.storage.from("notice-files").remove([fileRow.storage_path]);
  }

  await auth.supabase.from("documents").delete().eq("notice_file_id", fileId);

  const { error: deleteError } = await auth.supabase
    .from("notice_files")
    .delete()
    .eq("id", fileId)
    .eq("notice_id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
