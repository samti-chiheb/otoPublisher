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
- TikTok/Instagram publishing flows are implemented with pull-from-URL and upload fallback. Provide real tokens + user IDs in Platform Settings.
- Scheduler: call `POST /api/publish/run?secret=$ADMIN_SECRET` from Vercel cron or Supabase Scheduler. The run records heartbeat + next ETA in `platform_secrets.meta`.
- Token refresh: set `META_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, and `TIKTOK_CLIENT_SECRET` to enable automatic refresh when tokens near expiry. Long-lived IG tokens are refreshed via Meta; TikTok via OAuth refresh_token.
