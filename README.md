# SyncVerse

Peer-to-peer learning platform: AI-generated learning roadmaps, an AI explainer, curated company/program directories, and peer discovery.

Built with **Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui** on a **Supabase** backend (Auth, Postgres, Edge Functions).

## Getting started

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # http://localhost:8080
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server (port 8080, host `::`) |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript project check (`tsc --noEmit`) |
| `node scripts/db-check.mjs` | Runtime health check: Supabase auth/DB/edge CORS, env presence (never prints secrets). `--generate` also burns one roadmap generation against Gemini quota |

## Environment variables

All client env vars are read from `.env` (see `.env.example` for placeholders):

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | anon/publishable key (public by design — never put the service key here) |
| `VITE_SUPABASE_PROJECT_ID` | yes | used by health checks / CLI config |
| `VITE_GEMINI_API_KEY` | no | **Local development only.** Client-side Gemini calls are an unsafe fallback; production should always go through the `gemini-explainer` edge function. Note: if a Gemini key was ever committed to a public repo, Google flags it as leaked and returns 403 `PERMISSION_DENIED` — generate a fresh key and keep it server-side only (`GEMINI_API_KEY` edge secret) |
| `VITE_GEMINI_MODEL` | no | Gemini model override (default handled in code) |
| `VITE_INTERNSHIPS_WEBHOOK_URL` | no | n8n webhook for the Internships page (defaults to a localhost dev webhook) |
| `VITE_INTERNSHIPS_WEBHOOK_SECRET` | no | Shared secret header for the internships webhook |

`.env*` files are git-ignored on purpose. Never commit real keys.

## Architecture

- **Frontend** — single-page React app. Routing in `src/App.tsx`; auth state in `src/context/AuthContext.tsx` (`ProtectedRoute` guards `/roadmap-generator`, `/experts`, `/aihelp`, `/premium`).
- **Supabase Auth** — email confirmation is enabled: `signUp` returns `needsEmailConfirmation: true` when there is a user but no session, and the login page shows a "check your inbox" state.
- **Database** — `roadmaps` (cached generated roadmaps, RLS-protected) and `profiles` (created automatically for each new user by the `handle_new_user` trigger). Apply migrations with `supabase db push` or the Dashboard SQL editor.
- **Edge Functions** (in `supabase/functions/`):
  - `generate-roadmap` — generates learning roadmaps via Gemini using the `GEMINI_API_KEY_1` secret; results are cached into the `roadmaps` table.
  - `gemini-explainer` — server-side proxy for the AI Explainer page using the `GEMINI_API_KEY` secret; keeps the Gemini prompt and API key off the client. The client falls back to a direct browser call only when the function is not deployed and a local `VITE_GEMINI_API_KEY` is present.

## Deploying Supabase changes

```bash
supabase link --project-ref <your-project-ref>   # requires an access token
supabase db push                                  # apply migrations (e.g. profiles table)
supabase secrets set GEMINI_API_KEY=...           # secret for gemini-explainer
supabase functions deploy generate-roadmap
supabase functions deploy gemini-explainer
```

Without `supabase link`, migrations and function deploys must be done through the Supabase Dashboard.

## Known external dependencies

- **n8n internships webhook** — the Internships page posts to `VITE_INTERNSHIPS_WEBHOOK_URL`; if it is not reachable, search/chat will surface a clear error.
- **Gemini API** — roadmap generation and the AI explainer require the corresponding API keys/secrets to be configured.
