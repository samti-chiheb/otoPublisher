-- Add username column for profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Backfill existing rows with a simple handle
UPDATE public.profiles
SET username = COALESCE(
    username,
    'user_' || LEFT(id::text, 8)
);
