import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatTurn[];
  botName?: string;
  noticeId?: string;
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

function rankChunks(question: string, chunks: Array<{ content: string; fileName: string }>, topK = 5) {
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

    if (payload.noticeId) {
      const supabase = await createSupabaseServerClient();

      const { data: notice } = await supabase
        .from("notices")
        .select("id,title,summary,description")
        .eq("id", payload.noticeId)
        .maybeSingle();

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

      const topChunks = rankChunks(lastUserQuestion, rawChunks, 5);
      ragSources = Array.from(new Set(topChunks.map((chunk) => chunk.fileName)));

      ragContext = [
        notice
          ? `Resumo do edital:\nTitulo: ${notice.title}\nResumo: ${notice.summary}\nDescricao: ${notice.description}\n`
          : "",
        ...topChunks.map(
          (chunk, index) =>
            `Trecho ${index + 1} (${chunk.fileName}):\n${chunk.content.slice(0, 1200)}`
        )
      ]
        .filter(Boolean)
        .join("\n\n");
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
Use estritamente o contexto recuperado quando ele existir.
Se nao houver contexto suficiente para responder com seguranca, diga explicitamente.
Sempre que possivel, cite de forma resumida os arquivos base da resposta.`
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
