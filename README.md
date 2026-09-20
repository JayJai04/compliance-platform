# ClearPath Compliance Platform

Affiliate ad compliance review for ClearPath Financial consumer lending products (personal loans, credit cards, mortgage prequalification). Marketers submit ad images; an AI vision check (OpenAI `gpt-5.6-luna`) flags violations; human reviewers approve or reject with a decision note.

## How it works

1. **Marketer** signs up / logs in, submits a JPG ad (≤5MB) for a product.
2. **Submit API** uploads the image to private Supabase storage, inserts a `pending` row with an "AI check in progress" placeholder, and returns immediately.
3. **AI check** runs in the background via Next.js `after()`: Luna inspects the image against four rules — no false guarantees, accurate pricing/terms, required disclosures (company name + credit-review dependency), clear language — and UPDATEs the row with `PASS`/`FAIL`, issues found, and recommended changes.
4. **Reviewer** (admin login) sees the queue on the dashboard, opens an ad, reads the AI notes as reference, writes a decision note, and approves or rejects. The reviewer page polls every 3s until the AI result lands.
5. **Marketer** sees only the final compliance decision on their ads — never the raw AI output.

## System architecture

```
┌─────────────┐  POST /api/submit   ┌──────────────┐  upload JPG   ┌─────────────────┐
│  Marketer   │ ──────────────────► │ Next.js API  │ ────────────► │ Supabase        │
│  (browser)  │ ◄────────────────── │ routes       │               │ Storage (ads)   │
└─────────────┘  GET /api/marketer/*│              │ insert row    │ private bucket  │
                    │               └──────┬───────┘               └─────────────────┘
                    │ after() AI    │      │ insert/UPDATE ai_result
                    ▼               │      ▼                       ┌─────────────────┐
              ┌──────────────┐      │   ┌──────────────────┐       │ Supabase        │
              │ OpenAI Luna  │ ◄────┘   │ submissions      │       │ Postgres        │
              │ vision API   │ ────────► │ (jsonb ai_result)│       │ RLS: server     │
              └──────────────┘ result   └──────────────────┘       │ only (service   │
                    │               ▲                              │ role key)       │
┌─────────────┐     │  GET /api/list│                              └─────────────────┘
│  Reviewer   │ ────┘  POST /api/review (approve/reject + note)
│  (browser)  │
└─────────────┘
```

- **Frontend**: Next.js 16 App Router, React 19, Tailwind + shadcn-style UI. Routes: `/` (landing), `/login` (reviewer + marketer), `/marketer` (my ads + submit dialog), `/dashboard` (review queue), `/review/[id]` (decision page).
- **Backend**: Next.js route handlers under `src/app/api/` — `submit`, `list`, `review`, `image` (reviewer side); `marketer/list`, `marketer/image`, `marketer/signup`, `login`, `logout`.
- **Auth**: JWT sessions via `jose` in HTTP-only cookies (`MARKETER_COOKIE_NAME` / `ADMIN_COOKIE_NAME`). Marketers are DB-backed (`public.users`, bcrypt); the reviewer is env-var credentialed (`REVIEWER_PASSWORD`).
- **AI**: `src/lib/ai-check.ts` (`runAiCheck`) calls OpenAI chat completions with the ClearPath reviewer prompt, JSON mode, 12s timeout. No key or any failure → graceful fallback to the stub note; submission never breaks. Result type in `src/lib/check.ts` (`AiResult`: `overall`, `issues`, `recommended_changes`, `ocr_text`, `findings`, `notes`).
- **Database**: Supabase Postgres. `submissions` (one row per ad, `ai_result jsonb`, `status` pending/approved/rejected, `reviewer_note`) and `users` (marketers). RLS enabled with no browser policies — all access via `service_role` in server routes.
- **Storage**: `ads` bucket, private, JPG-only, 5MB limit.

## Getting started

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

Required env vars (see `.env.example`):

| Var | Purpose |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | DB + storage access (server only) |
| `REVIEWER_PASSWORD` | Admin/reviewer login |
| `SESSION_SECRET` | JWT signing |
| `OPENAI_API_KEY` | Luna vision checks (optional — falls back to stub note without it) |
| `OPENAI_MODEL` | Override model, default `gpt-5.6-luna` |

```bash
npm run lint   # eslint
npx tsc --noEmit  # type-check
```

Note: `next build` currently crashes with a Turbopack bus error in this environment (reproduces on pristine checkout — pre-existing, unrelated to app code).
