"use client";

import { ReactNode } from "react";

interface FapiChatLayoutProps {
  onReset: () => void;
  children: ReactNode;
}

export function FapiChatLayout({ onReset, children }: FapiChatLayoutProps) {
  return (
    <section className="panel flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: "var(--border-color)" }}>
        <div>
          <h1 className="text-sm font-bold text-[color:var(--text-primary)] sm:text-base">Análise de FAPI</h1>
          <p className="text-subtle text-[11px]">Avaliacao tecnica em fluxo conversacional.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="btn-base btn-secondary h-9 px-3 text-xs"
        >
          Nova analise
        </button>
      </header>
      {children}
    </section>
  );
}
