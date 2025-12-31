/**
 * Add Manheim columns directly via PostgreSQL connection
 */

import pg from 'pg';
const { Client } = pg;

// Try pooler connection (Supabase's recommended method)
const DATABASE_URL = 'postgresql://postgres.scgmpliwlfabnpygvbsy:adekunle12@aws-0-us-east-2.pooler.supabase.com:6543/postgres';

const ALTER_STATEMENTS = [
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS exterior_color TEXT",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS interior_color TEXT",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS trim TEXT",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS buy_fee DECIMAL(10,2) DEFAULT 0",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_location TEXT",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seller_name TEXT",
  "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS manheim_work_order TEXT",
];

async function addColumns() {
  console.log('='.repeat(60));
  console.log('ADDING MANHEIM COLUMNS VIA DIRECT POSTGRESQL CONNECTION');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (const sql of ALTER_STATEMENTS) {
      const colName = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
      process.stdout.write(`   Adding ${colName}... `);

      try {
        await client.query(sql);
        console.log('✅');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('(already exists)');
        } else {
          console.log(`❌ ${err.message}`);
        }
      }
    }

    // Verify columns were added
    console.log('\n📋 Verifying schema...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'vehicles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log(`   Total columns: ${result.rows.length}`);

    const newCols = ['source', 'exterior_color', 'interior_color', 'trim', 'buy_fee', 'total_cost', 'purchase_location', 'seller_name', 'manheim_work_order'];
    const found = result.rows.filter(r => newCols.includes(r.column_name));

    console.log(`   Manheim columns found: ${found.length}/${newCols.length}`);
    found.forEach(c => console.log(`     - ${c.column_name} (${c.data_type})`));

    console.log('\n' + '='.repeat(60));
    console.log('✅ SCHEMA UPDATE COMPLETE');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

addColumns();
