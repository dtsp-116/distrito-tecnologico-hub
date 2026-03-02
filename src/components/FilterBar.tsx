import { EditalStatus } from "@/types";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  agenciaOptions: FilterOption[];
  topicoOptions: FilterOption[];
  statusOptions: { value: EditalStatus; label: string }[];
  selectedAgencia: string;
  selectedStatus: EditalStatus | "";
  selectedTopico: string;
  onAgenciaChange: (value: string) => void;
  onStatusChange: (value: EditalStatus | "") => void;
  onTopicoChange: (value: string) => void;
}

export function FilterBar({
  agenciaOptions,
  topicoOptions,
  statusOptions,
  selectedAgencia,
  selectedStatus,
  selectedTopico,
  onAgenciaChange,
  onStatusChange,
  onTopicoChange
}: FilterBarProps) {
  return (
    <section className="panel grid gap-2.5 p-3 sm:gap-3 sm:p-4 md:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[color:var(--text-primary)]">Agencia</span>
        <select
          value={selectedAgencia}
          onChange={(event) => onAgenciaChange(event.target.value)}
          className="input-base min-w-0"
          aria-label="Filtro por agencia"
        >
          <option value="">Todas as agencias</option>
          {agenciaOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[color:var(--text-primary)]">Status</span>
        <select
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value as EditalStatus | "")}
          className="input-base min-w-0"
          aria-label="Filtro por status"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[color:var(--text-primary)]">Topicos</span>
        <select
          value={selectedTopico}
          onChange={(event) => onTopicoChange(event.target.value)}
          className="input-base min-w-0"
          aria-label="Filtro por topicos"
        >
          <option value="">Todos os topicos</option>
          {topicoOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
