import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Attaches a unique requestId to every incoming request so that
 * logs and error responses can be correlated across a request lifecycle.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
