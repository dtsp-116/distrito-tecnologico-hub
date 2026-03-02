import type { SupabaseClient } from "@supabase/supabase-js";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(needle: string, haystack: string) {
  const tokens = needle.split(" ").filter((token) => token.length >= 4);
  if (tokens.length === 0) return 0;
  return tokens.reduce((acc, token) => acc + (haystack.includes(token) ? 1 : 0), 0);
}

export async function detectReferencedEdital(input: {
  supabase: SupabaseClient;
  extractedText: string;
  hintEditalId?: string | null;
}) {
  if (input.hintEditalId) {
    return input.hintEditalId;
  }

  const { data, error } = await input.supabase
    .from("notices")
    .select("id,title,summary,description")
    .limit(300);
  if (error || !data || data.length === 0) return null;

  const normalizedText = normalize(input.extractedText).slice(0, 12000);
  if (!normalizedText) return null;

  let bestId: string | null = null;
  let bestScore = 0;
  for (const notice of data) {
    const searchable = normalize([notice.title ?? "", notice.summary ?? "", notice.description ?? ""].join(" "));
    const score = scoreMatch(searchable, normalizedText) + scoreMatch(normalizedText, searchable) * 0.2;
    if (score > bestScore) {
      bestScore = score;
      bestId = notice.id;
    }
  }

  return bestScore >= 3 ? bestId : null;
}
