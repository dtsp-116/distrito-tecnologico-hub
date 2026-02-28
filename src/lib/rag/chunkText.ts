interface ChunkResult {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

function countTokensApprox(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function chunkText(source: string, maxTokens = 220, overlapTokens = 40): ChunkResult[] {
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: ChunkResult[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(words.length, start + maxTokens);
    const slice = words.slice(start, end);
    const content = slice.join(" ").trim();

    if (content.length > 0) {
      chunks.push({
        chunkIndex,
        content,
        tokenCount: countTokensApprox(content)
      });
      chunkIndex += 1;
    }

    if (end >= words.length) break;
    start = Math.max(0, end - overlapTokens);
  }

  return chunks;
}
