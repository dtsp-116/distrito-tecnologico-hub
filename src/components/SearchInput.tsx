interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="panel flex w-full flex-col gap-1.5 p-3 sm:p-4">
      <span className="text-sm font-semibold text-[color:var(--text-primary)]">Buscar editais</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
        placeholder="Digite nome, agencia ou topico"
        className="input-base min-w-0"
        aria-label="Campo de busca de editais"
      />
    </label>
  );
}
