import type { SupabaseClient } from "@supabase/supabase-js";
import { FapiEvaluationOutput } from "@/modules/fapi/dto/types";
import { FapiRuleEngineService } from "@/modules/fapi/rule-engine/FapiRuleEngineService";
import { extractFapiText } from "@/modules/fapi/services/fapiTextExtractionService";
import { parseFapiStructuredData, buildFapiStructuredSummary } from "@/modules/fapi/services/fapiParsingService";
import { detectReferencedEdital } from "@/modules/fapi/services/fapiEditalDetectionService";
import { buildFapiEvaluationPrompt } from "@/modules/fapi/services/fapiPromptBuilder";
import { callGroq } from "@/modules/fapi/services/groqClient";
import { assertFapiFileConstraints, FapiUploadedFile, runWithTimeout } from "@/modules/fapi/services/requestGuards";
import { saveFapiSession } from "@/modules/fapi/services/sessionStore";
import { FapiMetricsService } from "@/modules/fapi/services/FapiMetricsService";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasMinimumFapiSections(response: string) {
  const normalized = normalizeText(response);
  return (
    normalized.includes("pontos a melhorar") &&
    normalized.includes("insight geral")
  );
}

export class FapiEvaluationService {
  private readonly metricsService = new FapiMetricsService();

  constructor(private readonly supabase: SupabaseClient) {}

  async evaluate(input: {
    userId: string;
    agencyId?: string | null;
    editalId?: string | null;
    file: FapiUploadedFile;
  }): Promise<FapiEvaluationOutput> {
    assertFapiFileConstraints(input.file);
    const startedAt = Date.now();

    const bytes = input.file.bytes;
    try {
      const extraction = await runWithTimeout(
        extractFapiText({
          fileName: input.file.fileName,
          mimeType: input.file.mimeType,
          bytes
        }),
        30000,
        "Tempo limite excedido durante a extracao do arquivo."
      );

      if (!extraction.text || extraction.text.length < 80) {
        throw new Error("Nao foi possivel extrair texto suficiente da FAPI.");
      }

      const parsedFapi = parseFapiStructuredData(extraction.text);
      const detectedEditalId = await detectReferencedEdital({
        supabase: this.supabase,
        extractedText: extraction.text,
        hintEditalId: input.editalId ?? null
      });

      const ruleEngine = new FapiRuleEngineService(this.supabase);
      const consolidatedRules = await ruleEngine.resolve({
        agencyId: input.agencyId ?? null,
        editalId: detectedEditalId
      });

      const structuredSummary = buildFapiStructuredSummary(parsedFapi);
      const prompt = buildFapiEvaluationPrompt({
        extractedText: extraction.text,
        structuredSummary,
        rules: consolidatedRules
      });

      const response = await runWithTimeout(
        callGroq([
          { role: "system", content: "Avalie FAPI de forma tecnica e objetiva." },
          { role: "user", content: prompt }
        ]),
        60000,
        "Tempo limite excedido durante a avaliacao da IA."
      );

      const normalizedResponse = hasMinimumFapiSections(response)
        ? response
        : await runWithTimeout(
            callGroq([
              {
                role: "system",
                content:
                  "Reestruture a avaliacao em markdown mantendo apenas o conteudo original, sem inventar dados."
              },
              {
                role: "user",
                content: `
Reestruture a avaliacao abaixo para incluir obrigatoriamente:
- "Pontos a melhorar (com motivo)" em lista com: ponto, impacto/risco e acao sugerida;
- "Insight geral (curto)" com 1-2 frases.

Nao adicione fatos novos. Se faltar informacao, explicite o dado ausente.

Avaliacao original:
${response}
`.trim()
              }
            ]),
            30000,
            "Tempo limite excedido durante a normalizacao da resposta da IA."
          );

      const sessionId = crypto.randomUUID();
      saveFapiSession({
        sessionId,
        userId: input.userId,
        agencyId: input.agencyId ?? null,
        editalId: detectedEditalId,
        extractedText: extraction.text,
        parsedFapi,
        evaluation: normalizedResponse,
        appliedRules: consolidatedRules,
        messages: [
          { role: "assistant", content: normalizedResponse, createdAt: Date.now() }
        ]
      });

      await this.metricsService.registerAnalysis({
        agencyId: input.agencyId ?? null,
        responseMs: Date.now() - startedAt
      });

      return {
        sessionId,
        response: normalizedResponse,
        extractedMethod: extraction.method,
        extractedChars: extraction.text.length,
        appliedRules: consolidatedRules,
        parsedFapi,
        agencyId: input.agencyId ?? null,
        editalId: detectedEditalId
      };
    } finally {
      bytes.fill(0);
    }
  }
}
