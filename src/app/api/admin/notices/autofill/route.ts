import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdmin } from "@/lib/auth/adminGuard";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const payloadSchema = z.object({
  link: z.string().url()
});

const autofillSchema = z.object({
  nome: z.string().optional().default(""),
  resumo: z.string().optional().default(""),
  descricao: z.string().optional().default(""),
  status: z.enum(["aberto", "encerrado", "em_breve"]).optional().default("em_breve"),
  dataPublicacao: z.string().optional().default(""),
  dataLimite: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  valorMinimo: z.number().nullable().optional().default(null),
  valorMaximo: z.number().nullable().optional().default(null),
  trlMinimo: z.number().nullable().optional().default(null),
  trlMaximo: z.number().nullable().optional().default(null)
});

function stripHtml(rawHtml: string) {
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tryParseJson(content: string) {
  const cleaned = content.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  const auth = await ensureAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Link invalido." }, { status: 400 });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY nao configurada." }, { status: 500 });
  }

  const sourceResponse = await fetch(parsed.data.link);
  if (!sourceResponse.ok) {
    return NextResponse.json({ error: "Nao foi possivel acessar o link informado." }, { status: 400 });
  }

  const rawHtml = await sourceResponse.text();
  const sourceText = stripHtml(rawHtml).slice(0, 18000);

  const iaResponse = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Voce extrai campos de editais e responde SOMENTE com JSON valido. Se nao encontrar um campo, devolva valor vazio, null ou array vazio."
        },
        {
          role: "user",
          content: `Extraia do texto do edital os campos abaixo e responda com JSON:
{
  "nome": string,
  "resumo": string,
  "descricao": string,
  "status": "aberto" | "encerrado" | "em_breve",
  "dataPublicacao": "YYYY-MM-DD" ou "",
  "dataLimite": "YYYY-MM-DD" ou "",
  "tags": string[],
  "valorMinimo": number|null,
  "valorMaximo": number|null,
  "trlMinimo": number|null,
  "trlMaximo": number|null
}

Texto:
${sourceText}`
        }
      ]
    })
  });

  if (!iaResponse.ok) {
    const details = await iaResponse.text();
    return NextResponse.json({ error: "Falha ao processar link com IA.", details }, { status: 502 });
  }

  const iaData = await iaResponse.json();
  const content = iaData?.choices?.[0]?.message?.content as string | undefined;
  if (!content) {
    return NextResponse.json({ error: "A IA nao retornou conteudo." }, { status: 502 });
  }

  const json = tryParseJson(content);
  if (!json) {
    return NextResponse.json({ error: "Nao foi possivel interpretar resposta da IA." }, { status: 502 });
  }

  const safeAutofill = autofillSchema.parse(json);
  return NextResponse.json(safeAutofill);
}
