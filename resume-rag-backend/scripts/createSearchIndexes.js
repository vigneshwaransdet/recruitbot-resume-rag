/**
 * One-time Atlas Search index setup for the retrieval module.
 *
 * Creates the two search indexes retrieval depends on, using the same
 * connection settings as the app (.env). Safe to re-run: existing
 * indexes are skipped.
 *
 *   bm25_rag          — lexical Atlas Search over resume text + metadata
 *   vector_search_rag — vector search over the 1024-dim `embedding`
 *
 * Usage:  node scripts/createSearchIndexes.js
 */
require("dotenv").config();
const dns = require("dns");
try {
  // Match src/config/database.ts: use public DNS so mongodb+srv SRV
  // lookups succeed on networks with unreliable resolvers.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  /* fall back to system resolver */
}
const { MongoClient } = require("mongodb");

const BM25_INDEX = process.env.BM25_INDEX_NAME || "bm25_rag";
const VECTOR_INDEX = process.env.VECTOR_INDEX_NAME || "vector_search_rag";
const DIM = parseInt(process.env.EMBEDDING_DIMENSION || "1024", 10);

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client
    .db(process.env.MONGODB_DB_NAME)
    .collection(process.env.MONGODB_COLLECTION);

  const existing = (await col.listSearchIndexes().toArray()).map((i) => i.name);
  console.log("Existing search indexes:", existing);

  if (!existing.includes(BM25_INDEX)) {
    await col.createSearchIndex({
      name: BM25_INDEX,
      type: "search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            rawText: { type: "string" },
            skills: { type: "string" },
            jobTitles: { type: "string" },
            experienceSummary: { type: "string" },
            role: { type: "string" },
            company: { type: "string" },
            totalExperience: { type: "number" },
          },
        },
      },
    });
    console.log("Created BM25 index:", BM25_INDEX);
  } else {
    console.log("BM25 index already exists:", BM25_INDEX);
  }

  if (!existing.includes(VECTOR_INDEX)) {
    await col.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: DIM,
            similarity: "cosine",
          },
          { type: "filter", path: "totalExperience" },
        ],
      },
    });
    console.log("Created vector index:", VECTOR_INDEX);
  } else {
    console.log("Vector index already exists:", VECTOR_INDEX);
  }

  await client.close();
  console.log("Done. Indexes may take a short time to become queryable.");
})().catch((e) => {
  console.error("Index setup failed:", e.message);
  process.exit(1);
});
