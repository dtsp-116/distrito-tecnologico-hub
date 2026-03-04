import type { SupabaseClient } from "@supabase/supabase-js";
import { FapiEvaluationOutput, type FapiExtractionErrorDetails } from "@/modules/fapi/dto/types";
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
    normalized.includes("insight geral do projeto") &&
    normalized.includes("nome do projeto") &&
    normalized.includes("objetivo do projeto") &&
    normalized.includes("avanco de trl")
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

      const rawText = extraction.text ?? "";
      const extractedText = rawText.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (extractedText.length === 0) {
        const err = new Error("Nao foi possivel extrair texto da FAPI.") as Error & { details?: FapiExtractionErrorDetails };
        err.details = {
          fileName: input.file.fileName,
          mimeType: input.file.mimeType,
          method: extraction.method,
          rawLength: rawText.length
        };
        throw err;
      }

      const parsedFapi = parseFapiStructuredData(extractedText);
      const detectedEditalId = await detectReferencedEdital({
        supabase: this.supabase,
        extractedText,
        hintEditalId: input.editalId ?? null
      });

      const ruleEngine = new FapiRuleEngineService(this.supabase);
      const consolidatedRules = await ruleEngine.resolve({
        agencyId: input.agencyId ?? null,
        editalId: detectedEditalId
      });

      const structuredSummary = buildFapiStructuredSummary(parsedFapi);
      const prompt = buildFapiEvaluationPrompt({
        extractedText,
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
                  "Reestruture a avaliacao mantendo apenas o conteudo original, sem inventar dados."
              },
              {
                role: "user",
                content: `
Reestruture a avaliacao abaixo para seguir EXATAMENTE o formato:

INSIGHT GERAL DO PROJETO  
Comentario curto (maximo 2 frases) sobre a qualidade geral da proposta.

---

NOME DO PROJETO  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema do titulo.
- Sugestao de melhoria: proponha um titulo mais adequado, alinhado ao TRL e ao escopo do projeto.

---

OBJETIVO DO PROJETO  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema (ex.: nao segue metodologia SMART, esta vago, muito amplo etc.).
- Sugestao de melhoria: proponha uma forma melhor de escrever o objetivo.

---

CONTEXTO DO PROJETO  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema (ex.: problema mal definido, ausencia de justificativa, falta de evidencia).
- Sugestao de melhoria: proponha como o contexto deveria ser descrito.

---

ESCOPO DO PROJETO  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema (ex.: escopo muito amplo, mal delimitado ou desalinhado com objetivo).
- Sugestao de melhoria: proponha uma forma mais adequada de delimitar o escopo.

---

INOVACAO DO PROJETO  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema (ex.: inovacao pouco clara, incremental sem justificativa, descricao generica).
- Sugestao de melhoria: proponha uma forma melhor de descrever a inovacao.

---

AVANCO DE TRL  
Status: OK ou NAO OK

Se NAO OK:
- Problema identificado: explique brevemente o problema (ex.: TRL incoerente com escopo, justificativa fraca, salto tecnologico irrealista).
- Sugestao de melhoria: explique como o avanco de TRL deveria ser ajustado ou melhor justificado.

---

Nao adicione fatos novos. Se faltar informacao, apenas sinalize a falta dentro do item correspondente.

Avaliacao original a ser reestruturada:
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
        extractedChars: extractedText.length,
        appliedRules: consolidatedRules,
        parsedFapi,
        agencyId: input.agencyId ?? null,
        editalId: detectedEditalId,
        lowTextQuality: extractedText.length < 80
      };
    } finally {
      bytes.fill(0);
    }
  }
}
