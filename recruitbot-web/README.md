# RecruitBot — Web

Recruiter-focused frontend for an enhanced **Resume RAG** application.
Built with Vite + React 18 + TypeScript + TailwindCSS, talking to the
`resume-rag-backend` API.

RecruitBot lets a recruiter describe a role in natural language and get back
**ranked, deduplicated, AI-summarized** candidate matches from a resume
database, using Vector / BM25 / Hybrid search.

---

## Enhanced features

| Feature | What it does |
|---------|--------------|
| **Re-ranking** | An LLM re-orders retrieved candidates by fit, adding a relevance score + "why" reason per candidate |
| **Deduplication** | Candidates found by both keyword and semantic search are merged into single results (shown explicitly) |
| **Summarization** | Each result gets an AI "fit summary" tailored to the query |
| **End-to-end pipeline** | One search runs embed → BM25 + vector → merge/dedupe → re-rank → summarize |
| **Clear results UI** | Ranked cards with scores, dedup badges, reasons, summaries + a candidate profile modal |

Plus: RecruitBot branding, an "RB" logo, a Professional Blue dark theme,
responsive layout (mobile drawer), and loading / success / validation /
error messaging.

---

## Run locally

Both apps run separately. The backend needs a `.env` with a MongoDB Atlas
URI, a Mistral API key (embeddings), and a Groq API key (LLM).

```bash
# 1) Backend  → http://localhost:3000
cd resume-rag-backend
npm install
npm run dev

# 2) Frontend → http://localhost:5173
cd recruitbot-web
npm install
npm run dev
```

- Candidate search: `http://localhost:5173/`
- Resume upload: `http://localhost:5173/ingest`

The Vite dev server proxies `/v1/*` requests to the backend on port 3000.

---

## Scripts

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

---

## Project structure

```
src/
├── components/
│   ├── common/         # BrandAvatar, StatusDot, LoadingDots
│   ├── layout/         # AppShell, Sidebar, ChatMain
│   └── features/
│       ├── sidebar/    # search-mode nav, hybrid weights, AI enhancement toggles
│       ├── chat/       # topbar, messages, bubbles, input, suggestions
│       ├── results/    # result cards, score pills, rank badges, summary, errors
│       └── candidate/  # candidate profile modal + sections
├── features/ingestion/ # resume upload flow (dropzone, progress, result, errors)
├── hooks/              # use-search, use-hybrid-weights, use-candidate-modal
├── lib/
│   ├── api/            # axios client, search + candidate APIs
│   ├── stores/         # zustand stores (search, chat, ui)
│   └── utils/          # constants, formatters
├── pages/              # ChatPage
└── types/              # search / chat / candidate types
```

---

## Documentation

- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — phase-wise implementation details
- [`PROMPTS.md`](./PROMPTS.md) — prompt file
- [`SUBMISSION.md`](./SUBMISSION.md) — submission checklist & steps

---

## Notes

- The Groq LLM (free tier) can rate-limit intermittently; the app degrades
  gracefully and shows a notice, and works on retry.
- The candidate modal is populated from the search result (the backend does
  not expose a separate candidate-detail endpoint).
