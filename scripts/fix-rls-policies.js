/**
 * TRIPLE J AUTO - Fix RLS Policies Script
 * Uses service_role key to fix Row Level Security policies
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLS() {
  console.log('='.repeat(60));
  console.log('FIXING RLS POLICIES');
  console.log('='.repeat(60));

  // Use raw SQL via rpc if available, otherwise use REST API
  // Since we can't run raw SQL via the JS client, we'll verify policies work

  console.log('\nTesting public read access with ANON key...');

  // Create a client with the anon key to test public access
  const anonClient = createClient(SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg0NjQsImV4cCI6MjA4MDk4NDQ2NH0.o8jvtDPVJ6DGwDy6QPuG_3XzmHPuR_hZ82DZsdeDisM',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: publicVehicles, error: publicError } = await anonClient
    .from('vehicles')
    .select('id, make, model, status')
    .limit(5);

  if (publicError) {
    console.error('❌ Public read FAILED:', publicError.message);
    console.log('\nThe RLS policies are blocking public access.');
    console.log('You need to run this SQL in Supabase dashboard:\n');
    console.log(`
-- Drop all existing vehicle policies
DROP POLICY IF EXISTS "Allow public read access on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public Read" ON public.vehicles;
DROP POLICY IF EXISTS "Public read access" ON public.vehicles;
DROP POLICY IF EXISTS "public_read_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "admin_full_access_vehicles" ON public.vehicles;

-- Create simple public read policy
CREATE POLICY "enable_public_read" ON public.vehicles
  FOR SELECT USING (true);

-- Create admin full access policy
CREATE POLICY "enable_admin_all" ON public.vehicles
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );
`);
  } else {
    console.log('✅ Public read access WORKS!');
    console.log(`   Found ${publicVehicles.length} vehicles via public API`);
    publicVehicles.forEach(v => {
      console.log(`   - ${v.make} ${v.model} (${v.status})`);
    });
  }

  // Test profiles access
  console.log('\nTesting profiles access...');
  const { data: profiles, error: profileError } = await anonClient
    .from('profiles')
    .select('email, is_admin')
    .eq('is_admin', true);

  if (profileError) {
    console.error('❌ Profiles read FAILED:', profileError.message);
    console.log('\nThe profiles RLS is blocking access. Run this SQL:\n');
    console.log(`
-- Allow reading profiles for admin check
DROP POLICY IF EXISTS "allow_profile_access" ON public.profiles;
CREATE POLICY "enable_profile_read" ON public.profiles
  FOR SELECT USING (true);
`);
  } else {
    console.log('✅ Profiles access WORKS!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

fixRLS().catch(console.error);
