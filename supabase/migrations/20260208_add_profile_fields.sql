-- Add business and alert fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS notify_on_fail boolean DEFAULT true;

-- Backfill timezone for existing rows
UPDATE public.profiles
SET timezone = COALESCE(timezone, 'UTC');
