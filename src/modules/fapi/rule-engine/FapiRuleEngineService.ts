import type { SupabaseClient } from "@supabase/supabase-js";
import { ConsolidatedRule, FapiRuleRow, FapiRuleType } from "@/modules/fapi/dto/types";

function rulePriority(type: FapiRuleType) {
  if (type === "edital") return 3;
  if (type === "agencia") return 2;
  return 1;
}

function normalizeRuleText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class FapiRuleEngineService {
  constructor(private readonly supabase: SupabaseClient) {}

  async resolve(input: { agencyId?: string | null; editalId?: string | null }) {
    const { data, error } = await this.supabase
      .from("fapi_rules")
      .select("id,tipo,agencia_id,edital_id,descricao,ativa,created_at,updated_at")
      .eq("ativa", true)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const allRules = (data ?? []) as FapiRuleRow[];
    const scoped = allRules.filter((rule) => {
      if (rule.tipo === "geral") return true;
      if (rule.tipo === "agencia") return Boolean(input.agencyId) && rule.agencia_id === input.agencyId;
      if (rule.tipo === "edital") return Boolean(input.editalId) && rule.edital_id === input.editalId;
      return false;
    });

    const deduped = new Map<string, ConsolidatedRule>();
    for (const rule of scoped) {
      const normalized = normalizeRuleText(rule.descricao);
      const current = deduped.get(normalized);
      const candidate: ConsolidatedRule = {
        id: rule.id,
        type: rule.tipo,
        description: rule.descricao,
        priority: rulePriority(rule.tipo)
      };

      if (!current || candidate.priority > current.priority) {
        deduped.set(normalized, candidate);
      }
    }

    return Array.from(deduped.values()).sort((a, b) => b.priority - a.priority);
  }
}
