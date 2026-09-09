import fs from "fs";
import path from "path";
import { ResumeIngestionService } from "./ResumeIngestionService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { env } from "../../../config/env";
import { logStructured } from "../../../shared/logging/structuredLogger";

/**
 * BatchIngestionService (Home Assignment)
 *
 * Processes resume PDFs from a folder in configurable batches
 * (default 5, hard-capped at 10 per run) reusing the existing
 * single-resume ingestion pipeline.
 *
 * Behavior:
 * - Lists .pdf files in the Resumes folder in a deterministic order.
 * - Skips files already ingested (matched by fileName in MongoDB).
 * - Processes a window of `batchSize` files starting at `offset`.
 * - Isolates per-file failures: one bad resume does not stop the batch.
 * - Never deletes the original resume files.
 * - Returns a summary so callers can drive multiple runs.
 */

export interface BatchFileResult {
  fileName: string;
  status: "succeeded" | "failed" | "skipped";
  resumeId?: string;
  errorCode?: string;
  message?: string;
}

export interface BatchSummary {
  folder: string;
  totalPdfFiles: number;
  batchSize: number;
  offset: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  nextOffset: number;
  remaining: number;
  results: BatchFileResult[];
}

export class BatchIngestionService {
  private readonly ingestionService = new ResumeIngestionService();
  private readonly repository = new ResumeIngestionRepository();

  /** Absolute path to the resumes folder. */
  private resumesDir(): string {
    return path.resolve(process.cwd(), env.resumesDir);
  }

  /** List PDF files (deterministic, case-insensitive sort). */
  listPdfFiles(): string[] {
    const dir = this.resumesDir();
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  /**
   * Run one batch.
   *
   * @param options.batchSize how many files to process this run
   *   (defaults to env.batchSize; hard-capped at 10)
   * @param options.offset index into the sorted file list to start from
   * @param options.skipExisting skip files already in MongoDB (default true)
   */
  async runBatch(options?: {
    batchSize?: number;
    offset?: number;
    skipExisting?: boolean;
    requestId?: string;
  }): Promise<BatchSummary> {
    const allFiles = this.listPdfFiles();
    const totalPdfFiles = allFiles.length;

    const requestedSize = options?.batchSize ?? env.batchSize;
    const batchSize = Math.min(Math.max(requestedSize || env.batchSize, 1), 10);
    const offset = Math.max(options?.offset ?? 0, 0);
    const skipExisting = options?.skipExisting !== false;

    const window = allFiles.slice(offset, offset + batchSize);

    // Determine which of this window are already ingested.
    const existing = skipExisting
      ? await this.repository.findExistingFileNames(window)
      : new Set<string>();

    const results: BatchFileResult[] = [];
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const fileName of window) {
      if (existing.has(fileName)) {
        skipped += 1;
        results.push({ fileName, status: "skipped", message: "Already ingested" });
        continue;
      }

      const filePath = path.join(this.resumesDir(), fileName);
      try {
        const result = await this.ingestionService.ingestResume({
          path: filePath,
          originalname: fileName,
          deleteAfter: false, // never delete the source resume files
        });
        succeeded += 1;
        results.push({
          fileName,
          status: "succeeded",
          resumeId: result.resumeId,
        });
      } catch (err) {
        failed += 1;
        const errorCode =
          (err as { errorCode?: string }).errorCode ?? "INGESTION_FAILED";
        const message = err instanceof Error ? err.message : "Ingestion failed";
        results.push({ fileName, status: "failed", errorCode, message });
      }
    }

    const processed = window.length;
    const nextOffset = offset + processed;
    const remaining = Math.max(totalPdfFiles - nextOffset, 0);

    const summary: BatchSummary = {
      folder: env.resumesDir,
      totalPdfFiles,
      batchSize,
      offset,
      processed,
      succeeded,
      failed,
      skipped,
      nextOffset,
      remaining,
      results,
    };

    // Structured, safe log line (no secrets/vectors/raw text).
    logStructured({
      requestId: options?.requestId,
      endpoint: "/v1/resume/ingest-batch",
      message: "batch completed",
      offset,
      batchSize,
      processed,
      succeeded,
      failed,
      skipped,
      remaining,
    });

    return summary;
  }
}
