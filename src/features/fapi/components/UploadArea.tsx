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
        className="panel-muted flex min-h-28 cursor-pointer flex-col items-center justify-center border-dashed p-3 text-center transition hover:brightness-95"
        onPaste={handlePaste}
        tabIndex={0}
        aria-label="Area para enviar FAPI em PDF ou imagem. Voce pode clicar para escolher um arquivo ou colar uma imagem com Ctrl+V."
      >
        <input
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          disabled={isLoading}
          onChange={handleInputChange}
        />
        <p className="text-sm font-semibold text-[color:var(--text-primary)]">
          {selectedFile ? selectedFile.name : "Toque para enviar arquivo"}
        </p>
        <p className="text-subtle mt-1 text-xs">
          Maximo de 12MB, sem armazenamento permanente. Voce tambem pode colar uma imagem da FAPI (Ctrl+V).
        </p>
      </label>
      {pasteError && <p className="text-xs text-red-600 dark:text-red-300">{pasteError}</p>}
    </div>
  );
}
