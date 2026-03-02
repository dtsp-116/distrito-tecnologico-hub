"use client";

import { ReactNode } from "react";

interface FapiChatLayoutProps {
  onReset: () => void;
  children: ReactNode;
}

export function FapiChatLayout({ onReset, children }: FapiChatLayoutProps) {
  return (
    <section className="flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-mdx border border-district-border bg-white shadow-card dark:border-gray-700 dark:bg-gray-900">
      <header className="flex items-center justify-between border-b border-district-border px-3 py-2.5 dark:border-gray-700">
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-base">Análise de FAPI</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Avaliacao tecnica em fluxo conversacional.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-md border border-district-border px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Nova analise
        </button>
      </header>
      {children}
    </section>
  );
}
