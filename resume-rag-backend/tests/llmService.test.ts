import { LLMService } from "../src/modules/retrieval/services/LLMService";

/**
 * LLMService unit tests (Phase 10/11/18).
 *
 * The Groq HTTP call is mocked so these tests are deterministic and run
 * with no network. They verify the re-rank output contract: ids must be
 * a subset of the input, hallucinated ids are dropped, and invalid JSON
 * is surfaced as a controlled error.
 */

// Ensure the service treats the key as configured.
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-key";

function mockGroq(content: string): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
    text: async () => content,
  }) as unknown as typeof fetch;
}

const candidates = [
  { resumeId: "aaa", snippet: "senior RAG MCP DeepEval architect" },
  { resumeId: "bbb", snippet: "junior manual tester" },
];

describe("LLMService.rerankCandidates (Phase 11)", () => {
  it("returns only ids that were supplied (subset), re-ranked", async () => {
    mockGroq(
      JSON.stringify({
        results: [
          { resumeId: "bbb", rank: 1, relevanceScore: 0.3 },
          { resumeId: "aaa", rank: 2, relevanceScore: 0.9 },
        ],
      })
    );
    const svc = new LLMService();
    const out = await svc.rerankCandidates("query", candidates, 10);
    expect(out.map((r) => r.resumeId).sort()).toEqual(["aaa", "bbb"]);
    // Ranks are reassigned sequentially in returned order.
    expect(out[0].rank).toBe(1);
    expect(out[1].rank).toBe(2);
  });

  it("drops hallucinated ids not present in the input", async () => {
    mockGroq(
      JSON.stringify({
        results: [
          { resumeId: "ZZZ", rank: 1, relevanceScore: 0.99 },
          { resumeId: "aaa", rank: 2, relevanceScore: 0.9 },
        ],
      })
    );
    const svc = new LLMService();
    const out = await svc.rerankCandidates("query", candidates, 10);
    expect(out.map((r) => r.resumeId)).toEqual(["aaa"]);
    expect(out.find((r) => r.resumeId === "ZZZ")).toBeUndefined();
  });

  it("caps results to topK", async () => {
    mockGroq(
      JSON.stringify({
        results: [
          { resumeId: "aaa", rank: 1, relevanceScore: 0.9 },
          { resumeId: "bbb", rank: 2, relevanceScore: 0.8 },
        ],
      })
    );
    const svc = new LLMService();
    const out = await svc.rerankCandidates("query", candidates, 1);
    expect(out).toHaveLength(1);
    expect(out[0].resumeId).toBe("aaa");
  });

  it("throws a controlled error on non-JSON output", async () => {
    mockGroq("this is not json at all");
    const svc = new LLMService();
    await expect(svc.rerankCandidates("query", candidates, 10)).rejects.toThrow();
  });

  it("normalizes 0-100 style scores into 0-1", async () => {
    mockGroq(
      JSON.stringify({
        results: [{ resumeId: "aaa", rank: 1, relevanceScore: 96 }],
      })
    );
    const svc = new LLMService();
    const out = await svc.rerankCandidates("query", candidates, 10);
    expect(out[0].relevanceScore).toBeLessThanOrEqual(1);
    expect(out[0].relevanceScore).toBeGreaterThan(0.9);
  });
});

describe("LLMService.summarizeCandidateFit (Phase 12)", () => {
  it("returns the trimmed model text", async () => {
    mockGroq("  Strong fit for a senior QA/GenAI role.  ");
    const svc = new LLMService();
    const summary = await svc.summarizeCandidateFit(
      "query",
      { resumeId: "aaa", snippet: "RAG MCP" },
      { style: "short" }
    );
    expect(summary).toBe("Strong fit for a senior QA/GenAI role.");
  });
});
