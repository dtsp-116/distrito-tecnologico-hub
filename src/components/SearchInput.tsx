interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="flex w-full flex-col gap-1 rounded-mdx border border-district-border bg-white p-3 shadow-card dark:border-gray-700 dark:bg-gray-900">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Buscar editais</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
        placeholder="Digite nome, agencia ou topico"
        className="h-11 w-full min-w-0 rounded-mdx border border-district-border bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        aria-label="Campo de busca de editais"
      />
    </label>
  );
}
