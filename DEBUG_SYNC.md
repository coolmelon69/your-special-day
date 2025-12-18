# Debugging Supabase Sync Issues

If your database isn't updating, follow these steps to debug:

## Step 1: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Look for any error messages related to Supabase

## Step 2: Run Debug Function

In the browser console, run this command to check your Supabase connection:

```javascript
// First, import the debug function (if using module system)
// Or add this to your code temporarily:

import { debugSupabaseConnection } from './src/utils/supabaseClient';
await debugSupabaseConnection();
```

Alternatively, you can add this to your app temporarily. Add this to `src/App.tsx` or any component:

```typescript
import { debugSupabaseConnection } from "@/utils/supabaseClient";

// In a useEffect or on button click:
useEffect(() => {
  debugSupabaseConnection();
}, []);
```

## Step 3: Check Common Issues

### Issue 1: Environment Variables Not Loaded

**Symptom**: Console shows "Supabase environment variables are not set"

**Solution**:
1. Make sure you have a `.env` file (not just `.env.example`)
2. Restart your dev server after adding/updating `.env`
3. Check that variables start with `VITE_`
4. In Vercel, make sure env vars are set in project settings

### Issue 2: RLS Policies Blocking Writes

**Symptom**: Console shows errors like "permission denied" or "new row violates row-level security policy"

**Solution**:
1. Go to Supabase Dashboard → Authentication → Policies
2. Verify RLS is enabled for both tables
3. Check that policies allow INSERT and UPDATE for authenticated users
4. For anonymous users, make sure the policies use `auth.uid() = user_id`

### Issue 3: Tables Don't Exist

**Symptom**: Console shows "relation does not exist" or "table not found"

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL migration from `SUPABASE_SETUP.md`
3. Verify tables exist in Table Editor

### Issue 4: Anonymous Auth Not Working

**Symptom**: User ID is null, console shows auth errors

**Solution**:
1. Check Supabase Dashboard → Authentication → Settings
2. Make sure anonymous sign-ins are enabled
3. Check that the anon key has proper permissions

### Issue 5: Upsert Conflict Resolution

**Symptom**: Data syncs but doesn't update existing records

**Solution**:
1. Verify unique constraints exist:
   - `stamps_progress`: `UNIQUE(user_id, stamp_key)`
   - `coupon_achievements`: `UNIQUE(user_id)`
2. Check that `onConflict` parameter matches the constraint

## Step 4: Manual Test

Test the sync manually in the browser console:

```javascript
// Test stamps sync
import { syncStampsProgress } from './src/utils/supabaseSync';
import { useAdventure } from './src/contexts/AdventureContext';

// Get current itinerary state (you'll need to access this from your component)
const { itineraryState } = useAdventure();
const result = await syncStampsProgress(itineraryState);
console.log("Sync result:", result);
```

## Step 5: Check Network Tab

1. Open Developer Tools → Network tab
2. Filter by "supabase"
3. Try to sync (complete a stamp or redeem a coupon)
4. Check the requests:
   - Are requests being made?
   - What's the status code? (200 = success, 401 = auth error, 403 = RLS blocked)
   - Check the response body for error messages

## Step 6: Verify Database Directly

In Supabase Dashboard:

1. Go to Table Editor
2. Check `stamps_progress` table - do you see any rows?
3. Check `coupon_achievements` table - do you see any rows?
4. Check Authentication → Users - do you see anonymous users?

## Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "permission denied" | RLS policy blocking | Update RLS policies to allow anonymous users |
| "relation does not exist" | Table not created | Run SQL migration |
| "new row violates row-level security policy" | RLS policy too restrictive | Check INSERT/UPDATE policies |
| "Could not get anonymous user" | Auth not working | Check anonymous auth settings |
| "Supabase environment variables are not set" | Env vars missing | Add `.env` file and restart dev server |

## Still Having Issues?

1. Check the browser console for the detailed error logs (we added better logging)
2. Verify your Supabase project is active (not paused)
3. Check your Supabase project logs in the Dashboard
4. Make sure you're using the correct project URL and anon key
