import { AlgorithmResumeParser } from "../src/modules/ingestion/services/AlgorithmResumeParser";

describe("AlgorithmResumeParser (Phase 9)", () => {
  const parser = new AlgorithmResumeParser();

  const structured = [
    "Rajesh Mohan Kumar",
    "Test Architect & Senior Agentic Test Engineer",
    "Company: Testleaf Software Solutions Private Limited",
    "Education: B.Tech - Information Technology",
    "Email: rajesh@example.com Phone: +91 9876543210",
    "Skills: Selenium, Python, C#, RAG, DeepEval, MCP (Model Context Protocol)",
    "13+ years of experience.",
  ].join("\n");

  it("extracts the name", () => {
    expect(parser.parseResume(structured).name).toBe("Rajesh Mohan Kumar");
  });

  it("extracts the role/title", () => {
    expect(parser.parseResume(structured).role).toBe(
      "Test Architect & Senior Agentic Test Engineer"
    );
  });

  it("extracts the company", () => {
    expect(parser.parseResume(structured).company).toBe(
      "Testleaf Software Solutions Private Limited"
    );
  });

  it("extracts education", () => {
    expect(parser.parseResume(structured).education).toBe(
      "B.Tech - Information Technology"
    );
  });

  it("extracts total experience as a number", () => {
    expect(parser.parseResume(structured).totalExperience).toBe(13);
  });

  it("extracts email and phone", () => {
    const r = parser.parseResume(structured);
    expect(r.email).toBe("rajesh@example.com");
    expect(r.phone).toContain("9876543210");
  });

  it("detects multiple skills", () => {
    const r = parser.parseResume(structured);
    expect(r.skills.length).toBeGreaterThanOrEqual(4);
    expect(r.skills).toContain("RAG");
  });

  it("does not hallucinate unsupported fields", () => {
    const r = parser.parseResume(structured);
    expect(r.location).toBeNull();
    expect(r.relevantExperience).toBeNull();
    expect(r.experienceSummary).toBeNull();
  });
});
