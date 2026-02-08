-- otoPublisher base schema (PRD v1)

create extension if not exists "pgcrypto";

create type post_status as enum (
  'scheduled',
  'publishing',
  'published',
  'failed',
  'canceled'
);

create type platform_name as enum ('tiktok', 'instagram');

create type platform_status as enum (
  'scheduled',
  'publishing',
  'published',
  'failed',
  'skipped'
);

create type log_level as enum ('info', 'warn', 'error');

create type media_type as enum ('image', 'video');

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  caption text not null,
  schedule_at timestamptz not null,
  enabled boolean not null default true,
  status post_status not null default 'scheduled',
  media_type media_type not null,
  media_filename text,
  media_url text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_media_source_check check (
    media_filename is not null or media_url is not null
  )
);

create table if not exists posts_platform (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  platform platform_name not null,
  status platform_status not null default 'scheduled',
  attempts integer not null default 0,
  last_error text,
  platform_post_id text,
  platform_url text,
  published_at timestamptz,
  next_retry_at timestamptz,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, platform)
);

create table if not exists publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  platform platform_name,
  level log_level not null,
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists platform_secrets (
  id uuid primary key default gen_random_uuid(),
  tiktok_access_token text,
  tiktok_refresh_token text,
  tiktok_expires_at timestamptz,
  instagram_access_token text,
  instagram_refresh_token text,
  instagram_expires_at timestamptz,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (auth-backed)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  business_name text,
  timezone text default 'UTC',
  notify_on_fail boolean default true,
  role text default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_schedule_status_enabled_idx
  on posts (schedule_at, status, enabled);

create index if not exists posts_status_idx on posts (status);
create index if not exists publish_logs_post_id_idx on publish_logs (post_id, created_at desc);
create index if not exists posts_platform_retry_idx on posts_platform (status, next_retry_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_posts_updated_at on posts;
create trigger set_posts_updated_at
before update on posts
for each row
execute procedure set_updated_at();

drop trigger if exists set_posts_platform_updated_at on posts_platform;
create trigger set_posts_platform_updated_at
before update on posts_platform
for each row
execute procedure set_updated_at();

drop trigger if exists set_platform_secrets_updated_at on platform_secrets;
create trigger set_platform_secrets_updated_at
before update on platform_secrets
for each row
execute procedure set_updated_at();
