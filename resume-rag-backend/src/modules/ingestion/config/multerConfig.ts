import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { env } from "../../../config/env";

/**
 * Secure PDF upload configuration (Phase 4).
 *
 * - Accepts only .pdf / application/pdf
 * - Max size enforced from MAX_UPLOAD_SIZE_MB
 * - Stores to a temporary uploads/ directory
 * - Generates safe, random file names (never trusts client filenames
 *   for the storage path)
 */

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure the temporary uploads directory exists.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, _file, cb) => {
    // Safe, non-guessable name. Client filename is never used for the path.
    const safeName = `${Date.now()}-${randomUUID()}.pdf`;
    cb(null, safeName);
  },
});

function pdfFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMime && isPdfExt) {
    cb(null, true);
    return;
  }

  // Reject with a typed error carrying a stable code.
  const err = new Error("Only PDF files are allowed") as Error & {
    code?: string;
  };
  err.code = "INVALID_FILE_TYPE";
  cb(err);
}

export const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
  },
});

export const UPLOADS_DIRECTORY = UPLOAD_DIR;
