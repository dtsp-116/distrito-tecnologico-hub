import { extractTextFromFile } from "@/lib/rag/extractText";

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractTextFromImageWithOcr(fileName: string, mimeType: string, bytes: Uint8Array) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY nao configurada para processar imagens.");
  }

  const formData = new FormData();
  const blob = new Blob([Buffer.from(bytes)], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("isOverlayRequired", "false");
  formData.append("language", "por");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey },
    body: formData
  });
  if (!response.ok) {
    throw new Error("Falha ao executar OCR da imagem.");
  }

  const data = (await response.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
  };
  const text = (data.ParsedResults ?? [])
    .map((item) => item.ParsedText ?? "")
    .join("\n")
    .trim();
  return normalizeWhitespace(text);
}

export async function extractFapiText(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<{ text: string; method: "text" | "ocr" | "unknown" }> {
  const isImage = input.mimeType.startsWith("image/");
  if (isImage) {
    const text = await extractTextFromImageWithOcr(input.fileName, input.mimeType, input.bytes);
    return { text, method: text ? "ocr" : "unknown" };
  }

  return extractTextFromFile(input.fileName, input.mimeType, input.bytes);
}
