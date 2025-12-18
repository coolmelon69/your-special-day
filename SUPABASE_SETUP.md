# Supabase Database Setup Guide

This guide will help you set up the Supabase database tables and Row Level Security (RLS) policies for syncing stamps and coupons across devices.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created
3. Your Supabase project URL and anon key (found in Settings > API)

## Step 1: Run SQL Migration

Go to your Supabase project dashboard and navigate to **SQL Editor**. Create a new query and run the following SQL:

```sql
-- Create stamps_progress table
CREATE TABLE IF NOT EXISTS stamps_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stamp_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_past BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stamp_key)
);

-- Create coupon_achievements table
CREATE TABLE IF NOT EXISTS coupon_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  redeemed_coupon_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements_unlocked JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievement_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stamps_progress_user_id ON stamps_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_stamps_progress_stamp_key ON stamps_progress(stamp_key);
CREATE INDEX IF NOT EXISTS idx_coupon_achievements_user_id ON coupon_achievements(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE stamps_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stamps_progress
-- Users can only read their own stamps
CREATE POLICY "Users can view their own stamps"
  ON stamps_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own stamps
CREATE POLICY "Users can insert their own stamps"
  ON stamps_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stamps
CREATE POLICY "Users can update their own stamps"
  ON stamps_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stamps
CREATE POLICY "Users can delete their own stamps"
  ON stamps_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for coupon_achievements
-- Users can only read their own coupon achievements
CREATE POLICY "Users can view their own coupon achievements"
  ON coupon_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own coupon achievements
CREATE POLICY "Users can insert their own coupon achievements"
  ON coupon_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own coupon achievements
CREATE POLICY "Users can update their own coupon achievements"
  ON coupon_achievements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own coupon achievements
CREATE POLICY "Users can delete their own coupon achievements"
  ON coupon_achievements
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 2: Enable Anonymous Authentication

**IMPORTANT:** Anonymous authentication must be explicitly enabled in Supabase.

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down to find **Anonymous** provider (it might be at the bottom of the list)
4. Click on **Anonymous** to expand it
5. **Enable** the Anonymous provider by toggling it on
6. Click **Save**

**Alternative method (if Anonymous provider is not visible):**
1. Go to **Authentication** → **Settings**
2. Look for "Enable anonymous sign-ins" or similar option
3. Enable it and save

Note: The `signInAnonymously()` function in the Supabase client will create anonymous users automatically once enabled. These users will have a `user_id` that can be used with the RLS policies above.

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. For Vercel deployment, add these as environment variables in your Vercel project settings:
   - Go to your project in Vercel
   - Navigate to Settings > Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production, Preview, and Development environments

## Step 4: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

2. Open your app in the browser
3. Check the browser console for any Supabase connection errors
4. Try completing a stamp - it should sync to Supabase
5. Try redeeming a coupon - it should sync to Supabase

## Verification Queries

You can verify data is being synced by running these queries in the Supabase SQL Editor:

```sql
-- Check stamps_progress entries
SELECT * FROM stamps_progress ORDER BY updated_at DESC LIMIT 10;

-- Check coupon_achievements entries
SELECT * FROM coupon_achievements ORDER BY updated_at DESC LIMIT 10;

-- Count anonymous users
SELECT COUNT(*) FROM auth.users WHERE is_anonymous = true;
```

## Troubleshooting

### Issue: "Failed to open database" or connection errors

- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active (not paused)
- Ensure you're using the correct project URL format: `https://your-project-id.supabase.co`

### Issue: "permission denied" errors

- Verify RLS policies were created correctly
- Check that anonymous authentication is working
- Ensure the user is properly authenticated (check browser console for auth errors)

### Issue: Data not syncing

- Check browser console for errors
- Verify network requests are reaching Supabase (check Network tab in DevTools)
- Ensure tables were created correctly (run verification queries above)
- Check that RLS policies allow the operations

### Issue: "relation does not exist" error

- Make sure you ran the SQL migration script completely
- Verify tables exist in your Supabase database (check Table Editor in dashboard)

## Additional Notes

- **Anonymous Users**: Each device/browser will create a unique anonymous user. To sync across devices, users would need to sign in with email/password instead (future enhancement).
- **Data Retention**: Anonymous users and their data will persist until manually deleted or the user signs up with email/password (which converts the anonymous account).
- **Storage**: The free tier of Supabase includes 500MB database storage, which should be more than enough for stamps and coupon data.
- **Backup**: localStorage is kept as a fallback, so data won't be lost if Supabase is temporarily unavailable.
