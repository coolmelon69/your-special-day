-- Create custom_coupons table for syncing custom coupons across devices
-- This table stores user-created coupons that sync via Supabase

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS custom_coupons CASCADE;

-- Create custom_coupons table
CREATE TABLE custom_coupons (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  required_stamps INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Create index on user_id for faster queries
CREATE INDEX idx_custom_coupons_user_id ON custom_coupons(user_id);

-- Create index on created_at for ordering
CREATE INDEX idx_custom_coupons_created_at ON custom_coupons(created_at);

-- Enable Row Level Security
ALTER TABLE custom_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own custom coupons
CREATE POLICY "Users can view their own custom coupons"
  ON custom_coupons
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own custom coupons
CREATE POLICY "Users can insert their own custom coupons"
  ON custom_coupons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own custom coupons
CREATE POLICY "Users can update their own custom coupons"
  ON custom_coupons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own custom coupons
CREATE POLICY "Users can delete their own custom coupons"
  ON custom_coupons
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_custom_coupons_updated_at
  BEFORE UPDATE ON custom_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_coupons_updated_at();

-- Add comment to table
COMMENT ON TABLE custom_coupons IS 'Stores user-created custom coupons that sync across devices via Supabase';




