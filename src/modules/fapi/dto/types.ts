export interface ParsedFapi {
  id?: string;
  titulo?: string;
  empresa?: string;
  institutoCoordenador?: string;
  parceiros?: string;
  duracaoEstimada?: string;
  fonteFomentoChamada?: string;
  orcamentoInicial?: string;
  contexto?: string;
  escopoSenai?: string;
  objetivoProjeto?: string;
  inovacaoProjeto?: string;
  trlInicial?: string;
  justificativaInicial?: string;
  trlFinal?: string;
  justificativaFinal?: string;
}

export interface FAPI {
  rawText: string;
  structuredData?: ParsedFapi;
  agencyId?: string;
  editalId?: string;
}

export type FapiRuleType = "geral" | "agencia" | "edital";

export interface FapiRuleRow {
  id: string;
  tipo: FapiRuleType;
  agencia_id: string | null;
  edital_id: string | null;
  descricao: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsolidatedRule {
  id: string;
  type: FapiRuleType;
  description: string;
  priority: number;
}

export interface FapiEvaluationOutput {
  sessionId: string;
  response: string;
  extractedMethod: "text" | "ocr" | "unknown";
  extractedChars: number;
  appliedRules: ConsolidatedRule[];
  parsedFapi: ParsedFapi;
  agencyId: string | null;
  editalId: string | null;
}

export interface FapiSessionMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}
