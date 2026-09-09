import request from "supertest";
import app from "../src/app";
import * as database from "../src/config/database";
// pdfkit ships no bundled types; require it in the test only.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");

/**
 * End-to-end ingest test.
 *
 * Flow: sample PDF -> POST /v1/resume/ingest -> 201 -> resumeId returned
 * -> stored document captured -> name/skills populated -> embedding
 * length 1024.
 *
 * External services are mocked: Mistral via global.fetch, Mongo via
 * getCollection. This keeps the test deterministic and offline.
 */

function makeResumePdf(): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(16).text("Rajesh Mohan Kumar");
    doc.fontSize(12).text("Test Architect & Senior Agentic Test Engineer");
    doc.text("Company: Testleaf Software Solutions Private Limited");
    doc.text("Skills: Selenium, Python, RAG, DeepEval, MCP (Model Context Protocol)");
    doc.text("13+ years of experience.");
    doc.end();
  });
}

describe("e2e: POST /v1/resume/ingest", () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.MISTRAL_API_KEY =
      process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY !== "YOUR_KEY"
        ? process.env.MISTRAL_API_KEY
        : "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("ingests a resume end-to-end and stores a 1024-dim embedding", async () => {
    const pdf = await makeResumePdf();

    // Mock Mistral to return a 1024-dim vector.
    const fakeVector = Array.from({ length: 1024 }, () => 0.001);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: fakeVector }] }),
    }) as unknown as typeof fetch;

    // Capture the document that gets inserted into Mongo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stored: any = null;
    const insertOne = jest.fn().mockImplementation((d) => {
      stored = d;
      return Promise.resolve({ insertedId: { toString: () => "e2e-id-1" } });
    });
    jest
      .spyOn(database, "getCollection")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ insertOne } as any);

    const res = await request(app)
      .post("/v1/resume/ingest")
      .attach("file", pdf, {
        filename: "rajesh.pdf",
        contentType: "application/pdf",
      });

    // Response assertions
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.resumeId).toBe("e2e-id-1");
    expect(res.body.data.embeddingModel).toBe("mistral-embed");
    expect(res.body.data.embeddingDimension).toBe(1024);
    expect(res.body.timings).toHaveProperty("totalMs");

    // Stored-document assertions
    expect(stored).not.toBeNull();
    expect(stored.fileName).toBe("rajesh.pdf");
    expect(typeof stored.rawText).toBe("string");
    expect(stored.rawText.length).toBeGreaterThan(0);
    expect(Array.isArray(stored.skills)).toBe(true);
    expect(Array.isArray(stored.embedding)).toBe(true);
    expect(stored.embedding).toHaveLength(1024);
    expect(stored.embeddingModel).toBe("mistral-embed");
  });
});
