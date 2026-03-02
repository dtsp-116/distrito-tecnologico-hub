import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth/adminGuard";
import { createFapiRuleController, listFapiRulesController } from "@/modules/fapi/controllers/fapiRulesAdminController";

export async function GET() {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  try {
    const result = await listFapiRulesController(auth.supabase);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar regras FAPI." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const result = await createFapiRuleController({
      supabase: auth.supabase,
      body
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao criar regra FAPI." },
      { status: 400 }
    );
  }
}
