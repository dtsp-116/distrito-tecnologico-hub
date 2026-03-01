"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MensagemChat } from "@/types";
import { useChat } from "@/hooks/useChat";

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
          <section className="flex w-full flex-col rounded-mdx border border-district-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <header className="flex items-center justify-between border-b border-district-border px-3 py-2 dark:border-gray-700">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                  <path d="M5 19V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!isDesktopCollapsed && title}
              </h3>
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-district-border text-gray-700 dark:border-gray-700 dark:text-gray-100"
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
              </button>
            </header>

            {!isDesktopCollapsed && (
              <>
                <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <p className="rounded-md border border-dashed border-district-border p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {emptyStateMessage}
                    </p>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <strong className="text-xs text-gray-800 dark:text-gray-100">{message.usuario}</strong>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{message.horario}</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
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
                                <strong className="font-semibold text-gray-800 dark:text-gray-100">{children}</strong>
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

                <form onSubmit={handleSubmit} className="border-t border-district-border p-3 dark:border-gray-700">
                  {contextualQuickActions.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {contextualQuickActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => sendMessage(action)}
                          disabled={isReplying}
                          className="rounded-full border border-district-border px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
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
                      className="h-10 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      aria-label={`Mensagem de ${title}`}
                    />
                    <button
                      type="submit"
                      className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {isOpen && (
        <section className="fixed bottom-20 right-4 z-40 flex h-[70dvh] w-[calc(100%-1.25rem)] max-w-sm flex-col rounded-mdx border border-district-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 md:bottom-24 md:right-6 lg:hidden">
          <header className="flex items-center justify-between border-b border-district-border px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-district-border text-gray-700 dark:border-gray-700 dark:text-gray-100"
              aria-label="Fechar chat do edital"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={containerRef} className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
            {messages.length === 0 ? (
              <p className="rounded-md border border-dashed border-district-border p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {emptyStateMessage}
              </p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-md bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="text-xs text-gray-800 dark:text-gray-100">{message.usuario}</strong>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{message.horario}</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
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
                        strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-gray-100">{children}</strong>
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
              <p className="text-xs text-gray-600 dark:text-gray-300" aria-live="polite">
                {uploadFeedback}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-district-border p-2.5 dark:border-gray-700">
            {contextualQuickActions.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {contextualQuickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendMessage(action)}
                    disabled={isReplying}
                    className="whitespace-nowrap rounded-full border border-district-border px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
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
                className="h-10 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                aria-label={`Mensagem de ${title}`}
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                Enviar
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((currentState) => !currentState)}
        className="fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-district-red text-white shadow-lg transition hover:bg-red-700 md:bottom-6 md:right-6 lg:hidden"
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
      </button>
    </>
  );
}
