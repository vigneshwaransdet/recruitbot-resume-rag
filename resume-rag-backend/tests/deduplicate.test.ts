import { mergeAndDeduplicate } from "../src/modules/retrieval/utils/deduplicate";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

function candidate(
  id: string,
  source: "bm25" | "vector",
  score: number,
  extra: Partial<SearchCandidate> = {}
): SearchCandidate {
  const c: SearchCandidate = {
    resumeId: id,
    sources: [source],
    ...extra,
  };
  if (source === "bm25") c.bm25Score = score;
  else c.vectorScore = score;
  return c;
}

describe("mergeAndDeduplicate (Phase 9)", () => {
  it("merges the documented A,B,C + B,D,A pool into A,B,C,D", () => {
    const bm25 = [
      candidate("A", "bm25", 5),
      candidate("B", "bm25", 4),
      candidate("C", "bm25", 3),
    ];
    const vector = [
      candidate("B", "vector", 0.9),
      candidate("D", "vector", 0.8),
      candidate("A", "vector", 0.7),
    ];

    const pool = mergeAndDeduplicate(bm25, vector);
    const ids = pool.map((c) => c.resumeId).sort();
    expect(ids).toEqual(["A", "B", "C", "D"]);
  });

  it("preserves source provenance for candidates found by both paths", () => {
    const pool = mergeAndDeduplicate(
      [candidate("A", "bm25", 5)],
      [candidate("A", "vector", 0.9)]
    );
    expect(pool).toHaveLength(1);
    expect(pool[0].sources).toEqual(["bm25", "vector"]);
  });

  it("keeps both scores when merged", () => {
    const pool = mergeAndDeduplicate(
      [candidate("A", "bm25", 5)],
      [candidate("A", "vector", 0.9)]
    );
    expect(pool[0].bm25Score).toBe(5);
    expect(pool[0].vectorScore).toBe(0.9);
  });

  it("unions matchedSkills across sources", () => {
    const pool = mergeAndDeduplicate(
      [candidate("A", "bm25", 5, { matchedSkills: ["RAG"] })],
      [candidate("A", "vector", 0.9, { matchedSkills: ["MCP"] })]
    );
    expect(pool[0].matchedSkills?.sort()).toEqual(["MCP", "RAG"]);
  });

  it("prefers non-empty metadata from either candidate", () => {
    const pool = mergeAndDeduplicate(
      [candidate("A", "bm25", 5, { name: null, role: null })],
      [candidate("A", "vector", 0.9, { name: "Jane", role: "QA Architect" })]
    );
    expect(pool[0].name).toBe("Jane");
    expect(pool[0].role).toBe("QA Architect");
  });

  it("does not mutate the input arrays", () => {
    const bm25 = [candidate("A", "bm25", 5)];
    const original = JSON.parse(JSON.stringify(bm25));
    mergeAndDeduplicate(bm25, [candidate("A", "vector", 0.9)]);
    expect(bm25).toEqual(original);
  });

  it("returns an empty pool for empty inputs", () => {
    expect(mergeAndDeduplicate([], [])).toEqual([]);
  });
});
