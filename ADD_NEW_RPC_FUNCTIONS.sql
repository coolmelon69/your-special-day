-- Add new RPC functions for current invite and leave group
-- Run this in your Supabase SQL Editor if you're getting errors about missing get_current_invite or leave_current_group

-- Function to get current active invite code for user's group
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

-- Function to leave current group and create a new private group
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



