"use client";

import { useState } from "react";

interface UploadAreaProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isLoading?: boolean;
}

const MAX_SIZE_BYTES = 12 * 1024 * 1024; // 12MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function UploadArea({ selectedFile, onFileChange, isLoading = false }: UploadAreaProps) {
  const [pasteError, setPasteError] = useState("");

  const handleFile = (file: File | null) => {
    setPasteError("");
    if (!file) {
      onFileChange(null);
      return;
    }

    const isPdf = file.type === "application/pdf";
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      setPasteError("Arquivo invalido: permita apenas PDF ou imagem (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setPasteError("Arquivo muito grande: limite de 12MB.");
      return;
    }

    onFileChange(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
  };

  const handlePaste: React.ClipboardEventHandler<HTMLLabelElement> = (event) => {
    if (isLoading) return;
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    if (!imageItem) {
      setPasteError("Nenhuma imagem encontrada na area de transferencia.");
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      setPasteError("Nao foi possivel ler a imagem colada.");
      return;
    }

    handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-subtle block text-xs font-semibold uppercase tracking-wide">
        FAPI (PDF ou imagem)
      </label>
      <label
        className="panel-muted flex min-h-20 cursor-pointer items-center justify-between gap-3 border-dashed px-3 py-2 text-left transition hover:brightness-95"
        onPaste={handlePaste}
        tabIndex={0}
        aria-label="Botao de anexo da FAPI em PDF ou imagem. Voce pode clicar para escolher um arquivo ou colar uma imagem com Ctrl+V."
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
            {/* Icone de anexo */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M7.5 20a4.5 4.5 0 0 1-3.182-7.682l7.071-7.07a3.75 3.75 0 0 1 5.303 5.303l-6.01 6.01a2.25 2.25 0 1 1-3.182-3.182l5.01-5.01.707.707-5.01 5.01a1.25 1.25 0 1 0 1.768 1.768l6.01-6.01a2.75 2.75 0 1 0-3.889-3.889l-7.07 7.07A3.5 3.5 0 0 0 7.5 19h4a.75.75 0 0 1 0 1.5h-4Z"
              />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">
              {selectedFile ? selectedFile.name : "Anexar FAPI (PDF ou imagem)"}
            </p>
            <p className="text-subtle text-[11px] leading-snug">
              Envie apenas a FAPI em formato one-page do projeto, sem edital completo nem outros anexos. Maximo de 12MB, sem
              armazenamento permanente. Voce tambem pode colar uma imagem da FAPI (Ctrl+V).
            </p>
          </div>
        </div>
        <input
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          disabled={isLoading}
          onChange={handleInputChange}
        />
      </label>
      {pasteError && <p className="text-xs text-red-600 dark:text-red-300">{pasteError}</p>}
    </div>
  );
}
