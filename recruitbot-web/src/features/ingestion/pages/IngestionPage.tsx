import { ResumeUploadCard } from '../components/ResumeUploadCard';

/**
 * IngestionPage
 *
 * Hosts the resume ingestion flow. Phase 2 renders the upload UI
 * (dropzone + button + progress + success/error states). API wiring and
 * the multi-stage progress screen arrive in Phases 3–6.
 */
export function IngestionPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-bg-base p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-base font-bold text-white">
          RB
        </span>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">RecruitBot</h1>
          <p className="text-xs text-text-muted">Resume Ingestion</p>
        </div>
      </div>

      <ResumeUploadCard />
    </div>
  );
}
