import { IResumeParser, ParsedResume } from "../types/ingestion.types";
import { env } from "../../../config/env";
import { detectSkills } from "../utils/skillDetector";

/**
 * LLMResumeParser (Phase 10)
 *
 * Optional LLM-backed parser, enabled via USE_LLM_PARSER=true. Uses the
 * Groq chat completions API to convert resume text into structured JSON.
 *
 * The LLM output is schema-validated before it is accepted, so malformed
 * or hallucinated shapes never propagate downstream.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface LLMParserError extends Error {
  code?: string;
}

export class LLMResumeParser implements IResumeParser {
  async parseResume(rawText: string): Promise<ParsedResume> {
    if (!env.groqApiKey || env.groqApiKey === "YOUR_KEY") {
      const err: LLMParserError = new Error(
        "GROQ_API_KEY is not configured"
      );
      err.code = "LLM_CONFIG_MISSING";
      throw err;
    }

    const prompt = this.buildPrompt(rawText);

    let content: string;
    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify({
          model: env.groqModel || "llama-3.1-8b-instant",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You extract structured data from resumes. Respond with strict JSON only. Never invent values; use null for anything not present in the text.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        const err: LLMParserError = new Error(
          `Groq API error ${response.status}: ${body.slice(0, 200)}`
        );
        err.code = "LLM_REQUEST_FAILED";
        throw err;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      content = data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if ((err as LLMParserError).code) throw err;
      const wrapped: LLMParserError = new Error(
        `Groq request failed: ${err instanceof Error ? err.message : String(err)}`
      );
      wrapped.code = "LLM_REQUEST_FAILED";
      throw wrapped;
    }

    const parsed = this.safeJsonParse(content);
    return this.validateAndNormalize(parsed, rawText);
  }

  private buildPrompt(rawText: string): string {
    return [
      "Extract the following fields from the resume text and return JSON with exactly these keys:",
      "name, email, phone, location, company, role, education, totalExperience, relevantExperience, skills, jobTitles, experienceSummary.",
      "- totalExperience and relevantExperience must be numbers (years) or null.",
      "- skills and jobTitles must be arrays of strings (use [] if none).",
      "- All other fields are strings or null.",
      "- Do not invent data. If a field is not clearly present, use null.",
      "",
      "Resume text:",
      rawText,
    ].join("\n");
  }

  private safeJsonParse(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch {
      // Attempt to salvage a JSON object embedded in the response.
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
      const err: LLMParserError = new Error("LLM returned non-JSON output");
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }
  }

  /**
   * Validate the LLM object against the ParsedResume schema and coerce
   * types. Rejects anything that is not an object.
   */
  private validateAndNormalize(input: unknown, rawText: string): ParsedResume {
    if (typeof input !== "object" || input === null) {
      const err: LLMParserError = new Error("LLM output is not an object");
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }

    const obj = input as Record<string, unknown>;

    const asStringOrNull = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

    const asNumberOrNull = (v: unknown): number | null => {
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string") {
        const n = parseFloat(v);
        return Number.isNaN(n) ? null : n;
      }
      return null;
    };

    const asStringArray = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string" && x.length > 0)
        : [];

    // Skills: trust the LLM if provided, otherwise fall back to the
    // deterministic detector so the field is never silently empty.
    let skills = asStringArray(obj.skills);
    if (skills.length === 0) {
      skills = detectSkills(rawText);
    }

    const role = asStringOrNull(obj.role);
    let jobTitles = asStringArray(obj.jobTitles);
    if (jobTitles.length === 0 && role) {
      jobTitles = [role];
    }

    return {
      name: asStringOrNull(obj.name),
      email: asStringOrNull(obj.email),
      phone: asStringOrNull(obj.phone),
      location: asStringOrNull(obj.location),
      company: asStringOrNull(obj.company),
      role,
      education: asStringOrNull(obj.education),
      totalExperience: asNumberOrNull(obj.totalExperience),
      relevantExperience: asNumberOrNull(obj.relevantExperience),
      skills,
      jobTitles,
      experienceSummary: asStringOrNull(obj.experienceSummary),
    };
  }
}
