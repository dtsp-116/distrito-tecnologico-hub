import type { SupabaseClient } from "@supabase/supabase-js";
import { FapiEvaluationService } from "@/modules/fapi/services/FapiEvaluationService";
import { FapiChatService } from "@/modules/fapi/services/FapiChatService";
import { FapiWritingService } from "@/modules/fapi/services/FapiWritingService";
import { FapiWritingChatService } from "@/modules/fapi/services/FapiWritingChatService";
import { fapiChatSchema, fapiWritingChatSchema, fapiWritingSchema } from "@/modules/fapi/validators/fapiSchemas";
import { sanitizeUserText } from "@/modules/fapi/services/requestGuards";
import { resetFapiSession, resetFapiWritingSession } from "@/modules/fapi/services/sessionStore";

export async function analyzeFapiController(input: {
  supabase: SupabaseClient;
  userId: string;
  formData: FormData;
}) {
  const file = input.formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Envie um arquivo valido para analise.");
  }

  const agencyIdValue = input.formData.get("agencyId");
  const editalIdValue = input.formData.get("editalId");
  const agencyId = typeof agencyIdValue === "string" && agencyIdValue.trim() ? agencyIdValue : null;
  const editalId = typeof editalIdValue === "string" && editalIdValue.trim() ? editalIdValue : null;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const service = new FapiEvaluationService(input.supabase);
  return service.evaluate({
    userId: input.userId,
    agencyId,
    editalId,
    file: {
      fileName: sanitizeUserText(file.name || "fapi"),
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      bytes
    }
  });
}

export async function chatWithFapiController(input: {
  userId: string;
  body: unknown;
}) {
  const parsed = fapiChatSchema.safeParse(input.body);
  if (!parsed.success) {
    throw new Error("Payload invalido.");
  }

  const service = new FapiChatService();
  return service.reply({
    sessionId: parsed.data.sessionId,
    userId: input.userId,
    message: parsed.data.message
  });
}

export function resetFapiSessionController(input: { sessionId: string; userId: string }) {
  const reset = resetFapiSession(input.sessionId, input.userId);
  if (!reset) {
    throw new Error("Sessao nao encontrada.");
  }
  return { reset: true };
}

export async function writeFapiController(input: {
  supabase: SupabaseClient;
  userId: string;
  body: unknown;
}) {
  const parsed = fapiWritingSchema.safeParse(input.body);
  if (!parsed.success) {
    throw new Error("Payload invalido.");
  }

  const service = new FapiWritingService(input.supabase);
  return service.generate({
    userId: input.userId,
    agencyId: parsed.data.agencyId ?? null,
    editalId: parsed.data.editalId ?? null,
    briefing: parsed.data.briefing
  });
}

export async function chatWithFapiWritingController(input: {
  userId: string;
  body: unknown;
}) {
  const parsed = fapiWritingChatSchema.safeParse(input.body);
  if (!parsed.success) {
    throw new Error("Payload invalido.");
  }

  const service = new FapiWritingChatService();
  return service.refine({
    sessionId: parsed.data.sessionId,
    userId: input.userId,
    message: parsed.data.message
  });
}

export function resetFapiWritingSessionController(input: { sessionId: string; userId: string }) {
  const reset = resetFapiWritingSession(input.sessionId, input.userId);
  if (!reset) {
    throw new Error("Sessao nao encontrada.");
  }
  return { reset: true };
}
