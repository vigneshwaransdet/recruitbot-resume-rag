import { MongoClient, Db, Collection, Document } from "mongodb";
import * as dns from "dns";
import { env } from "./env";

/**
 * Node's default DNS resolver can fail the SRV lookup required by
 * mongodb+srv:// connection strings on some networks (VPN / corporate
 * DNS), producing "querySrv ECONNREFUSED". Pointing Node at public
 * DNS resolvers makes the SRV lookup reliable without changing the URI.
 */
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Non-fatal: fall back to system resolver if this is not permitted.
}

/**
 * Single shared MongoDB connection.
 *
 * The client is created once and reused for the whole process so that
 * both ingestion and (later) retrieval share one connection pool.
 * Connection details come only from environment variables (.env).
 */

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Establish the shared connection. Safe to call once at startup.
 * If already connected, the existing connection is reused.
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not configured in the environment");
  }

  // Bounded timeouts so an unreachable/blocked Atlas endpoint fails fast
  // (returns a controlled 503) instead of hanging ~30s on the default
  // server-selection timeout. The lazy ensureConnected() path can then
  // retry cleanly on a later request once connectivity recovers.
  client = new MongoClient(env.mongodbUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });
  await client.connect();
  db = client.db(env.mongodbDbName);
  return db;
}

/**
 * Return the shared Db instance. Throws if the connection has not
 * been established yet (call connectToDatabase() at startup).
 */
export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase() first.");
  }
  return db;
}

/**
 * Lazily ensure a live connection, retrying if the initial startup
 * connection failed (e.g. a transient network/TLS hiccup to Atlas).
 *
 * Request paths that need the database should await this instead of
 * calling getDb() directly, so the app self-heals once connectivity
 * recovers — no server restart required.
 */
export async function ensureConnected(): Promise<Db> {
  if (db) {
    return db;
  }
  // (Re)create the client and connect. connectToDatabase() resets state
  // on success; on failure the error propagates to the caller.
  if (client) {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    client = null;
  }
  return connectToDatabase();
}

/**
 * Convenience accessor for a typed collection from the shared Db.
 */
export function getCollection<T extends Document = Document>(
  name: string
): Collection<T> {
  return getDb().collection<T>(name);
}

/**
 * Ping the database and measure round-trip latency in milliseconds.
 * Used by the /v1/health/db endpoint.
 */
export async function pingDatabase(): Promise<{ connected: boolean; latencyMs: number }> {
  const database = getDb();
  const start = Date.now();
  await database.command({ ping: 1 });
  const latencyMs = Date.now() - start;
  return { connected: true, latencyMs };
}

/**
 * Gracefully close the shared connection (used on shutdown).
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
