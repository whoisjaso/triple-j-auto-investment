-- ================================================================
-- FIX: "public.my_table does not exist" ERROR
-- ================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Go to: SQL Editor → New Query → Paste this → Run
-- ================================================================

-- STEP 1: Find ALL policies that might reference bad tables
SELECT
  schemaname,
  tablename,
  policyname,
  qual as policy_using_clause,
  with_check as policy_with_check_clause
FROM pg_policies
WHERE tablename IN ('vehicles', 'profiles', 'leads')
ORDER BY tablename, policyname;

-- STEP 2: Find any triggers that might be broken
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- STEP 3: Check for any functions referencing my_table
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%my_table%';

-- ================================================================
-- IF THE ABOVE SHOWS PROBLEMS, RUN THESE FIXES:
-- ================================================================

-- NUCLEAR OPTION: Drop ALL vehicle policies and recreate clean ones
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "allow_public_select_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "allow_admin_all_vehicles" ON public.vehicles;

-- Create simple, working policies
-- 1. Everyone can READ vehicles
CREATE POLICY "public_read_vehicles" ON public.vehicles
  FOR SELECT
  USING (true);

-- 2. Authenticated admins can do everything
CREATE POLICY "admin_full_access_vehicles" ON public.vehicles
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );

-- ================================================================
-- VERIFY YOUR ADMIN USER EXISTS
-- ================================================================
SELECT
  p.id,
  p.email,
  p.is_admin,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;

-- If empty, run this (replace with your email):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'jobawems@gmail.com';

-- ================================================================
-- VERIFY SETUP IS CORRECT
-- ================================================================
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;
