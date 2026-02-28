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
    <section className="grid gap-3 rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Agencia</span>
        <select
          value={selectedAgencia}
          onChange={(event) => onAgenciaChange(event.target.value)}
          className="h-11 w-full min-w-0 rounded-mdx border border-district-border bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</span>
        <select
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value as EditalStatus | "")}
          className="h-11 w-full min-w-0 rounded-mdx border border-district-border bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Topicos</span>
        <select
          value={selectedTopico}
          onChange={(event) => onTopicoChange(event.target.value)}
          className="h-11 w-full min-w-0 rounded-mdx border border-district-border bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
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
