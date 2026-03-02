import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeFapiController } from "@/modules/fapi/controllers/fapiController";
import { enforceRateLimit, runWithTimeout } from "@/modules/fapi/services/requestGuards";
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

      enforceRateLimit({
        key: `fapi:analyze:${user.id}`,
        limit: 5,
        windowMs: 60_000
      });

      const formData = await request.formData();
      const result = await runWithTimeout(
        analyzeFapiController({
          supabase,
          userId: user.id,
          formData
        }),
        80_000,
        "Tempo limite excedido na analise da FAPI."
      );

      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao analisar FAPI." },
        { status: 400 }
      );
    }
  });
}
