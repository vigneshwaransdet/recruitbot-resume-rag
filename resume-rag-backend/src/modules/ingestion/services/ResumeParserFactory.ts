import { IResumeParser } from "../types/ingestion.types";
import { AlgorithmResumeParser } from "./AlgorithmResumeParser";
import { LLMResumeParser } from "./LLMResumeParser";
import { env } from "../../../config/env";

/**
 * Selects the active resume parser based on configuration.
 *
 * USE_LLM_PARSER=true  -> LLMResumeParser (Groq)
 * USE_LLM_PARSER=false -> AlgorithmResumeParser (deterministic, default)
 */
export function getResumeParser(): IResumeParser {
  return env.useLlmParser ? new LLMResumeParser() : new AlgorithmResumeParser();
}

export function isLlmParserEnabled(): boolean {
  return env.useLlmParser;
}
