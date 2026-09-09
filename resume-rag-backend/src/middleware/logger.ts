import { Request, Response, NextFunction } from "express";
import { logStructured } from "../shared/logging/structuredLogger";

/**
 * Lightweight structured request logger.
 * Emits one JSON log line per completed request with requestId,
 * endpoint, status code and total duration.
 *
 * Secrets and large payloads (e.g. embedding vectors) are never logged.
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    logStructured({
      level: res.statusCode >= 500 ? "error" : "info",
      requestId: req.requestId,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      totalMs: Date.now() - start,
    });
  });

  next();
}
