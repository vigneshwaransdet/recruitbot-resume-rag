import type { IngestionStage } from '../types/ingestion.types';

/** Descriptor for a single step in the ingestion progress stepper. */
export interface StageDescriptor {
  key: IngestionStage;
  label: string;
  description: string;
}

/**
 * Ordered pipeline stages shown in the progress UI (Phase 5). These mirror
 * the backend pipeline: upload -> extract -> parse -> embed -> store.
 *
 * NOTE: the backend does not stream per-stage progress — it returns
 * per-step timings only after the whole pipeline finishes. The stepper
 * therefore advances on a timed cadence while the request is in flight and
 * snaps to "completed" on success. See useIngestion for the cadence logic.
 */
export const INGESTION_STAGES: StageDescriptor[] = [
  { key: 'upload', label: 'Resume Upload', description: 'Sending the PDF to the server' },
  { key: 'processing', label: 'PDF Processing', description: 'Extracting text from the PDF' },
  { key: 'parsing', label: 'Resume Parsing', description: 'Structuring name, role & skills' },
  { key: 'embedding', label: 'Embedding Generation', description: 'Creating the semantic vector' },
  { key: 'storage', label: 'MongoDB Storage', description: 'Saving to the resume database' },
  { key: 'completed', label: 'Completed', description: 'Ready for vector search' },
];

/** Zero-based index of a stage within INGESTION_STAGES. */
export function stageIndex(stage: IngestionStage): number {
  const i = INGESTION_STAGES.findIndex((s) => s.key === stage);
  return i === -1 ? 0 : i;
}

/**
 * The stages that run while the request is in flight (everything except the
 * terminal "completed"), used to drive the timed cadence.
 */
export const IN_FLIGHT_STAGES: IngestionStage[] = INGESTION_STAGES
  .map((s) => s.key)
  .filter((k) => k !== 'completed');
