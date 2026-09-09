/**
 * Structured logging helpers (Phase 15).
 *
 * Emits single-line JSON logs so every request is traceable by
 * requestId. Sensitive material — secrets, full embedding vectors and
 * raw resume payloads — is never logged here. Callers must pass only
 * safe, summarised fields (counts, timings, ids).
 */

export type LogLevel = "info" | "warn" | "error";

export interface StructuredLog {
  level?: LogLevel;
  requestId?: string;
  endpoint?: string;
  fileName?: string;
  statusCode?: number;
  // Per-step ingestion timings (ms)
  extractMs?: number;
  cleanMs?: number;
  parseMs?: number;
  embeddingMs?: number;
  mongoInsertMs?: number;
  totalMs?: number;
  // Optional safe extras
  errorCode?: string;
  message?: string;
  [key: string]: unknown;
}

export function logStructured(entry: StructuredLog): void {
  const line: StructuredLog = { level: "info", ...entry };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}
