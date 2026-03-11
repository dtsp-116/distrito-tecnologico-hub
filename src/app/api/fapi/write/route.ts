import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeFapiController } from "@/modules/fapi/controllers/fapiController";
import { enforceRateLimit } from "@/modules/fapi/services/requestGuards";
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
        key: `fapi:write:${user.id}`,
        limit: 5,
        windowMs: 60_000
      });

      const body = await request.json();
      const result = await writeFapiController({
        supabase,
        userId: user.id,
        body
      });

      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao gerar FAPI a partir do briefing." },
        { status: 400 }
      );
    }
  });
}

