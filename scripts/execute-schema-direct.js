// Direct Schema Execution using Supabase Database API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQwODQ2NCwiZXhwIjoyMDgwOTg0NDY0fQ.9Xnx_7ECRm0kHbij8uIugF-bnTiijOsPualtuVSRVZ0';

console.log('🚀 Setting up database schema via Supabase client...\n');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSchema() {
  try {
    // Read schema
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📖 Schema loaded, executing via database API...\n');

    // Try using the SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/sql',
        'Accept': 'application/json'
      },
      body: schema
    });

    if (response.ok) {
      console.log('✅ Schema executed successfully!\n');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️  API execution not available. Manual step required.\n');
      console.log('Please copy schema from: D:\\triple-j-auto-investment\\supabase\\schema.sql');
      console.log('And paste into: https://supabase.com/dashboard/project/scgmpliwlfabnpygvbsy/sql');
      return false;
    }

  } catch (error) {
    console.log('ℹ️  Automated schema execution not supported.');
    console.log('\n📋 QUICK MANUAL STEP (30 seconds):');
    console.log('1. Open: https://supabase.com/dashboard/project/scgmpliwlfabnpygvbsy/sql/new');
    console.log('2. Copy contents from: D:\\triple-j-auto-investment\\supabase\\schema.sql');
    console.log('3. Paste and click "Run"');
    console.log('\n');
    return false;
  }
}

// Verify tables exist
async function verifySetup() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Try to query profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (!profileError) {
      console.log('✅ profiles table exists');
    }

    // Try to query vehicles table
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1);

    if (!vehicleError) {
      console.log('✅ vehicles table exists');
    }

    // Try to query leads table
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (!leadError) {
      console.log('✅ leads table exists');
    }

    if (!profileError && !vehicleError && !leadError) {
      console.log('\n✨ Database is fully configured!');
      console.log('✅ Ready to proceed with Store.tsx update\n');
      return true;
    } else {
      console.log('\n⚠️  Some tables missing - schema needs to be run');
      return false;
    }

  } catch (error) {
    console.log('\n⚠️  Tables not found - schema needs to be run first\n');
    return false;
  }
}

async function main() {
  const executed = await executeSchema();

  // Wait a moment for database to process
  await new Promise(resolve => setTimeout(resolve, 2000));

  const verified = await verifySetup();

  if (!verified) {
    console.log('================================================');
    console.log('ACTION NEEDED: Run schema in Supabase dashboard');
    console.log('(This is a one-time 30-second copy-paste task)');
    console.log('================================================\n');
  }
}

main();
