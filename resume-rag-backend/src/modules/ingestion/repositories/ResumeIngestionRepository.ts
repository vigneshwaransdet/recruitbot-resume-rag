import { Collection, Document } from "mongodb";
import { getCollection } from "../../../config/database";
import { env } from "../../../config/env";
import { StoredResume } from "../types/ingestion.types";

/**
 * ResumeIngestionRepository (Phase 12)
 *
 * Persists resume documents (metadata + embedding) into the configured
 * MongoDB collection using the shared connection. The collection name
 * comes from MONGODB_COLLECTION so it matches the Atlas cluster
 * (resume_rag), which also holds the vector/BM25 search indexes.
 */
export class ResumeIngestionRepository {
  private collection(): Collection<Document> {
    return getCollection<Document>(env.mongodbCollection);
  }

  /**
   * Insert a resume document and return its generated id as a string.
   */
  async insertResume(doc: StoredResume): Promise<string> {
    const result = await this.collection().insertOne(doc as Document);
    return result.insertedId.toString();
  }

  /**
   * Return the set of fileNames already present in the collection,
   * limited to the provided candidate names. Used by batch ingestion to
   * skip files that were already ingested.
   */
  async findExistingFileNames(candidates: string[]): Promise<Set<string>> {
    if (candidates.length === 0) return new Set();
    const docs = await this.collection()
      .find({ fileName: { $in: candidates } }, { projection: { fileName: 1 } })
      .toArray();
    return new Set(docs.map((d) => d.fileName as string));
  }

  /**
   * Count all documents in the collection (used for validation).
   */
  async count(): Promise<number> {
    return this.collection().countDocuments();
  }

  /**
   * Fetch a stored resume by its id (used for verification).
   */
  async findById(id: string): Promise<Document | null> {
    // Lazy import to avoid a hard dependency at module load.
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return this.collection().findOne({ _id: new ObjectId(id) });
  }
}
