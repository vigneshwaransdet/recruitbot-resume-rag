/**
 * Reusable deterministic extraction helpers (Phase 7).
 *
 * These are pure, side-effect-free utilities consumed by the algorithm
 * parser (Phase 9). No HTTP endpoint is exposed for this phase; it is
 * verified through unit tests.
 */

/** Matches an email address. */
export const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

/** Matches Indian mobile numbers, with optional +91 / 91 / 0 prefixes. */
export const PHONE_REGEX = /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/;

/**
 * Matches an experience expression like "13 years", "13+ years",
 * "7.5 yrs", capturing the leading number in group 1.
 */
export const EXPERIENCE_REGEX = /(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs|year|yr)/i;

/**
 * Extract the first email address found in the text, or null.
 */
export function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : null;
}

/**
 * Extract the first phone number found in the text, or null.
 */
export function extractPhone(text: string): string | null {
  const match = text.match(PHONE_REGEX);
  return match ? match[0].trim() : null;
}

/**
 * Extract total years of experience as a number, e.g.
 * "13+ years of experience" -> 13, "7.5 yrs" -> 7.5.
 * Returns null when no experience expression is present.
 */
export function extractExperienceYears(text: string): number | null {
  const match = text.match(EXPERIENCE_REGEX);
  if (!match) {
    return null;
  }
  const value = parseFloat(match[1]);
  return Number.isNaN(value) ? null : value;
}
