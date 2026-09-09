import request from "supertest";
import app from "../src/app";

/**
 * Integration tests exercise the Express app directly (no network
 * server, no live Mongo/Mistral). Endpoints that depend on external
 * services are covered for their validation/error behavior; the full
 * success path with mocks is covered in the e2e test.
 */
describe("integration: health + validation endpoints", () => {
  it("GET /v1/health returns 200 ok", async () => {
    const res = await request(app).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", app: "resume-rag-backend" });
  });

  it("GET /v1/resume/health returns module readiness", async () => {
    const res = await request(app).get("/v1/resume/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", module: "resume-ingestion" });
  });

  it("POST /v1/resume/upload with no file -> 400 FILE_REQUIRED", async () => {
    const res = await request(app).post("/v1/resume/upload");
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("FILE_REQUIRED");
  });

  it("POST /v1/resume/upload with a non-PDF -> 415 INVALID_FILE_TYPE", async () => {
    const res = await request(app)
      .post("/v1/resume/upload")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "note.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(415);
    expect(res.body.errorCode).toBe("INVALID_FILE_TYPE");
  });

  it("POST /v1/resume/clean with missing rawText -> 400", async () => {
    const res = await request(app).post("/v1/resume/clean").send({});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("RAW_TEXT_REQUIRED");
  });

  it("POST /v1/resume/clean normalizes text", async () => {
    const res = await request(app)
      .post("/v1/resume/clean")
      .send({ rawText: "A\n\n\nB   \n C" });
    expect(res.status).toBe(200);
    expect(res.body.cleanText).toBe("A\nB\nC");
  });

  it("POST /v1/resume/skills detects skills", async () => {
    const res = await request(app)
      .post("/v1/resume/skills")
      .send({ rawText: "Selenium, Python, RAG, DeepEval" });
    expect(res.status).toBe(200);
    expect(res.body.skills).toEqual(
      expect.arrayContaining(["Selenium", "Python", "RAG", "DeepEval"])
    );
  });

  it("POST /v1/resume/parse returns structured JSON", async () => {
    const res = await request(app)
      .post("/v1/resume/parse")
      .send({
        rawText:
          "Rajesh Mohan Kumar\nTest Architect\nSkills: Python, RAG\n13+ years",
      });
    expect(res.status).toBe(200);
    expect(res.body.resume.name).toBe("Rajesh Mohan Kumar");
    expect(res.body.resume.totalExperience).toBe(13);
  });

  it("POST /v1/resume/embed with empty body -> 400", async () => {
    const res = await request(app).post("/v1/resume/embed").send({});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("EMBEDDING_INPUT_REQUIRED");
  });

  it("POST /v1/resume/store with missing embedding -> 400", async () => {
    const res = await request(app)
      .post("/v1/resume/store")
      .send({ fileName: "x.pdf", rawText: "hello" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("EMBEDDING_REQUIRED");
  });

  it("unknown route -> 404 NOT_FOUND", async () => {
    const res = await request(app).get("/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("malformed JSON -> 400 INVALID_JSON", async () => {
    const res = await request(app)
      .post("/v1/resume/clean")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("INVALID_JSON");
  });
});
