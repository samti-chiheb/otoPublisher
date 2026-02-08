# Repository Guidelines

## Project Structure & Module Organization
- Next.js (App Router) + TypeScript. Routes live in `src/app/` (e.g., `src/app/dashboard` → `/dashboard`), shared logic in `src/lib/`, UI primitives in `src/components/ui/`, and global components (e.g., `user-menu`) in `src/components/`.
- Supabase schema sits in `supabase/schema.sql`; update it before altering API logic. Public assets go in `public/`.

## Build, Test, and Development Commands
- `npm run dev` — start the local dev server.
- `npm run build` — production build; fails on type/lint errors.
- `npm run start` — serve the built app.
- `npm run lint` — ESLint via `eslint.config.mjs`.
- `npm test` — Vitest suite (API/auth/publisher unit tests).

## Coding Style & Naming Conventions
- Use TypeScript everywhere; prefer `async/await` over `.then`.
- Styling: Tailwind + shadcn/ui. Extend primitives under `src/components/ui/`; avoid inline styles.
- Indentation is 2 spaces. `PascalCase` for components, `camelCase` for variables/functions, kebab-case for route folders.
- Keep React components small and data-fetching in API routes or hooks; avoid duplicating fetch logic across pages.

## Testing Guidelines
- Tests live in `tests/`; mirror source structure when adding new suites.
- Use Vitest and the existing path alias (`@/`) for imports.
- Prefer unit tests for pure helpers and mocked-integration tests for publishers/auth. Name tests with intent (`publishes_due_posts`, `rejects_missing_tokens`).

## Auth, Secrets & Configuration
- Supabase auth is required for app/API access (middleware enforced). Environment: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side auth.
- Legacy `ADMIN_SECRET` remains only for cron-style `/api/publish/run?secret=...`; do not rely on the old admin cookie gate.
- Never commit real tokens. Store values in `.env.local`; keep `.env.example` updated when adding new vars.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and scoped (`Add Supabase middleware`, `Fix dashboard parse error`).
- PRs should state the problem, the change, and how it was verified. Include screenshots/GIFs for UI work and note any new env vars or migrations.
