import request from "supertest";
import app from "../src/app";

/**
 * Retrieval integration tests (Phase 18).
 *
 * These exercise the Express app directly and focus on validation and
 * error contracts that do NOT require a live MongoDB or LLM connection,
 * so they are deterministic in CI. Full success paths that need Atlas /
 * Mistral / Groq are verified manually (Postman) and via unit tests.
 */
describe("retrieval: validation + error contracts", () => {
  it("POST /v1/search with empty query -> 400 INVALID_SEARCH_QUERY", async () => {
    const res = await request(app).post("/v1/search").send({ query: "" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  it("POST /v1/search/bm25 with missing query -> 400", async () => {
    const res = await request(app).post("/v1/search/bm25").send({});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  it("POST /v1/search/vector with a non-object filter -> 400 INVALID_FILTER", async () => {
    const res = await request(app)
      .post("/v1/search/vector")
      .send({ query: "hi", filters: "not-an-object" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_FILTER");
  });

  it("POST /v1/search/bm25 with a negative minYearsExperience -> 400 INVALID_FILTER", async () => {
    const res = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "hi", filters: { minYearsExperience: -3 } });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_FILTER");
  });

  it("POST /v1/search/rerank with no candidates -> 400 CANDIDATES_REQUIRED", async () => {
    const res = await request(app)
      .post("/v1/search/rerank")
      .send({ query: "hi", candidates: [] });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("CANDIDATES_REQUIRED");
  });

  it("POST /v1/search/rerank with a candidate missing resumeId -> 400", async () => {
    const res = await request(app)
      .post("/v1/search/rerank")
      .send({ query: "hi", candidates: [{ snippet: "no id here" }] });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("CANDIDATES_REQUIRED");
  });

  it("POST /v1/search/summarize with no candidate -> 400 CANDIDATE_REQUIRED", async () => {
    const res = await request(app)
      .post("/v1/search/summarize")
      .send({ query: "hi" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("CANDIDATE_REQUIRED");
  });

  it("oversized JSON body -> 413 PAYLOAD_TOO_LARGE", async () => {
    const huge = "x".repeat(1_200_000);
    const res = await request(app)
      .post("/v1/search")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ query: huge }));
    expect(res.status).toBe(413);
    expect(res.body.errorCode).toBe("PAYLOAD_TOO_LARGE");
  });

  it("unknown retrieval route -> 404 NOT_FOUND", async () => {
    const res = await request(app).post("/v1/search/nope").send({});
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });
});
