"use client";

interface UploadAreaProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isLoading?: boolean;
}

export function UploadArea({ selectedFile, onFileChange, isLoading = false }: UploadAreaProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        FAPI (PDF ou imagem)
      </label>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-district-border bg-gray-50 p-3 text-center transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
        <input
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          disabled={isLoading}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {selectedFile ? selectedFile.name : "Toque para enviar arquivo"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximo de 12MB, sem armazenamento permanente.</p>
      </label>
    </div>
  );
}
