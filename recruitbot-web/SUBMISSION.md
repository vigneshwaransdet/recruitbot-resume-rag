# RecruitBot — Submission Guide

Checklist and steps for submitting the home assignment
("Enhance the existing Resume RAG application").

---

## 1. Deliverables checklist

| Item | Status | Notes |
|------|--------|-------|
| Phase-wise implementation file | ✅ Ready | `IMPLEMENTATION.md` |
| Prompt file | ✅ Ready | `PROMPTS.md` |
| Screenshots of the application & final results | ⬜ You capture | See list below |
| GitHub repository link | ⬜ You create | See git steps below |
| Post in WhatsApp group | ⬜ You do | GitHub link + screenshots + files |

---

## 2. Screenshots to capture

Capture these from the running app (`http://localhost:5173`). Together they
evidence all five features + branding + responsiveness.

1. **Home / welcome screen** — sidebar (branding, RB logo, search modes, AI Enhancements toggles) + welcome message.
2. **Re-ranking** — a results list showing ranked cards with relevance score pills and "Why" reasons.
3. **Deduplication** — a Hybrid results view showing the green "Deduplicated — N merged" line + "Keyword + Semantic" badges.
4. **Summarization** — a results card with a "FIT SUMMARY" box.
5. **Candidate modal** — the profile modal showing score + matched-by + skills + "Why this candidate" + full "Fit summary" (this single shot demonstrates re-rank + dedup + summary together).
6. **End-to-end** — a single search result showing header (Found N · Mode · time) + dedup line + scores + reasons + summaries all at once.
7. **Empty / edge case** — a nonsense query (e.g. `xyzqwerty123`) showing honest low scores / "no direct match" reasoning.
8. **Upload flow** — `http://localhost:5173/ingest`: the upload card, and (optionally) a successful ingestion result screen.
9. **Responsive (optional)** — narrow the browser (or use DevTools device mode) to show the mobile drawer sidebar.

> Do NOT include the backend `.env` file or any API keys in screenshots.

---

## 3. Git / GitHub steps

No git repository exists yet. The backend `.gitignore` already excludes
`.env`, so your API keys will not be pushed.

**Recommended:** push the frontend and backend as one repository from the
`ClassroomActivity` folder, or create two repos — either is fine. Example
for a single combined repo:

```bash
# from the ClassroomActivity folder
git init
git add recruitbot-web resume-rag-backend
git status                     # verify .env is NOT listed
git commit -m "RecruitBot: enhanced Resume RAG app (re-rank, dedupe, summarize, e2e, UI)"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

**Before committing, double-check secrets are excluded:**

```bash
git ls-files | Select-String ".env"   # should return nothing
```

If `.env` ever shows as tracked, remove it from tracking (keeps the local file):

```bash
git rm --cached resume-rag-backend/.env
```

> Also make sure `node_modules/` and `dist/` are not committed (both are
> already git-ignored in each project).

---

## 4. WhatsApp submission

Post in the group:

- The **GitHub repository link**
- The **screenshots** from section 2
- The **phase-wise implementation file** (`IMPLEMENTATION.md`) and **prompt file** (`PROMPTS.md`)

---

## 5. Honest notes to mention (optional but recommended)

- The Groq LLM (free tier) occasionally rate-limits; the app degrades
  gracefully and shows a notice. Re-running the search after ~20 seconds
  produces a full re-ranked + summarized result.
- Some candidate names appear as text fragments due to backend resume
  parsing on messy PDFs — not a UI issue.
