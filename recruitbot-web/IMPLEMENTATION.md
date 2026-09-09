# RecruitBot — Phase-wise Implementation

Home assignment: **Enhance the existing Resume RAG application.**

This document records, phase by phase, how the RecruitBot application was
enhanced and customized. It covers the retrieval pipeline enhancements
(re-ranking, deduplication, summarization, end-to-end integration), the
result display on the UI, and the organization branding / UX work.

---

## Architecture Overview

Two applications, run separately:

| App | Path | Port | Role |
|-----|------|------|------|
| Backend | `resume-rag-backend` | 3000 | Express + MongoDB Atlas (Vector + BM25 search), Mistral embeddings, Groq LLM |
| Frontend | `recruitbot-web` | 5173 | Vite + React 18 + TypeScript + TailwindCSS |

The frontend dev server proxies `/v1/*` to the backend on port 3000.

**Enhanced retrieval pipeline** (single call to `POST /v1/search`):

```
Query
  → Embed (Mistral)
  → BM25 search + Vector search (parallel)
  → Merge + Deduplicate (by resumeId)
  → LLM Re-rank (Groq)
  → Summarize each result (Groq)
  → Ranked results
```

---

## Feature Requirement → Where It Lives

| Assignment requirement | Status | Implementation |
|------------------------|--------|----------------|
| Re-ranking of retrieved resumes | Done (existing backend) | `POST /v1/search` LLM re-rank; surfaced on UI as `relevanceScore` + "Why" reason |
| Deduplication of repeated results | Done (existing backend) | `mergeAndDeduplicate` by `resumeId`; surfaced as "Matched by Keyword + Semantic" badge |
| Summarization of final results | Done (existing backend) | Per-candidate fit summary; surfaced as "Fit summary" on card + modal |
| End-to-end pipeline integration | Done (existing backend) | `POST /v1/search` runs the full pipeline in one call |
| Display all relevant results clearly | Done (this work) | Ranked result cards, score pills, dedup badges, reasons, summaries, candidate modal |
| Organization branding | Done (this work) | Name "RecruitBot", "RB" logo, Professional Blue theme |
| Professional UI layout | Done | Sidebar + chat layout, dark theme, consistent tokens |
| Responsive design | Done | Mobile drawer sidebar + responsive spacing |
| Loading / success / validation / error messages | Done | Covered across ingestion + search flows |

---

## Phase C — Branding

**Goal:** Customize the app with organization identity.

- **Name:** RecruitBot
- **Logo:** "RB" monogram in a blue→cyan gradient (`public/logo.svg`, used as favicon and in all avatar spots)
- **Theme:** Professional Blue (dark)
  - Primary `#2563eb`, Accent `#06b6d4`
  - Backgrounds cooled to blue-gray: base `#0b1120`, surface `#111a2e`, card `#172136`
  - Text `#f1f5f9` / muted `#94a3b8`
  - Distinct score colors: Vector `#3b82f6`, BM25 `#22d3ee`, Hybrid `#34d399`

**Files:** `tailwind.config.js`, `src/index.css`, `public/logo.svg`,
`BrandAvatar.tsx`, `ChatTopbar.tsx`, `BotBubble.tsx`, `IngestionPage.tsx`.

---

## Phase A — Verify the Pipeline (End-to-End Testing)

**Goal:** Confirm the four pipeline features work live before wiring the UI.

Ran real queries against `POST /v1/search` (168 resumes indexed). Confirmed:

- **Re-ranking:** results carry `relevanceScore` (e.g. 0.95 / 0.92 / 0.78) and a `reason`.
- **Deduplication:** each result lists `sources` (e.g. `["bm25","vector"]`) — evidence of merged duplicates.
- **Summarization:** each result carries a `summary` ("Fit Summary" text).
- **End-to-end:** one call returns embed → BM25 + vector → merge/dedupe → re-rank → summarize with per-stage `timings`.

**Resilience note:** the Groq LLM occasionally rate-limits. The backend
degrades gracefully (`degraded: true`, `warnings: [...]`) and still returns
deterministically-ordered results. The UI surfaces this (see Phase E).

**Verified response shape:**
`{ rank, resumeId, name, role, company, totalExperience, skills[], sources[], relevanceScore, reason, summary }`

---

## Phase B — Surface Pipeline Outputs on the UI

**Goal:** "Display all relevant results clearly."

- All search modes now run the **full pipeline** (`POST /v1/search`), so re-ranking, dedup and summaries always appear.
- **Sidebar "AI Enhancements" section** with **Re-ranking** and **Summarize** toggles (both on by default), sitting alongside the search modes:
  - *Summarize* toggles the backend `summarize` option (real behaviour change).
  - *Re-ranking* toggles whether the LLM relevance score + reason are shown (the backend pipeline always re-ranks).
- **Result card** shows: rank badge, relevance score pill, experience, a **"Matched by Keyword + Semantic"** dedup badge, skill chips, the re-rank **reason** ("Why"), and a **Fit summary** box.
- **Candidate modal** shows: score + experience, matched-by provenance, skills, "Why this candidate" (reason), and the full Fit summary.
- Response fields normalized in `search.api.ts` (`relevanceScore → score`, `skills`, `sources`, `reason`, `summary`).

**Files:** `types/search.types.ts`, `lib/api/search.api.ts`,
`ResultCard.tsx`, `CandidateModal.tsx`, `ResultsList.tsx`, `use-search.tsx`.

---

## Phase D — Responsive Design

**Goal:** Work on small screens.

- Sidebar body extracted into a shared `SidebarContent`.
- **Desktop (≥768px):** fixed 260px sidebar column (unchanged).
- **Mobile (<768px):** slide-out drawer + backdrop, opened by a hamburger button in the topbar; auto-closes after picking a non-hybrid mode.
- Responsive padding across chat messages, input, and suggestion chips.
- Ingestion page was already responsive (centered card).

**Files:** `Sidebar.tsx`, `ChatTopbar.tsx`, `ChatMessages.tsx`, `ChatMain.tsx`.

---

## Phase E — Loading / Success / Validation / Error Messages

**Goal:** Professional, consistent status messaging.

- **Loading:** search shows "Searching & ranking candidates…" with animated dots; ingestion shows an upload progress bar then a pipeline stepper.
- **Success:** ingestion success screen (checklist + parsed summary); search result summary header ("Found N candidates · Mode · duration").
- **Validation:** ingestion inline amber messages — "Only PDF allowed", "Maximum 5MB allowed", "Please select a file".
- **Error:** search shows a friendly, differentiated, **retryable** error card (timeout / cannot reach server / temporarily unavailable / server error); ingestion maps backend error codes to friendly copy with retry; a **graceful degradation** notice appears when the LLM re-rank/summary is temporarily unavailable.

**Files:** `SearchError.tsx`, `use-search.tsx`, `ChatMessages.tsx`,
plus existing ingestion `IngestionErrorScreen.tsx`, `fileValidation.ts`,
`errorMessages.ts`.

---

## How to Run

```bash
# Backend (needs .env with MongoDB URI + Mistral + Groq keys)
cd resume-rag-backend
npm install
npm run dev            # http://localhost:3000

# Frontend
cd recruitbot-web
npm install
npm run dev            # http://localhost:5173
```

- Search: `http://localhost:5173/`
- Upload: `http://localhost:5173/ingest`

---

## Testing Summary

`npm run build` passes (TypeScript + Vite) with no errors. Both dev servers
run and communicate; search returns real ranked candidates from the 168
indexed resumes.

Each feature was tested one-by-one in the live UI and confirmed:

| # | Feature | How it was tested | Result |
|---|---------|-------------------|--------|
| 1 | Re-ranking | Ran a query; observed ranked #1–#5 with descending relevance scores (0.950 → 0.850) and per-candidate "Why" reasons | ✅ Confirmed |
| 2 | Deduplication | Ran a Hybrid query; observed the green "Deduplicated — N candidates matched by both keyword + semantic search (merged)" indicator + per-card "Keyword + Semantic" badges, no duplicate cards | ✅ Confirmed |
| 3 | Summarization | Ran a query with Summarize ON; observed a "FIT SUMMARY" box on each card and the full summary in the candidate modal; toggling Summarize OFF removed them | ✅ Confirmed |
| 4 | End-to-end pipeline | A single search produced all stages together (header "Found N · Mode · time", dedup line, scores, reasons, fit summaries) in one request | ✅ Confirmed |
| 5 | Display results clearly | Reviewed results layout + candidate modal (open / close via ✕, overlay click, Esc); nonsense query returned honestly low scores with "no direct match" reasoning rather than breaking | ✅ Confirmed |

**Observed pipeline timings (typical successful run):** embedding ~0.3–1s,
BM25 ~0.15s, vector ~0.1s, re-rank ~2.5–3.7s, summarize ~0.9–2s,
total ~4–6s.

### Known notes (honest)

- The Groq LLM can rate-limit intermittently; the app degrades gracefully and shows a notice rather than failing.
- Some candidate `name`/`role` values look like extracted text fragments — this is a backend resume-parsing quality matter, not a frontend issue.
- The same person can appear under two different `resumeId`s if uploaded twice; dedup works per document (same document is merged correctly).
- The candidate modal is populated from the search result (the backend does not expose a separate candidate-detail endpoint).
