/**
 * TRIPLE J AUTO - Database Fix Script
 * Uses service_role key to bypass RLS and fix all database issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runFixes() {
  console.log('='.repeat(60));
  console.log('TRIPLE J AUTO - DATABASE FIX SCRIPT');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Check vehicle count
  console.log('STEP 1: Checking vehicles in database...');
  const { data: vehicles, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, vin, make, model, year, status');

  if (vehicleError) {
    console.error('❌ Error fetching vehicles:', vehicleError.message);
  } else {
    console.log(`✅ Found ${vehicles.length} vehicles in database`);
    if (vehicles.length > 0) {
      console.log('   Sample vehicles:');
      vehicles.slice(0, 5).forEach(v => {
        console.log(`   - ${v.year} ${v.make} ${v.model} (${v.status})`);
      });
    }
  }
  console.log('');

  // Step 2: Check profiles and admin user
  console.log('STEP 2: Checking admin user...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, is_admin');

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError.message);
  } else {
    console.log(`✅ Found ${profiles.length} profiles`);
    const admins = profiles.filter(p => p.is_admin);
    if (admins.length > 0) {
      console.log('   Admin users:');
      admins.forEach(a => console.log(`   - ${a.email} (is_admin: ${a.is_admin})`));
    } else {
      console.log('   ⚠️ NO ADMIN USERS FOUND!');
    }
  }
  console.log('');

  // Step 3: Fix admin user if needed
  console.log('STEP 3: Ensuring admin user exists...');
  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'jobawems@gmail.com')
    .single();

  if (adminCheck) {
    if (!adminCheck.is_admin) {
      console.log('   Setting is_admin = true for jobawems@gmail.com...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'jobawems@gmail.com');

      if (updateError) {
        console.error('❌ Failed to update admin status:', updateError.message);
      } else {
        console.log('✅ Admin status updated!');
      }
    } else {
      console.log('✅ Admin user already has is_admin = true');
    }
  } else {
    console.log('   ⚠️ Profile for jobawems@gmail.com not found');
    console.log('   Attempting to find user in auth.users and create profile...');

    // Try to get from auth.users via admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && authUsers) {
      const adminUser = authUsers.users.find(u => u.email === 'jobawems@gmail.com');
      if (adminUser) {
        console.log('   Found user in auth.users, creating profile...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: adminUser.id, email: adminUser.email, is_admin: true });

        if (insertError) {
          console.error('❌ Failed to create profile:', insertError.message);
        } else {
          console.log('✅ Profile created with admin access!');
        }
      }
    }
  }
  console.log('');

  // Step 4: Test vehicle update capability
  console.log('STEP 4: Testing vehicle update capability...');
  if (vehicles && vehicles.length > 0) {
    const testVehicle = vehicles[0];
    const { error: testError } = await supabase
      .from('vehicles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testVehicle.id);

    if (testError) {
      console.error('❌ Vehicle update test failed:', testError.message);
    } else {
      console.log('✅ Vehicle update test PASSED!');
    }
  }
  console.log('');

  // Step 5: Add sample vehicle if database is empty
  if (!vehicles || vehicles.length === 0) {
    console.log('STEP 5: Database is empty, adding sample vehicles...');

    const sampleVehicles = [
      {
        vin: 'SAMPLE-001-TEST',
        make: 'Mercedes-Benz',
        model: 'G 63 AMG',
        year: 2023,
        price: 215000,
        cost: 190000,
        mileage: 4200,
        status: 'Available',
        description: 'Executive transport. Built for those who operate above the terrain.',
        image_url: 'https://images.unsplash.com/photo-1520031441872-265e4e98884c?q=80&w=2070&auto=format&fit=crop',
        registration_status: 'Pending',
        date_added: new Date().toISOString().split('T')[0]
      },
      {
        vin: 'SAMPLE-002-TEST',
        make: 'Rolls-Royce',
        model: 'Wraith',
        year: 2021,
        price: 289000,
        cost: 230000,
        mileage: 12500,
        status: 'Available',
        description: 'A sanctuary of silence. This machine is not driven; it is commanded.',
        image_url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop',
        registration_status: 'Completed',
        date_added: new Date().toISOString().split('T')[0]
      }
    ];

    const { error: insertError } = await supabase
      .from('vehicles')
      .insert(sampleVehicles);

    if (insertError) {
      console.error('❌ Failed to insert sample vehicles:', insertError.message);
    } else {
      console.log('✅ Added 2 sample vehicles to database');
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('DATABASE FIX COMPLETE');
  console.log('='.repeat(60));

  // Final verification
  const { data: finalCheck } = await supabase.from('vehicles').select('id');
  const { data: finalProfiles } = await supabase.from('profiles').select('email, is_admin').eq('is_admin', true);

  console.log('');
  console.log('FINAL STATUS:');
  console.log(`  Vehicles in database: ${finalCheck?.length || 0}`);
  console.log(`  Admin users: ${finalProfiles?.length || 0}`);
  if (finalProfiles && finalProfiles.length > 0) {
    finalProfiles.forEach(p => console.log(`    - ${p.email}`));
  }
}

runFixes().catch(console.error);
