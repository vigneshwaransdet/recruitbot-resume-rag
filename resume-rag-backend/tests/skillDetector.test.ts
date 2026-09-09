import { detectSkills } from "../src/modules/ingestion/utils/skillDetector";

describe("skillDetector (Phase 8)", () => {
  it("matches the documented example", () => {
    const input =
      "Experienced in Selenium WebDriver, Python, RAG, DeepEval and MCP (Model Context Protocol).";
    expect(detectSkills(input)).toEqual([
      "Selenium",
      "Python",
      "RAG",
      "DeepEval",
      "MCP (Model Context Protocol)",
    ]);
  });

  it("detects the C# symbol skill", () => {
    expect(detectSkills("Strong in C# and Postman")).toContain("C#");
  });

  it("does not match Java inside JavaScript", () => {
    // "Java" is in the dictionary but must not match within "JavaScript".
    expect(detectSkills("Only JavaScript here")).not.toContain("Java");
  });

  it("returns dictionary order with no duplicates", () => {
    const result = detectSkills("Python Python RAG RAG");
    expect(result).toEqual(["Python", "RAG"]);
  });

  it("returns [] for empty input", () => {
    expect(detectSkills("")).toEqual([]);
  });
});
