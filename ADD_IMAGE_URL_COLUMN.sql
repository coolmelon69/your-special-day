-- Migration: Add image_url column to stamps_progress table
-- This column stores the URL/path to the evidence photo uploaded for each stamp

-- Add the image_url column (nullable text)
ALTER TABLE stamps_progress 
ADD COLUMN IF NOT EXISTS image_url TEXT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN stamps_progress.image_url IS 'URL/path to the evidence photo uploaded for this stamp. Stored in Supabase Storage.';

-- Create an index for better query performance when filtering by image_url
CREATE INDEX IF NOT EXISTS idx_stamps_progress_image_url 
ON stamps_progress(image_url) 
WHERE image_url IS NOT NULL;
