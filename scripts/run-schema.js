// Run Database Schema via Supabase API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQwODQ2NCwiZXhwIjoyMDgwOTg0NDY0fQ.9Xnx_7ECRm0kHbij8uIugF-bnTiijOsPualtuVSRVZ0';

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split into individual statements (basic splitting)
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

console.log('🚀 Running database schema...\n');
console.log(`📊 Found ${statements.length} SQL statements\n`);

async function runSchema() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments and notices
    if (statement.includes('DO $$') || statement.includes('RAISE NOTICE')) {
      console.log(`⏭️  Skipping notification block ${i + 1}`);
      continue;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      });

      const preview = statement.substring(0, 60).replace(/\n/g, ' ');

      if (response.ok || response.status === 201 || response.status === 204) {
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`   Status: ${response.status}, might already exist`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ [${i + 1}/${statements.length}] Error:`, error.message);
      errorCount++;
    }
  }

  console.log('\n================================================');
  console.log(`✅ Completed: ${successCount} successful`);
  console.log(`⚠️  Warnings: ${errorCount} (may be pre-existing objects)`);
  console.log('================================================\n');
}

runSchema().catch(console.error);
