import { env } from "../../../config/env";

/**
 * EmbeddingService (Phase 11)
 *
 * Generates a Mistral embedding for resume text during ingestion.
 * This is the handoff that makes later vector retrieval possible.
 *
 * A shared copy can later be moved to src/shared/services so retrieval
 * can reuse the same Mistral client.
 */

const MISTRAL_URL = "https://api.mistral.ai/v1/embeddings";

interface EmbeddingError extends Error {
  code?: string;
}

export interface EmbeddingInput {
  name?: string | null;
  role?: string | null;
  skills?: string[];
  company?: string | null;
  experienceSummary?: string | null;
  rawText: string;
}

export class EmbeddingService {
  /**
   * Build the text that gets embedded. Combines the most meaningful
   * resume signals so the vector captures identity, role, skills,
   * employer and full context.
   */
  buildEmbeddingText(input: EmbeddingInput): string {
    const skills = (input.skills ?? []).join(", ");
    return [
      input.name ?? "",
      input.role ?? "",
      skills,
      input.company ?? "",
      input.experienceSummary ?? "",
      input.rawText ?? "",
    ]
      .filter((part) => part && part.trim().length > 0)
      .join("\n")
      .trim();
  }

  /**
   * Generate an embedding vector for arbitrary text using mistral-embed.
   *
   * @returns numeric embedding vector
   * @throws an error tagged with code "EMBEDDING_FAILED" on any failure
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!env.mistralApiKey || env.mistralApiKey === "YOUR_KEY") {
      const err: EmbeddingError = new Error(
        "MISTRAL_API_KEY is not configured"
      );
      err.code = "EMBEDDING_FAILED";
      throw err;
    }

    if (!text || text.trim().length === 0) {
      const err: EmbeddingError = new Error("Embedding input text is empty");
      err.code = "EMBEDDING_FAILED";
      throw err;
    }

    try {
      const response = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.mistralApiKey}`,
        },
        body: JSON.stringify({
          model: env.mistralEmbedModel,
          input: [text],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        const err: EmbeddingError = new Error(
          `Mistral API error ${response.status}: ${body.slice(0, 200)}`
        );
        err.code = "EMBEDDING_FAILED";
        throw err;
      }

      const data = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      const embedding = data.data?.[0]?.embedding;

      if (!Array.isArray(embedding) || embedding.length === 0) {
        const err: EmbeddingError = new Error(
          "Mistral returned an empty embedding"
        );
        err.code = "EMBEDDING_FAILED";
        throw err;
      }

      if (!embedding.every((n) => typeof n === "number" && !Number.isNaN(n))) {
        const err: EmbeddingError = new Error(
          "Mistral embedding contained non-numeric values"
        );
        err.code = "EMBEDDING_FAILED";
        throw err;
      }

      return embedding;
    } catch (err) {
      if ((err as EmbeddingError).code === "EMBEDDING_FAILED") throw err;
      const wrapped: EmbeddingError = new Error(
        `Mistral request failed: ${err instanceof Error ? err.message : String(err)}`
      );
      wrapped.code = "EMBEDDING_FAILED";
      throw wrapped;
    }
  }

  /**
   * Convenience: build the embedding text from structured input and
   * generate its vector in one call.
   */
  async embedResume(input: EmbeddingInput): Promise<number[]> {
    const text = this.buildEmbeddingText(input);
    return this.generateEmbedding(text);
  }
}
