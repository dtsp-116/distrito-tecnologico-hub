"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MensagemChat } from "@/types";
import { useChat } from "@/hooks/useChat";
import { ButtonBase } from "@/components/ui/ButtonBase";

interface FloatingChatProps {
  title: string;
  initialMessages?: MensagemChat[];
  botName?: string;
  noticeId?: string;
  triggerLabel?: string;
  emptyStateMessage?: string;
  quickActions?: string[];
  desktopDocked?: boolean;
  desktopDockedSide?: "left" | "right";
}

export function FloatingChat({
  title,
  initialMessages,
  botName,
  noticeId,
  triggerLabel = "Chat",
  emptyStateMessage = "Comece a conversa enviando sua duvida.",
  quickActions,
  desktopDocked = false,
  desktopDockedSide = "left"
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [text, setText] = useState("");
  const [uploadFeedback, setUploadFeedback] = useState("");
  const { messages, isReplying, sendMessage, containerRef } = useChat({ initialMessages, botName, noticeId });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const handleAttachFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadFeedback(`Arquivo anexado: ${file.name}`);
    event.target.value = "";
  };

  const contextualQuickActions = (quickActions && quickActions.length > 0
    ? quickActions
    : noticeId
      ? [
          "Quais requisitos obrigatorios deste edital?",
          "Qual o prazo final e documentos principais?",
          "Este edital combina com projeto de R$ 2 milhoes?"
        ]
      : [
          "Tenho projeto de IA com R$ 3 milhoes. Quais editais posso tentar?",
          "Quais editais abertos para bioeconomia hoje?",
          "Compare os 3 editais mais aderentes para ESG."
        ]
  ).slice(0, 3);

  return (
    <>
      {desktopDocked && (
        <div
          className={`fixed ${desktopDockedSide === "right" ? "right-4" : "left-4"} bottom-0 top-16 z-30 hidden pb-3 transition-all duration-300 lg:flex ${
            isDesktopCollapsed ? "w-16" : "w-[320px]"
          }`}
        >
          <section className="panel flex w-full flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--border-color)" }}>
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                  <path d="M5 19V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!isDesktopCollapsed && title}
              </h3>
              <ButtonBase
                type="button"
                variant="secondary"
                onClick={() => setIsDesktopCollapsed((value) => !value)}
                className="h-8 w-8 px-0"
                aria-label={isDesktopCollapsed ? `Expandir ${title}` : `Recolher ${title}`}
              >
                {isDesktopCollapsed ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={desktopDockedSide === "right" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={desktopDockedSide === "right" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </ButtonBase>
            </header>

            {!isDesktopCollapsed && (
              <>
                <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[var(--border-color)] p-3 text-sm text-subtle">
                      {emptyStateMessage}
                    </p>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className="panel-muted p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <strong className="text-xs text-[color:var(--text-primary)]">{message.usuario}</strong>
                          <span className="text-subtle text-[11px]">{message.horario}</span>
                        </div>
                        <div className="text-sm text-subtle">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-bold">{children}</h4>,
                              h2: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>,
                              h3: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-semibold">{children}</h5>,
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => (
                                <strong className="font-semibold text-[color:var(--text-primary)]">{children}</strong>
                              )
                            }}
                          >
                            {message.conteudo}
                          </ReactMarkdown>
                        </div>
                      </article>
                    ))
                  )}
                  {isReplying && (
                    <p className="text-xs font-medium text-district-red" aria-live="polite">
                      Assistente digitando...
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="border-t p-3" style={{ borderColor: "var(--border-color)" }}>
                  {contextualQuickActions.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {contextualQuickActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => sendMessage(action)}
                          disabled={isReplying}
                          className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-subtle transition hover:brightness-95 disabled:opacity-60"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      type="text"
                      placeholder="Digite sua mensagem..."
                      className="input-base h-10"
                      aria-label={`Mensagem de ${title}`}
                    />
                    <ButtonBase type="submit" variant="primary" className="h-10 rounded-md px-4">
                      Enviar
                    </ButtonBase>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {isOpen && (
        <section className="panel fixed bottom-20 right-4 z-40 flex h-[70dvh] w-[calc(100%-1.25rem)] max-w-sm flex-col overflow-hidden md:bottom-24 md:right-6 lg:hidden">
          <header className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">{title}</h3>
            <ButtonBase
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 px-0"
              aria-label="Fechar chat do edital"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </ButtonBase>
          </header>

          <div ref={containerRef} className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
            {messages.length === 0 ? (
              <p className="rounded-md border border-dashed border-district-border p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {emptyStateMessage}
              </p>
            ) : (
              messages.map((message) => (
                <article key={message.id} className="panel-muted p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="text-xs text-[color:var(--text-primary)]">{message.usuario}</strong>
                    <span className="text-subtle text-[11px]">{message.horario}</span>
                  </div>
                  <div className="text-sm text-subtle">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-bold">{children}</h4>,
                        h2: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>,
                        h3: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-semibold">{children}</h5>,
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-[color:var(--text-primary)]">{children}</strong>
                      }}
                    >
                      {message.conteudo}
                    </ReactMarkdown>
                  </div>
                </article>
              ))
            )}

            {isReplying && (
              <p className="text-xs font-medium text-district-red" aria-live="polite">
                Assistente digitando...
              </p>
            )}
            {uploadFeedback && (
                <p className="text-subtle text-xs" aria-live="polite">
                {uploadFeedback}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-2.5" style={{ borderColor: "var(--border-color)" }}>
            {contextualQuickActions.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {contextualQuickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendMessage(action)}
                    disabled={isReplying}
                    className="whitespace-nowrap rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-subtle transition hover:brightness-95 disabled:opacity-60"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-2 grid grid-cols-[auto_1fr_auto] gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-district-border px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-100">
                Anexar
                <input type="file" className="sr-only" onChange={handleAttachFile} />
              </label>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                type="text"
                placeholder="Digite sua mensagem..."
                className="input-base h-10"
                aria-label={`Mensagem de ${title}`}
              />
              <ButtonBase type="submit" variant="primary" className="h-10 rounded-md px-4">
                Enviar
              </ButtonBase>
            </div>
          </form>
        </section>
      )}

      <ButtonBase
        type="button"
        variant="primary"
        onClick={() => setIsOpen((currentState) => !currentState)}
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full px-0 shadow-lg md:bottom-6 md:right-6 lg:hidden"
        aria-label={isOpen ? `Minimizar ${triggerLabel}` : `Abrir ${triggerLabel}`}
      >
        {isOpen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 10h8M8 14h5" strokeLinecap="round" />
            <path d="M5 19V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </ButtonBase>
    </>
  );
}
