import { Collection, Document } from "mongodb";
import { getCollection, ensureConnected } from "../../../config/database";
import { env } from "../../../config/env";
import { SearchFilters } from "../types/retrieval.types";

/**
 * Raw row returned by the BM25 / vector aggregation pipelines before it
 * is normalized into a SearchCandidate.
 */
export interface RawSearchRow {
  _id: unknown;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  jobTitles?: string[];
  experienceSummary?: string | null;
  rawText?: string;
  score?: number;
}

/**
 * ResumeRepository (retrieval)
 *
 * Retrieval-only database access against the existing `resume_rag`
 * collection produced by ingestion. This repository never mutates
 * ingestion records during a normal search.
 */
export class ResumeRepository {
  private collection(): Collection<Document> {
    return getCollection<Document>(env.mongodbCollection);
  }

  /**
   * Ensure the shared connection is live (self-heals after a transient
   * startup failure), then return the collection handle.
   */
  private async collectionAsync(): Promise<Collection<Document>> {
    await ensureConnected();
    return this.collection();
  }

  /**
   * Count all documents in the collection.
   */
  async count(): Promise<number> {
    return (await this.collectionAsync()).countDocuments();
  }

  /**
   * Count documents that have a non-empty embedding array.
   */
  async countWithEmbedding(): Promise<number> {
    return (await this.collectionAsync()).countDocuments({
      embedding: { $exists: true, $type: "array", $ne: [] },
    });
  }

  /**
   * Fetch a single sample document that has an embedding, used to read
   * back the embedding model/dimension actually stored during ingestion.
   */
  async findOneWithEmbedding(): Promise<Document | null> {
    return (await this.collectionAsync()).findOne(
      { embedding: { $exists: true, $type: "array", $ne: [] } },
      {
        projection: {
          embeddingModel: 1,
          embeddingDimension: 1,
          embedding: 1,
        },
      }
    );
  }

  /**
   * Fetch a stored resume by its id (used for verification).
   */
  async findById(id: string): Promise<Document | null> {
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return (await this.collectionAsync()).findOne({ _id: new ObjectId(id) });
  }

  /**
   * Lexical (BM25) search via MongoDB Atlas Search `$search`.
   *
   * Searches across the resume text and structured metadata using a
   * compound query. `minYearsExperience` is applied as a numeric range
   * filter inside the same `$search` stage so BM25 scoring stays intact.
   */
  async bm25Search(
    query: string,
    topK: number,
    filters?: SearchFilters
  ): Promise<RawSearchRow[]> {
    const should = [
      { text: { query, path: "rawText" } },
      { text: { query, path: "skills" } },
      { text: { query, path: "jobTitles" } },
      { text: { query, path: "experienceSummary" } },
      { text: { query, path: "role" } },
      { text: { query, path: "company" } },
    ];

    const filter =
      typeof filters?.minYearsExperience === "number"
        ? [
            {
              range: {
                path: "totalExperience",
                gte: filters.minYearsExperience,
              },
            },
          ]
        : [];

    const pipeline: Document[] = [
      {
        $search: {
          index: env.bm25IndexName,
          compound: {
            should,
            minimumShouldMatch: 1,
            ...(filter.length > 0 ? { filter } : {}),
          },
        },
      },
      { $limit: topK },
      {
        $project: {
          _id: 1,
          name: 1,
          role: 1,
          company: 1,
          totalExperience: 1,
          skills: 1,
          jobTitles: 1,
          experienceSummary: 1,
          rawText: 1,
          score: { $meta: "searchScore" },
        },
      },
    ];

    return (await this.collectionAsync())
      .aggregate<RawSearchRow>(pipeline)
      .toArray();
  }

  /**
   * Semantic (vector) search via MongoDB Atlas Vector Search `$vectorSearch`.
   *
   * Compares the supplied query embedding against the stored resume
   * `embedding` field using cosine similarity (ANN). `minYearsExperience`
   * is applied as a pre-filter, which requires the index to declare
   * `totalExperience` as a filter field.
   */
  async vectorSearch(
    queryVector: number[],
    topK: number,
    filters?: SearchFilters
  ): Promise<RawSearchRow[]> {
    const hasFilter = typeof filters?.minYearsExperience === "number";

    const vectorStage: Document = {
      index: env.vectorIndexName,
      path: "embedding",
      queryVector,
      numCandidates: Math.max(topK * 10, 100),
      limit: topK,
    };

    if (hasFilter) {
      vectorStage.filter = {
        totalExperience: { $gte: filters!.minYearsExperience },
      };
    }

    const pipeline: Document[] = [
      { $vectorSearch: vectorStage },
      {
        $project: {
          _id: 1,
          name: 1,
          role: 1,
          company: 1,
          totalExperience: 1,
          skills: 1,
          jobTitles: 1,
          experienceSummary: 1,
          rawText: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    return (await this.collectionAsync())
      .aggregate<RawSearchRow>(pipeline)
      .toArray();
  }
}
