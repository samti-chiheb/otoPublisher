# TODO — otoPublisher

## Current Objective
Ship a multi-user Next.js + Supabase otoPublisher where operators can authenticate, manage profiles, import JSON plans, and reliably publish to TikTok/Instagram.

## Execution Plan (checklist)
- [ ] Supabase auth & profiles
  - [x] Protect app/API via Supabase middleware (drop admin cookie gate)
  - [x] Login/signup flow, user menu, and profile auto-provision
  - [x] Enforce `admin` role for platform tokens/publish actions; seed first admin
  - [ ] Add password reset / magic-link option and better loading states
- [ ] Dashboard & UX polish
  - [x] Profile management page (name, avatar, role)
  - [ ] Surface current user info + sign-out CTA on dashboard hero
  - [ ] Toasts and graceful fallbacks when API JSON parsing fails
- [ ] Platform publishers
  - [ ] Wire Instagram Graph publishing (container -> status poll -> publish -> permalink)
  - [ ] Wire TikTok upload + publish + share URL capture with retries/backoff
  - [ ] Token refresh + expiry warnings surfaced in UI
- [ ] Media handling
  - [ ] Use Supabase storage signed URLs when `media_url` is missing
  - [ ] Validate media exists before publish; mark missing media as failed
- [ ] Scheduler robustness
  - [ ] Add lease/backoff fields and prevent double-runs
  - [ ] Expose last/next run on dashboard and hook to cron/secret endpoint
- [ ] Observability & logs
  - [ ] Downloadable logs (CSV/JSON) from dashboard
  - [ ] Richer publish error messages and grouping
- [ ] Testing
  - [x] Vitest baseline for schema/auth/publishers
  - [ ] Integration tests for Supabase-auth protected routes + profiles

## Done
- [x] Tailwind + shadcn UI scaffold and route skeletons
- [x] Supabase schema + CRUD/import APIs
- [x] Dashboard live stats/upcoming/logs/health
- [x] Manual publish/retry/disable endpoints and UI hooks
