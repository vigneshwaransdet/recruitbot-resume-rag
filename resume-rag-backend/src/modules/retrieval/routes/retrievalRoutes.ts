import { Router } from "express";
import { retrievalController } from "../controllers/retrievalController";

/**
 * Retrieval routes, mounted under /v1 in app.ts.
 *
 * Phase 1:  GET  /v1/search/readiness
 * Phase 3:  POST /v1/embeddings
 * Phase 5:  POST /v1/search/bm25
 * Phase 6:  POST /v1/search/vector
 * Phase 8:  POST /v1/search/hybrid
 * Phase 11: POST /v1/search/rerank
 * Phase 12: POST /v1/search/summarize
 * Phase 14: POST /v1/search
 */
const router = Router();

// GET /v1/search/readiness
router.get("/search/readiness", retrievalController.readiness);

// POST /v1/embeddings
router.post("/embeddings", retrievalController.embeddings);

// POST /v1/search/bm25
router.post("/search/bm25", retrievalController.bm25);

// POST /v1/search/vector
router.post("/search/vector", retrievalController.vector);

// POST /v1/search/hybrid
router.post("/search/hybrid", retrievalController.hybrid);

// POST /v1/search/rerank
router.post("/search/rerank", retrievalController.rerank);

// POST /v1/search/summarize
router.post("/search/summarize", retrievalController.summarize);

// POST /v1/search (full end-to-end pipeline)
router.post("/search", retrievalController.search);

export default router;
