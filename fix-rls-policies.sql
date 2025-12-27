-- ============================================================================
-- FIX: Vehicle Update Persistence - Database RLS Policy Cleanup
-- ============================================================================
-- Run these queries in your Supabase SQL Editor to fix RLS policy conflicts
-- and verify admin user permissions.
-- ============================================================================

-- STEP 1: Check current RLS policies on vehicles table
-- This shows you what policies exist and might be conflicting
SELECT
  policyname,
  cmd,
  roles::text,
  qual::text
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Verify your admin user status
-- ============================================================================
-- Check if jobawems@gmail.com is marked as admin in profiles table
SELECT
  id,
  email,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'jobawems@gmail.com';

-- If the user doesn't exist or is_admin is false, run this:
INSERT INTO public.profiles (id, email, is_admin)
SELECT
  id,
  email,
  true
FROM auth.users
WHERE email = 'jobawems@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- ============================================================================
-- STEP 3: Clean up conflicting RLS policies (OPTIONAL - only if needed)
-- ============================================================================
-- WARNING: Only run this if you're experiencing RLS policy errors
-- This removes all existing vehicle policies and creates clean ones

-- Drop all existing policies on vehicles table
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.vehicles;

-- Create clean, non-conflicting policies
CREATE POLICY "allow_public_select_vehicles" ON public.vehicles
  FOR SELECT
  USING (true);

CREATE POLICY "allow_admin_all_vehicles" ON public.vehicles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ============================================================================
-- STEP 4: Verify policies are now correct
-- ============================================================================
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'Public can view vehicles'
    WHEN cmd = 'ALL' THEN 'Admins can do everything'
  END as description
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY cmd DESC;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- You should see exactly 2 policies:
-- 1. allow_admin_all_vehicles (cmd: ALL) - For admin users
-- 2. allow_public_select_vehicles (cmd: SELECT) - For everyone to view
-- ============================================================================
