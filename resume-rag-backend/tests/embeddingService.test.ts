import { EmbeddingService } from "../src/modules/ingestion/services/EmbeddingService";

/**
 * These tests mock global.fetch so no live Mistral call is made. They
 * verify the embedding response validation and error mapping.
 */
describe("EmbeddingService (Phase 11)", () => {
  const service = new EmbeddingService();
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Ensure the key check passes.
    process.env.MISTRAL_API_KEY =
      process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY !== "YOUR_KEY"
        ? process.env.MISTRAL_API_KEY
        : "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("buildEmbeddingText combines meaningful signals", () => {
    const text = service.buildEmbeddingText({
      name: "Rajesh",
      role: "Test Architect",
      skills: ["RAG", "DeepEval"],
      company: "Testleaf",
      experienceSummary: null,
      rawText: "resume text",
    });
    expect(text).toContain("Rajesh");
    expect(text).toContain("Test Architect");
    expect(text).toContain("RAG, DeepEval");
    expect(text).toContain("Testleaf");
    expect(text).toContain("resume text");
  });

  it("returns a numeric vector on a valid response", async () => {
    const fakeVector = Array.from({ length: 1024 }, (_, i) => i * 0.001);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: fakeVector }] }),
    }) as unknown as typeof fetch;

    const out = await service.generateEmbedding("hello");
    expect(out).toHaveLength(1024);
    expect(out.every((n) => typeof n === "number")).toBe(true);
  });

  it("throws EMBEDDING_FAILED on a non-ok API response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "server error",
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("hello")).rejects.toMatchObject({
      code: "EMBEDDING_FAILED",
    });
  });

  it("throws EMBEDDING_FAILED on an empty embedding", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [] }] }),
    }) as unknown as typeof fetch;

    await expect(service.generateEmbedding("hello")).rejects.toMatchObject({
      code: "EMBEDDING_FAILED",
    });
  });

  it("throws EMBEDDING_FAILED on empty input text", async () => {
    await expect(service.generateEmbedding("")).rejects.toMatchObject({
      code: "EMBEDDING_FAILED",
    });
  });
});
