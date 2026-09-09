import { env } from "../../../config/env";
import { RerankResult } from "../types/retrieval.types";

/**
 * LLMService (Phase 10)
 *
 * Groq-backed LLM operations for retrieval: re-ranking candidates and
 * summarizing candidate fit. Reuses the same Groq chat-completions
 * integration pattern proven by the ingestion LLM parser.
 *
 * The LLM is the final authority on ranking, but its output is always
 * schema-validated and constrained to the supplied candidate IDs so it
 * can never invent a resume that was not retrieved.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface LLMServiceError extends Error {
  code?: string;
}

/** Minimal candidate shape the re-ranker needs. */
export interface RerankInputCandidate {
  resumeId: string;
  snippet?: string;
  name?: string | null;
  role?: string | null;
  skills?: string[];
}

/** Candidate shape for summarization. */
export interface SummarizeCandidate {
  resumeId: string;
  snippet?: string;
  name?: string | null;
  role?: string | null;
  skills?: string[];
}

export interface SummarizeOptions {
  style?: "short" | "detailed";
  maxTokens?: number;
}

export class LLMService {
  private ensureConfigured(): void {
    if (!env.groqApiKey || env.groqApiKey === "YOUR_KEY") {
      const err: LLMServiceError = new Error("GROQ_API_KEY is not configured");
      err.code = "LLM_CONFIG_MISSING";
      throw err;
    }
  }

  /**
   * Low-level Groq chat call returning the raw assistant message content.
   */
  private async chat(
    messages: Array<{ role: string; content: string }>,
    opts: { jsonObject?: boolean; maxTokens?: number } = {}
  ): Promise<string> {
    this.ensureConfigured();

    const body: Record<string, unknown> = {
      model: env.groqModel || "llama-3.1-8b-instant",
      temperature: 0,
      messages,
    };
    if (opts.jsonObject) {
      body.response_format = { type: "json_object" };
    }
    if (typeof opts.maxTokens === "number") {
      body.max_tokens = opts.maxTokens;
    }

    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const wrapped: LLMServiceError = new Error(
        `Groq request failed: ${err instanceof Error ? err.message : String(err)}`
      );
      wrapped.code = "LLM_REQUEST_FAILED";
      throw wrapped;
    }

    if (!response.ok) {
      const text = await response.text();
      const err: LLMServiceError = new Error(
        `Groq API error ${response.status}: ${text.slice(0, 200)}`
      );
      err.code = "LLM_REQUEST_FAILED";
      throw err;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  /**
   * Attempt to parse JSON, salvaging an embedded object if needed.
   */
  private safeJsonParse(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
      const err: LLMServiceError = new Error("LLM returned non-JSON output");
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }
  }

  /**
   * Re-rank candidates against the query (Phase 10/11).
   *
   * Returns at most `topK` results, each tied to an input resumeId.
   * Any id the model returns that was not in the input is dropped, so
   * the model can never introduce a candidate that was not retrieved.
   */
  async rerankCandidates(
    query: string,
    candidates: RerankInputCandidate[],
    topK: number
  ): Promise<RerankResult[]> {
    const allowedIds = new Set(candidates.map((c) => c.resumeId));

    const prompt = this.buildRerankPrompt(query, candidates, topK);
    const content = await this.chat(
      [
        {
          role: "system",
          content:
            "You are a strict recruiting re-ranker. Rank ONLY the supplied candidates by fit for the query. Respond with strict JSON. Never invent a candidate or an id that is not in the input.",
        },
        { role: "user", content: prompt },
      ],
      { jsonObject: true }
    );

    const parsed = this.safeJsonParse(content);
    return this.validateRerank(parsed, allowedIds, topK);
  }

  private buildRerankPrompt(
    query: string,
    candidates: RerankInputCandidate[],
    topK: number
  ): string {
    const lines = candidates.map((c, i) => {
      const skills = (c.skills ?? []).join(", ");
      return [
        `Candidate ${i + 1}:`,
        `resumeId: ${c.resumeId}`,
        c.name ? `name: ${c.name}` : "",
        c.role ? `role: ${c.role}` : "",
        skills ? `skills: ${skills}` : "",
        c.snippet ? `snippet: ${c.snippet}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });

    return [
      `Search query: ${query}`,
      "",
      "Candidates:",
      lines.join("\n\n"),
      "",
      `Return the top ${topK} candidates ranked best-first as JSON with this exact shape:`,
      `{ "results": [ { "resumeId": "<one of the supplied ids>", "rank": 1, "relevanceScore": 0.0-1.0, "reason": "short justification" } ] }`,
      "Only use resumeId values from the candidates above. Do not include any candidate that is not listed.",
    ].join("\n");
  }

  /**
   * Validate the LLM re-rank output: must be an object with a results
   * array, each entry referencing an allowed resumeId. Ranks are
   * re-assigned sequentially to guarantee a clean 1..N ordering.
   */
  private validateRerank(
    input: unknown,
    allowedIds: Set<string>,
    topK: number
  ): RerankResult[] {
    if (typeof input !== "object" || input === null) {
      const err: LLMServiceError = new Error("LLM output is not an object");
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }

    const rawResults = (input as { results?: unknown }).results;
    if (!Array.isArray(rawResults)) {
      const err: LLMServiceError = new Error("LLM output missing results array");
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }

    const seen = new Set<string>();
    const cleaned: RerankResult[] = [];

    for (const row of rawResults) {
      if (typeof row !== "object" || row === null) continue;
      const obj = row as Record<string, unknown>;
      const resumeId = typeof obj.resumeId === "string" ? obj.resumeId : "";
      if (!resumeId || !allowedIds.has(resumeId) || seen.has(resumeId)) {
        continue;
      }
      seen.add(resumeId);

      const relevanceScore = clampScore(obj.relevanceScore);
      cleaned.push({
        resumeId,
        rank: cleaned.length + 1,
        relevanceScore,
        reason:
          typeof obj.reason === "string" && obj.reason.trim().length > 0
            ? obj.reason.trim()
            : undefined,
      });

      if (cleaned.length >= topK) break;
    }

    if (cleaned.length === 0) {
      const err: LLMServiceError = new Error(
        "LLM re-rank returned no valid candidates"
      );
      err.code = "LLM_INVALID_OUTPUT";
      throw err;
    }

    return cleaned;
  }

  /**
   * Summarize how well a single candidate fits the query (Phase 12).
   * Grounded strictly in the supplied candidate data.
   */
  async summarizeCandidateFit(
    query: string,
    candidate: SummarizeCandidate,
    options: SummarizeOptions = {}
  ): Promise<string> {
    const style = options.style === "detailed" ? "detailed" : "short";
    const maxTokens =
      typeof options.maxTokens === "number" && options.maxTokens > 0
        ? Math.min(options.maxTokens, 512)
        : style === "detailed"
          ? 300
          : 150;

    const skills = (candidate.skills ?? []).join(", ");
    const prompt = [
      `Search query: ${query}`,
      "",
      "Candidate:",
      candidate.name ? `name: ${candidate.name}` : "",
      candidate.role ? `role: ${candidate.role}` : "",
      skills ? `skills: ${skills}` : "",
      candidate.snippet ? `snippet: ${candidate.snippet}` : "",
      "",
      `Write a ${style} summary of how well this candidate fits the query.`,
      "Use ONLY the information above. Do not invent experience, skills, or employers.",
    ]
      .filter(Boolean)
      .join("\n");

    const content = await this.chat(
      [
        {
          role: "system",
          content:
            "You summarize candidate fit for recruiters. Be concise and factual. Never invent information not present in the supplied candidate data.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens }
    );

    return content.trim();
  }
}

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return n > 1 && n <= 100 ? n / 100 : 1;
  return Math.round(n * 100) / 100;
}
