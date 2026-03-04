import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureEditorOrAdmin } from "@/lib/auth/adminGuard";

const updateAgencySchema = z.object({
  nome: z.string().min(2).optional(),
  sigla: z.string().min(2).optional(),
  descricao: z.string().min(5).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureEditorOrAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAgencySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = parsed.data;

  if (!payload.nome && !payload.sigla && !payload.descricao) {
    return NextResponse.json(
      { error: "Nenhum campo para atualizar." },
      { status: 400 }
    );
  }

  const update: { name?: string; acronym?: string; description?: string } = {};
  if (payload.nome) update.name = payload.nome.trim();
  if (payload.sigla) update.acronym = payload.sigla.trim().toUpperCase();
  if (payload.descricao) update.description = payload.descricao.trim();

  const { data, error } = await auth.supabase
    .from("agencies")
    .update(update)
    .eq("id", id)
    .select("id,name,acronym,description")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    id: data.id,
    nome: data.name,
    sigla: data.acronym,
    descricao: data.description
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureEditorOrAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { error } = await auth.supabase
    .from("agencies")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

