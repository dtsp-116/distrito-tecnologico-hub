import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fapiSessionResetSchema } from "@/modules/fapi/validators/fapiSchemas";
import { resetFapiSessionController } from "@/modules/fapi/controllers/fapiController";
import { withFapiSessionCleanup } from "@/modules/fapi/services/fapiSessionMiddleware";

export async function POST(request: Request) {
  return withFapiSessionCleanup(async () => {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
      }

      const body = await request.json();
      const parsed = fapiSessionResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
      }

      const result = resetFapiSessionController({
        sessionId: parsed.data.sessionId,
        userId: user.id
      });
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao resetar sessao." },
        { status: 400 }
      );
    }
  });
}
