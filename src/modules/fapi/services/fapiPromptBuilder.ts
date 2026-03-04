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

Analise a FAPI enviada de forma OBJETIVA, direta e estruturada.

Regras gerais para a resposta:
- Seja conciso e evite textos longos.
- Avalie cada campo separadamente.
- Para cada item, diga claramente se esta **OK** ou **NAO OK**.
- Se estiver NAO OK, explique brevemente o problema e proponha uma sugestao de melhoria ou reescrita.
- Use linguagem tecnica e nao faca elogios genericos.
- Nunca invente informacao ausente; quando faltar dado, apenas sinalize a falta.

Regras institucionais aplicadas (gerais, agencia, edital):
${rulesToPrompt(input.rules)}

Dados estruturados extraidos:
${input.structuredSummary}

Texto integral da FAPI (resumo util):
${input.extractedText.slice(0, 16000)}

Estruture a resposta EXATAMENTE no formato abaixo (mantendo os titulos e a ordem):

INSIGHT GERAL DO PROJETO  
Escreva um comentario curto (maximo 2 frases) sobre a qualidade geral da proposta.

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
- Sugestao de melhoria: explique como o avancode TRL deveria ser ajustado ou melhor justificado.

---

Importante:
- Sempre alinhe a analise as regras institucionais e as boas praticas de projetos de inovacao.
- Evite termos que impliquem compromisso institucional (como garantir, assegurar, validar).
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
