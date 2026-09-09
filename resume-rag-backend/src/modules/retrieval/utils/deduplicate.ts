import { SearchCandidate, SearchSource } from "../types/retrieval.types";

/**
 * Merge + deduplicate (Phase 9).
 *
 * Combines the independent BM25 and vector result lists into a single
 * candidate pool keyed by `resumeId`. When the same resume appears in
 * both lists, the two entries are merged so that:
 *
 *   - `sources` contains every path that surfaced it (e.g. ["bm25","vector"])
 *   - both `bm25Score` and `vectorScore` are preserved
 *   - `matchedSkills` are unioned
 *   - richer metadata / snippet wins (prefer non-empty values)
 *
 * No mathematical score fusion happens here — the LLM re-ranker is the
 * final authority on ordering. This only builds a clean, unique pool.
 */
export function mergeAndDeduplicate(
  ...lists: SearchCandidate[][]
): SearchCandidate[] {
  const byId = new Map<string, SearchCandidate>();

  for (const list of lists) {
    for (const candidate of list) {
      const existing = byId.get(candidate.resumeId);
      if (!existing) {
        // Store a shallow copy so callers' arrays are never mutated.
        byId.set(candidate.resumeId, {
          ...candidate,
          sources: [...candidate.sources],
          matchedSkills: candidate.matchedSkills
            ? [...candidate.matchedSkills]
            : undefined,
        });
        continue;
      }
      merge(existing, candidate);
    }
  }

  return Array.from(byId.values());
}

/**
 * Merge `incoming` into `target` in place, preserving provenance and
 * the best available field values from either candidate.
 */
function merge(target: SearchCandidate, incoming: SearchCandidate): void {
  // Union sources (preserve order: bm25 before vector).
  for (const src of incoming.sources) {
    if (!target.sources.includes(src)) {
      target.sources.push(src);
    }
  }
  target.sources = orderSources(target.sources);

  // Keep both scores.
  if (incoming.bm25Score !== undefined) {
    target.bm25Score = target.bm25Score ?? incoming.bm25Score;
  }
  if (incoming.vectorScore !== undefined) {
    target.vectorScore = target.vectorScore ?? incoming.vectorScore;
  }

  // Prefer non-empty metadata.
  target.name = target.name || incoming.name;
  target.role = target.role || incoming.role;
  target.company = target.company || incoming.company;
  target.totalExperience =
    target.totalExperience ?? incoming.totalExperience ?? null;
  if ((!target.skills || target.skills.length === 0) && incoming.skills) {
    target.skills = incoming.skills;
  }
  if ((!target.snippet || target.snippet.length === 0) && incoming.snippet) {
    target.snippet = incoming.snippet;
  }

  // Union matched skills.
  const merged = new Set<string>([
    ...(target.matchedSkills ?? []),
    ...(incoming.matchedSkills ?? []),
  ]);
  target.matchedSkills = Array.from(merged);
}

/** Keep a stable source ordering (bm25 first, then vector). */
function orderSources(sources: SearchSource[]): SearchSource[] {
  const order: SearchSource[] = ["bm25", "vector"];
  return order.filter((s) => sources.includes(s));
}
