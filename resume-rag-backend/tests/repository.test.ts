import { ResumeIngestionRepository } from "../src/modules/ingestion/repositories/ResumeIngestionRepository";
import { StoredResume } from "../src/modules/ingestion/types/ingestion.types";
import * as database from "../src/config/database";

/**
 * Repository insert handling with the DB layer mocked (no live Mongo).
 */
describe("ResumeIngestionRepository (Phase 12)", () => {
  const repo = new ResumeIngestionRepository();

  const doc: StoredResume = {
    fileName: "x.pdf",
    rawText: "hello",
    name: "Rajesh",
    email: null,
    phone: null,
    location: null,
    company: null,
    role: null,
    education: null,
    totalExperience: null,
    relevantExperience: null,
    skills: ["RAG"],
    jobTitles: [],
    experienceSummary: null,
    embedding: [0.1, 0.2, 0.3],
    embeddingModel: "mistral-embed",
    embeddingDimension: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the inserted id as a string", async () => {
    const insertOne = jest
      .fn()
      .mockResolvedValue({ insertedId: { toString: () => "abc123" } });

    jest
      .spyOn(database, "getCollection")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ insertOne } as any);

    const id = await repo.insertResume(doc);
    expect(id).toBe("abc123");
    expect(insertOne).toHaveBeenCalledTimes(1);
  });

  it("propagates insert failures", async () => {
    const insertOne = jest.fn().mockRejectedValue(new Error("mongo down"));
    jest
      .spyOn(database, "getCollection")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({ insertOne } as any);

    await expect(repo.insertResume(doc)).rejects.toThrow("mongo down");
  });
});
