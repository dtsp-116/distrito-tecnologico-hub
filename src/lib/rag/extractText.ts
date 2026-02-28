import mammoth from "mammoth";

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractTextFromFile(fileName: string, mimeType: string, bytes: Uint8Array) {
  const lowerName = fileName.toLowerCase();
  const utf8TextTypes = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/xml",
    "text/html"
  ];

  if (utf8TextTypes.includes(mimeType) || /\.(txt|md|csv|json|xml|html)$/.test(lowerName)) {
    return normalizeWhitespace(Buffer.from(bytes).toString("utf-8"));
  }

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule as unknown as { default?: (buffer: Buffer) => Promise<{ text?: string }> })
      .default ?? (pdfModule as unknown as (buffer: Buffer) => Promise<{ text?: string }>);
    const parsed = await pdfParse(Buffer.from(bytes));
    return normalizeWhitespace(parsed.text ?? "");
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return normalizeWhitespace(result.value ?? "");
  }

  // Tipos nao suportados por enquanto: retorna vazio para nao quebrar upload.
  return "";
}
