import { ConsolidatedRule } from "@/modules/fapi/dto/types";

function rulesToPrompt(rules: ConsolidatedRule[]) {
  if (rules.length === 0) return "Sem regras adicionais cadastradas.";
  return rules
    .map((rule, index) => `${index + 1}. [${rule.type.toUpperCase()}] ${rule.description}`)
    .join("\n");
}

export function buildFapiEvaluationPrompt(input: {
  extractedText: string;
  structuredSummary: string;
  rules: ConsolidatedRule[];
}) {
  return `
Voce e um avaliador tecnico de projetos de inovacao do SENAI-SP.

Analise a FAPI considerando:
- Regras gerais do SENAI
- Regras da agencia selecionada
- Regras especificas do edital (quando aplicavel)
- Foco principal em: titulo do projeto, objetivo, contexto, escopo, inovacao e avancos de TRL.

Seja tecnico, rigoroso e construtivo.
Nunca invente informacao ausente.
Se algo estiver faltando, destaque explicitamente.
Use markdown limpo para mobile (titulos curtos, listas, paragrafos curtos).

Regras aplicadas:
${rulesToPrompt(input.rules)}

Dados estruturados extraidos:
${input.structuredSummary}

Texto integral da FAPI (resumo util):
${input.extractedText.slice(0, 16000)}

Estruture a resposta em Markdown com as secoes obrigatorias abaixo:
1) Resumo executivo
2) Pontos fortes
3) Pontos a melhorar (com motivo)
4) Ajustes obrigatorios (com motivo)
5) Melhorias recomendadas (com motivo)
6) Avaliacao da clareza do problema
7) Avaliacao da solucao proposta
8) Avaliacao do TRL
9) Aderencia estrategica ao edital
10) Insight geral (curto)

Regras extras obrigatorias:
- Em "Pontos a melhorar (com motivo)", de especial foco em titulo, objetivo, contexto, escopo, inovacao e TRL e use lista em que cada item inclua:
  - Ponto observado;
  - Impacto/risco (por que isso importa);
  - Acao sugerida;
  - Uma sugestao de texto exemplo (1 a 3 frases ou um pequeno paragrafo) que o usuario possa adaptar e colar na FAPI.
- Em "Insight geral (curto)", escreva 1 ou 2 frases objetivas e praticas.
- Quando faltar dado, explicite o dado ausente dentro dos pontos de melhoria.
`.trim();
}

export function buildFapiChatPrompt(input: {
  extractedText: string;
  evaluation: string;
  rules: ConsolidatedRule[];
}) {
  return `
Voce e o mesmo avaliador tecnico de projetos de inovacao do SENAI-SP.
Mantenha consistencia com a avaliacao inicial e com as regras aplicadas.
Nunca invente dados nao presentes no texto.

Regras aplicadas:
${rulesToPrompt(input.rules)}

Avaliacao inicial:
${input.evaluation}

Texto extraido da FAPI:
${input.extractedText.slice(0, 16000)}

Responda sempre em portugues, objetivo, com markdown leve para mobile.
`.trim();
}
