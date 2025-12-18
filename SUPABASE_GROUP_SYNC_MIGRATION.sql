-- Migration: Add Device Link Code Sync Groups
-- Run this in Supabase SQL Editor after the initial setup

-- Step 1: Create sync_groups table
CREATE TABLE IF NOT EXISTS sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create sync_group_members table
CREATE TABLE IF NOT EXISTS sync_group_members (
  group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Step 3: Create sync_group_invites table
CREATE TABLE IF NOT EXISTS sync_group_invites (
  code TEXT PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Add group_id to existing tables
-- First, add the column (allowing NULL temporarily for migration)
ALTER TABLE stamps_progress ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES sync_groups(id) ON DELETE CASCADE;
ALTER TABLE coupon_achievements ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES sync_groups(id) ON DELETE CASCADE;

-- Step 5: Migrate existing data to a default group (optional - only if you have existing data)
-- This creates a group for each existing user_id
-- Comment out if you want a fresh start
-- DO NOT RUN THIS IF YOU HAVE EXISTING DATA YOU WANT TO KEEP
-- Uncomment and run separately if needed:
/*
DO $$
DECLARE
  user_record RECORD;
  new_group_id UUID;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM stamps_progress WHERE group_id IS NULL
  LOOP
    INSERT INTO sync_groups DEFAULT VALUES RETURNING id INTO new_group_id;
    INSERT INTO sync_group_members (group_id, user_id) VALUES (new_group_id, user_record.user_id);
    UPDATE stamps_progress SET group_id = new_group_id WHERE user_id = user_record.user_id;
    UPDATE coupon_achievements SET group_id = new_group_id WHERE user_id = user_record.user_id;
  END LOOP;
END $$;
*/

-- Step 6: Make user_id nullable (since we're now using group_id instead)
ALTER TABLE stamps_progress ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE coupon_achievements ALTER COLUMN user_id DROP NOT NULL;

-- Step 7: Make group_id NOT NULL (only after migration is complete)
-- Uncomment these lines after running the migration script above if you want to enforce group_id
-- ALTER TABLE stamps_progress ALTER COLUMN group_id SET NOT NULL;
-- ALTER TABLE coupon_achievements ALTER COLUMN group_id SET NOT NULL;

-- Step 8: Update unique constraints
-- Drop old constraints if they exist
ALTER TABLE stamps_progress DROP CONSTRAINT IF EXISTS stamps_progress_user_id_stamp_key_key;
ALTER TABLE coupon_achievements DROP CONSTRAINT IF EXISTS coupon_achievements_user_id_key;

-- Add new constraints with group_id
ALTER TABLE stamps_progress ADD CONSTRAINT stamps_progress_group_id_stamp_key_key UNIQUE (group_id, stamp_key);
ALTER TABLE coupon_achievements ADD CONSTRAINT coupon_achievements_group_id_key UNIQUE (group_id);

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_stamps_progress_group_id ON stamps_progress(group_id);
CREATE INDEX IF NOT EXISTS idx_coupon_achievements_group_id ON coupon_achievements(group_id);
CREATE INDEX IF NOT EXISTS idx_sync_group_members_user_id ON sync_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_group_members_group_id ON sync_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_sync_group_invites_expires_at ON sync_group_invites(expires_at);

-- Step 10: Enable RLS on new tables
ALTER TABLE sync_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_group_invites ENABLE ROW LEVEL SECURITY;

-- Step 11: RLS Policies for sync_groups (read only if member)
CREATE POLICY "Users can view groups they belong to"
  ON sync_groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

-- Step 12: RLS Policies for sync_group_members
CREATE POLICY "Users can view their own memberships"
  ON sync_group_members FOR SELECT
  USING (user_id = auth.uid());

-- Step 13: RLS Policies for sync_group_invites (no direct client access)
-- Clients will join via RPC function only
CREATE POLICY "No direct access to invites"
  ON sync_group_invites FOR SELECT
  USING (false);

-- Step 14: Update RLS policies for stamps_progress (use group_id instead of user_id)
DROP POLICY IF EXISTS "Users can view their own stamps" ON stamps_progress;
DROP POLICY IF EXISTS "Users can insert their own stamps" ON stamps_progress;
DROP POLICY IF EXISTS "Users can update their own stamps" ON stamps_progress;
DROP POLICY IF EXISTS "Users can delete their own stamps" ON stamps_progress;

CREATE POLICY "Users can view stamps in their groups"
  ON stamps_progress FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stamps in their groups"
  ON stamps_progress FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stamps in their groups"
  ON stamps_progress FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stamps in their groups"
  ON stamps_progress FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

-- Step 15: Update RLS policies for coupon_achievements (use group_id instead of user_id)
DROP POLICY IF EXISTS "Users can view their own coupon achievements" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can insert their own coupon achievements" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can update their own coupon achievements" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can delete their own coupon achievements" ON coupon_achievements;

CREATE POLICY "Users can view coupon achievements in their groups"
  ON coupon_achievements FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert coupon achievements in their groups"
  ON coupon_achievements FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update coupon achievements in their groups"
  ON coupon_achievements FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete coupon achievements in their groups"
  ON coupon_achievements FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );

-- Step 16: Create RPC function to generate a random 6-character code
CREATE OR REPLACE FUNCTION generate_link_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes ambiguous chars (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 17: Create RPC function to create a sync invite
CREATE OR REPLACE FUNCTION create_sync_invite()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  user_group_id UUID;
  new_code TEXT;
  expires_at TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Find or create a group for this user
  SELECT group_id INTO user_group_id
  FROM sync_group_members
  WHERE user_id = current_user_id
  LIMIT 1;

  -- If user doesn't have a group, create one
  IF user_group_id IS NULL THEN
    INSERT INTO sync_groups DEFAULT VALUES RETURNING id INTO user_group_id;
    INSERT INTO sync_group_members (group_id, user_id) VALUES (user_group_id, current_user_id);
  END IF;

  -- Generate a unique code
  LOOP
    new_code := generate_link_code();
    BEGIN
      expires_at := now() + interval '10 minutes';
      INSERT INTO sync_group_invites (code, group_id, expires_at, created_by)
      VALUES (new_code, user_group_id, expires_at, current_user_id);
      EXIT; -- Success, exit loop
    EXCEPTION
      WHEN unique_violation THEN
        -- Code already exists, try again
        CONTINUE;
    END;
  END LOOP;

  -- Return result
  result := json_build_object(
    'group_id', user_group_id,
    'code', new_code,
    'expires_at', expires_at
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 18: Create RPC function to join a sync invite
CREATE OR REPLACE FUNCTION join_sync_invite(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  invite_record RECORD;
  target_group_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Find valid invite
  SELECT group_id, expires_at INTO invite_record
  FROM sync_group_invites
  WHERE code = p_code AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  target_group_id := invite_record.group_id;

  -- Add user to group (ignore if already a member)
  INSERT INTO sync_group_members (group_id, user_id)
  VALUES (target_group_id, current_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Return the group_id
  RETURN target_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 19: Create RPC function to get or create user's group (for auto-creation)
CREATE OR REPLACE FUNCTION get_or_create_user_group()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  user_group_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Try to find existing group
  SELECT group_id INTO user_group_id
  FROM sync_group_members
  WHERE user_id = current_user_id
  LIMIT 1;

  -- If no group exists, create one
  IF user_group_id IS NULL THEN
    INSERT INTO sync_groups DEFAULT VALUES RETURNING id INTO user_group_id;
    INSERT INTO sync_group_members (group_id, user_id) VALUES (user_group_id, current_user_id);
  END IF;

  RETURN user_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 20: Create RPC function to get current active invite code for user's group
CREATE OR REPLACE FUNCTION get_current_invite()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  user_group_id UUID;
  invite_record RECORD;
  result JSON;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get user's group
  SELECT group_id INTO user_group_id
  FROM sync_group_members
  WHERE user_id = current_user_id
  LIMIT 1;

  IF user_group_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find active (not expired) invite for this group
  SELECT code, expires_at INTO invite_record
  FROM sync_group_invites
  WHERE group_id = user_group_id
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  result := json_build_object(
    'code', invite_record.code,
    'expires_at', invite_record.expires_at
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 21: Create RPC function to leave current group
CREATE OR REPLACE FUNCTION leave_current_group()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  user_group_id UUID;
  new_group_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get user's current group
  SELECT group_id INTO user_group_id
  FROM sync_group_members
  WHERE user_id = current_user_id
  LIMIT 1;

  IF user_group_id IS NULL THEN
    -- User is not in a group, create a new one
    INSERT INTO sync_groups DEFAULT VALUES RETURNING id INTO new_group_id;
    INSERT INTO sync_group_members (group_id, user_id) VALUES (new_group_id, current_user_id);
    RETURN new_group_id;
  END IF;

  -- Remove user from current group
  DELETE FROM sync_group_members
  WHERE user_id = current_user_id AND group_id = user_group_id;

  -- Create a new private group for the user
  INSERT INTO sync_groups DEFAULT VALUES RETURNING id INTO new_group_id;
  INSERT INTO sync_group_members (group_id, user_id) VALUES (new_group_id, current_user_id);

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
