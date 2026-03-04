import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeFapiController } from "@/modules/fapi/controllers/fapiController";
import { OCR_ERROR_CODES } from "@/modules/fapi/services/fapiTextExtractionService";
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
      const err = error as Error & { details?: { fileName: string; mimeType: string; method: string; rawLength: number } };
      let message = error instanceof Error ? error.message : "Falha ao analisar FAPI.";

      if (message.includes(OCR_ERROR_CODES.NO_API_KEY)) {
        message =
          "Para analisar imagens ou PDFs escaneados, configure a variavel de ambiente OCR_SPACE_API_KEY no servidor (ex.: .env.local em desenvolvimento).";
      } else if (message.includes(OCR_ERROR_CODES.EMPTY_RESULT)) {
        message =
          "Nao foi possivel extrair texto da imagem. Use imagem de maior resolucao, recorte apenas a area de texto ou envie um PDF com camada de texto.";
      } else if (message.includes(OCR_ERROR_CODES.API_ERROR)) {
        const detail = message.replace(new RegExp(`^.*${OCR_ERROR_CODES.API_ERROR}:\\s*`), "").trim();
        if (detail.includes("System Resource Exhaustion") || detail.includes("E500")) {
          message =
            "O servico externo de OCR (OCR.space) esta temporariamente indisponivel (erro interno). Tente novamente em alguns minutos ou envie um PDF com texto selecionavel.";
        } else {
          message = detail
            ? `Falha no servico de OCR: ${detail}`
            : "Falha no servico de OCR. Tente novamente ou use outro arquivo (ex.: PDF com texto).";
        }
      } else if (message.includes("OCR_SPACE_API_KEY")) {
        message = "Para analisar imagens ou PDFs escaneados, configure OCR_SPACE_API_KEY no servidor.";
      } else if (message.includes("extrair texto da imagem")) {
        message =
          "Nao foi possivel extrair texto da imagem. Use imagem de maior resolucao ou envie um PDF com texto.";
      } else if (message.includes("Tempo limite")) {
        message = "O processamento demorou demais. Tente um arquivo menor ou tente novamente.";
      } else if (err.details && message.includes("extrair texto")) {
        const { method, rawLength } = err.details;
        if (method === "unknown" && rawLength === 0) {
          message = "Tipo de arquivo nao suportado ou arquivo sem texto detectavel. Use PDF, imagem (PNG/JPG) ou DOCX.";
        } else if (rawLength > 0) {
          message = "O arquivo parece conter apenas espacos ou caracteres nao reconhecidos. Envie um PDF ou imagem com texto legivel.";
        } else {
          message =
            "Nao foi possivel extrair texto do arquivo. Se for PDF escaneado ou imagem, configure OCR_SPACE_API_KEY ou envie um PDF com camada de texto.";
        }
      }

      const body: { error: string; fileName?: string; mimeType?: string; method?: string; rawLength?: number } = { error: message };
      if (err.details) {
        body.fileName = err.details.fileName;
        body.mimeType = err.details.mimeType;
        body.method = err.details.method;
        body.rawLength = err.details.rawLength;
      }
      return NextResponse.json(body, { status: 400 });
    }
  });
}
