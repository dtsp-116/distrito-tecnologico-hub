import { appendFapiSessionMessages, getFapiSession } from "@/modules/fapi/services/sessionStore";
import { buildFapiChatPrompt } from "@/modules/fapi/services/fapiPromptBuilder";
import { callGroq } from "@/modules/fapi/services/groqClient";
import { runWithTimeout, sanitizeUserText } from "@/modules/fapi/services/requestGuards";

export class FapiChatService {
  async reply(input: { sessionId: string; userId: string; message: string }) {
    const sanitized = sanitizeUserText(input.message);
    if (!sanitized) {
      throw new Error("Mensagem invalida.");
    }

    const session = getFapiSession(input.sessionId, input.userId);
    if (!session) {
      throw new Error("Sessao expirada ou inexistente. Inicie uma nova analise.");
    }

    const prompt = buildFapiChatPrompt({
      extractedText: session.extractedText,
      evaluation: session.evaluation,
      rules: session.appliedRules
    });

    const history = session.messages.slice(-12).map((item) => ({
      role: item.role,
      content: item.content
    }));

    const response = await runWithTimeout(
      callGroq([
        { role: "system", content: prompt },
        ...history,
        { role: "user", content: sanitized }
      ]),
      45000,
      "Tempo limite excedido no chat da FAPI."
    );

    appendFapiSessionMessages(input.sessionId, input.userId, [
      { role: "user", content: sanitized, createdAt: Date.now() },
      { role: "assistant", content: response, createdAt: Date.now() }
    ]);

    return { content: response };
  }
}
