import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";

const createNoticeSchema = z.object({
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

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createNoticeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = parsed.data;
  if (
    payload.valorMinimo !== undefined &&
    payload.valorMinimo !== null &&
    payload.valorMaximo !== undefined &&
    payload.valorMaximo !== null &&
    payload.valorMinimo > payload.valorMaximo
  ) {
    return NextResponse.json({ error: "Valor minimo nao pode ser maior que valor maximo." }, { status: 400 });
  }

  if (
    payload.trlMinimo !== undefined &&
    payload.trlMinimo !== null &&
    payload.trlMaximo !== undefined &&
    payload.trlMaximo !== null &&
    payload.trlMinimo > payload.trlMaximo
  ) {
    return NextResponse.json({ error: "TRL minimo nao pode ser maior que TRL maximo." }, { status: 400 });
  }

  const baseNoticePayload = {
    title: payload.nome.trim(),
    agency_id: payload.agenciaId,
    access_link: payload.linkAcesso || null,
    status: payload.status,
    publish_date: payload.dataPublicacao,
    deadline_date: payload.dataLimite,
    summary: payload.resumo.trim(),
    description: payload.descricao.trim(),
    created_by: auth.user.id
  };

  const rangedNoticePayload = {
    ...baseNoticePayload,
    budget_min: payload.valorMinimo ?? null,
    budget_max: payload.valorMaximo ?? null,
    trl_min: payload.trlMinimo ?? null,
    trl_max: payload.trlMaximo ?? null
  };

  const tryWithRanges = await auth.supabase.from("notices").insert(rangedNoticePayload).select("id").single();

  let notice = tryWithRanges.data;
  let noticeError = tryWithRanges.error;
  let savedWithoutRangeFields = false;

  const missingRangeColumns =
    noticeError?.message?.includes("budget_min") ||
    noticeError?.message?.includes("budget_max") ||
    noticeError?.message?.includes("trl_min") ||
    noticeError?.message?.includes("trl_max");

  if (noticeError && missingRangeColumns) {
    const fallbackInsert = await auth.supabase.from("notices").insert(baseNoticePayload).select("id").single();
    notice = fallbackInsert.data;
    noticeError = fallbackInsert.error;
    savedWithoutRangeFields = !fallbackInsert.error;
  }

  if (noticeError) {
    return NextResponse.json({ error: noticeError.message }, { status: 400 });
  }
  if (!notice) {
    return NextResponse.json({ error: "Nao foi possivel criar edital." }, { status: 400 });
  }

  const uniqueTags = Array.from(new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean)));
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

  if (insertedTagIds.length > 0) {
    const { error: relationError } = await auth.supabase.from("notice_tags").insert(
      insertedTagIds.map((tagId) => ({
        notice_id: notice.id,
        tag_id: tagId
      }))
    );

    if (relationError) {
      return NextResponse.json({ error: relationError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: notice.id, savedWithoutRangeFields }, { status: 201 });
}
