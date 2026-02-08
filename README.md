# otoPublisher

Social auto-publisher built with Next.js, Supabase, Tailwind, and shadcn/ui.

## What is scaffolded
- Admin secret gate (`/login`) with HttpOnly cookie session.
- Core pages: dashboard, import plan, posts list/detail, platform settings.
- API routes for auth, import, posts CRUD, publish run, and platform token checks.
- Supabase SQL schema in `supabase/schema.sql`.

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
3. Apply `supabase/schema.sql` in Supabase SQL editor.
4. Start dev server:
   ```bash
   npm run dev
   ```

## Key commands
- `npm run dev` - run local dev server.
- `npm run lint` - run ESLint.
- `npm run build` - production build.

## API routes
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/posts`
- `GET|PATCH|DELETE /api/posts/:id`
- `POST /api/posts/import`
- `POST /api/publish/run`
- `GET|POST /api/platforms`
- `POST /api/platforms/test`

## Notes
- Publisher integrations are currently mocked in `src/lib/publishers/index.ts`.
- Replace mocks with real TikTok/Instagram API flows next.
