-- Add stamp_order column to admin_settings for drag-reorder persistence
-- Run in Supabase SQL Editor if you use the admin_settings table

ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS stamp_order TEXT[] DEFAULT '{}';
