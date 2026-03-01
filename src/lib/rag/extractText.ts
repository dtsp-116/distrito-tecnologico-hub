import mammoth from "mammoth";

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface ExtractedTextResult {
  text: string;
  method: "text" | "ocr" | "unknown";
}

function looksLikePdf(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

async function extractTextWithOcrSpaceIfConfigured(fileName: string, bytes: Uint8Array): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return "";

  const formData = new FormData();
  const blob = new Blob([Buffer.from(bytes)], { type: "application/pdf" });
  formData.append("file", blob, fileName);
  formData.append("isOverlayRequired", "false");
  formData.append("language", "por");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey
      },
      body: formData
    });
    if (!response.ok) return "";

    const data = (await response.json()) as {
      ParsedResults?: Array<{ ParsedText?: string }>;
    };
    const parsedText = (data.ParsedResults ?? [])
      .map((result) => result.ParsedText ?? "")
      .join("\n")
      .trim();
    return normalizeWhitespace(parsedText);
  } catch {
    return "";
  }
}

export async function extractTextFromFile(fileName: string, mimeType: string, bytes: Uint8Array): Promise<ExtractedTextResult> {
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
    return { text: normalizeWhitespace(Buffer.from(bytes).toString("utf-8")), method: "text" };
  }

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf") || looksLikePdf(bytes)) {
    let pdfText = "";
    try {
      const pdfModule = await import("pdf-parse");
      const pdfParse = (pdfModule as unknown as { default?: (buffer: Buffer) => Promise<{ text?: string }> })
        .default ?? (pdfModule as unknown as (buffer: Buffer) => Promise<{ text?: string }>);
      const parsed = await pdfParse(Buffer.from(bytes));
      pdfText = normalizeWhitespace(parsed.text ?? "");
    } catch {
      pdfText = "";
    }

    if (pdfText.length >= 120) {
      return { text: pdfText, method: "text" };
    }

    // Fallback OCR opcional para PDFs escaneados sem camada de texto.
    const ocrText = await extractTextWithOcrSpaceIfConfigured(fileName, bytes);
    if (ocrText.length > pdfText.length) {
      return { text: ocrText, method: "ocr" };
    }

    return { text: pdfText, method: "text" };
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { text: normalizeWhitespace(result.value ?? ""), method: "text" };
  }

  // Tipos nao suportados por enquanto: retorna vazio para nao quebrar upload.
  return { text: "", method: "unknown" };
}
