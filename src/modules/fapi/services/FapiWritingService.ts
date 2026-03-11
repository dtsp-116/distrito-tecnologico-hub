import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  ConsolidatedRule,
  FapiWritingResponse
} from "@/modules/fapi/dto/types";
import { FapiRuleEngineService } from "@/modules/fapi/rule-engine/FapiRuleEngineService";
import { buildFapiWritingPrompt } from "@/modules/fapi/services/fapiPromptBuilder";
import { callGroq } from "@/modules/fapi/services/groqClient";
import { runWithTimeout, sanitizeUserText } from "@/modules/fapi/services/requestGuards";
import {
  saveFapiWritingSession
} from "@/modules/fapi/services/sessionStore";

export class FapiWritingService {
  constructor(private readonly supabase: SupabaseClient) {}

  private sanitizeBriefing(raw: string) {
    const cleaned = sanitizeUserText(raw);
    if (!cleaned || cleaned.length < 20) {
      throw new Error("Forneca um briefing mais detalhado da FAPI (pelo menos algumas frases).");
    }
    return cleaned.slice(0, 6000);
  }

  private async resolveRules(input: { agencyId: string | null; editalId: string | null }): Promise<{
    rules: ConsolidatedRule[];
    agencyName?: string;
    editalName?: string;
  }> {
    const ruleEngine = new FapiRuleEngineService(this.supabase);
    const rules = await ruleEngine.resolve({
      agencyId: input.agencyId,
      editalId: input.editalId
    });

    let agencyName: string | undefined;
    let editalName: string | undefined;

    if (input.agencyId) {
      const { data } = await this.supabase.from("agencies").select("name,acronym").eq("id", input.agencyId).single();
      if (data) {
        agencyName = data.acronym ? `${data.acronym} - ${data.name}` : data.name;
      }
    }

    if (input.editalId) {
      const { data } = await this.supabase.from("notices").select("title").eq("id", input.editalId).single();
      if (data) {
        editalName = data.title;
      }
    }

    return { rules, agencyName, editalName };
  }

  async generate(input: {
    userId: string;
    agencyId?: string | null;
    editalId?: string | null;
    briefing: string;
  }): Promise<FapiWritingResponse> {
    const agencyId = input.agencyId ?? null;
    const editalId = input.editalId ?? null;
    const briefing = this.sanitizeBriefing(input.briefing);

    const { rules, agencyName, editalName } = await this.resolveRules({ agencyId, editalId });

    const prompt = buildFapiWritingPrompt({
      briefing,
      rules,
      agencyName,
      editalName
    });

    const draftFapi = await runWithTimeout(
      callGroq([{ role: "system", content: prompt }]),
      60000,
      "Tempo limite excedido durante a geracao da FAPI."
    );

    const sessionId = crypto.randomUUID();
    saveFapiWritingSession({
      sessionId,
      userId: input.userId,
      agencyId,
      editalId,
      appliedRules: rules,
      briefing,
      draftFapi,
      messages: [{ role: "assistant", content: draftFapi, createdAt: Date.now() }]
    });

    return {
      sessionId,
      draftFapi,
      appliedRules: rules
    };
  }
}

