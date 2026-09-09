import app from "./app";
import { env, APP_NAME } from "./config/env";
import { connectToDatabase, closeDatabase } from "./config/database";

async function start(): Promise<void> {
  // Establish the single shared MongoDB connection once at startup.
  // Reused by all requests (never recreated per request).
  try {
    await connectToDatabase();
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: "info",
        message: "MongoDB connected",
        db: env.mongodbDbName,
      })
    );
  } catch (err) {
    // Do not crash the server: /v1/health/db will report the failure.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        message: "MongoDB connection failed at startup",
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: "info",
        message: `${APP_NAME} listening`,
        port: env.port,
        nodeEnv: env.nodeEnv,
      })
    );
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await closeDatabase();
  process.exit(0);
});

start();
