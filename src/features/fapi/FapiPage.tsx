"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Agencia } from "@/types";
import { AgencySelector } from "@/features/fapi/components/AgencySelector";
import { UploadArea } from "@/features/fapi/components/UploadArea";
import { MessageBubble } from "@/features/fapi/components/MessageBubble";
import { EvaluationResultCard } from "@/features/fapi/components/EvaluationResultCard";
import { FapiChatLayout } from "@/features/fapi/components/FapiChatLayout";
import { ButtonBase } from "@/components/ui/ButtonBase";

interface FapiPageProps {
  agencias: Agencia[];
}

interface FapiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function FapiPage({ agencias }: FapiPageProps) {
  const [mode, setMode] = useState<"write" | "analyze">("analyze");
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

  // Escrita de FAPI
  const [writeSessionId, setWriteSessionId] = useState<string | null>(null);
  const [writeMessages, setWriteMessages] = useState<FapiMessage[]>([]);
  const [writeDraft, setWriteDraft] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [isWritingReplying, setIsWritingReplying] = useState(false);
  const [writeAppliedRuleCount, setWriteAppliedRuleCount] = useState(0);

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
    if (mode === "analyze") {
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
    } else {
      if (writeSessionId) {
        await fetch("/api/fapi/write/session/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: writeSessionId })
        });
      }
      setWriteSessionId(null);
      setWriteMessages([]);
      setWriteDraft("");
      setWriteAppliedRuleCount(0);
    }
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

  const handleWriteGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!writeDraft.trim()) {
      setError("Descreva o briefing da FAPI para gerar uma proposta.");
      return;
    }

    setError("");
    setIsWriting(true);
    try {
      const payload = {
        briefing: writeDraft.trim(),
        agencyId: agencyId || null
      };

      const response = await fetch("/api/fapi/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as {
        error?: string;
        sessionId?: string;
        draftFapi?: string;
        appliedRules?: Array<{ id: string }>;
      };

      if (!response.ok || !data.sessionId || !data.draftFapi) {
        throw new Error(data.error ?? "Falha ao gerar FAPI a partir do briefing.");
      }

      setWriteSessionId(data.sessionId);
      setWriteAppliedRuleCount(data.appliedRules?.length ?? 0);
      setWriteMessages([
        { id: crypto.randomUUID(), role: "user", content: writeDraft.trim() },
        { id: crypto.randomUUID(), role: "assistant", content: data.draftFapi }
      ]);
      setWriteDraft("");
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar FAPI a partir do briefing.");
    } finally {
      setIsWriting(false);
    }
  };

  const handleWriteChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!writeSessionId || !writeDraft.trim() || isWritingReplying) return;

    const userMessage: FapiMessage = { id: crypto.randomUUID(), role: "user", content: writeDraft.trim() };
    setWriteMessages((current) => [...current, userMessage]);
    setWriteDraft("");
    setIsWritingReplying(true);
    setError("");
    scrollToBottom();

    try {
      const response = await fetch("/api/fapi/write/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: writeSessionId,
          message: userMessage.content
        })
      });
      const data = (await response.json()) as { error?: string; content?: string };
      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Falha ao refinar a FAPI.");
      }
      setWriteMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: data.content ?? "" }]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao refinar a FAPI.");
    } finally {
      setIsWritingReplying(false);
    }
  };

  return (
    <MainLayout agencias={agencias} activeAgencyId={activeAgencyId}>
      <FapiChatLayout onReset={handleReset}>
        <div className="border-b px-3 pb-2 pt-2.5 text-xs" style={{ borderColor: "var(--border-color)" }}>
          <div className="inline-flex rounded-full bg-[color:var(--bg-elevated)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`rounded-full px-3 py-1 font-medium ${
                mode === "write" ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]" : "text-subtle"
              }`}
            >
              Escrever FAPI
            </button>
            <button
              type="button"
              onClick={() => setMode("analyze")}
              className={`rounded-full px-3 py-1 font-medium ${
                mode === "analyze" ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]" : "text-subtle"
              }`}
            >
              Analisar FAPI pronta
            </button>
          </div>
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {mode === "analyze" ? (
            !sessionId ? (
            <>
              <div className="mb-3">
                <MessageBubble
                  role="assistant"
                  content={
                    "Envie a **FAPI (one page)** do seu projeto em PDF ou imagem e eu farei uma avaliacao tecnica estruturada. Em seguida, voce podera **continuar a conversa** tirando duvidas ou pedindo ajustes finos na redacao."
                  }
                />
              </div>
              <form onSubmit={handleAnalyze} className="space-y-3">
                <AgencySelector agencies={agencias} value={agencyId} onChange={setAgencyId} />
                <UploadArea selectedFile={selectedFile} onFileChange={setSelectedFile} isLoading={isAnalyzing} />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="btn-base btn-primary h-10 w-full disabled:opacity-60"
                >
                  {isAnalyzing ? "Analisando FAPI..." : "Iniciar analise tecnica"}
                </button>
                {isAnalyzing && (
                  <div className="mt-3 flex flex-col items-center gap-2 text-xs text-subtle" aria-live="polite">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[color:var(--primary-soft)] border-t-[color:var(--primary)]" />
                    <p className="text-[color:var(--text-primary)]">
                      Estamos lendo a sua FAPI com cuidado. Isso pode levar alguns segundos.
                    </p>
                  </div>
                )}
              </form>
            </>
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
              <p className="text-xs font-medium text-[color:var(--primary)]" aria-live="polite">
                  Assistente digitando...
                </p>
              )}
            </>
            )
          ) : mode === "write" ? (
            !writeSessionId ? (
              <>
                <div className="mb-3">
                  <MessageBubble
                    role="assistant"
                    content={
                      "Me conte sobre o projeto (empresa, problema, solucao proposta, valor aproximado, duracao e TRL atual/desejado) e eu vou montar uma **FAPI completa one-page** seguindo as regras gerais e da agencia/editais selecionados. Depois voce podera pedir ajustes finos via chat antes de colar no formulario oficial."
                    }
                  />
                </div>
                <form onSubmit={handleWriteGenerate} className="space-y-3">
                  <AgencySelector agencies={agencias} value={agencyId} onChange={setAgencyId} />
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Briefing do projeto</span>
                    <textarea
                      value={writeDraft}
                      onChange={(event) => setWriteDraft(event.target.value)}
                      rows={6}
                      className="textarea-base"
                      placeholder="Explique o projeto: contexto, problema, solucao proposta, publico alvo, valor aproximado, TRL atual e TRL desejado..."
                    />
                  </label>
                  <p className="text-[11px] text-[color:var(--text-secondary)]">
                    Dica: informe tudo que voce ja souber. Se algum dado ainda nao existir, a IA marcara como <strong>NAO INFORMADO</strong> e podera sugerir perguntas para completar depois.
                  </p>
                  <button
                    type="submit"
                    disabled={isWriting}
                    className="btn-base btn-primary h-10 w-full disabled:opacity-60"
                  >
                    {isWriting ? "Gerando FAPI..." : "Gerar FAPI a partir do briefing"}
                  </button>
                </form>
              </>
            ) : (
              <>
                {writeAppliedRuleCount > 0 && (
                  <div className="panel-muted mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] text-[color:var(--text-secondary)]">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[10px] text-[color:var(--primary)]">
                      R
                    </span>
                    <span>FAPI escrita com {writeAppliedRuleCount} regra(s) aplicada(s) (gerais, agencia e/ou edital).</span>
                  </div>
                )}
                {writeMessages.map((message) => (
                  <MessageBubble key={message.id} role={message.role} content={message.content} />
                ))}
                {isWritingReplying && (
                  <p className="text-xs font-medium text-[color:var(--primary)]" aria-live="polite">
                    Assistente reformulando a FAPI...
                  </p>
                )}
              </>
            )
          ) : null}
          {error && (
            <div className="space-y-1">
              <p className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </p>
              {(error.includes("imagem") || error.includes("OCR") || error.includes("resolucao") || error.includes("OCR_SPACE")) && (
                <p className="text-xs text-[color:var(--text-secondary)]">
                  Dica: para imagens, use arquivos nitidos ou maior resolucao; prefira PDF com camada de texto quando possivel. Em desenvolvimento, configure OCR_SPACE_API_KEY no .env.local.
                </p>
              )}
            </div>
          )}
        </div>

        {mode === "analyze" && sessionId && (
          <form onSubmit={handleSendMessage} className="sticky bottom-0 grid grid-cols-[1fr_auto] gap-2 border-t p-3" style={{ borderColor: "var(--border-color)", background: "var(--bg-elevated)" }}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Pergunte algo sobre a FAPI analisada..."
              className="input-base h-10"
            />
            <ButtonBase
              type="submit"
              variant="primary"
              disabled={isReplying || !draft.trim()}
              className="h-10 px-4 disabled:opacity-60"
            >
              Enviar
            </ButtonBase>
          </form>
        )}
        {mode === "write" && writeSessionId && (
          <form onSubmit={handleWriteChat} className="sticky bottom-0 grid grid-cols-[1fr_auto] gap-2 border-t p-3" style={{ borderColor: "var(--border-color)", background: "var(--bg-elevated)" }}>
            <input
              value={writeDraft}
              onChange={(event) => setWriteDraft(event.target.value)}
              placeholder="Peça ajustes na FAPI gerada (ex.: simplificar objetivo, focar mais na inovacao)..."
              className="input-base h-10"
            />
            <ButtonBase
              type="submit"
              variant="primary"
              disabled={isWritingReplying || !writeDraft.trim()}
              className="h-10 px-4 disabled:opacity-60"
            >
              Enviar
            </ButtonBase>
          </form>
        )}
      </FapiChatLayout>
    </MainLayout>
  );
}
