"use client";

import { useState } from "react";

export function UploadArea() {
  const [feedback, setFeedback] = useState("");

  const simulateUpload = () => {
    setFeedback("Enviando arquivo...");
    window.setTimeout(() => {
      setFeedback("Upload concluido com sucesso (simulado).");
    }, 1200);
  };

  return (
    <section className="rounded-mdx border border-district-border bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Area de upload</h3>
      <p className="mb-3 text-sm text-gray-600">Envie documentos de apoio para analise do edital.</p>

      <div className="grid min-h-36 place-content-center rounded-md border-2 border-dashed border-gray-300 p-4 text-center">
        <p className="text-sm text-gray-600">Arraste e solte arquivos aqui (visual)</p>
      </div>

      <button
        type="button"
        onClick={simulateUpload}
        className="mt-4 h-10 rounded-md bg-district-dark px-4 text-sm font-semibold text-white transition hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        Upload
      </button>

      {feedback && (
        <p className="mt-3 text-sm text-gray-700" aria-live="polite">
          {feedback}
        </p>
      )}
    </section>
  );
}
