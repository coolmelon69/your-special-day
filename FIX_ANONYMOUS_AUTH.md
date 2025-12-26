# Fix: Anonymous Sign-ins Disabled

## Error Message
```
AuthApiError: Anonymous sign-ins are disabled
```

## Solution: Enable Anonymous Authentication in Supabase

### Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Providers** (or go directly to Authentication → Providers)

3. **Enable Anonymous Provider**
   - Scroll down through the list of providers
   - Find **Anonymous** provider (it might be near the bottom)
   - Click on **Anonymous** to expand it
   - **Toggle it ON** (enable it)
   - Click **Save** button

4. **Verify It's Enabled**
   - The Anonymous provider should now show as "Enabled" or have a green toggle
   - You should see it in the list of active providers

5. **Test Your App**
   - Refresh your app in the browser
   - Try completing a stamp or redeeming a coupon
   - Check the console - the error should be gone
   - Check Supabase Dashboard → Authentication → Users - you should see anonymous users appearing

## Visual Guide

The Anonymous provider in Supabase looks like this:
```
Providers
├── Email
├── Phone
├── Google
├── GitHub
├── ...
└── Anonymous  ← Find this one and enable it
```

## Alternative: Using Email/Password Instead

If you prefer to use email/password authentication instead of anonymous:

1. You would need to modify the sync code to use email auth
2. Users would need to sign up/sign in with email
3. This provides better cross-device sync (same account on all devices)

But for the simplest setup, **anonymous authentication is recommended** as it requires no user interaction.

## Still Having Issues?

After enabling anonymous auth:
1. **Clear browser cache/localStorage** (optional but recommended)
2. **Restart your dev server**
3. **Refresh the browser**
4. Run `debugSupabase()` in console to verify it's working

The error should disappear once anonymous authentication is enabled in your Supabase project settings.




