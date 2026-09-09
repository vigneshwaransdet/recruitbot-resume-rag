import { IResumeParser, ParsedResume } from "../types/ingestion.types";
import {
  extractEmail,
  extractPhone,
  extractExperienceYears,
} from "../utils/regex";
import { detectSkills } from "../utils/skillDetector";

/**
 * AlgorithmResumeParser (Phase 9)
 *
 * Deterministic (no-LLM) parser that turns cleaned resume text into
 * structured JSON. It combines:
 * - regex utilities (Phase 7) for email / phone / experience
 * - skill detection (Phase 8) for skills
 * - line-based heuristics for name / role / company / education
 *
 * Design principle: only return fields that can be supported from the
 * text. Anything that cannot be confidently determined is returned as
 * null rather than invented (no hallucination).
 */
export class AlgorithmResumeParser implements IResumeParser {
  parseResume(rawText: string): ParsedResume {
    const text = typeof rawText === "string" ? rawText : "";
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const email = extractEmail(text);
    const phone = extractPhone(text);
    const totalExperience = extractExperienceYears(text);
    const skills = detectSkills(text);

    const name = this.extractName(lines, email);
    const role = this.extractRole(lines);
    const company = this.extractCompany(text, lines);
    const education = this.extractEducation(text, lines);

    return {
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      location: null,
      company: company ?? null,
      role: role ?? null,
      education: education ?? null,
      totalExperience: totalExperience ?? null,
      relevantExperience: null,
      skills,
      jobTitles: role ? [role] : [],
      experienceSummary: null,
    };
  }

  /**
   * Bound a labelled value (e.g. text after "Education:") so it does not
   * swallow the rest of a single-line document. We cut at the first
   * newline, at the next likely ALL-CAPS section header, or at a
   * reasonable max length, whichever comes first.
   */
  private boundLabelValue(value: string): string | null {
    let v = value.trim();

    // Stop at a newline if present.
    v = v.split(/\n/)[0].trim();

    // Stop before the next known field label (e.g. "Education:",
    // "Email:", "Phone:", "Company:", "Skills:", "Address:", etc.), so a
    // single-line resume does not let one field swallow the next.
    const nextLabel = v.match(
      /\s+(?:education|email|e-mail|phone|mobile|contact|company|skills|address|role|title|experience|summary|working|native)\s*[:\-]/i
    );
    if (nextLabel && nextLabel.index !== undefined) {
      v = v.slice(0, nextLabel.index).trim();
    }

    // Stop before the next ALL-CAPS section header (2+ consecutive
    // uppercase words), e.g. "... 2015-2019 PROFESSIONAL EXPERIENCE ...".
    const headerMatch = v.match(/\s+[A-Z]{2,}(?:\s+[A-Z]{2,})+/);
    if (headerMatch && headerMatch.index !== undefined) {
      v = v.slice(0, headerMatch.index).trim();
    }

    // Final safety bound.
    if (v.length > 120) {
      v = v.slice(0, 120).trim();
    }

    return v.length > 0 ? v : null;
  }

  /**
   * Heuristic: the candidate name is usually one of the first non-empty
   * lines, is short, contains mostly letters, and is not a contact line
   * or a section header. We avoid guessing when nothing plausible is
   * found.
   */
  private extractName(lines: string[], email: string | null): string | null {
    const headerWords =
      /(resume|curriculum vitae|profile|summary|experience|skills|education|contact|phone|email|address)/i;

    // Case 1: multi-line resume — a short name-like line near the top.
    for (const line of lines.slice(0, 6)) {
      if (headerWords.test(line)) continue;
      if (/@|\d{4,}|http/i.test(line)) continue;

      const words = line.split(/\s+/);
      const looksLikeName =
        words.length >= 2 &&
        words.length <= 4 &&
        words.every((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w));

      if (looksLikeName) {
        return line;
      }
    }

    // Case 2: single-line resume — the name is the leading run of
    // capitalized words up to (but not including) the word that begins
    // the role/title. We detect the role keyword and treat the
    // capitalized word immediately before it as part of the title, not
    // the name (e.g. "... Kumar Test Architect ..." -> name stops at
    // "Kumar", title starts at "Test").
    const first = lines[0] ?? "";
    const roleKeyword =
      /\b(architect|engineer|developer|manager|specialist|analyst|consultant|lead|designer|administrator|tester|scientist|strategist)\b/i;

    const tokens = first.split(/\s+/);
    const roleTokenIdx = tokens.findIndex((t) => roleKeyword.test(t));

    // Upper bound for the name scan: stop before the role token (and the
    // capitalized word right before it, which usually starts the title),
    // or before the first label/contact token.
    let limit = tokens.length;
    if (roleTokenIdx > 0) {
      // Include title words that precede the keyword (like "Test"): the
      // name ends where a maximal run of capitalized title words begins.
      let titleStart = roleTokenIdx;
      while (
        titleStart - 1 > 0 &&
        /^[A-Z][A-Za-z.'-]*$/.test(tokens[titleStart - 1])
      ) {
        // Keep at least the first token as a potential name; only pull
        // back one word before the keyword as part of the title.
        titleStart -= 1;
        break;
      }
      limit = titleStart;
    }

    const nameParts: string[] = [];
    for (let i = 0; i < limit && i < tokens.length; i++) {
      const tok = tokens[i];
      if (/[:@]/.test(tok) || /\d/.test(tok)) break;
      if (/^[A-Z][A-Za-z.'-]+$/.test(tok)) {
        nameParts.push(tok);
        if (nameParts.length === 4) break;
      } else {
        break;
      }
    }
    if (nameParts.length >= 2) {
      return nameParts.join(" ");
    }

    // No confident name; do not invent one from the email local-part.
    void email;
    return null;
  }

  /**
   * Heuristic: a role/title line typically appears near the top and
   * contains role keywords (Engineer, Developer, Architect, Manager,
   * Specialist, Analyst, Consultant, Lead, etc.).
   */
  private extractRole(lines: string[]): string | null {
    const roleKeyword =
      /\b(architect|engineer|developer|manager|specialist|analyst|consultant|lead|designer|administrator|tester|scientist|strategist)\b/i;

    for (const line of lines.slice(0, 8)) {
      if (!roleKeyword.test(line)) continue;

      // Short line: skip obvious contact lines; otherwise it is the title.
      if (line.length <= 90) {
        if (/@|http/i.test(line)) continue;
        return line;
      }

      // Long/single line: extract a bounded title window that starts at
      // the capitalized word immediately before the role keyword (the
      // title's first word, e.g. "Test" in "Test Architect"), and stops
      // before the next field label.
      const tokens = line.split(/\s+/);
      const kwIdx = tokens.findIndex((t) => roleKeyword.test(t));
      if (kwIdx < 0) continue;

      let start = kwIdx;
      if (start - 1 >= 0 && /^[A-Z][A-Za-z.'-]*$/.test(tokens[start - 1])) {
        start -= 1;
      }
      const window = tokens.slice(start).join(" ");
      return this.boundLabelValue(window);
    }
    return null;
  }

  /**
   * Heuristic: a company is often signalled by a legal suffix
   * (Pvt Ltd, Private Limited, Inc, LLC, Technologies, Solutions, etc.)
   * or an explicit "Company:" label.
   */
  private extractCompany(text: string, lines: string[]): string | null {
    const labelled = text.match(/company\s*[:\-]\s*(.+)/i);
    if (labelled && labelled[1]) {
      return this.boundLabelValue(labelled[1]);
    }

    const companySuffix =
      /(private limited|pvt\.?\s*ltd\.?|technologies|solutions|systems|software|consulting|services|inc\.?|llc|ltd\.?|corporation|labs)/i;

    for (const line of lines) {
      if (line.length > 90) continue;
      if (companySuffix.test(line)) {
        return line;
      }
    }
    return null;
  }

  /**
   * Heuristic: education is signalled by degree keywords
   * (B.Tech, B.E, B.Sc, M.Tech, MBA, Bachelor, Master, etc.) or an
   * explicit "Education:" label.
   */
  private extractEducation(text: string, lines: string[]): string | null {
    const labelled = text.match(/education\s*[:\-]\s*(.+)/i);
    if (labelled && labelled[1]) {
      return this.boundLabelValue(labelled[1]);
    }

    const degreeKeyword =
      /\b(b\.?\s?tech|b\.?e\.?|b\.?\s?sc|m\.?\s?tech|m\.?\s?sc|mba|mca|bca|bachelor|master|ph\.?d|diploma)\b/i;

    for (const line of lines) {
      const m = line.match(degreeKeyword);
      if (m && m.index !== undefined) {
        // Return a bounded window starting at the degree keyword rather
        // than the whole line (resumes may be a single long line).
        const window = line.slice(m.index);
        return this.boundLabelValue(window);
      }
    }
    return null;
  }
}
