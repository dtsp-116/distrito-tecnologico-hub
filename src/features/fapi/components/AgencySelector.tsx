"use client";

import { Agencia } from "@/types";

interface AgencySelectorProps {
  agencies: Agencia[];
  value: string;
  onChange: (value: string) => void;
}

export function AgencySelector({ agencies, value, onChange }: AgencySelectorProps) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Agencia FAPI (opcional)
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-800 outline-none focus:border-district-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="">Selecionar agencia</option>
        {agencies.map((agency) => (
          <option key={agency.id} value={agency.id}>
            {agency.sigla} - {agency.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
