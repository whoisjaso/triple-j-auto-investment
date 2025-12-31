/**
 * Add Manheim-related columns to vehicles table
 * Since Supabase JS client can't run DDL, this prints the SQL to execute
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// SQL to add missing columns
const ALTER_SQL = `
-- Add Manheim-related columns to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS exterior_color TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS interior_color TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS buy_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_location TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS manheim_work_order TEXT;
`;

async function checkAndAddColumns() {
  console.log('='.repeat(60));
  console.log('ADDING MANHEIM COLUMNS TO VEHICLES TABLE');
  console.log('='.repeat(60));

  // First, check what columns exist
  console.log('\n📋 Checking current schema...');
  const { data: sample } = await supabase
    .from('vehicles')
    .select('*')
    .limit(1);

  if (sample && sample[0]) {
    const cols = Object.keys(sample[0]);
    console.log(`   Found ${cols.length} columns`);

    // Check if our columns exist
    const newCols = ['source', 'exterior_color', 'interior_color', 'trim', 'buy_fee', 'total_cost', 'purchase_location', 'seller_name', 'manheim_work_order'];
    const missing = newCols.filter(c => !cols.includes(c));

    if (missing.length === 0) {
      console.log('\n✅ All Manheim columns already exist!');
      return true;
    }

    console.log(`\n⚠️  Missing columns: ${missing.join(', ')}`);
  }

  // Print SQL for manual execution
  console.log('\n' + '='.repeat(60));
  console.log('RUN THIS SQL IN SUPABASE DASHBOARD:');
  console.log('https://supabase.com/dashboard/project/scgmpliwlfabnpygvbsy/sql/new');
  console.log('='.repeat(60));
  console.log(ALTER_SQL);
  console.log('='.repeat(60));

  return false;
}

checkAndAddColumns().catch(console.error);
