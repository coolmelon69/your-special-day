-- Migration: Create checkpoint_photos table for cross-device Memory Book photo sync
-- Stores photo metadata per user (image file lives in Supabase Storage).

-- 1) Table
CREATE TABLE IF NOT EXISTS public.checkpoint_photos (
  user_id uuid NOT NULL,
  photo_id text NOT NULL,
  checkpoint_id text NOT NULL,
  storage_url text NOT NULL,
  caption text NULL,
  filter text NULL,
  frame text NULL,
  stickers jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkpoint_photos_pkey PRIMARY KEY (user_id, photo_id)
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_checkpoint_photos_user_created_at
  ON public.checkpoint_photos (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkpoint_photos_user_checkpoint
  ON public.checkpoint_photos (user_id, checkpoint_id);

-- 3) Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_checkpoint_photos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checkpoint_photos_set_updated_at ON public.checkpoint_photos;
CREATE TRIGGER trg_checkpoint_photos_set_updated_at
BEFORE UPDATE ON public.checkpoint_photos
FOR EACH ROW
EXECUTE FUNCTION public.set_checkpoint_photos_updated_at();

-- 4) Row Level Security (RLS)
ALTER TABLE public.checkpoint_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkpoint_photos_select_own" ON public.checkpoint_photos;
CREATE POLICY "checkpoint_photos_select_own"
  ON public.checkpoint_photos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "checkpoint_photos_insert_own" ON public.checkpoint_photos;
CREATE POLICY "checkpoint_photos_insert_own"
  ON public.checkpoint_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkpoint_photos_update_own" ON public.checkpoint_photos;
CREATE POLICY "checkpoint_photos_update_own"
  ON public.checkpoint_photos
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checkpoint_photos_delete_own" ON public.checkpoint_photos;
CREATE POLICY "checkpoint_photos_delete_own"
  ON public.checkpoint_photos
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

