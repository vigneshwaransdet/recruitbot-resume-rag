import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized, typed access to environment variables.
 * Values come only from the .env file (never hard-coded).
 */
export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDbName: process.env.MONGODB_DB_NAME || "Resume_RAG",
  mongodbCollection: process.env.MONGODB_COLLECTION || "resume_rag",
  vectorIndexName: process.env.VECTOR_INDEX_NAME || "vector_search_rag",
  bm25IndexName: process.env.BM25_INDEX_NAME || "bm25_rag",

  mistralApiKey: process.env.MISTRAL_API_KEY || "",
  mistralEmbedModel: process.env.MISTRAL_EMBED_MODEL || "mistral-embed",
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION || "1024", 10),

  useLlmParser: (process.env.USE_LLM_PARSER || "false").toLowerCase() === "true",

  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "",

  // Retrieval defaults (Phase 2 — retrieval guide)
  retrievalDefaultTopK: parseInt(process.env.RETRIEVAL_DEFAULT_TOP_K || "20", 10),
  rerankDefaultTopN: parseInt(process.env.RERANK_DEFAULT_TOP_N || "10", 10),
  searchP95TargetMs: parseInt(process.env.SEARCH_P95_TARGET_MS || "5000", 10),

  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || "5", 10),

  // Batch ingestion (home assignment)
  // Default 5, hard-capped at 10 per run.
  batchSize: Math.min(
    Math.max(parseInt(process.env.BATCH_SIZE || "5", 10) || 5, 1),
    10
  ),
  resumesDir: process.env.RESUMES_DIR || "Resumes",
};

export const APP_NAME = "resume-rag-backend";
export const APP_VERSION = "1.0.0";
