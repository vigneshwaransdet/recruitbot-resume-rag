import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { ingestionController } from "../controllers/ingestionController";
import { upload } from "../config/multerConfig";
import { ingestionError } from "../errors/errorCatalog";

/**
 * Ingestion routes, mounted under /v1 in app.ts.
 *
 * Phase 3: module readiness route.
 * Phase 4: secure PDF upload.
 * Later phases add: /resume/extract, /resume/clean, /resume/skills,
 * /resume/parse, /resume/llm-parse, /resume/embed, /resume/store,
 * /resume/ingest.
 */
const router = Router();

/**
 * Wraps multer's single-file handler so multer errors are converted
 * into stable application errors (Phase 14 error contract).
 */
function uploadSingle(field: string) {
  const handler = upload.single(field);
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(ingestionError("FILE_TOO_LARGE"));
          return;
        }
        next(ingestionError("FILE_REQUIRED"));
        return;
      }

      const code = (err as { code?: string }).code;
      if (code === "INVALID_FILE_TYPE") {
        next(ingestionError("INVALID_FILE_TYPE"));
        return;
      }

      next(err);
    });
  };
}

// GET /v1/resume/health
router.get("/resume/health", ingestionController.health);

// POST /v1/resume/upload
router.post("/resume/upload", uploadSingle("file"), ingestionController.upload);

// POST /v1/resume/extract
router.post("/resume/extract", uploadSingle("file"), ingestionController.extract);

// POST /v1/resume/clean (JSON body: { rawText })
router.post("/resume/clean", ingestionController.clean);

// POST /v1/resume/skills (JSON body: { rawText })
router.post("/resume/skills", ingestionController.skills);

// POST /v1/resume/parse (JSON body: { rawText })
router.post("/resume/parse", ingestionController.parse);

// POST /v1/resume/llm-parse (JSON body: { rawText })
router.post("/resume/llm-parse", ingestionController.llmParse);

// POST /v1/resume/embed (JSON body: { name, role, skills, company, rawText })
router.post("/resume/embed", ingestionController.embed);

// POST /v1/resume/store (JSON body: { fileName, resume, rawText, embedding })
router.post("/resume/store", ingestionController.store);

// POST /v1/resume/ingest (form-data file) — full pipeline
router.post(
  "/resume/ingest",
  uploadSingle("file"),
  ingestionController.ingestResume
);

// POST /v1/resume/ingest-batch (JSON body: { batchSize?, offset?, skipExisting? })
router.post("/resume/ingest-batch", ingestionController.ingestBatch);

export default router;
