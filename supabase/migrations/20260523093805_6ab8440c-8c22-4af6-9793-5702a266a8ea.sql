ALTER TABLE public.paths
  ADD COLUMN IF NOT EXISTS image_day text,
  ADD COLUMN IF NOT EXISTS image_night text,
  ADD COLUMN IF NOT EXISTS around_view_url text;