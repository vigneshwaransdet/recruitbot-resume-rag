/**
 * Shared type definitions for the ingestion module.
 * These are the contracts every ingestion phase builds on.
 */

/**
 * Structured resume produced by the parser (algorithm or LLM).
 * Only fields that can be supported from the resume are populated;
 * unsupported values are null/undefined rather than invented.
 */
export interface ParsedResume {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  company?: string | null;
  role?: string | null;
  education?: string | null;
  totalExperience?: number | null;
  relevantExperience?: number | null;
  skills: string[];
  jobTitles?: string[];
  experienceSummary?: string | null;
}

/**
 * Final document stored in the MongoDB resumes collection.
 */
export interface StoredResume extends ParsedResume {
  fileName: string;
  rawText: string;
  embedding: number[];
  embeddingModel: string;
  embeddingDimension: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contract implemented by both AlgorithmResumeParser and LLMResumeParser.
 */
export interface IResumeParser {
  parseResume(rawText: string): ParsedResume | Promise<ParsedResume>;
}
