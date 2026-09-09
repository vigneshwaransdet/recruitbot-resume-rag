import { cleanText } from "../src/modules/ingestion/utils/textCleaner";

describe("textCleaner (Phase 6)", () => {
  it("matches the documented example", () => {
    const input =
      "Rajesh Mohan Kumar\n\n\nTest Architect & Senior Agentic Test Engineer   \n RAG";
    expect(cleanText(input)).toBe(
      "Rajesh Mohan Kumar\nTest Architect & Senior Agentic Test Engineer\nRAG"
    );
  });

  it("collapses repeated spaces and tabs", () => {
    expect(cleanText("A     B\t\tC")).toBe("A B C");
  });

  it("normalizes CRLF and CR to LF", () => {
    expect(cleanText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("removes duplicate blank lines", () => {
    expect(cleanText("a\n\n\n\nb")).toBe("a\nb");
  });

  it("preserves technical symbols and emails and dates", () => {
    const input = "Skills:   C#,  C++,   .NET  Email: t@e.com  2015-2019";
    const out = cleanText(input);
    expect(out).toContain("C#");
    expect(out).toContain("C++");
    expect(out).toContain(".NET");
    expect(out).toContain("t@e.com");
    expect(out).toContain("2015-2019");
  });

  it("strips control characters", () => {
    expect(cleanText("a\u0000b\u0007c")).toBe("abc");
  });

  it("returns empty string for non-string input", () => {
    // @ts-expect-error testing runtime guard
    expect(cleanText(null)).toBe("");
  });
});
