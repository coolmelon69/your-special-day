# Device Link Code Sync - Setup Guide

## What Was Implemented

Device link code sync allows multiple devices to share the same stamps and coupons progress by joining a sync group via a 6-character code that expires in 10 minutes.

## Database Migration Required

**IMPORTANT:** You need to run the SQL migration before the feature will work.

1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL from `SUPABASE_GROUP_SYNC_MIGRATION.sql`
3. This will:
   - Create sync group tables
   - Update existing tables to use `group_id` instead of `user_id`
   - Set up RLS policies
   - Create RPC functions for creating/joining codes

**Note:** The migration includes optional code to migrate existing data. Review it before running if you have existing stamps/coupons data.

## How It Works

1. **Each device starts with its own private group** - Data syncs within that group
2. **Generate a code** - Click "Sync" in the navigation bar → "Generate Code"
   - Creates a 6-character code (e.g., "ABC123")
   - Code expires in 10 minutes
   - Share this code with other devices
3. **Join a code** - Click "Sync" → "Join Code" → Enter the code
   - Device joins the shared group
   - **Local progress is replaced** with the group's cloud data
   - All devices in the group now share the same stamps/coupons

## Features

- **6-character codes** - Easy to share
- **10-minute expiry** - Codes expire for security
- **Overwrite on join** - When joining, device switches to group's data (as requested)
- **Real-time sync** - Changes sync to cloud and are visible to all devices in the group
- **No sign-up required** - Uses anonymous authentication

## Usage Flow

### Device A (Generate Code):
1. Open app → Click "Sync" button in navigation
2. Click "Generate Code"
3. Copy/share the 6-character code
4. Complete stamps or redeem coupons (data syncs to group)

### Device B (Join Code):
1. Open app → Click "Sync" button in navigation
2. Click "Join Code" tab
3. Enter the 6-character code
4. Click "Join Group"
5. Device's stamps/coupons are replaced with Device A's data
6. Complete more stamps (data syncs and Device A sees updates)

## Testing

1. **Test on two devices/browsers:**
   - Device 1: Generate code, complete a stamp
   - Device 2: Join code, verify it sees Device 1's stamp
   - Device 2: Complete another stamp
   - Device 1: Refresh, verify it sees Device 2's new stamp

2. **Test expiry:**
   - Generate code
   - Wait 10+ minutes (or manually expire in database)
   - Try to join with expired code → Should show error

3. **Test error handling:**
   - Try joining invalid code → Should show error
   - Try joining expired code → Should show error message

## Files Created/Modified

### New Files:
- `src/utils/syncGroup.ts` - Group management and RPC calls
- `src/components/DeviceLinkModal.tsx` - UI for generating/joining codes
- `SUPABASE_GROUP_SYNC_MIGRATION.sql` - Database migration script

### Modified Files:
- `src/utils/supabaseSync.ts` - Updated to use `group_id` instead of `user_id`
- `src/contexts/AdventureContext.tsx` - Added groupId management and reload function
- `src/components/GiftCouponsSection.tsx` - Updated to use groupId
- `src/components/NavigationBar.tsx` - Added "Sync" button

## Troubleshooting

### Codes not generating:
- Check browser console for errors
- Verify RPC functions were created in Supabase
- Check that anonymous auth is still enabled

### Join not working:
- Verify code hasn't expired (10 minutes)
- Check browser console for errors
- Verify RLS policies allow group membership reads

### Data not syncing after join:
- Check that `reloadStampsFromCloud()` is called after join
- Verify groupId is stored in localStorage after join
- Check Network tab for Supabase requests

## Next Steps

1. **Run the SQL migration** (required!)
2. **Test the feature** on two devices
3. **Optional:** Customize the UI styling if desired
4. **Optional:** Adjust code expiry time (currently 10 minutes) in the SQL function

## Notes

- Each device maintains its own anonymous user account
- Groups can have multiple members (devices)
- Data is stored by `group_id`, so all devices in a group share the same stamps/coupons
- When a device joins a code, it permanently switches to that group's data
- If you want to leave a group and create a new private group, you'd need to clear localStorage and refresh (this could be added as a feature later)




