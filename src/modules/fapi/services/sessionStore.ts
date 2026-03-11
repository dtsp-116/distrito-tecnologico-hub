import { ConsolidatedRule, FapiSessionMessage, FapiWritingSession, ParsedFapi } from "@/modules/fapi/dto/types";

interface FapiSession {
  sessionId: string;
  userId: string;
  agencyId: string | null;
  editalId: string | null;
  extractedText: string;
  parsedFapi: ParsedFapi;
  evaluation: string;
  appliedRules: ConsolidatedRule[];
  messages: FapiSessionMessage[];
  expiresAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map<string, FapiSession>();
const writingSessions = new Map<string, FapiWritingSession>();

function cloneSession(session: FapiSession): FapiSession {
  return {
    ...session,
    appliedRules: [...session.appliedRules],
    parsedFapi: { ...session.parsedFapi },
    messages: [...session.messages]
  };
}

export function purgeExpiredFapiSessions() {
  const now = Date.now();
  for (const [key, value] of sessions.entries()) {
    if (value.expiresAt <= now) sessions.delete(key);
  }
}

export function saveFapiSession(input: Omit<FapiSession, "expiresAt">) {
  purgeExpiredFapiSessions();
  sessions.set(input.sessionId, {
    ...input,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
}

export function getFapiSession(sessionId: string, userId: string): FapiSession | null {
  purgeExpiredFapiSessions();
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.userId !== userId) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(sessionId, session);
  return cloneSession(session);
}

export function appendFapiSessionMessages(sessionId: string, userId: string, messages: FapiSessionMessage[]) {
  purgeExpiredFapiSessions();
  const current = sessions.get(sessionId);
  if (!current || current.userId !== userId) return false;
  const nextMessages = [...current.messages, ...messages].slice(-20);
  sessions.set(sessionId, {
    ...current,
    messages: nextMessages,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return true;
}

export function resetFapiSession(sessionId: string, userId: string) {
  const current = sessions.get(sessionId);
  if (!current || current.userId !== userId) return false;
  sessions.delete(sessionId);
  return true;
}

export function purgeExpiredFapiWritingSessions() {
  const now = Date.now();
  for (const [key, value] of writingSessions.entries()) {
    if (value.expiresAt <= now) writingSessions.delete(key);
  }
}

export function saveFapiWritingSession(input: Omit<FapiWritingSession, "expiresAt">) {
  purgeExpiredFapiWritingSessions();
  writingSessions.set(input.sessionId, {
    ...input,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
}

export function getFapiWritingSession(sessionId: string, userId: string): FapiWritingSession | null {
  purgeExpiredFapiWritingSessions();
  const session = writingSessions.get(sessionId);
  if (!session || session.userId !== userId) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  writingSessions.set(sessionId, session);
  return {
    ...session,
    appliedRules: [...session.appliedRules],
    messages: [...session.messages]
  };
}

export function appendFapiWritingSessionMessages(
  sessionId: string,
  userId: string,
  messages: FapiSessionMessage[],
  nextDraft: string
) {
  purgeExpiredFapiWritingSessions();
  const current = writingSessions.get(sessionId);
  if (!current || current.userId !== userId) return false;
  const nextMessages = [...current.messages, ...messages].slice(-20);
  writingSessions.set(sessionId, {
    ...current,
    draftFapi: nextDraft,
    messages: nextMessages,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return true;
}

export function resetFapiWritingSession(sessionId: string, userId: string) {
  const current = writingSessions.get(sessionId);
  if (!current || current.userId !== userId) return false;
  writingSessions.delete(sessionId);
  return true;
}
