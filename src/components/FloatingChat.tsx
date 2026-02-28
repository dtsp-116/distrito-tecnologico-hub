"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { MensagemChat } from "@/types";
import { useChat } from "@/hooks/useChat";

interface FloatingChatProps {
  title: string;
  initialMessages?: MensagemChat[];
  botName?: string;
  noticeId?: string;
  triggerLabel?: string;
  emptyStateMessage?: string;
}

export function FloatingChat({
  title,
  initialMessages,
  botName,
  noticeId,
  triggerLabel = "Chat",
  emptyStateMessage = "Comece a conversa enviando sua duvida."
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      {isOpen && (
        <section className="fixed bottom-20 right-4 z-40 flex h-[68dvh] w-[calc(100%-2rem)] max-w-sm flex-col rounded-mdx border border-district-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 md:bottom-24 md:right-6">
          <header className="flex items-center justify-between border-b border-district-border px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-district-border px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-100"
              aria-label="Fechar chat do edital"
            >
              Fechar
            </button>
          </header>

          <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
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
                  <p className="text-sm text-gray-700 dark:text-gray-300">{message.conteudo}</p>
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

          <form onSubmit={handleSubmit} className="border-t border-district-border p-3 dark:border-gray-700">
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
        className="fixed bottom-4 right-4 z-40 h-12 rounded-full bg-district-red px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 md:bottom-6 md:right-6"
        aria-label={isOpen ? `Minimizar ${triggerLabel}` : `Abrir ${triggerLabel}`}
      >
        {isOpen ? "Minimizar chat" : triggerLabel}
      </button>
    </>
  );
}
