-- Migration to add custom_stamps table and sync support
-- Run this in your Supabase SQL Editor

-- Step 1: Create custom_stamps table
CREATE TABLE IF NOT EXISTS custom_stamps (
  id TEXT PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sprite TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_past BOOLEAN DEFAULT false,
  location JSONB, -- {latitude: number, longitude: number, radius: number}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, id)
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_stamps_group_id ON custom_stamps(group_id);

-- Step 3: Enable RLS
ALTER TABLE custom_stamps ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies using the helper function (if it exists) or direct check
-- First try with helper function, fallback to direct check
DO $$
BEGIN
  -- Check if is_user_in_group function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_in_group') THEN
    -- Use helper function
    DROP POLICY IF EXISTS "Users can view custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can insert custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can update custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can delete custom stamps in their groups" ON custom_stamps;

    CREATE POLICY "Users can view custom stamps in their groups"
      ON custom_stamps FOR SELECT
      USING (is_user_in_group(group_id));

    CREATE POLICY "Users can insert custom stamps in their groups"
      ON custom_stamps FOR INSERT
      WITH CHECK (is_user_in_group(group_id));

    CREATE POLICY "Users can update custom stamps in their groups"
      ON custom_stamps FOR UPDATE
      USING (is_user_in_group(group_id))
      WITH CHECK (is_user_in_group(group_id));

    CREATE POLICY "Users can delete custom stamps in their groups"
      ON custom_stamps FOR DELETE
      USING (is_user_in_group(group_id));
  ELSE
    -- Fallback to direct check
    DROP POLICY IF EXISTS "Users can view custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can insert custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can update custom stamps in their groups" ON custom_stamps;
    DROP POLICY IF EXISTS "Users can delete custom stamps in their groups" ON custom_stamps;

    CREATE POLICY "Users can view custom stamps in their groups"
      ON custom_stamps FOR SELECT
      USING (
        group_id IN (
          SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can insert custom stamps in their groups"
      ON custom_stamps FOR INSERT
      WITH CHECK (
        group_id IN (
          SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can update custom stamps in their groups"
      ON custom_stamps FOR UPDATE
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

    CREATE POLICY "Users can delete custom stamps in their groups"
      ON custom_stamps FOR DELETE
      USING (
        group_id IN (
          SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;




