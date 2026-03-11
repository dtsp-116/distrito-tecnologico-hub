import { appendFapiWritingSessionMessages, getFapiWritingSession } from "@/modules/fapi/services/sessionStore";
import { callGroq } from "@/modules/fapi/services/groqClient";
import { runWithTimeout, sanitizeUserText } from "@/modules/fapi/services/requestGuards";
import { buildFapiWritingPrompt } from "@/modules/fapi/services/fapiPromptBuilder";

export class FapiWritingChatService {
  async refine(input: { sessionId: string; userId: string; message: string }) {
    const sanitized = sanitizeUserText(input.message);
    if (!sanitized) {
      throw new Error("Mensagem invalida.");
    }

    const session = getFapiWritingSession(input.sessionId, input.userId);
    if (!session) {
      throw new Error("Sessao de escrita expirada ou inexistente. Gere uma nova FAPI a partir do briefing.");
    }

    const basePrompt = buildFapiWritingPrompt({
      briefing: session.briefing,
      rules: session.appliedRules
    });

    const history = session.messages.slice(-12).map((item) => ({
      role: item.role,
      content: item.content
    }));

    const response = await runWithTimeout(
      callGroq([
        { role: "system", content: basePrompt },
        ...history,
        { role: "user", content: sanitized }
      ]),
      60000,
      "Tempo limite excedido durante o refinamento da FAPI."
    );

    appendFapiWritingSessionMessages(
      input.sessionId,
      input.userId,
      [
        { role: "user", content: sanitized, createdAt: Date.now() },
        { role: "assistant", content: response, createdAt: Date.now() }
      ],
      response
    );

    return { content: response };
  }
}

