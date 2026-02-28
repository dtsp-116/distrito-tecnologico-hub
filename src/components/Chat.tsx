"use client";

import { FormEvent, useState } from "react";
import { MensagemChat } from "@/types";
import { useChat } from "@/hooks/useChat";

interface ChatProps {
  title: string;
  initialMessages?: MensagemChat[];
  botName?: string;
}

export function Chat({ title, initialMessages, botName }: ChatProps) {
  const [text, setText] = useState("");
  const { messages, isReplying, sendMessage, containerRef } = useChat({ initialMessages, botName });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <section className="flex h-[460px] flex-col rounded-mdx border border-district-border bg-white dark:border-gray-700 dark:bg-gray-900">
      <header className="border-b border-district-border px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </header>

      <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="rounded-md border border-dashed border-district-border p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Ainda nao ha mensagens neste chat.
          </p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
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
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2 border-t border-district-border p-3 dark:border-gray-700">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          type="text"
          placeholder="Digite sua mensagem"
          className="h-10 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          aria-label="Campo para digitar mensagem do chat"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
