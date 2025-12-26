-- Migration: Remove Group-Based Sync and Switch to User-Based Authentication
-- Run this in Supabase SQL Editor to migrate from device linking codes to email/password auth

-- Step 1: Drop RPC functions related to group sync
DROP FUNCTION IF EXISTS create_sync_invite() CASCADE;
DROP FUNCTION IF EXISTS join_sync_invite(p_code TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_or_create_user_group() CASCADE;
DROP FUNCTION IF EXISTS get_current_invite() CASCADE;
DROP FUNCTION IF EXISTS leave_current_group() CASCADE;
DROP FUNCTION IF EXISTS generate_link_code() CASCADE;
DROP FUNCTION IF EXISTS is_user_in_group(p_group_id UUID) CASCADE;

-- Step 2: Update stamps_progress table
-- First, delete any rows with null user_id (orphaned/anonymous data)
DELETE FROM stamps_progress WHERE user_id IS NULL;

-- Remove group_id column and make user_id NOT NULL again
ALTER TABLE stamps_progress DROP COLUMN IF EXISTS group_id CASCADE;
ALTER TABLE stamps_progress ALTER COLUMN user_id SET NOT NULL;

-- Drop old constraint if it exists
ALTER TABLE stamps_progress DROP CONSTRAINT IF EXISTS stamps_progress_group_id_stamp_key_key;
-- Add constraint back with user_id
ALTER TABLE stamps_progress DROP CONSTRAINT IF EXISTS stamps_progress_user_id_stamp_key_key;
ALTER TABLE stamps_progress ADD CONSTRAINT stamps_progress_user_id_stamp_key_key UNIQUE (user_id, stamp_key);

-- Step 3: Update coupon_achievements table
-- First, delete any rows with null user_id (orphaned/anonymous data)
DELETE FROM coupon_achievements WHERE user_id IS NULL;

-- Remove group_id column and make user_id NOT NULL again
ALTER TABLE coupon_achievements DROP COLUMN IF EXISTS group_id CASCADE;
ALTER TABLE coupon_achievements ALTER COLUMN user_id SET NOT NULL;

-- Drop old constraint if it exists
ALTER TABLE coupon_achievements DROP CONSTRAINT IF EXISTS coupon_achievements_group_id_key;
-- Add constraint back with user_id
ALTER TABLE coupon_achievements DROP CONSTRAINT IF EXISTS coupon_achievements_user_id_key;
ALTER TABLE coupon_achievements ADD CONSTRAINT coupon_achievements_user_id_key UNIQUE (user_id);

-- Step 4: Update custom_stamps table
-- Remove group_id column first
ALTER TABLE custom_stamps DROP COLUMN IF EXISTS group_id CASCADE;

-- Check if user_id column exists, if not add it, otherwise clean up nulls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_stamps' AND column_name = 'user_id'
  ) THEN
    -- Column doesn't exist, add it (will be empty table or we need to handle existing data)
    -- Since custom_stamps was group-based, we'll delete all existing rows as they can't be migrated
    -- without knowing which user they belong to
    DELETE FROM custom_stamps;
    ALTER TABLE custom_stamps ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
  ELSE
    -- Column exists, delete nulls first, then make it NOT NULL
    DELETE FROM custom_stamps WHERE user_id IS NULL;
    ALTER TABLE custom_stamps ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Drop old constraint if it exists
ALTER TABLE custom_stamps DROP CONSTRAINT IF EXISTS custom_stamps_group_id_id_key;
-- Add constraint with user_id
ALTER TABLE custom_stamps DROP CONSTRAINT IF EXISTS custom_stamps_user_id_id_key;
ALTER TABLE custom_stamps ADD CONSTRAINT custom_stamps_user_id_id_key UNIQUE (user_id, id);

-- Step 5: Update indexes
-- Drop group_id indexes
DROP INDEX IF EXISTS idx_stamps_progress_group_id;
DROP INDEX IF EXISTS idx_coupon_achievements_group_id;
DROP INDEX IF EXISTS idx_custom_stamps_group_id;

-- Ensure user_id indexes exist
CREATE INDEX IF NOT EXISTS idx_stamps_progress_user_id ON stamps_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_achievements_user_id ON coupon_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_stamps_user_id ON custom_stamps(user_id);

-- Step 6: Update RLS policies for stamps_progress
DROP POLICY IF EXISTS "Users can view stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can insert stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can update stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can delete stamps in their groups" ON stamps_progress;

CREATE POLICY "Users can view their own stamps"
  ON stamps_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stamps"
  ON stamps_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stamps"
  ON stamps_progress FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own stamps"
  ON stamps_progress FOR DELETE
  USING (user_id = auth.uid());

-- Step 7: Update RLS policies for coupon_achievements
DROP POLICY IF EXISTS "Users can view coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can insert coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can update coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can delete coupon achievements in their groups" ON coupon_achievements;

CREATE POLICY "Users can view their own coupon achievements"
  ON coupon_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own coupon achievements"
  ON coupon_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own coupon achievements"
  ON coupon_achievements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own coupon achievements"
  ON coupon_achievements FOR DELETE
  USING (user_id = auth.uid());

-- Step 8: Update RLS policies for custom_stamps
DROP POLICY IF EXISTS "Users can view custom stamps in their groups" ON custom_stamps;
DROP POLICY IF EXISTS "Users can insert custom stamps in their groups" ON custom_stamps;
DROP POLICY IF EXISTS "Users can update custom stamps in their groups" ON custom_stamps;
DROP POLICY IF EXISTS "Users can delete custom stamps in their groups" ON custom_stamps;

CREATE POLICY "Users can view their own custom stamps"
  ON custom_stamps FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own custom stamps"
  ON custom_stamps FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own custom stamps"
  ON custom_stamps FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own custom stamps"
  ON custom_stamps FOR DELETE
  USING (user_id = auth.uid());

-- Step 9: Drop group-related tables (do this last to avoid cascade issues)
-- Note: This will delete all group data. Make sure you want to do this!
DROP TABLE IF EXISTS sync_group_invites CASCADE;
DROP TABLE IF EXISTS sync_group_members CASCADE;
DROP TABLE IF EXISTS sync_groups CASCADE;

-- Step 10: Clean up any remaining group-related indexes
DROP INDEX IF EXISTS idx_sync_group_members_user_id;
DROP INDEX IF EXISTS idx_sync_group_members_group_id;
DROP INDEX IF EXISTS idx_sync_group_invites_expires_at;

-- Migration complete!
-- All data is now user-based instead of group-based.
-- Users must authenticate with email/password to sync data.




