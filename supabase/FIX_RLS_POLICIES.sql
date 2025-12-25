-- ================================================================
-- TRIPLE J AUTO INVESTMENT - FIX RLS POLICIES
-- ================================================================
-- Run this in Supabase SQL Editor to fix public access issues
-- ================================================================

-- PROBLEM: Current policy only shows Available/Pending vehicles to public
-- SOLUTION: Allow public to view ALL vehicles (including Sold)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;

-- Create new policy that allows public to view ALL vehicles
CREATE POLICY "Public can view all vehicles" ON public.vehicles
  FOR SELECT USING (true);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- Check if there are any vehicles in the database
SELECT COUNT(*) as total_vehicles,
       COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
       COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'Sold' THEN 1 END) as sold
FROM public.vehicles;

-- Show sample of vehicles (first 5)
SELECT id, make, model, year, status, price, image_url
FROM public.vehicles
ORDER BY date_added DESC
LIMIT 5;
