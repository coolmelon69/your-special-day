-- Quick Fix: Make user_id nullable to fix the sync error
-- Run this if you're getting "null value in column user_id violates not-null constraint" errors

-- Make user_id nullable in stamps_progress
ALTER TABLE stamps_progress ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in coupon_achievements  
ALTER TABLE coupon_achievements ALTER COLUMN user_id DROP NOT NULL;



