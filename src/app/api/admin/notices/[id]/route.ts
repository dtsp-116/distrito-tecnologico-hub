import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";

const updateNoticeSchema = z.object({
  nome: z.string().min(3),
  agenciaId: z.string().uuid(),
  linkAcesso: z.string().url().optional().or(z.literal("")),
  status: z.enum(["aberto", "encerrado", "em_breve"]),
  dataPublicacao: z.string().min(8),
  dataLimite: z.string().min(8),
  resumo: z.string().min(6),
  descricao: z.string().min(10),
  valorMinimo: z.coerce.number().nonnegative().optional().nullable(),
  valorMaximo: z.coerce.number().nonnegative().optional().nullable(),
  trlMinimo: z.coerce.number().int().min(1).max(9).optional().nullable(),
  trlMaximo: z.coerce.number().int().min(1).max(9).optional().nullable(),
  tags: z.array(z.string().min(1)).default([])
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateNoticeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = parsed.data;

  const baseUpdate = {
    title: payload.nome.trim(),
    agency_id: payload.agenciaId,
    access_link: payload.linkAcesso || null,
    status: payload.status,
    publish_date: payload.dataPublicacao,
    deadline_date: payload.dataLimite,
    summary: payload.resumo.trim(),
    description: payload.descricao.trim()
  };

  const rangedUpdate = {
    ...baseUpdate,
    budget_min: payload.valorMinimo ?? null,
    budget_max: payload.valorMaximo ?? null,
    trl_min: payload.trlMinimo ?? null,
    trl_max: payload.trlMaximo ?? null
  };

  const firstTry = await auth.supabase.from("notices").update(rangedUpdate).eq("id", id).select("id").single();
  let updateError = firstTry.error;
  let savedWithoutRangeFields = false;

  if (updateError) {
    const missingRangeColumns =
      updateError.message.includes("budget_min") ||
      updateError.message.includes("budget_max") ||
      updateError.message.includes("trl_min") ||
      updateError.message.includes("trl_max");

    if (missingRangeColumns) {
      const fallback = await auth.supabase.from("notices").update(baseUpdate).eq("id", id).select("id").single();
      updateError = fallback.error;
      savedWithoutRangeFields = !fallback.error;
    }
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await auth.supabase.from("notice_tags").delete().eq("notice_id", id);

  const uniqueTags = Array.from(new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean)));
  if (uniqueTags.length > 0) {
    const insertedTagIds: string[] = [];
    for (const tagName of uniqueTags) {
      const slug = slugify(tagName);
      const { data: tag, error: upsertError } = await auth.supabase
        .from("tags")
        .upsert({ name: tagName, slug }, { onConflict: "slug" })
        .select("id")
        .single();

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 400 });
      }
      insertedTagIds.push(tag.id);
    }

    const { error: relationError } = await auth.supabase.from("notice_tags").insert(
      insertedTagIds.map((tagId) => ({
        notice_id: id,
        tag_id: tagId
      }))
    );
    if (relationError) {
      return NextResponse.json({ error: relationError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id, savedWithoutRangeFields });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const { data: files } = await auth.supabase.from("notice_files").select("storage_path").eq("notice_id", id);
  if (files && files.length > 0) {
    await auth.supabase.storage
      .from("notice-files")
      .remove(files.map((file) => file.storage_path).filter(Boolean));
  }

  const { error } = await auth.supabase.from("notices").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
