import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";

const createAgencySchema = z.object({
  nome: z.string().min(2),
  sigla: z.string().min(2),
  descricao: z.string().min(5)
});

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createAgencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = parsed.data;

  const { data, error } = await auth.supabase
    .from("agencies")
    .insert({
      name: payload.nome.trim(),
      acronym: payload.sigla.trim().toUpperCase(),
      description: payload.descricao.trim()
    })
    .select("id,name,acronym,description")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      id: data.id,
      nome: data.name,
      sigla: data.acronym,
      descricao: data.description
    },
    { status: 201 }
  );
}
