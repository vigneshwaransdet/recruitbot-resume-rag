import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { AppError } from "../../../middleware/errorHandler";
import { ResumeParserService } from "../services/ResumeParserService";
import { cleanText } from "../utils/textCleaner";
import { detectSkills } from "../utils/skillDetector";
import { AlgorithmResumeParser } from "../services/AlgorithmResumeParser";
import { LLMResumeParser } from "../services/LLMResumeParser";
import { isLlmParserEnabled } from "../services/ResumeParserFactory";
import { EmbeddingService } from "../services/EmbeddingService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { ResumeIngestionService } from "../services/ResumeIngestionService";
import { BatchIngestionService } from "../services/BatchIngestionService";
import { ParsedResume, StoredResume } from "../types/ingestion.types";
import { ingestionError } from "../errors/errorCatalog";
import { logStructured } from "../../../shared/logging/structuredLogger";
import { env } from "../../../config/env";

const resumeParserService = new ResumeParserService();
const algorithmParser = new AlgorithmResumeParser();
const llmParser = new LLMResumeParser();
const embeddingService = new EmbeddingService();
const resumeRepository = new ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService();
const batchIngestionService = new BatchIngestionService();

/**
 * Best-effort removal of a temporary uploaded file.
 */
function cleanupTempFile(filePath?: string): void {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {
    /* ignore cleanup failures */
  });
}

/**
 * ingestionController
 *
 * Holds the HTTP handlers for ingestion endpoints. Per-phase handlers
 * (upload, extract, clean, skills, parse, embed, store, ingest) are
 * added in their respective phases.
 */
export const ingestionController = {
  /**
   * Temporary module readiness route (Phase 3).
   */
  health(_req: Request, res: Response): void {
    res.status(200).json({
      status: "ok",
      module: "resume-ingestion",
    });
  },

  /**
   * POST /v1/resume/upload (Phase 4)
   *
   * Multer has already validated + stored the file by the time this
   * runs. A missing file means the client omitted the `file` field.
   */
  upload(req: Request, res: Response): void {
    const file = req.file;

    if (!file) {
      throw ingestionError("FILE_REQUIRED");
    }

    // Phase 4 only validates + acknowledges the upload. The temporary
    // file is not needed beyond this phase, so clean it up.
    cleanupTempFile(file.path);

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      file: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  },

  /**
   * POST /v1/resume/extract (Phase 5)
   *
   * Extracts raw text from the uploaded PDF. Empty text is treated as
   * a failure. The temporary file is always cleaned up.
   */
  async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    const file = req.file;

    if (!file) {
      next(ingestionError("FILE_REQUIRED"));
      return;
    }

    try {
      const rawText = await resumeParserService.extractTextFromPdf(file.path);

      if (!rawText || rawText.length === 0) {
        next(ingestionError("RESUME_EXTRACTION_FAILED"));
        return;
      }

      res.status(200).json({
        success: true,
        rawText,
        characters: rawText.length,
      });
    } catch (_err) {
      next(ingestionError("RESUME_EXTRACTION_FAILED"));
    } finally {
      cleanupTempFile(file.path);
    }
  },

  /**
   * POST /v1/resume/clean (Phase 6)
   *
   * Normalizes raw resume text supplied in the JSON body.
   * Body: { "rawText": "..." }
   */
  clean(req: Request, res: Response, next: NextFunction): void {
    const rawText = (req.body as { rawText?: unknown })?.rawText;

    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(ingestionError("RAW_TEXT_REQUIRED"));
      return;
    }

    const cleaned = cleanText(rawText);

    res.status(200).json({
      success: true,
      cleanText: cleaned,
    });
  },

  /**
   * POST /v1/resume/skills (Phase 8)
   *
   * Detects known technical skills from raw text supplied in the JSON
   * body. Body: { "rawText": "..." }
   */
  skills(req: Request, res: Response, next: NextFunction): void {
    const rawText = (req.body as { rawText?: unknown })?.rawText;

    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(ingestionError("RAW_TEXT_REQUIRED"));
      return;
    }

    const skills = detectSkills(rawText);

    res.status(200).json({
      success: true,
      skills,
    });
  },

  /**
   * POST /v1/resume/parse (Phase 9)
   *
   * Parses raw/cleaned resume text into structured JSON using the
   * deterministic algorithm parser. Body: { "rawText": "..." }
   */
  parse(req: Request, res: Response, next: NextFunction): void {
    const rawText = (req.body as { rawText?: unknown })?.rawText;

    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(ingestionError("RAW_TEXT_REQUIRED"));
      return;
    }

    try {
      const resume = algorithmParser.parseResume(rawText);
      res.status(200).json({
        success: true,
        resume,
      });
    } catch (_err) {
      next(ingestionError("RESUME_PARSE_FAILED"));
    }
  },

  /**
   * POST /v1/resume/llm-parse (Phase 10)
   *
   * Parses resume text using the optional LLM parser. When
   * USE_LLM_PARSER is false, returns a disabled response.
   * Body: { "rawText": "..." }
   */
  async llmParse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!isLlmParserEnabled()) {
      res.status(200).json({
        success: false,
        errorCode: "LLM_PARSER_DISABLED",
        message: "LLM resume parser is disabled",
      });
      return;
    }

    const rawText = (req.body as { rawText?: unknown })?.rawText;

    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(ingestionError("RAW_TEXT_REQUIRED"));
      return;
    }

    try {
      const resume = await llmParser.parseResume(rawText);
      res.status(200).json({
        success: true,
        parser: "llm",
        resume,
      });
    } catch (_err) {
      next(ingestionError("RESUME_PARSE_FAILED"));
    }
  },

  /**
   * POST /v1/resume/embed (Phase 11)
   *
   * Generates a Mistral embedding for the supplied resume signals.
   * Body: { name, role, skills, company, experienceSummary, rawText }
   */
  async embed(req: Request, res: Response, next: NextFunction): Promise<void> {
    const body = (req.body ?? {}) as {
      name?: string;
      role?: string;
      skills?: string[];
      company?: string;
      experienceSummary?: string;
      rawText?: string;
    };

    const hasContent =
      (typeof body.rawText === "string" && body.rawText.trim().length > 0) ||
      (typeof body.name === "string" && body.name.trim().length > 0) ||
      (Array.isArray(body.skills) && body.skills.length > 0);

    if (!hasContent) {
      next(ingestionError("EMBEDDING_INPUT_REQUIRED"));
      return;
    }

    try {
      const text = embeddingService.buildEmbeddingText({
        name: body.name,
        role: body.role,
        skills: body.skills,
        company: body.company,
        experienceSummary: body.experienceSummary,
        rawText: body.rawText ?? "",
      });

      const embedding = await embeddingService.generateEmbedding(text);

      res.status(200).json({
        success: true,
        model: env.mistralEmbedModel,
        dimension: embedding.length,
        embedding,
      });
    } catch (_err) {
      next(
        new AppError(502, "EMBEDDING_FAILED", "Mistral embedding failed")
      );
    }
  },

  /**
   * POST /v1/resume/store (Phase 12)
   *
   * Persists a resume document (metadata + embedding) to MongoDB.
   * Body: { fileName, resume, rawText, embedding }
   */
  async store(req: Request, res: Response, next: NextFunction): Promise<void> {
    const body = (req.body ?? {}) as {
      fileName?: string;
      resume?: Partial<ParsedResume>;
      rawText?: string;
      embedding?: number[];
    };

    const { fileName, resume, rawText, embedding } = body;

    if (typeof fileName !== "string" || fileName.trim().length === 0) {
      next(ingestionError("FILE_NAME_REQUIRED"));
      return;
    }
    if (typeof rawText !== "string" || rawText.trim().length === 0) {
      next(ingestionError("RAW_TEXT_REQUIRED", "rawText is required"));
      return;
    }
    if (!Array.isArray(embedding) || embedding.length === 0) {
      next(ingestionError("EMBEDDING_REQUIRED"));
      return;
    }

    const r = resume ?? {};
    const now = new Date();

    const doc: StoredResume = {
      fileName,
      rawText,
      name: r.name ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      location: r.location ?? null,
      company: r.company ?? null,
      role: r.role ?? null,
      education: r.education ?? null,
      totalExperience: r.totalExperience ?? null,
      relevantExperience: r.relevantExperience ?? null,
      skills: Array.isArray(r.skills) ? r.skills : [],
      jobTitles: Array.isArray(r.jobTitles) ? r.jobTitles : [],
      experienceSummary: r.experienceSummary ?? null,
      embedding,
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: embedding.length,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const resumeId = await resumeRepository.insertResume(doc);
      res.status(201).json({
        success: true,
        message: "Resume stored successfully",
        resumeId,
      });
    } catch (_err) {
      next(ingestionError("INGESTION_FAILED"));
    }
  },

  /**
   * POST /v1/resume/ingest (Phase 13)
   *
   * Production endpoint. Runs the full ingestion pipeline on an
   * uploaded PDF and returns the resumeId, a parsed summary and timings.
   */
  async ingestResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = req.file;

    if (!file) {
      next(ingestionError("FILE_REQUIRED"));
      return;
    }

    try {
      const result = await resumeIngestionService.ingestResume({
        path: file.path,
        originalname: file.originalname,
      });

      // Structured, traceable log with per-step timings. No secrets,
      // no full embedding vector, no raw resume text are logged.
      logStructured({
        requestId: req.requestId,
        endpoint: "/v1/resume/ingest",
        fileName: file.originalname,
        statusCode: 201,
        ...result.timings,
      });

      res.status(201).json({
        success: true,
        message: "Resume ingestion completed",
        resumeId: result.resumeId,
        data: result.data,
        timings: result.timings,
      });
    } catch (err) {
      // The service throws typed AppErrors for each pipeline stage.
      const appErr = err instanceof AppError ? err : ingestionError("INGESTION_FAILED");
      logStructured({
        level: "error",
        requestId: req.requestId,
        endpoint: "/v1/resume/ingest",
        fileName: file.originalname,
        statusCode: appErr.statusCode,
        errorCode: appErr.errorCode,
        message: appErr.message,
      });
      next(appErr);
    }
  },

  /**
   * POST /v1/resume/ingest-batch (Home Assignment)
   *
   * Batch-ingests resume PDFs from the Resumes/ folder in configurable
   * batches (default 5, max 10). Optional JSON body:
   *   { "batchSize": 5, "offset": 0, "skipExisting": true }
   * Returns a summary with per-file results and the next offset so the
   * caller can process subsequent batches.
   */
  async ingestBatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const body = (req.body ?? {}) as {
      batchSize?: number;
      offset?: number;
      skipExisting?: boolean;
    };

    try {
      const summary = await batchIngestionService.runBatch({
        batchSize: body.batchSize,
        offset: body.offset,
        skipExisting: body.skipExisting,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: "Batch ingestion completed",
        summary,
      });
    } catch (_err) {
      next(ingestionError("INGESTION_FAILED"));
    }
  },
};
