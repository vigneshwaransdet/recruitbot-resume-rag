import express, { Application, Request, Response } from "express";
import cors from "cors";

import { APP_NAME, APP_VERSION } from "./config/env";
import { pingDatabase } from "./config/database";
import ingestionRoutes from "./modules/ingestion/routes/ingestionRoutes";
import retrievalRoutes from "./modules/retrieval/routes/retrievalRoutes";
import { requestId } from "./middleware/requestId";
import { logger } from "./middleware/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app: Application = express();

// Core middleware
app.use(cors());
// Assign a requestId before body parsing so even body-size / JSON parse
// errors carry a traceable requestId in their response.
app.use(requestId);
// Enforce a JSON request body size limit (Phase 17). Oversized payloads
// are rejected before handlers run; the error handler maps the resulting
// "entity too large" error to a controlled 413 PAYLOAD_TOO_LARGE.
app.use(express.json({ limit: "1mb" }));
app.use(logger);

// Health endpoint (Phase 1)
app.get("/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    app: APP_NAME,
    version: APP_VERSION,
    uptime: process.uptime(),
  });
});

// Database health endpoint (Phase 2)
app.get("/v1/health/db", async (_req: Request, res: Response) => {
  try {
    const { connected, latencyMs } = await pingDatabase();
    res.status(200).json({
      status: "ok",
      database: "mongodb",
      connected,
      latencyMs,
    });
  } catch (_err) {
    res.status(503).json({
      status: "error",
      database: "mongodb",
      connected: false,
      errorCode: "DB_CONNECTION_FAILED",
    });
  }
});

// Ingestion module routes (Phase 3+)
app.use("/v1", ingestionRoutes);

// Retrieval module routes (Phase 2 of the build — retrieval guide)
app.use("/v1", retrievalRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
