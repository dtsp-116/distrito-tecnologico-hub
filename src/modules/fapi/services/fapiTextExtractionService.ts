import { extractTextFromFile } from "@/lib/rag/extractText";

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

/** Codigos de erro lancados pelo servico para o endpoint mapear mensagens ao usuario. */
export const OCR_ERROR_CODES = {
  /** Chave de API nao configurada no servidor. */
  NO_API_KEY: "OCR_NO_API_KEY",
  /** OCR executou mas retornou texto vazio (imagem ilegivel, baixa resolucao, etc.). */
  EMPTY_RESULT: "OCR_EMPTY_RESULT",
  /** API OCR.space retornou erro (IsErroredOnProcessing ou ErrorMessage). */
  API_ERROR: "OCR_API_ERROR"
} as const;

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
  ParsedResults?: Array<{ ParsedText?: string; ErrorMessage?: string }>;
};

async function callOcrSpace(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
  options?: { engine?: 1 | 2 }
): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return "";

  const formData = new FormData();
  const blob = new Blob([Buffer.from(bytes)], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("isOverlayRequired", "false");
  formData.append("language", "por");
  formData.append("OCREngine", String(options?.engine ?? 2));
  formData.append("scale", "true");

  const response = await fetch(OCR_SPACE_URL, {
    method: "POST",
    headers: { apikey: apiKey },
    body: formData
  });

  const data = (await response.json()) as OcrSpaceResponse;
  if (!response.ok) {
    const msg = data.ErrorMessage ?? `HTTP ${response.status}`;
    throw new Error(`${OCR_ERROR_CODES.API_ERROR}: ${msg}`);
  }
  if (data.IsErroredOnProcessing || data.ErrorMessage) {
    const msg = data.ErrorMessage ?? "Falha no servico de OCR.";
    throw new Error(`${OCR_ERROR_CODES.API_ERROR}: ${msg}`);
  }
  const first = data.ParsedResults?.[0];
  if (first?.ErrorMessage) {
    throw new Error(`${OCR_ERROR_CODES.API_ERROR}: ${first.ErrorMessage}`);
  }
  const text = (data.ParsedResults ?? [])
    .map((item) => item.ParsedText ?? "")
    .join("\n")
    .trim();
  return normalizeWhitespace(text);
}

async function extractTextFromImageWithOcr(fileName: string, mimeType: string, bytes: Uint8Array) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error(
      `${OCR_ERROR_CODES.NO_API_KEY}: OCR_SPACE_API_KEY nao configurada. Configure a chave no servidor (variavel de ambiente) para analisar FAPI em imagem.`
    );
  }

  let text = await callOcrSpace(fileName, mimeType, bytes, { engine: 2 });
  if (!text) {
    text = await callOcrSpace(fileName, mimeType, bytes, { engine: 1 });
  }
  if (!text) {
    throw new Error(
      `${OCR_ERROR_CODES.EMPTY_RESULT}: Nao foi possivel extrair texto da imagem. Use imagem de maior resolucao, recorte apenas a area de texto ou envie um PDF com camada de texto.`
    );
  }
  return text;
}

export async function extractFapiText(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<{ text: string; method: "text" | "ocr" | "unknown" }> {
  const isImage = input.mimeType.startsWith("image/");
  if (isImage) {
    try {
      const text = await extractTextFromImageWithOcr(input.fileName, input.mimeType, input.bytes);
      return { text, method: "ocr" };
    } catch (err) {
      if (err instanceof Error && /OCR_(NO_API_KEY|EMPTY_RESULT|API_ERROR)/.test(err.message)) throw err;
      throw new Error("Falha ao executar OCR da imagem. Verifique a conexao ou tente outro arquivo.");
    }
  }

  const result = await extractTextFromFile(input.fileName, input.mimeType, input.bytes);
  const rawText = result.text ?? "";
  const normalizedText = rawText.replace(/\s+/g, " ").trim();
  if (rawText.length > 0 && normalizedText.length === 0) {
    return { text: "", method: result.method };
  }

  const isPdf =
    input.mimeType === "application/pdf" ||
    input.fileName.toLowerCase().endsWith(".pdf");
  if (isPdf && normalizedText.length === 0) {
    const ocrText = await callOcrSpace(input.fileName, "application/pdf", input.bytes);
    if (ocrText.length > 0) {
      return { text: ocrText, method: "ocr" };
    }
  }

  return { text: rawText, method: result.method };
}
