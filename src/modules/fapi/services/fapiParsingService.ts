import { ParsedFapi } from "@/modules/fapi/dto/types";

const fieldMatchers: Array<{ key: keyof ParsedFapi; patterns: RegExp[] }> = [
  { key: "id", patterns: [/^id\b/i, /^identificacao\b/i] },
  { key: "titulo", patterns: [/^titulo\b/i, /^titulo do projeto\b/i] },
  { key: "empresa", patterns: [/^empresa\b/i, /^proponente\b/i] },
  { key: "institutoCoordenador", patterns: [/^instituto coordenador\b/i, /^coordenador\b/i] },
  { key: "parceiros", patterns: [/^parceiros\b/i] },
  { key: "duracaoEstimada", patterns: [/^duracao estimada\b/i, /^duracao\b/i] },
  { key: "fonteFomentoChamada", patterns: [/^fonte de fomento/i, /^chamada\b/i] },
  { key: "orcamentoInicial", patterns: [/^orcamento inicial\b/i, /^orcamento\b/i] },
  { key: "contexto", patterns: [/^contexto\b/i] },
  { key: "escopoSenai", patterns: [/^escopo senai\b/i] },
  { key: "objetivoProjeto", patterns: [/^objetivo do projeto\b/i, /^objetivo\b/i] },
  { key: "inovacaoProjeto", patterns: [/^inovacao no projeto\b/i, /^inovacao\b/i] },
  { key: "trlInicial", patterns: [/^trl inicial\b/i] },
  { key: "justificativaInicial", patterns: [/^justificativa inicial\b/i] },
  { key: "trlFinal", patterns: [/^trl final\b/i] },
  { key: "justificativaFinal", patterns: [/^justificativa final\b/i] }
];

function toSingleLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function parseFapiStructuredData(rawText: string): ParsedFapi {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ParsedFapi = {};
  for (const line of lines) {
    const [left, ...rest] = line.split(":");
    if (!left || rest.length === 0) continue;
    const label = left.trim();
    const value = toSingleLine(rest.join(":"));
    if (!value) continue;

    const matcher = fieldMatchers.find((field) => field.patterns.some((pattern) => pattern.test(label)));
    if (!matcher) continue;
    if (!parsed[matcher.key]) {
      parsed[matcher.key] = value;
    }
  }

  return parsed;
}

export function buildFapiStructuredSummary(parsed: ParsedFapi) {
  const lines = [
    `ID: ${parsed.id ?? "nao informado"}`,
    `Titulo: ${parsed.titulo ?? "nao informado"}`,
    `Empresa: ${parsed.empresa ?? "nao informado"}`,
    `Instituto coordenador: ${parsed.institutoCoordenador ?? "nao informado"}`,
    `Parceiros: ${parsed.parceiros ?? "nao informado"}`,
    `Duracao estimada: ${parsed.duracaoEstimada ?? "nao informado"}`,
    `Fonte de fomento/chamada: ${parsed.fonteFomentoChamada ?? "nao informado"}`,
    `Orcamento inicial: ${parsed.orcamentoInicial ?? "nao informado"}`,
    `Contexto: ${parsed.contexto ?? "nao informado"}`,
    `Escopo SENAI: ${parsed.escopoSenai ?? "nao informado"}`,
    `Objetivo do projeto: ${parsed.objetivoProjeto ?? "nao informado"}`,
    `Inovacao no projeto: ${parsed.inovacaoProjeto ?? "nao informado"}`,
    `TRL inicial: ${parsed.trlInicial ?? "nao informado"}`,
    `Justificativa inicial: ${parsed.justificativaInicial ?? "nao informado"}`,
    `TRL final: ${parsed.trlFinal ?? "nao informado"}`,
    `Justificativa final: ${parsed.justificativaFinal ?? "nao informado"}`
  ];

  return lines.join("\n");
}
