/**
 * TRIPLE J AUTO - Add Missing Schema Columns
 * Adds source, color, trim, and other Manheim-related columns to vehicles table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  console.error('Run with: node --env-file=.env.local scripts/add-schema-columns.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addColumns() {
  console.log('='.repeat(60));
  console.log('ADDING MISSING COLUMNS TO VEHICLES TABLE');
  console.log('='.repeat(60));

  // Check current schema by fetching one row
  console.log('\n1. Checking current schema...');
  const { data: sample, error: sampleError } = await supabase
    .from('vehicles')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('❌ Error checking schema:', sampleError.message);
    return;
  }

  const existingColumns = sample && sample[0] ? Object.keys(sample[0]) : [];
  console.log('   Current columns:', existingColumns.join(', '));

  // Columns we need for Manheim sync
  const requiredColumns = [
    { name: 'source', type: 'TEXT', default: "'manual'" },  // manheim, private, trade_in, manual
    { name: 'exterior_color', type: 'TEXT', default: null },
    { name: 'interior_color', type: 'TEXT', default: null },
    { name: 'trim', type: 'TEXT', default: null },
    { name: 'buy_fee', type: 'DECIMAL(10,2)', default: '0' },
    { name: 'total_cost', type: 'DECIMAL(10,2)', default: '0' },  // purchase + fees
    { name: 'purchase_location', type: 'TEXT', default: null },
    { name: 'seller_name', type: 'TEXT', default: null },
    { name: 'manheim_work_order', type: 'TEXT', default: null },
  ];

  // Check which columns are missing
  const missingColumns = requiredColumns.filter(col =>
    !existingColumns.includes(col.name)
  );

  if (missingColumns.length === 0) {
    console.log('\n✅ All required columns already exist!');
    return;
  }

  console.log('\n2. Missing columns:', missingColumns.map(c => c.name).join(', '));

  // Unfortunately, Supabase JS client can't run raw DDL
  // We'll generate the SQL and the user can run it, OR we use a workaround
  console.log('\n3. SQL to run in Supabase Dashboard:');
  console.log('-'.repeat(60));

  const sqlStatements = missingColumns.map(col => {
    const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
    return `ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${defaultClause};`;
  });

  console.log(sqlStatements.join('\n'));
  console.log('-'.repeat(60));

  // Try to add via RPC if available
  console.log('\n4. Attempting to add columns via database function...');

  // We can try inserting a row with the new columns to see if they exist
  // If they don't, Supabase will error - but that tells us we need to run the SQL

  const testData = {
    source: 'test',
    exterior_color: 'test',
    interior_color: 'test',
    trim: 'test',
    buy_fee: 0,
    total_cost: 0,
    purchase_location: 'test',
    seller_name: 'test',
    manheim_work_order: 'test'
  };

  // Try updating an existing vehicle with the new fields
  if (sample && sample[0]) {
    const { error: testError } = await supabase
      .from('vehicles')
      .update(testData)
      .eq('id', sample[0].id);

    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.log('❌ Columns do not exist yet.');
        console.log('\n⚠️  YOU MUST RUN THE SQL ABOVE IN SUPABASE DASHBOARD');
        console.log('   Go to: https://supabase.com/dashboard → SQL Editor → Paste & Run');
      } else {
        console.error('❌ Unexpected error:', testError.message);
      }
    } else {
      console.log('✅ Columns already exist! Reverting test data...');
      // Revert the test data
      await supabase
        .from('vehicles')
        .update({
          source: null,
          exterior_color: null,
          interior_color: null,
          trim: null,
          buy_fee: null,
          total_cost: null,
          purchase_location: null,
          seller_name: null,
          manheim_work_order: null
        })
        .eq('id', sample[0].id);
      console.log('✅ Test data reverted.');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

addColumns().catch(console.error);
