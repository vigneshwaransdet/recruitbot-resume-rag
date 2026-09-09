import {
  toCandidate,
  matchedSkills,
  buildSnippet,
} from "../src/modules/retrieval/utils/candidateMapper";
import { RawSearchRow } from "../src/modules/retrieval/repositories/ResumeRepository";

describe("candidateMapper (Phase 5/7)", () => {
  describe("matchedSkills", () => {
    it("matches skills present in the query", () => {
      const result = matchedSkills("agentic QA architect RAG MCP", [
        "RAG",
        "MCP",
        "Selenium",
      ]);
      expect(result).toContain("RAG");
      expect(result).toContain("MCP");
      expect(result).not.toContain("Selenium");
    });

    it("returns [] when there are no skills", () => {
      expect(matchedSkills("anything", [])).toEqual([]);
    });

    it("returns [] for an empty query", () => {
      expect(matchedSkills("", ["RAG"])).toEqual([]);
    });
  });

  describe("buildSnippet", () => {
    it("prefers experienceSummary over rawText", () => {
      const row: RawSearchRow = {
        _id: "x",
        experienceSummary: "Concise summary",
        rawText: "Very long raw text",
      };
      expect(buildSnippet(row)).toBe("Concise summary");
    });

    it("caps the snippet length", () => {
      const row: RawSearchRow = { _id: "x", rawText: "a".repeat(5000) };
      expect(buildSnippet(row).length).toBeLessThanOrEqual(1200);
    });

    it("returns empty string when no text is present", () => {
      expect(buildSnippet({ _id: "x" })).toBe("");
    });
  });

  describe("toCandidate", () => {
    const row: RawSearchRow = {
      _id: "691db80aa895776f97b6eca6",
      name: "Rajesh",
      role: "Test Architect",
      company: "Testleaf",
      totalExperience: 13,
      skills: ["RAG", "MCP"],
      experienceSummary: "13+ years RAG MCP",
      score: 8.412,
    };

    it("normalizes a bm25 row and rounds the score", () => {
      const c = toCandidate(row, "bm25", "RAG MCP");
      expect(c.resumeId).toBe("691db80aa895776f97b6eca6");
      expect(c.sources).toEqual(["bm25"]);
      expect(c.bm25Score).toBe(8.41);
      expect(c.vectorScore).toBeUndefined();
      expect(c.matchedSkills).toEqual(["RAG", "MCP"]);
    });

    it("normalizes a vector row into vectorScore", () => {
      const c = toCandidate({ ...row, score: 0.8765 }, "vector", "RAG");
      expect(c.sources).toEqual(["vector"]);
      expect(c.vectorScore).toBe(0.88);
      expect(c.bm25Score).toBeUndefined();
    });

    it("coerces ObjectId-like _id to string", () => {
      const c = toCandidate({ _id: 12345 as unknown as string }, "bm25");
      expect(typeof c.resumeId).toBe("string");
      expect(c.resumeId).toBe("12345");
    });
  });
});
