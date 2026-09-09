/**
 * Shared EmbeddingService (retrieval reuse).
 *
 * Retrieval must reuse the exact Mistral embedding logic proven during
 * ingestion so the query vector is produced with the same model and
 * dimension as the stored resume vectors.
 *
 * To avoid duplicating (and risking drift in) the tested implementation,
 * this shared module re-exports the ingestion EmbeddingService. If the
 * ingestion service is later physically relocated here, only this file
 * changes and every import site keeps working.
 */
export {
  EmbeddingService,
  type EmbeddingInput,
} from "../../modules/ingestion/services/EmbeddingService";
