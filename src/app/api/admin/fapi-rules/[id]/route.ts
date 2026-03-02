import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { deleteFapiRuleController, updateFapiRuleController } from "@/modules/fapi/controllers/fapiRulesAdminController";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { id } = await params;
    const result = await updateFapiRuleController({
      supabase: auth.supabase,
      id,
      body
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar regra FAPI." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const result = await deleteFapiRuleController({
      supabase: auth.supabase,
      id
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao excluir regra FAPI." },
      { status: 400 }
    );
  }
}
