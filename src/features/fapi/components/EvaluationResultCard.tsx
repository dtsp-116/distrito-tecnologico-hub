"use client";

interface EvaluationResultCardProps {
  extractedMethod: string;
  extractedChars: number;
  appliedRuleCount: number;
}

export function EvaluationResultCard({ extractedMethod, extractedChars, appliedRuleCount }: EvaluationResultCardProps) {
  return (
    <section className="rounded-md border border-district-border bg-white p-3 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Resultado tecnico inicial
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-district-border px-2 py-1 dark:border-gray-700">
          Extracao: {extractedMethod}
        </span>
        <span className="rounded-full border border-district-border px-2 py-1 dark:border-gray-700">
          Caracteres: {extractedChars}
        </span>
        <span className="rounded-full border border-district-border px-2 py-1 dark:border-gray-700">
          Regras aplicadas: {appliedRuleCount}
        </span>
      </div>
    </section>
  );
}
