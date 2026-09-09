import { SKILLS } from "../config/skills";

/**
 * Skill detection (Phase 8).
 *
 * Deterministically detects known skills from the dictionary within a
 * block of text. Matching is:
 * - case-insensitive
 * - whole-token (avoids matching "Java" inside "JavaScript")
 * - safe for skills containing symbols (C#, C++, .NET, and the
 *   parenthesised "MCP (Model Context Protocol)")
 *
 * Output preserves the dictionary's canonical casing, keeps dictionary
 * order, and contains no duplicates.
 */

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a matcher for a single skill. We require that an alphanumeric
 * edge of the skill is not directly adjacent to another word character,
 * so "Java" does not match within "JavaScript" while "C#" and "C++"
 * still match correctly.
 */
function buildSkillRegex(skill: string): RegExp {
  const escaped = escapeRegExp(skill);

  const startsAlnum = /^[A-Za-z0-9]/.test(skill);
  const endsAlnum = /[A-Za-z0-9]$/.test(skill);

  const prefix = startsAlnum ? "(?<![A-Za-z0-9])" : "";
  const suffix = endsAlnum ? "(?![A-Za-z0-9])" : "";

  return new RegExp(`${prefix}${escaped}${suffix}`, "i");
}

// Pre-compile matchers once at module load.
const SKILL_MATCHERS: Array<{ skill: string; regex: RegExp }> = SKILLS.map(
  (skill) => ({ skill, regex: buildSkillRegex(skill) })
);

/**
 * Detect skills present in the given text.
 *
 * @param text raw or cleaned resume text
 * @returns detected skills in dictionary order, canonical casing, unique
 */
export function detectSkills(text: string): string[] {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const found: string[] = [];
  for (const { skill, regex } of SKILL_MATCHERS) {
    if (regex.test(text)) {
      found.push(skill);
    }
  }
  return found;
}
