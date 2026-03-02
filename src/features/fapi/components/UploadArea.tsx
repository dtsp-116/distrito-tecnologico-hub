"use client";

interface UploadAreaProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isLoading?: boolean;
}

export function UploadArea({ selectedFile, onFileChange, isLoading = false }: UploadAreaProps) {
  return (
    <div className="space-y-2">
      <label className="text-subtle block text-xs font-semibold uppercase tracking-wide">
        FAPI (PDF ou imagem)
      </label>
      <label className="panel-muted flex min-h-28 cursor-pointer flex-col items-center justify-center border-dashed p-3 text-center transition hover:brightness-95">
        <input
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          disabled={isLoading}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <p className="text-sm font-semibold text-[color:var(--text-primary)]">
          {selectedFile ? selectedFile.name : "Toque para enviar arquivo"}
        </p>
        <p className="text-subtle mt-1 text-xs">Maximo de 12MB, sem armazenamento permanente.</p>
      </label>
    </div>
  );
}
