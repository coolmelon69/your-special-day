-- Create global admin settings table
-- This table stores settings that apply to ALL visitors (not per-user)
-- Used for hiding/showing default stamps and coupons globally

CREATE TABLE IF NOT EXISTS global_admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  disabled_default_stamps TEXT[] DEFAULT '{}',
  disabled_default_coupons INTEGER[] DEFAULT '{}',
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE global_admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read global settings (public access)
CREATE POLICY "Anyone can read global settings" 
ON global_admin_settings 
FOR SELECT 
TO public 
USING (true);

-- Policy: Only authenticated users can update (admin will be authenticated)
CREATE POLICY "Authenticated can update global settings" 
ON global_admin_settings 
FOR ALL 
TO authenticated 
USING (true);

-- Insert initial row with default values
INSERT INTO global_admin_settings (id) 
VALUES ('global') 
ON CONFLICT (id) DO NOTHING;

-- Create index for faster lookups (though with single row, not strictly necessary)
CREATE INDEX IF NOT EXISTS idx_global_admin_settings_id ON global_admin_settings(id);

