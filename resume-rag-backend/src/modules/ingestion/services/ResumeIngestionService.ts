import fs from "fs";
import { ResumeParserService } from "./ResumeParserService";
import { getResumeParser } from "./ResumeParserFactory";
import { cleanText } from "../utils/textCleaner";
import { EmbeddingService } from "./EmbeddingService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { StoredResume } from "../types/ingestion.types";
import { env } from "../../../config/env";
import { ingestionError } from "../errors/errorCatalog";

/**
 * Result of a full ingestion run.
 */
export interface IngestionResult {
  resumeId: string;
  data: {
    name: string | null;
    role: string | null;
    company: string | null;
    totalExperience: number | null;
    skillsCount: number;
    embeddingModel: string;
    embeddingDimension: number;
  };
  timings: {
    extractMs: number;
    cleanMs: number;
    parseMs: number;
    embeddingMs: number;
    mongoInsertMs: number;
    totalMs: number;
  };
}

/**
 * Minimal shape of an uploaded file we depend on. Kept local so the
 * service does not require multer types at every call site.
 */
export interface UploadedFile {
  path: string;
  originalname: string;
  /**
   * Whether to delete the source file after processing. Defaults to
   * true for temporary uploads. Batch ingestion sets this to false so
   * the original resume files in the Resumes/ folder are preserved.
   */
  deleteAfter?: boolean;
}

/**
 * ResumeIngestionService (Phase 13)
 *
 * Orchestrates the entire ingestion pipeline through one call:
 *   extract -> clean -> parse -> skills/metadata -> embed -> store
 * Each step is timed and the temporary file is always cleaned up.
 */
export class ResumeIngestionService {
  private readonly parserService = new ResumeParserService();
  private readonly embeddingService = new EmbeddingService();
  private readonly repository = new ResumeIngestionRepository();

  async ingestResume(file: UploadedFile): Promise<IngestionResult> {
    const startTotal = Date.now();

    try {
      // 1) Extract
      const startExtract = Date.now();
      const rawExtracted = await this.parserService.extractTextFromPdf(
        file.path
      );
      const extractMs = Date.now() - startExtract;

      if (!rawExtracted || rawExtracted.trim().length === 0) {
        throw ingestionError("RESUME_EXTRACTION_FAILED");
      }

      // 2) Clean
      const startClean = Date.now();
      const cleaned = cleanText(rawExtracted);
      const cleanMs = Date.now() - startClean;

      // 3) Parse (algorithm or LLM per USE_LLM_PARSER)
      const startParse = Date.now();
      let parsed;
      try {
        parsed = await getResumeParser().parseResume(cleaned);
      } catch (_e) {
        throw ingestionError("RESUME_PARSE_FAILED");
      }
      const parseMs = Date.now() - startParse;

      // 4) Embed (Mistral) — build input from parsed signals + text
      const startEmbed = Date.now();
      let embedding: number[];
      try {
        const embeddingText = this.embeddingService.buildEmbeddingText({
          name: parsed.name,
          role: parsed.role,
          skills: parsed.skills,
          company: parsed.company,
          experienceSummary: parsed.experienceSummary,
          rawText: cleaned,
        });
        embedding = await this.embeddingService.generateEmbedding(
          embeddingText
        );
      } catch (_e) {
        throw ingestionError("EMBEDDING_FAILED");
      }
      const embeddingMs = Date.now() - startEmbed;

      // 5) Store in MongoDB
      const startMongo = Date.now();
      const now = new Date();
      const doc: StoredResume = {
        fileName: file.originalname,
        rawText: cleaned,
        name: parsed.name ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        location: parsed.location ?? null,
        company: parsed.company ?? null,
        role: parsed.role ?? null,
        education: parsed.education ?? null,
        totalExperience: parsed.totalExperience ?? null,
        relevantExperience: parsed.relevantExperience ?? null,
        skills: parsed.skills ?? [],
        jobTitles: parsed.jobTitles ?? [],
        experienceSummary: parsed.experienceSummary ?? null,
        embedding,
        embeddingModel: env.mistralEmbedModel,
        embeddingDimension: embedding.length,
        createdAt: now,
        updatedAt: now,
      };

      let resumeId: string;
      try {
        resumeId = await this.repository.insertResume(doc);
      } catch (_e) {
        throw ingestionError("INGESTION_FAILED");
      }
      const mongoInsertMs = Date.now() - startMongo;

      return {
        resumeId,
        data: {
          name: parsed.name ?? null,
          role: parsed.role ?? null,
          company: parsed.company ?? null,
          totalExperience: parsed.totalExperience ?? null,
          skillsCount: parsed.skills?.length ?? 0,
          embeddingModel: env.mistralEmbedModel,
          embeddingDimension: embedding.length,
        },
        timings: {
          extractMs,
          cleanMs,
          parseMs,
          embeddingMs,
          mongoInsertMs,
          totalMs: Date.now() - startTotal,
        },
      };
    } finally {
      // Clean up temporary uploaded files only. Batch ingestion passes
      // deleteAfter=false to preserve the original resume files.
      if (file.deleteAfter !== false) {
        fs.promises.unlink(file.path).catch(() => {
          /* ignore */
        });
      }
    }
  }
}
