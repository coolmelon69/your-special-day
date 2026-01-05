-- Migration: Add checked_at column to stamps_progress table
-- This column records when a stamp was checked/completed by the user

-- Add the checked_at column (nullable timestamp)
ALTER TABLE stamps_progress 
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP WITH TIME ZONE NULL;

-- Add a comment to document the column
COMMENT ON COLUMN stamps_progress.checked_at IS 'Timestamp when the stamp was checked/completed by the user. NULL if not checked.';

-- Create an index for better query performance when filtering by checked_at
CREATE INDEX IF NOT EXISTS idx_stamps_progress_checked_at 
ON stamps_progress(checked_at) 
WHERE checked_at IS NOT NULL;

-- Update existing records: if is_past is true but checked_at is NULL, set checked_at to updated_at
-- This backfills the timestamp for stamps that were already checked
UPDATE stamps_progress 
SET checked_at = updated_at 
WHERE is_past = true AND checked_at IS NULL;
