/** Format a raw score for display. Vector/hybrid scores are ~0–1, BM25 is unbounded. */
export function formatScore(score: number): string {
  if (score <= 1) return score.toFixed(3);
  return score.toFixed(2);
}

/** Format a duration in ms, e.g. "243 ms" or "1.2 s". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Format a Date as HH:mm (24h). */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Truncate text to n chars with an ellipsis. */
export function truncate(text: string, n = 200): string {
  if (text.length <= n) return text;
  return `${text.slice(0, n).trimEnd()}…`;
}
