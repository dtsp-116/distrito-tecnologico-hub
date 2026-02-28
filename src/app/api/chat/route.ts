import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateEmbedding, toPgVectorLiteral } from "@/lib/rag/embeddings";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatTurn[];
  botName?: string;
  noticeId?: string;
}

type RagSearchLevel = "baixo" | "medio" | "alto";
type NoticeStatus = "aberto" | "encerrado" | "em_breve";

interface NoticeCandidate {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: NoticeStatus;
  deadlineDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  agencyName: string;
  tags: string[];
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(botName?: string) {
  return `
Voce e ${botName ?? "um assistente"} no Hub Inteligente de Editais.
Responda sempre em portugues do Brasil, com objetividade e linguagem clara.
Contexto principal:
- apoiar usuarios na leitura de editais, prazos, requisitos e documentacao;
- sugerir proximos passos praticos;
- sinalizar quando faltar informacao.
Evite inventar dados e, em caso de duvida, deixe isso explicito.

Formato obrigatorio de UX (Markdown web/mobile):
- Estruture com titulos e subtitulos curtos.
- Use negrito para destacar conceitos-chave.
- Use listas para organizar informacoes.
- Mantenha paragrafos curtos (1-3 linhas).
- Use espacamento entre blocos para facilitar leitura.
- Use emojis com moderacao para escaneabilidade.
- Evite texto denso e blocos longos.
- Preserve o conteudo original e nao altere fatos.
- Priorize leitura rapida em mobile.
`.trim();
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function rankChunks(question: string, chunks: Array<{ content: string; fileName: string }>, topK = 6) {
  const tokens = tokenize(question);
  if (tokens.length === 0) return chunks.slice(0, topK);

  return [...chunks]
    .map((chunk) => {
      const lower = chunk.content.toLowerCase();
      const score = tokens.reduce((acc, token) => acc + (lower.includes(token) ? 1 : 0), 0);
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function clipText(value: string, maxChars = 1100) {
  return value.length <= maxChars ? value : `${value.slice(0, maxChars)}...`;
}

function getRagConfig(level: RagSearchLevel) {
  if (level === "baixo") return { topK: 4, minRank: 0.16 };
  if (level === "alto") return { topK: 12, minRank: 0.03 };
  return { topK: 8, minRank: 0.08 };
}

function parseBudgetFromQuestion(question: string): number | null {
  const normalized = question.toLowerCase().replace(/\./g, "").replace(",", ".");
  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(milhao|milhoes|mi)\b/);
  if (millionMatch) return Number(millionMatch[1]) * 1_000_000;

  const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(mil|k)\b/);
  if (thousandMatch) return Number(thousandMatch[1]) * 1_000;

  const currencyMatch = normalized.match(/r\$\s*(\d+(?:\.\d+)?)/);
  if (currencyMatch) return Number(currencyMatch[1]);
  return null;
}

function parseTrlFromQuestion(question: string): number | null {
  const match = question.toLowerCase().match(/\btrl\s*(\d{1})\b/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 1 && value <= 9 ? value : null;
}

function parsePtBrNumberToFloat(rawValue: string) {
  const value = rawValue.replace(/\s/g, "");
  if (value.includes(",") && value.includes(".")) {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }
  if (value.includes(",")) return Number(value.replace(",", "."));
  return Number(value);
}

function toCurrencyByUnit(value: number, unit: string | undefined) {
  if (!Number.isFinite(value)) return null;
  const normalizedUnit = (unit ?? "").toLowerCase();
  if (normalizedUnit === "milhao" || normalizedUnit === "milhoes" || normalizedUnit === "mi") {
    return value * 1_000_000;
  }
  if (normalizedUnit === "mil" || normalizedUnit === "k") {
    return value * 1_000;
  }
  return value;
}

function extractBudgetRangeFromText(text: string): { min: number | null; max: number | null } | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const betweenMatch = normalized.match(
    /entre\s*r?\$?\s*(\d[\d\.,]*)\s*(milhao|milhoes|mi|mil|k)?\s*e\s*r?\$?\s*(\d[\d\.,]*)\s*(milhao|milhoes|mi|mil|k)?/
  );
  if (betweenMatch) {
    const left = toCurrencyByUnit(parsePtBrNumberToFloat(betweenMatch[1]), betweenMatch[2]);
    const right = toCurrencyByUnit(parsePtBrNumberToFloat(betweenMatch[3]), betweenMatch[4] ?? betweenMatch[2]);
    if (left !== null && right !== null) {
      return { min: Math.min(left, right), max: Math.max(left, right) };
    }
  }

  const rangeMatch = normalized.match(
    /r?\$?\s*(\d[\d\.,]*)\s*(milhao|milhoes|mi|mil|k)?\s*(?:a|ate|-|–)\s*r?\$?\s*(\d[\d\.,]*)\s*(milhao|milhoes|mi|mil|k)?/
  );
  if (rangeMatch) {
    const left = toCurrencyByUnit(parsePtBrNumberToFloat(rangeMatch[1]), rangeMatch[2]);
    const right = toCurrencyByUnit(parsePtBrNumberToFloat(rangeMatch[3]), rangeMatch[4] ?? rangeMatch[2]);
    if (left !== null && right !== null) {
      return { min: Math.min(left, right), max: Math.max(left, right) };
    }
  }

  return null;
}

function extractTrlRangeFromText(text: string): { min: number | null; max: number | null } | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const trlRangeMatch = normalized.match(/(?:trl|maturidade tecnologica)[^\d]{0,20}(\d)\s*(?:a|ate|-|–|e)\s*(\d)/);
  if (trlRangeMatch) {
    const left = Number(trlRangeMatch[1]);
    const right = Number(trlRangeMatch[2]);
    if (left >= 1 && left <= 9 && right >= 1 && right <= 9) {
      return { min: Math.min(left, right), max: Math.max(left, right) };
    }
  }

  return null;
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : null;
}

function formatCurrencyBRL(value: number | null) {
  if (value === null) return "nao informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

function isBudgetQuestion(question: string) {
  const normalized = question.toLowerCase();
  return /valor|faixa|range|orcamento|orçamento|milhao|milhões|milhoes|r\$/i.test(normalized);
}

function isTrlQuestion(question: string) {
  return /\btrl\b|nivel de maturidade|nível de maturidade/i.test(question.toLowerCase());
}

function isFutureDate(dateValue: string) {
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
}

function scoreNoticeCandidate(input: {
  notice: NoticeCandidate;
  questionTokens: string[];
  budgetHint: number | null;
  trlHint: number | null;
}) {
  const { notice, questionTokens, budgetHint } = input;
  const searchable = [
    notice.title,
    notice.summary,
    notice.description,
    notice.agencyName,
    ...notice.tags
  ]
    .join(" ")
    .toLowerCase();

  const matchedTokens = Array.from(new Set(questionTokens.filter((token) => searchable.includes(token))));
  const themeScore = matchedTokens.length * 0.9;

  let budgetScore = 0;
  if (budgetHint !== null && notice.budgetMin !== null && notice.budgetMax !== null) {
    if (budgetHint >= notice.budgetMin && budgetHint <= notice.budgetMax) budgetScore = 2.2;
    else if (budgetHint >= notice.budgetMin * 0.8 && budgetHint <= notice.budgetMax * 1.2) budgetScore = 0.9;
    else budgetScore = -0.8;
  }

  const statusScore = notice.status === "aberto" ? 1.2 : notice.status === "em_breve" ? 0.5 : -1;
  const deadlineScore = isFutureDate(notice.deadlineDate) ? 0.7 : -0.6;

  // Fase A: TRL ainda nao e critico no score global, mas ja fica preparado para evolucao.
  const trlScore = input.trlHint !== null ? 0.1 : 0;

  const total = themeScore + budgetScore + statusScore + deadlineScore + trlScore;
  return { total, matchedTokens };
}

function buildGlobalRecommendationContext(params: {
  notices: NoticeCandidate[];
  question: string;
  searchLevel: RagSearchLevel;
}) {
  const budgetHint = parseBudgetFromQuestion(params.question);
  const trlHint = parseTrlFromQuestion(params.question);
  const tokens = tokenize(params.question).filter((token) => token.length >= 4);
  const levelTopK = params.searchLevel === "baixo" ? 3 : params.searchLevel === "alto" ? 6 : 4;

  const ranked = params.notices
    .map((notice) => {
      const { total, matchedTokens } = scoreNoticeCandidate({
        notice,
        questionTokens: tokens,
        budgetHint,
        trlHint
      });
      return { notice, score: total, matchedTokens };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, levelTopK)
    .filter((item) => item.score > 0.2);

  if (ranked.length === 0) return { context: "", sources: [] as string[], hasContext: false };

  const context = ranked
    .map((item, index) => {
      const budgetLabel =
        item.notice.budgetMin !== null || item.notice.budgetMax !== null
          ? `${formatCurrencyBRL(item.notice.budgetMin)} a ${formatCurrencyBRL(item.notice.budgetMax)}`
          : "nao informado";
      const reasons: string[] = [];
      if (item.matchedTokens.length > 0) reasons.push(`tema: ${item.matchedTokens.slice(0, 4).join(", ")}`);
      if (budgetHint !== null) reasons.push(`projeto informado: ${formatCurrencyBRL(budgetHint)}`);
      reasons.push(`status: ${item.notice.status}`);
      return `Candidato ${index + 1}
ID: ${item.notice.id}
Titulo: ${item.notice.title}
Agencia: ${item.notice.agencyName}
Status: ${item.notice.status}
Prazo: ${item.notice.deadlineDate}
Faixa de valor: ${budgetLabel}
Tags: ${item.notice.tags.join(", ") || "sem tags"}
Resumo: ${clipText(item.notice.summary || item.notice.description, 500)}
Motivos de aderencia: ${reasons.join(" | ")}
Score interno: ${item.score.toFixed(2)}`;
    })
    .join("\n\n");

  return {
    context,
    sources: ranked.map((item) => item.notice.title),
    hasContext: true
  };
}

export async function POST(request: Request) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Chave GROQ_API_KEY nao configurada no servidor." },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as ChatRequestBody;
    const incomingMessages = payload.messages ?? [];
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return NextResponse.json({ error: "Envie ao menos uma mensagem." }, { status: 400 });
    }

    const history = incomingMessages.slice(-12).map((message) => ({
      role: message.role,
      content: message.content
    }));

    const lastUserQuestion = [...incomingMessages].reverse().find((message) => message.role === "user")?.content ?? "";
    let ragContext = "";
    let ragSources: string[] = [];
    let hasRetrievedContext = false;
    const supabase = await createSupabaseServerClient();
    const ragSettingsResult = await supabase
      .from("rag_settings")
      .select("search_level,use_legacy_fallback")
      .eq("id", true)
      .maybeSingle();

    const searchLevel = (ragSettingsResult.data?.search_level as RagSearchLevel | undefined) ?? "medio";
    const useLegacyFallback = ragSettingsResult.data?.use_legacy_fallback ?? true;
    const ragConfig = getRagConfig(searchLevel);

    if (payload.noticeId) {
      interface NoticeStructuredData {
        id: string;
        title: string;
        summary: string | null;
        description: string | null;
        status: NoticeStatus;
        publish_date: string | null;
        deadline_date: string | null;
        access_link: string | null;
        budget_min: number | string | null;
        budget_max: number | string | null;
        trl_min: number | string | null;
        trl_max: number | string | null;
      }

      const queryEmbedding = process.env.OPENAI_API_KEY
        ? await generateEmbedding(lastUserQuestion).catch(() => null)
        : null;

      const [noticeResult, hybridResult] = await Promise.all([
        supabase
          .from("notices")
          .select("id,title,summary,description,status,publish_date,deadline_date,access_link,budget_min,budget_max,trl_min,trl_max")
          .eq("id", payload.noticeId)
          .maybeSingle(),
        supabase.rpc("search_notice_chunks_hybrid", {
          p_notice_id: payload.noticeId,
          p_query: lastUserQuestion,
          p_query_embedding: queryEmbedding ? toPgVectorLiteral(queryEmbedding) : null,
          p_match_count: ragConfig.topK
        })
      ]);

      const notice = noticeResult.data as NoticeStructuredData | null;
      const noticeBudgetMin = toNumberOrNull(notice?.budget_min);
      const noticeBudgetMax = toNumberOrNull(notice?.budget_max);
      const noticeTrlMin = toNumberOrNull(notice?.trl_min);
      const noticeTrlMax = toNumberOrNull(notice?.trl_max);
      const budgetHint = parseBudgetFromQuestion(lastUserQuestion);
      const hasBudgetQuestion = isBudgetQuestion(lastUserQuestion);
      const hasTrlQuestion = isTrlQuestion(lastUserQuestion);
      const needsBudgetFallback = hasBudgetQuestion && (noticeBudgetMin === null || noticeBudgetMax === null);
      const needsTrlFallback = hasTrlQuestion && (noticeTrlMin === null || noticeTrlMax === null);

      let inferredBudgetRange: { min: number | null; max: number | null } | null = null;
      let inferredTrlRange: { min: number | null; max: number | null } | null = null;
      let inferredContextUsed = false;

      if (notice && (needsBudgetFallback || needsTrlFallback)) {
        const { data: chunkRows } = await supabase
          .from("document_chunks")
          .select("content,documents!inner(file_name,notice_id)")
          .eq("documents.notice_id", payload.noticeId)
          .limit(240);

        const rawChunks =
          chunkRows?.map((row) => {
            const documentsData = Array.isArray(row.documents) ? row.documents[0] : row.documents;
            return {
              content: row.content as string,
              fileName: (documentsData?.file_name as string | undefined) ?? "arquivo"
            };
          }) ?? [];

        const bestChunks = rankChunks(lastUserQuestion, rawChunks, 12);
        const fallbackSource = [notice.summary ?? "", notice.description ?? "", ...bestChunks.map((chunk) => chunk.content)]
          .filter(Boolean)
          .join("\n\n");

        if (needsBudgetFallback) {
          inferredBudgetRange = extractBudgetRangeFromText(fallbackSource);
        }
        if (needsTrlFallback) {
          inferredTrlRange = extractTrlRangeFromText(fallbackSource);
        }
        inferredContextUsed = Boolean(inferredBudgetRange || inferredTrlRange);
      }

      const effectiveBudgetMin = noticeBudgetMin ?? inferredBudgetRange?.min ?? null;
      const effectiveBudgetMax = noticeBudgetMax ?? inferredBudgetRange?.max ?? null;
      const effectiveTrlMin = noticeTrlMin ?? inferredTrlRange?.min ?? null;
      const effectiveTrlMax = noticeTrlMax ?? inferredTrlRange?.max ?? null;
      const budgetIsInferred = (noticeBudgetMin === null || noticeBudgetMax === null) && inferredBudgetRange !== null;
      const trlIsInferred = (noticeTrlMin === null || noticeTrlMax === null) && inferredTrlRange !== null;

      if (notice && (hasBudgetQuestion || hasTrlQuestion)) {
        const budgetRangeLabel =
          effectiveBudgetMin !== null || effectiveBudgetMax !== null
            ? `${formatCurrencyBRL(effectiveBudgetMin)} a ${formatCurrencyBRL(effectiveBudgetMax)}`
            : "nao informado no cadastro deste edital";
        const trlRangeLabel =
          effectiveTrlMin !== null || effectiveTrlMax !== null
            ? `${effectiveTrlMin ?? "N/D"} a ${effectiveTrlMax ?? "N/D"}`
            : "nao informado no cadastro deste edital";

        let budgetFitMessage = "";
        if (budgetHint !== null) {
          if (effectiveBudgetMin !== null && effectiveBudgetMax !== null) {
            budgetFitMessage =
              budgetHint >= effectiveBudgetMin && budgetHint <= effectiveBudgetMax
                ? `✅ **Sim**, um projeto de ${formatCurrencyBRL(budgetHint)} esta dentro da faixa cadastrada (${budgetRangeLabel}).`
                : `⚠️ **Nao exatamente**: um projeto de ${formatCurrencyBRL(budgetHint)} fica fora da faixa cadastrada (${budgetRangeLabel}).`;
            if (budgetIsInferred) {
              budgetFitMessage += "\n\n⚠️ *Faixa inferida a partir do texto do edital (baixa confianca). Confirme no documento oficial.*";
            }
          } else {
            budgetFitMessage = `⚠️ Nao consigo confirmar aderencia para ${formatCurrencyBRL(budgetHint)} porque a faixa de valor nao foi informada no cadastro.`;
          }
        }

        if (budgetFitMessage || (hasBudgetQuestion && !hasTrlQuestion) || (hasTrlQuestion && !hasBudgetQuestion)) {
          const directContent = [
            `## Dados objetivos do edital`,
            ``,
            `- **Edital:** ${notice.title}`,
            `- **Faixa de valor do projeto:** ${budgetRangeLabel}`,
            `- **Faixa de TRL:** ${trlRangeLabel}`,
            budgetIsInferred || trlIsInferred || inferredContextUsed
              ? `- **Confianca:** baixa (faixa inferida por leitura textual, validar no edital oficial)`
              : null,
            notice.deadline_date ? `- **Prazo final:** ${notice.deadline_date}` : null,
            notice.access_link ? `- **Link oficial:** ${notice.access_link}` : null,
            ``,
            budgetFitMessage || `Usei os dados estruturados cadastrados para responder com precisao.`
          ]
            .filter(Boolean)
            .join("\n");

          return NextResponse.json({ content: directContent, sources: ["dados do edital"] });
        }
      }

      let topChunks: Array<{ content: string; fileName: string }> = [];

      if (!hybridResult.error && hybridResult.data) {
        topChunks = (hybridResult.data as Array<{ content: string; file_name: string; rank?: number }>)
          .filter((row) => {
            if (!lastUserQuestion.trim()) return true;
            if (typeof row.rank !== "number") return true;
            return row.rank >= ragConfig.minRank;
          })
          .map((row) => ({
            content: row.content,
            fileName: row.file_name ?? "arquivo"
          }));
      }

      if (topChunks.length === 0 && useLegacyFallback) {
        const ftsResult = await supabase.rpc("search_notice_chunks_fts", {
          p_notice_id: payload.noticeId,
          p_query: lastUserQuestion,
          p_match_count: ragConfig.topK
        });

        if (!ftsResult.error && ftsResult.data) {
          topChunks = (ftsResult.data as Array<{ content: string; file_name: string }>).map((row) => ({
            content: row.content,
            fileName: row.file_name ?? "arquivo"
          }));
        }
      }

      if (topChunks.length === 0 && useLegacyFallback) {
        const { data: chunkRows } = await supabase
          .from("document_chunks")
          .select("content,documents!inner(file_name,notice_id)")
          .eq("documents.notice_id", payload.noticeId)
          .limit(300);
        const rawChunks =
          chunkRows?.map((row) => {
            const documentsData = Array.isArray(row.documents) ? row.documents[0] : row.documents;
            return {
              content: row.content as string,
              fileName: (documentsData?.file_name as string | undefined) ?? "arquivo"
            };
          }) ?? [];
        topChunks = rankChunks(lastUserQuestion, rawChunks, 6);
      }

      hasRetrievedContext = topChunks.length > 0;
      ragSources = Array.from(new Set(topChunks.map((chunk) => chunk.fileName)));
      const contexts = topChunks.map((chunk, index) => ({
        citation: `[${index + 1}]`,
        fileName: chunk.fileName,
        content: clipText(chunk.content, 1100)
      }));

      ragContext = [
        notice
          ? `Dados estruturados do edital:
Titulo: ${notice.title}
Status: ${notice.status}
Publicacao: ${notice.publish_date ?? "nao informado"}
Prazo final: ${notice.deadline_date ?? "nao informado"}
Link oficial: ${notice.access_link ?? "nao informado"}
Faixa de valor do projeto: ${formatCurrencyBRL(noticeBudgetMin)} a ${formatCurrencyBRL(noticeBudgetMax)}
Faixa de TRL: ${noticeTrlMin ?? "N/D"} a ${noticeTrlMax ?? "N/D"}
Resumo: ${notice.summary ?? ""}
Descricao: ${notice.description ?? ""}
`
          : "",
        ...contexts.map((chunk) => `Trecho ${chunk.citation} (${chunk.fileName}):\n${chunk.content}`)
      ]
        .filter(Boolean)
        .join("\n\n");
    } else {
      const [noticesWithRanges, agenciesResult, noticeTagsResult, tagsResult] = await Promise.all([
        supabase
          .from("notices")
          .select("id,title,summary,description,status,deadline_date,budget_min,budget_max,agency_id"),
        supabase.from("agencies").select("id,name"),
        supabase.from("notice_tags").select("notice_id,tag_id"),
        supabase.from("tags").select("id,name")
      ]);

      const noticesFallback =
        !noticesWithRanges.error
          ? null
          : await supabase
              .from("notices")
              .select("id,title,summary,description,status,deadline_date,agency_id");

      const noticesData = (noticesWithRanges.data ?? noticesFallback?.data ?? []) as Array<{
        id: string;
        title: string;
        summary: string;
        description: string;
        status: NoticeStatus;
        deadline_date: string;
        budget_min?: number | string | null;
        budget_max?: number | string | null;
        agency_id?: string | null;
      }>;

      if ((noticesWithRanges.error && noticesFallback?.error) || noticesData.length === 0) {
        hasRetrievedContext = false;
      } else {
        const agencyNameById = new Map<string, string>();
        (agenciesResult.data ?? []).forEach((agency) => {
          agencyNameById.set(agency.id, agency.name);
        });

        const tagNameById = new Map<string, string>();
        (tagsResult.data ?? []).forEach((tag) => {
          tagNameById.set(tag.id, tag.name);
        });

        const tagsByNotice = new Map<string, string[]>();
        (noticeTagsResult.data ?? []).forEach((row) => {
          const existing = tagsByNotice.get(row.notice_id) ?? [];
          const tagName = tagNameById.get(row.tag_id);
          if (!tagName) return;
          tagsByNotice.set(row.notice_id, [...existing, tagName]);
        });

        const noticeCandidates = noticesData.map((notice) => ({
          id: notice.id,
          title: notice.title,
          summary: notice.summary ?? "",
          description: notice.description ?? "",
          status: notice.status,
          deadlineDate: notice.deadline_date,
          budgetMin: toNumberOrNull(notice.budget_min),
          budgetMax: toNumberOrNull(notice.budget_max),
          agencyName: agencyNameById.get(notice.agency_id ?? "") ?? "Agencia",
          tags: tagsByNotice.get(notice.id) ?? []
        }));

        const global = buildGlobalRecommendationContext({
          notices: noticeCandidates,
          question: lastUserQuestion,
          searchLevel
        });
        ragContext = global.context;
        ragSources = global.sources;
        hasRetrievedContext = global.hasContext;
      }
    }

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `${buildSystemPrompt(payload.botName)}
${hasRetrievedContext
  ? `Use estritamente o contexto recuperado quando ele existir.
Se nao houver contexto suficiente para responder com seguranca, diga explicitamente.
Sempre que possivel, cite de forma resumida os arquivos base da resposta.
Ao usar o contexto RAG, adicione citacoes curtas no formato [1], [2] ao fim das frases principais.`
  : `Quando nao houver contexto RAG suficiente, use um modo simples de assistente (sem inventar fatos), explicando que a resposta pode precisar de validacao no edital oficial.`}`
          },
          ...(ragContext ? [{ role: "system", content: `Contexto RAG:\n${ragContext}` }] : []),
          ...history
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Falha ao consultar IA.", details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) {
      return NextResponse.json({ error: "Resposta da IA vazia." }, { status: 502 });
    }

    return NextResponse.json({ content, sources: ragSources });
  } catch {
    return NextResponse.json({ error: "Erro inesperado ao processar chat." }, { status: 500 });
  }
}
