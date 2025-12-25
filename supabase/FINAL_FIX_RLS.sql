-- ================================================================
-- FINAL FIX: Remove all duplicate RLS policies and create clean ones
-- ================================================================
-- Copy this ENTIRE script and run in Supabase SQL Editor
-- ================================================================

-- STEP 1: Drop ALL existing vehicle policies (clean slate)
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;

-- STEP 2: Create ONE simple policy for public SELECT
CREATE POLICY "allow_public_select_vehicles" ON public.vehicles
  FOR SELECT
  USING (true);

-- STEP 3: Create ONE policy for admin full access
CREATE POLICY "allow_admin_all_vehicles" ON public.vehicles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- STEP 4: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- STEP 5: Check if you have any vehicles
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
  COUNT(CASE WHEN status = 'Sold' THEN 1 END) as sold
FROM public.vehicles;

-- STEP 6: Show sample vehicles
SELECT
  make,
  model,
  year,
  status,
  price,
  image_url IS NOT NULL as has_image
FROM public.vehicles
ORDER BY created_at DESC
LIMIT 5;

-- STEP 7: Check if admin user exists
SELECT
  email,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'jobawems@gmail.com';

-- If you see "0 rows" in Step 7, run this:
-- INSERT INTO public.profiles (id, email, is_admin)
-- SELECT id, email, true
-- FROM auth.users
-- WHERE email = 'jobawems@gmail.com';
