# COMPLETE SUPABASE FIX - Step by Step

## ISSUE IDENTIFIED:

Your app uses **Google Sheets as the source of truth** for vehicle data, which syncs to Supabase. There are two potential issues:

1. **RLS Policies are too restrictive** - Public can only see 'Available' and 'Pending' vehicles
2. **Google Sheets might not have data** or sync hasn't run

## FIX STEP 1: Check Google Sheets (Source of Truth)

Your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vRHeta2U3ATyxE4hlQC3-kVCV8Iu-hnJYQIij68ptCBZYVw4C4vxIiu2fli5ltWXdsb7uVKxXco9WE3/pub?output=csv
```

**Action:** Open this URL in your browser right now.

**Expected:** You should see CSV data with columns like: VIN, Make, Model, Year, Price, etc.

**If you see an error or no data:**
- Your Google Sheet is not published
- Or it has no vehicle data
- Go to Google Sheets → File → Share → Publish to web → Publish as CSV

## FIX STEP 2: Fix Supabase RLS Policies

Go to Supabase → SQL Editor → New Query

**Copy and paste this ENTIRE script:**

```sql
-- ================================================================
-- FIX: Allow public to view ALL vehicles
-- ================================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;

-- Create new policy that allows public to view ALL vehicles
CREATE POLICY "Public can view all vehicles" ON public.vehicles
  FOR SELECT USING (true);

-- Verify it worked
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'vehicles'
  AND policyname = 'Public can view all vehicles';
```

Click **RUN**

**Expected output:** You should see the new policy listed.

## FIX STEP 3: Check if Vehicles Exist in Database

In the same SQL Editor, run this:

```sql
-- Check vehicle count
SELECT COUNT(*) as total_vehicles FROM public.vehicles;

-- Show sample vehicles
SELECT make, model, year, status, price
FROM public.vehicles
ORDER BY created_at DESC
LIMIT 10;
```

**If COUNT is 0 (no vehicles):**
- Your Google Sheets data hasn't synced yet
- Go to Step 4

**If COUNT > 0 (vehicles exist):**
- Data exists, the RLS fix should make them visible
- Go to Step 5 (test)

## FIX STEP 4: Manually Trigger Sync (If No Vehicles in DB)

After deployment, the app should auto-sync from Google Sheets.

**To manually trigger sync:**
1. Go to your deployed website
2. Open browser console (F12)
3. The app should automatically sync on load
4. Look for console message: "SYNC COMPLETE: X Assets synced to database"

**Or login as admin and use the admin panel to trigger sync**

## FIX STEP 5: Verify Everything Works

1. Open your deployed website: https://thetriplejauto.com
2. Open browser console (F12 → Console tab)
3. Look for these messages:

**✅ SUCCESS - You should see:**
```
✅ Loaded X vehicles from Supabase
```

**❌ FAILURE - If you see:**
```
❌ CRITICAL: Missing Supabase environment variables!
```
→ Environment variables not set in DokPloy (go back to DOKPLOY_ENV_SETUP.md)

**❌ FAILURE - If you see:**
```
Failed to load vehicles: [some error]
```
→ RLS policies still blocking (re-run Step 2)

## FIX STEP 6: Check Admin Login

1. Go to https://thetriplejauto.com/login
2. Login with:
   - Email: jobawems@gmail.com
   - Password: adekunle12

**✅ SUCCESS:** Should redirect to /admin/dashboard

**❌ FAILURE:** Check browser console for errors

## COMPLETE DIAGNOSTIC SCRIPT

Run this in Supabase SQL Editor to see EVERYTHING:

```sql
-- ================================================================
-- COMPLETE DIAGNOSTIC
-- ================================================================

-- 1. Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('vehicles', 'leads', 'profiles');

-- 2. Check RLS policies on vehicles
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'vehicles';

-- 3. Check vehicle count by status
SELECT
  status,
  COUNT(*) as count
FROM public.vehicles
GROUP BY status;

-- 4. Check admin users
SELECT email, is_admin
FROM public.profiles
WHERE is_admin = true;

-- 5. Sample vehicles
SELECT make, model, year, status, price, image_url IS NOT NULL as has_image
FROM public.vehicles
ORDER BY created_at DESC
LIMIT 5;
```

## SUMMARY - What Needs to Happen:

1. ✅ Environment variables set in DokPloy (you did this)
2. ⚠️ Google Sheets has vehicle data (CHECK THIS)
3. ⚠️ RLS policies allow public SELECT (FIX WITH SCRIPT)
4. ⚠️ Vehicles synced from Google Sheets to Supabase
5. ⚠️ Admin user exists in profiles table

## IF NOTHING WORKS:

Send me the output of:
1. The Google Sheets URL (open in browser, copy first 5 lines)
2. The diagnostic SQL script output
3. Browser console errors from https://thetriplejauto.com

Then I can pinpoint the exact issue.
