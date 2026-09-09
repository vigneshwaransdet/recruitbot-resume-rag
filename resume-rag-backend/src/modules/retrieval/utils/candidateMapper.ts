import { RawSearchRow } from "../repositories/ResumeRepository";
import { SearchCandidate, SearchSource } from "../types/retrieval.types";

/** Maximum characters of rawText kept as a candidate snippet. */
const SNIPPET_MAX_CHARS = 1200;

/**
 * Build a size-controlled snippet from raw resume text so candidate
 * payloads sent to the LLM stay bounded.
 */
export function buildSnippet(row: RawSearchRow): string {
  const base =
    (row.experienceSummary && row.experienceSummary.trim()) ||
    (row.rawText && row.rawText.trim()) ||
    "";
  if (base.length <= SNIPPET_MAX_CHARS) return base;
  return base.slice(0, SNIPPET_MAX_CHARS).trim();
}

/**
 * Determine which of the candidate's skills matched the query terms.
 * Purely lexical (token overlap) so it never calls out to a model.
 */
export function matchedSkills(query: string, skills: string[] = []): string[] {
  if (!query || skills.length === 0) return [];
  const q = query.toLowerCase();
  return skills.filter((s) => {
    const skill = s.toLowerCase();
    // Match whole skill phrase or any of its word tokens against the query.
    if (q.includes(skill)) return true;
    return skill
      .split(/[^a-z0-9+#]+/i)
      .filter((t) => t.length >= 2)
      .some((t) => q.includes(t.toLowerCase()));
  });
}

/**
 * Convert a raw BM25/vector row into a normalized SearchCandidate.
 */
export function toCandidate(
  row: RawSearchRow,
  source: SearchSource,
  query = ""
): SearchCandidate {
  const resumeId = String(row._id);
  const skills = Array.isArray(row.skills) ? row.skills : [];

  const candidate: SearchCandidate = {
    resumeId,
    name: row.name ?? null,
    role: row.role ?? null,
    company: row.company ?? null,
    totalExperience: row.totalExperience ?? null,
    skills,
    matchedSkills: matchedSkills(query, skills),
    snippet: buildSnippet(row),
    sources: [source],
  };

  if (source === "bm25") {
    candidate.bm25Score = round(row.score);
  } else {
    candidate.vectorScore = round(row.score);
  }

  return candidate;
}

function round(n?: number): number | undefined {
  if (typeof n !== "number" || Number.isNaN(n)) return undefined;
  return Math.round(n * 100) / 100;
}
