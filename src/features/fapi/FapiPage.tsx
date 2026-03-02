"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia } from "@/types";
import { AgencySelector } from "@/features/fapi/components/AgencySelector";
import { UploadArea } from "@/features/fapi/components/UploadArea";
import { MessageBubble } from "@/features/fapi/components/MessageBubble";
import { EvaluationResultCard } from "@/features/fapi/components/EvaluationResultCard";
import { FapiChatLayout } from "@/features/fapi/components/FapiChatLayout";

interface FapiPageProps {
  agencias: Agencia[];
}

interface FapiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function FapiPage({ agencias }: FapiPageProps) {
  const [agencyId, setAgencyId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FapiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [evaluationMeta, setEvaluationMeta] = useState<{
    extractedMethod: string;
    extractedChars: number;
    appliedRuleCount: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const activeAgencyId = useMemo(() => {
    return agencyId || undefined;
  }, [agencyId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 80);
  };

  const handleReset = async () => {
    setError("");
    if (sessionId) {
      await fetch("/api/fapi/session/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    }
    setSessionId(null);
    setMessages([]);
    setEvaluationMeta(null);
    setSelectedFile(null);
    setDraft("");
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Selecione uma FAPI para iniciar a analise.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (agencyId) formData.append("agencyId", agencyId);

      const response = await fetch("/api/fapi/analyze", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as {
        error?: string;
        sessionId?: string;
        response?: string;
        extractedMethod?: string;
        extractedChars?: number;
        appliedRules?: Array<{ id: string }>;
      };

      if (!response.ok || !data.sessionId || !data.response) {
        throw new Error(data.error ?? "Falha ao avaliar FAPI.");
      }

      setSessionId(data.sessionId);
      setMessages([{ id: crypto.randomUUID(), role: "assistant", content: data.response }]);
      setEvaluationMeta({
        extractedMethod: data.extractedMethod ?? "unknown",
        extractedChars: data.extractedChars ?? 0,
        appliedRuleCount: data.appliedRules?.length ?? 0
      });
      scrollToBottom();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Falha ao avaliar FAPI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionId || !draft.trim() || isReplying) return;

    const userMessage: FapiMessage = { id: crypto.randomUUID(), role: "user", content: draft.trim() };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsReplying(true);
    setError("");
    scrollToBottom();

    try {
      const response = await fetch("/api/fapi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content
        })
      });
      const data = (await response.json()) as { error?: string; content?: string };
      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Falha no chat da FAPI.");
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: data.content ?? "" }]);
      scrollToBottom();
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Falha no chat da FAPI.");
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <MainLayout agencias={agencias} activeAgencyId={activeAgencyId}>
      <FapiChatLayout onReset={handleReset}>
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {!sessionId ? (
            <form onSubmit={handleAnalyze} className="space-y-3">
              <AgencySelector agencies={agencias} value={agencyId} onChange={setAgencyId} />
              <UploadArea selectedFile={selectedFile} onFileChange={setSelectedFile} isLoading={isAnalyzing} />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="h-10 w-full rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isAnalyzing ? "Analisando FAPI..." : "Iniciar analise tecnica"}
              </button>
            </form>
          ) : (
            <>
              {evaluationMeta && (
                <EvaluationResultCard
                  extractedMethod={evaluationMeta.extractedMethod}
                  extractedChars={evaluationMeta.extractedChars}
                  appliedRuleCount={evaluationMeta.appliedRuleCount}
                />
              )}
              {messages.map((message) => (
                <MessageBubble key={message.id} role={message.role} content={message.content} />
              ))}
              {isReplying && (
                <p className="text-xs font-medium text-district-red" aria-live="polite">
                  Assistente digitando...
                </p>
              )}
            </>
          )}
          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
        </div>

        {sessionId && (
          <form onSubmit={handleSendMessage} className="sticky bottom-0 grid grid-cols-[1fr_auto] gap-2 border-t border-district-border bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Pergunte algo sobre a FAPI analisada..."
              className="h-10 rounded-md border border-district-border bg-white px-3 text-sm outline-none focus:border-district-red dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={isReplying || !draft.trim()}
              className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        )}
      </FapiChatLayout>
    </MainLayout>
  );
}
