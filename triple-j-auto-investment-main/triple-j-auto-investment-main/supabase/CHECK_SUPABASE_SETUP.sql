-- ================================================================
-- DIAGNOSTIC SCRIPT - Run this in Supabase SQL Editor
-- ================================================================
-- This will check if your database is set up correctly
-- ================================================================

-- 1. Check if tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('vehicles', 'leads', 'profiles')
ORDER BY table_name;

-- 2. Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('vehicles', 'leads', 'profiles');

-- 3. Check all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as operation,
  CASE
    WHEN roles = '{public}' THEN 'PUBLIC ACCESS'
    ELSE roles::text
  END as who_can_access
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check vehicle count and sample data
SELECT
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN status = 'Available' THEN 1 END) as available_count,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as vehicles_with_images
FROM public.vehicles;

-- 5. Check if there are any vehicles at all
SELECT
  id,
  make,
  model,
  year,
  status,
  price,
  mileage,
  image_url IS NOT NULL as has_image
FROM public.vehicles
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check admin users
SELECT
  email,
  is_admin,
  created_at
FROM public.profiles
WHERE is_admin = true;

-- ================================================================
-- EXPECTED RESULTS:
-- ================================================================
-- 1. All three tables should exist (vehicles, leads, profiles)
-- 2. RLS should be enabled on all tables
-- 3. There should be policies allowing public SELECT on vehicles
-- 4. There should be at least 1 admin user
-- 5. There should be vehicles in the database
-- ================================================================
