import { env } from "../../../config/env";
import { ResumeRepository } from "../repositories/ResumeRepository";
import { ReadinessResult } from "../types/retrieval.types";

/**
 * RetrievalValidationService (Phase 1)
 *
 * Proves that ingestion has completed and retrieval has usable data
 * before any search is attempted.
 *
 * Readiness rule:
 *   resumeCount > 0
 *   AND at least one resume has a non-empty embedding
 *   AND the stored embedding dimension matches the configured model.
 */
export class RetrievalValidationService {
  constructor(private readonly repo: ResumeRepository = new ResumeRepository()) {}

  async checkReadiness(): Promise<ReadinessResult> {
    const resumeCount = await this.repo.count();

    if (resumeCount === 0) {
      return {
        ready: false,
        reason: "No ingested resume embeddings are available",
      };
    }

    const resumesWithEmbedding = await this.repo.countWithEmbedding();

    if (resumesWithEmbedding === 0) {
      return {
        ready: false,
        reason: "No ingested resume embeddings are available",
      };
    }

    const sample = await this.repo.findOneWithEmbedding();
    const storedDimension =
      (sample?.embeddingDimension as number | undefined) ??
      (Array.isArray(sample?.embedding)
        ? (sample?.embedding as number[]).length
        : undefined);
    const storedModel = sample?.embeddingModel as string | undefined;

    if (
      typeof storedDimension === "number" &&
      storedDimension !== env.embeddingDimension
    ) {
      return {
        ready: false,
        reason: `Stored embedding dimension (${storedDimension}) does not match configured dimension (${env.embeddingDimension})`,
        collection: env.mongodbCollection,
        resumeCount,
        resumesWithEmbedding,
        embeddingModel: storedModel,
        embeddingDimension: storedDimension,
      };
    }

    return {
      ready: true,
      collection: env.mongodbCollection,
      resumeCount,
      resumesWithEmbedding,
      embeddingModel: storedModel ?? env.mistralEmbedModel,
      embeddingDimension: storedDimension ?? env.embeddingDimension,
    };
  }
}
