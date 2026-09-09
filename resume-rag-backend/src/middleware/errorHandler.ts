import { Request, Response, NextFunction } from "express";

/**
 * Application error with a stable error code and HTTP status.
 * Used across ingestion endpoints to produce controlled responses.
 */
export class AppError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralized error handler. Produces a consistent error shape that
 * always includes the requestId for traceability.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      requestId: req.requestId,
      errorCode: err.errorCode,
      message: err.message,
    });
    return;
  }

  // Oversized request body (thrown by express.json limit) -> 413.
  if (
    typeof err === "object" &&
    err !== null &&
    ((err as { type?: string }).type === "entity.too.large" ||
      (err as { status?: number }).status === 413)
  ) {
    res.status(413).json({
      success: false,
      requestId: req.requestId,
      errorCode: "PAYLOAD_TOO_LARGE",
      message: "Request payload is too large",
    });
    return;
  }

  // Malformed JSON body (thrown by express.json()) -> controlled 400.
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as SyntaxError & { status?: number }).status === 400 &&
    "body" in err
  ) {
    res.status(400).json({
      success: false,
      requestId: req.requestId,
      errorCode: "INVALID_JSON",
      message: "Request body is not valid JSON",
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      requestId: req.requestId,
      level: "error",
      message,
    })
  );

  res.status(500).json({
    success: false,
    requestId: req.requestId,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    requestId: req.requestId,
    errorCode: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
