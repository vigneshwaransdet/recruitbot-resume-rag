# RecruitBot — Prompt File

A record of the prompts / instructions used to build and enhance the
RecruitBot Resume RAG application with an AI coding assistant. Prompts are
grouped by phase and lightly cleaned up for clarity.

---

## 0. Assignment framing

> Home Assignment — Enhance the existing Resume RAG application by
> implementing: re-ranking of retrieved resumes, deduplication of repeated
> results, summarization of the final results, complete end-to-end pipeline
> integration, and display all relevant results clearly on the UI.
> Customize with organization branding (name, logo, theme/colours,
> professional responsive layout, loading/success/validation/error
> messages). Then test the complete end-to-end application.

---

## 1. Frontend build (base app, from the provided instructions doc)

> Read `FRONTEND_WEB_INSTRUCTIONS_FINAL_V1 3.md` and implement it phase by
> phase, confirming with me before moving to the next phase.

This produced the base `recruitbot-web` app: ingestion/upload flow
(Phases 1–9) and the search/retrieval chat UI (Phases 10–15).

---

## 2. Branding customization

> Keep the name "RecruitBot". Use an "RB" monogram logo. Change the theme to
> a standard Professional Blue palette — primary `#2563eb`, accent
> `#06b6d4` — on a dark background. Apply it across the app.

---

## 3. Verify the pipeline (end-to-end)

> Run real queries against the backend and confirm that re-ranking,
> deduplication, and summarization actually work end-to-end. Capture the
> real response shape so the UI shows the right fields.

Findings: all four features work; the response includes `relevanceScore`,
`reason`, `sources`, and `summary`; the LLM occasionally rate-limits and the
backend degrades gracefully.

---

## 4. Surface the pipeline outputs on the UI

> Make search use the full pipeline with summaries on. On each result card
> and in the candidate modal, clearly display: the relevance score
> (re-ranking), a badge showing it was matched by keyword + semantic search
> (deduplication), the re-rank reason, and the fit summary. Show a graceful
> notice if AI re-ranking/summaries are temporarily unavailable.

---

## 5. Responsive design

> Make the layout responsive. On mobile, collapse the sidebar into a
> slide-out drawer with a hamburger toggle in the topbar; keep the desktop
> layout unchanged.

---

## 6. Messages polish

> Review loading, success, validation, and error states across the app and
> make them read professionally. Give search failures friendly, specific
> messages with a retry action, and show a clear loading indicator while the
> pipeline runs.

---

## 7. Make enhancements visible as UI controls / indicators

> Add Re-ranking and Summarize as visible controls in the sidebar (like the
> search-mode tabs). And make deduplication explicit — add a clear
> "Deduplicated — N candidates merged" indicator in the results header so it
> is obvious the feature ran, not just a hidden step.

Result: "AI Enhancements" sidebar section with Re-ranking + Summarize
toggles, and an explicit green "Deduplicated — N merged" line in the results
header (count derived from results matched by both engines).

---

## 8. Test each feature one by one

> Implement and then test each feature one at a time. After I test a feature
> in the UI and post a screenshot, confirm it, then move to the next.

All five features were tested live in the UI and confirmed one-by-one:
re-ranking, deduplication, summarization, end-to-end pipeline, and clear
results display.

---

## 9. Deliverables

> Prepare the relevant assignment documents.

Result: `IMPLEMENTATION.md` (phase-wise), `PROMPTS.md` (this file),
`SUBMISSION.md` (submission checklist), and an updated `README.md`.
(Screenshots and the GitHub push are done manually.)

---

## Notes on working style used throughout

- Work in small phases; verify each with a production build (`npm run build`) before moving on.
- Prefer verifying against the **real backend** response shape over assumptions.
- Be explicit about what is verified vs. not (e.g. live LLM behavior, backend data quality).
- Keep changes centralized (theme tokens, typed API normalizer) so they are low-risk and consistent.
