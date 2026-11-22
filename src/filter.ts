/**
 * A palette entry. `keywords` are extra searchable terms that never render,
 * so "settings" can match "Preferences" without polluting the label.
 */
export interface PaletteItem {
  id: string;
  label: string;
  keywords?: readonly string[];
  disabled?: boolean;
}

interface ScoredItem {
  item: PaletteItem;
  score: number;
}

const SEPARATOR = /[\s\-_/.]/;

/** Higher is better; -1 means the token is absent. */
function scoreToken(haystack: string, token: string): number {
  const at = haystack.indexOf(token);
  if (at < 0) return -1;
  const boundary = at === 0 ? 8 : SEPARATOR.test(haystack[at - 1]) ? 4 : 0;
  return boundary + Math.max(0, 6 - at / 4);
}

function scoreItem(item: PaletteItem, tokens: readonly string[]): number {
  const label = item.label.toLowerCase();
  const keywords = item.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];
  let total = 0;

  for (const token of tokens) {
    const labelScore = scoreToken(label, token);
    const keywordScore = Math.max(-1, ...keywords.map((k) => scoreToken(k, token)));
    if (labelScore < 0 && keywordScore < 0) return -1;
    total += Math.max(labelScore, keywordScore * 0.5);
  }

  // Prefer short labels when scores are close.
  return total - label.length * 0.05;
}

/**
 * Ranks items for a query. Every whitespace-separated token must match the
 * label or a keyword. Ties fall back to locale-aware label order so the list
 * does not jump between renders.
 */
export function filterItems(
  items: readonly PaletteItem[],
  query: string,
  limit = 50,
): PaletteItem[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items.slice(0, limit);

  const scored: ScoredItem[] = [];
  for (const item of items) {
    const score = scoreItem(item, tokens);
    if (score >= 0) scored.push({ item, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label),
  );
  return scored.slice(0, limit).map((entry) => entry.item);
}
