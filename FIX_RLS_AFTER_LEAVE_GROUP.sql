-- Fix RLS policies to handle immediate inserts after leaving/joining groups
-- This ensures the policies work correctly even right after group membership changes

-- The issue: When a user leaves a group and a new group is created,
-- the RLS policy check might not immediately see the new membership.
-- This fix uses a function to check membership that's more reliable.

-- Create a helper function to check if user is member of a group
-- This uses SECURITY DEFINER to ensure it works correctly even in transactions
CREATE OR REPLACE FUNCTION is_user_in_group(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM sync_group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate stamps_progress policies using the helper function
DROP POLICY IF EXISTS "Users can view stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can insert stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can update stamps in their groups" ON stamps_progress;
DROP POLICY IF EXISTS "Users can delete stamps in their groups" ON stamps_progress;

CREATE POLICY "Users can view stamps in their groups"
  ON stamps_progress FOR SELECT
  USING (is_user_in_group(group_id));

CREATE POLICY "Users can insert stamps in their groups"
  ON stamps_progress FOR INSERT
  WITH CHECK (is_user_in_group(group_id));

CREATE POLICY "Users can update stamps in their groups"
  ON stamps_progress FOR UPDATE
  USING (is_user_in_group(group_id))
  WITH CHECK (is_user_in_group(group_id));

CREATE POLICY "Users can delete stamps in their groups"
  ON stamps_progress FOR DELETE
  USING (is_user_in_group(group_id));

-- Recreate coupon_achievements policies using the helper function
-- Drop all possible policy names
DROP POLICY IF EXISTS "Users can view coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can insert coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can update coupon achievements in their groups" ON coupon_achievements;
DROP POLICY IF EXISTS "Users can delete coupon achievements in their groups" ON coupon_achievements;

CREATE POLICY "Users can view coupon achievements in their groups"
  ON coupon_achievements FOR SELECT
  USING (is_user_in_group(group_id));

CREATE POLICY "Users can insert coupon achievements in their groups"
  ON coupon_achievements FOR INSERT
  WITH CHECK (is_user_in_group(group_id));

CREATE POLICY "Users can update coupon achievements in their groups"
  ON coupon_achievements FOR UPDATE
  USING (is_user_in_group(group_id))
  WITH CHECK (is_user_in_group(group_id));

CREATE POLICY "Users can delete coupon achievements in their groups"
  ON coupon_achievements FOR DELETE
  USING (is_user_in_group(group_id));



