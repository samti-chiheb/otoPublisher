# PRD — otoPublisher (Next.js + Supabase)

## 1) Summary
Build a full-stack web app (Next.js) backed by Supabase that lets a user import a JSON file containing scheduled social posts (image/video + caption + publish datetime + target platforms). The system queues those posts and automatically publishes them to TikTok and/or Instagram at the planned time.  
**No end-user authentication**: the app is single-tenant and protected only by an admin secret (simple access gate).

---

## 2) Goals
- Import a JSON “publication plan” and persist it in Supabase.
- Provide a UI to view, edit, enable/disable, and re-run posts.
- Automatically publish at the scheduled date/time to:
  - TikTok
  - Instagram
  - or both
- Track status, attempts, errors, and platform post IDs/URLs.

### Non-Goals (v1)
- Multi-user accounts / roles / teams.
- Analytics dashboards beyond basic status + logs.
- Content creation tools (editing videos/images).
- Full media library management (we store references + uploads only).

---

## 3) Key Constraint: “No Auth” but still needs platform credentials
Even without app user auth, TikTok/Instagram publishing requires API credentials + access tokens.
**Approach**:
- Single-tenant “admin secret” to access the UI.
- Platform tokens stored in Supabase (encrypted) or as environment secrets.
- A “Connect Platforms” page to paste tokens (or run OAuth once and store resulting tokens).

---

## 4) Target User
- Solo creator / small brand operator who plans content in batches and wants automatic posting.

---

## 5) User Stories
1. As a user, I upload a JSON file containing 50 scheduled posts and see them listed in the app.
2. As a user, I can edit caption, scheduled time, and platform targets before they go live.
3. As a user, I can upload the media (or link to a file name that matches storage) and validate it.
4. As a user, I can enable/disable a post so it won’t publish.
5. As a user, I can see publishing results, platform post IDs, and error logs.
6. As a user, I can re-try a failed publish.
7. As a user, I can test publish immediately (“Publish now”) for one item.

---

## 6) Functional Requirements

### 6.1 Admin Access (No Auth)
- App is accessible only if user provides `ADMIN_SECRET`.
- Implementation options:
  - Simple login screen that sets an `HttpOnly` cookie if secret matches env var.
  - Or require `?key=` token in URL (less secure; avoid if possible).

**Acceptance**: Without secret, app shows locked screen and blocks all actions + API calls.

---

### 6.2 JSON Import
- UI: “Import Plan” page with file picker + JSON preview + validation errors.
- After validation, user can “Import” (create/update).
- Duplicate handling:
  - If JSON has `external_id`, upsert by `external_id`.
  - Else create new rows.

**Validation rules**:
- Required fields: `media.type`, `media.filename` (or `media.url`), `caption`, `schedule_at`, `targets`.
- `schedule_at` must be valid ISO string OR `{date:"YYYY-MM-DD", time:"HH:mm"}`.
- `targets` must contain at least one of: `tiktok`, `instagram`.
- Media must be `image` or `video`.
- If `media.filename` used, file must exist in Supabase Storage (or show “missing” status).

---

### 6.3 Post Management UI
Main views:
1. **Dashboard**
   - KPIs: scheduled (future), due (ready), publishing, published, failed.
2. **Posts List**
   - Table: schedule time, caption snippet, targets, status, attempts, last error.
   - Filters: status, platform, date range.
3. **Post Details**
   - Full caption, media preview, schedule, targets
   - Actions: edit, disable/enable, publish now, retry, delete
   - Logs timeline
4. **Platform Settings**
   - TikTok credentials status
   - Instagram credentials status
   - “Test publish” / “Test token” buttons

---

### 6.4 Scheduling & Execution Engine
We need a reliable background scheduler.

**Option A (recommended for Supabase):**
- Use Supabase Postgres + `pg_cron` (if available) or Supabase Scheduled Functions.
- A scheduled job runs every minute:
  - Find posts where `status='scheduled' AND schedule_at <= now() AND enabled=true`
  - Mark them `publishing` with a lease/lock to avoid double publish
  - Enqueue per-target publish tasks (or publish inline)

**Option B:**
- Separate worker (Node) running on a server with cron (e.g. Fly.io/Render) reading Supabase.

**Idempotency**
- Ensure each platform publish is idempotent:
  - Use `posts_platform` table with unique constraint `(post_id, platform)`.
  - If already `published`, do nothing.
  - If `publishing` and lease not expired, skip.

**Retries**
- Configurable max attempts (default 3).
- Exponential backoff or next retry timestamp.
- Store raw error payload.

---

### 6.5 Publishing: TikTok
**High-level flow (API dependent)**
- Upload media (video) / create post container (if required).
- Publish at “now” (we schedule on our side).
- Save platform response: `platform_post_id`, optional `share_url`.

**Notes**
- TikTok typically has specific requirements (video format, size, duration, captions, privacy).
- v1 supports public posts only (configurable later).

---

### 6.6 Publishing: Instagram
Instagram publishing typically means:
- Reels / video via Instagram Graph API (business/creator account connected to a Facebook Page).
- Image posts via container + publish steps.

**High-level flow**
- Create media container (image/video + caption).
- Poll container status until ready.
- Publish container.
- Save `platform_post_id`, permalink if available.

---

### 6.7 Media Handling (Supabase Storage)
- Supabase Storage bucket: `media`
- Upload via UI or reference existing `filename`.
- Store `storage_path` and public (or signed) URL.
- For APIs that require publicly accessible media URLs:
  - Generate signed URL with sufficient TTL for publishing window (e.g. 2 hours).
  - Or keep bucket public (not recommended).

---

## 7) Data Model (Supabase)

### 7.1 Tables

#### `posts`
- `id` uuid pk
- `external_id` text unique nullable
- `caption` text
- `schedule_at` timestamptz
- `enabled` boolean default true
- `status` enum: `scheduled | publishing | published | failed | canceled`
- `media_type` enum: `image | video`
- `media_filename` text nullable
- `media_url` text nullable (derived signed/public)
- `storage_path` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `posts_platform`
- `id` uuid pk
- `post_id` uuid fk -> posts.id
- `platform` enum: `tiktok | instagram`
- `status` enum: `scheduled | publishing | published | failed | skipped`
- `attempts` int default 0
- `last_error` text nullable
- `platform_post_id` text nullable
- `platform_url` text nullable
- `published_at` timestamptz nullable
- unique `(post_id, platform)`

#### `publish_logs`
- `id` uuid pk
- `post_id` uuid fk
- `platform` enum nullable
- `level` enum: `info | warn | error`
- `message` text
- `payload` jsonb nullable
- `created_at` timestamptz

#### `platform_secrets`
- `id` uuid pk (single row)
- `tiktok_access_token` text (encrypted at rest if possible)
- `tiktok_refresh_token` text
- `tiktok_expires_at` timestamptz
- `instagram_access_token` text
- `instagram_refresh_token` text
- `instagram_expires_at` timestamptz
- `meta` jsonb

> If encryption isn’t available easily, store tokens in env vars and only store account IDs in DB.

---

## 8 JSON Plan Format

### 8.1 Example 
json {
  "plan_name": "Feb content batch",
  "timezone": "Europe/Paris",
  "publications": [
    {
      "external_id": "post-001",
      "media": { "type": "video", "filename": "reel_001.mp4" },
      "caption": "New drop. Link in bio. #paris #food",
      "schedule_at": "2026-02-10T19:30:00+01:00",
      "targets": ["instagram", "tiktok"]
    },
    {
      "external_id": "post-002",
      "media": { "type": "image", "filename": "img_002.jpg" },
      "caption": "Behind the scenes ✨",
      "schedule_at": "2026-02-11T12:00:00+01:00",
      "targets": ["instagram"]
    }
  ]
}

8.2 Schema (rules)

timezone optional (default Europe/Paris). If provided and schedule_at has no offset, interpret in this timezone.

Each publication must have:

media.type in image|video

one of media.filename or media.url

caption string (can be empty if platform allows)

schedule_at string OR {date,time}

targets array with instagram and/or tiktok

9 System Architecture
9.1 Frontend (Next.js App Router)

Pages:

/ Dashboard

/import Import JSON

/posts List

/posts/[id] Details

/settings/platforms Tokens + test

/login Admin secret gate

UI library: shadcn/ui (optional)

9.2 Backend (Next.js API Routes)

/api/auth/login (admin secret -> cookie)

/api/posts/import (validate + upsert)

/api/posts CRUD

/api/publish/run (manual trigger)

/api/platforms/test (validate tokens)

/api/webhooks/* (optional later)

9.3 Worker / Scheduler

Scheduled function runs every minute:

Query due posts

Lock

Publish per platform

Update status + logs

10) Security & Access

Admin secret required for all UI + API access.

Use HttpOnly cookie session with short TTL (e.g. 24h).

Rate limit API endpoints (basic).

Never expose platform tokens to client.

Signed URLs for media should be generated server-side only.

11) Observability

Every publish attempt writes publish_logs.

Store structured error payloads (jsonb).

Provide “Download logs” (CSV/JSON) from UI.

12) Edge Cases

Post scheduled in the past -> treated as “due now”.

Missing media file -> mark as failed with reason “media_missing”.

Token expired -> attempt refresh; if fails, mark platform publish failed.

Partial success (Instagram published but TikTok failed) -> overall posts.status becomes:

published if all selected platforms published

else failed with per-platform status visible

Duplicate runs -> prevented by locks and unique constraints.

13) MVP Acceptance Criteria

User can import JSON and see posts created in DB.

User can upload media to Supabase Storage and attach to posts.

Scheduler runs every minute and publishes due posts automatically.

Supports:

Instagram image publish

Instagram video/reel publish

TikTok video publish

UI shows accurate status, attempts, errors, and platform IDs.

Retry works for failed items.

14) Milestones

Project setup

Next.js + Supabase client + DB schema + storage bucket

Admin gate

Secret login + API protection middleware

Import

JSON validation + upsert + UI preview/errors

Posts UI

List/details/edit/enable/disable

Scheduler

Scheduled job + locking + status transitions

Instagram publisher

Container + publish + logging

TikTok publisher

Upload + publish + logging

Retries + polish

Backoff, logs UI, test token buttons

15) Status Machine
Post (overall)

scheduled → publishing → published

scheduled → publishing → failed

scheduled → canceled (disabled permanently)

Platform publish

scheduled → publishing → published

scheduled → publishing → failed

scheduled → skipped (if target removed before publish)

16) Implementation Notes for Codex

Use TypeScript everywhere.

Use Supabase server client in API routes (service role key server-side only).

Add DB constraints + indexes:

index on posts(schedule_at, status, enabled)

unique on posts.external_id

unique on posts_platform(post_id, platform)

Implement a publisher module with:

publishToInstagram(post)

publishToTikTok(post)

token refresh utilities

Implement a scheduler entry that can run as:

Supabase scheduled function OR

server cron hitting /api/publish/run?secret=...

17) Open Questions (document but proceed with assumptions)

Which Instagram publishing mode is required (Feed image, Carousel, Reels)? v1: single media only.

TikTok: video only in v1 (most common).

Do we require hashtags auto-formatting? v1: caption as-is.

Do we need “draft” mode? v1: not required.
