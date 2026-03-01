interface ChunkResult {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

function countTokensApprox(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function normalizeForChunking(source: string) {
  return source.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[ \u00A0]+/g, " ").trim();
}

function isHeadingLike(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(capitulo|se[cç][aã]o|anexo|item|cl[aá]usula)\b/i.test(trimmed)) return true;
  if (/^\d+(\.\d+)*[\)\.]?\s+[A-Za-zÀ-ÿ]/.test(trimmed)) return true;
  return trimmed.length <= 90 && trimmed === trimmed.toUpperCase();
}

function splitSemanticBlocks(source: string) {
  const text = normalizeForChunking(source);
  if (!text) return [];

  const lines = text.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const content = current.join("\n").trim();
    if (content) blocks.push(content);
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length > 0) flush();
      continue;
    }

    const startsEnumerated = /^(\d+(\.\d+)*[\)\.]|[-*•])\s+/.test(trimmed);
    if (isHeadingLike(trimmed) && current.length > 0) {
      flush();
    }
    current.push(trimmed);

    if (startsEnumerated && current.length >= 5) {
      flush();
    }
  }

  flush();
  return blocks;
}

function splitLongBlockIntoWindows(
  block: string,
  startChunkIndex: number,
  maxTokens: number,
  overlapTokens: number
): ChunkResult[] {
  const words = block.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: ChunkResult[] = [];
  let start = 0;
  let localIndex = 0;

  while (start < words.length) {
    const end = Math.min(words.length, start + maxTokens);
    const content = words.slice(start, end).join(" ").trim();
    if (content) {
      chunks.push({
        chunkIndex: startChunkIndex + localIndex,
        content,
        tokenCount: countTokensApprox(content)
      });
      localIndex += 1;
    }
    if (end >= words.length) break;
    start = Math.max(0, end - overlapTokens);
  }

  return chunks;
}

export function chunkText(source: string, maxTokens = 220, overlapTokens = 40): ChunkResult[] {
  const semanticBlocks = splitSemanticBlocks(source);
  if (semanticBlocks.length === 0) return [];

  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  for (const block of semanticBlocks) {
    const tokenCount = countTokensApprox(block);
    if (tokenCount <= maxTokens) {
      chunks.push({
        chunkIndex,
        content: block,
        tokenCount
      });
      chunkIndex += 1;
      continue;
    }

    const windowed = splitLongBlockIntoWindows(block, chunkIndex, maxTokens, overlapTokens);
    chunks.push(...windowed);
    chunkIndex += windowed.length;
  }

  return chunks;
}
