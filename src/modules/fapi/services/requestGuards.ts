const rateBuckets = new Map<string, number[]>();

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);

export interface FapiUploadedFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
}

export function sanitizeUserText(input: string) {
  return input
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 4000);
}

export function assertFapiFileConstraints(file: FapiUploadedFile) {
  if (!file.fileName.trim()) {
    throw new Error("Arquivo sem nome.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType.toLowerCase())) {
    throw new Error("Tipo de arquivo nao permitido. Envie PDF, PNG, JPG ou WEBP.");
  }
  if (file.sizeBytes <= 0) {
    throw new Error("Arquivo vazio.");
  }
  if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error("Arquivo excede o limite de 12MB.");
  }
}

export function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = rateBuckets.get(input.key) ?? [];
  const active = existing.filter((timestamp) => now - timestamp < input.windowMs);
  if (active.length >= input.limit) {
    throw new Error("Muitas requisicoes em pouco tempo. Tente novamente em instantes.");
  }
  active.push(now);
  rateBuckets.set(input.key, active);
}

export async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
