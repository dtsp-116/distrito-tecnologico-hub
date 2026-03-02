const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(messages: ChatMessage[]) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("Chave GROQ_API_KEY nao configurada no servidor.");
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages
    })
  });

  if (!response.ok) {
    throw new Error("Falha ao consultar IA.");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content as string | undefined;
  if (!content?.trim()) {
    throw new Error("Resposta vazia da IA.");
  }

  return content.trim();
}
