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
      <span className="text-subtle text-xs font-semibold uppercase tracking-wide">
        Agencia FAPI (opcional)
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-base h-10"
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
