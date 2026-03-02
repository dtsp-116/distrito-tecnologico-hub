"use client";

interface EvaluationResultCardProps {
  extractedMethod: string;
  extractedChars: number;
  appliedRuleCount: number;
}

export function EvaluationResultCard({ extractedMethod, extractedChars, appliedRuleCount }: EvaluationResultCardProps) {
  return (
    <section className="panel p-3 text-xs text-subtle">
      <p className="text-subtle text-[11px] font-semibold uppercase tracking-wide">
        Resultado tecnico inicial
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2 py-1">
          Extracao: {extractedMethod}
        </span>
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2 py-1">
          Caracteres: {extractedChars}
        </span>
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2 py-1">
          Regras aplicadas: {appliedRuleCount}
        </span>
      </div>
    </section>
  );
}
