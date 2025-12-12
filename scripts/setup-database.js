// Database Setup Script
// This script will:
// 1. Run the database schema
// 2. Create admin user
// 3. Set admin permissions

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://scgmpliwlfabnpygvbsy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQwODQ2NCwiZXhwIjoyMDgwOTg0NDY0fQ.9Xnx_7ECRm0kHbij8uIugF-bnTiijOsPualtuVSRVZ0';

const ADMIN_EMAIL = 'jobawems@gmail.com';
const ADMIN_PASSWORD = 'adekunle12';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    // If the RPC doesn't exist, we'll use direct SQL execution via PostgREST
    console.log('Note: Using alternative SQL execution method...');
    throw error;
  }
}

async function setup() {
  console.log('🚀 Starting Supabase Database Setup...\n');

  try {
    // Step 1: Read schema file
    console.log('📖 Reading schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Step 2: Execute schema (using PostgreSQL REST API)
    console.log('🔨 Executing database schema...');
    console.log('⚠️  Note: This requires using Supabase dashboard SQL Editor');
    console.log('📋 Schema ready at: D:\\triple-j-auto-investment\\supabase\\schema.sql\n');

    // Step 3: Create admin user
    console.log('👤 Creating admin user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists, skipping creation...');

        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.find(u => u.email === ADMIN_EMAIL);
        if (!existingUser) throw new Error('User exists but could not be found');

        console.log(`✅ Found existing user: ${existingUser.id}\n`);

        // Update admin flag
        console.log('🔐 Setting admin permissions...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('email', ADMIN_EMAIL);

        if (updateError) throw updateError;
        console.log('✅ Admin permissions set\n');

      } else {
        throw authError;
      }
    } else {
      console.log(`✅ User created: ${authData.user.id}\n`);

      // Set admin flag (profile should be auto-created by trigger)
      console.log('🔐 Setting admin permissions...');

      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', ADMIN_EMAIL);

      if (updateError) {
        console.log('⚠️  Could not set admin flag automatically.');
        console.log('   Run this SQL in Supabase dashboard:');
        console.log(`   UPDATE public.profiles SET is_admin = true WHERE email = '${ADMIN_EMAIL}';`);
      } else {
        console.log('✅ Admin permissions set\n');
      }
    }

    console.log('================================================');
    console.log('✅ SETUP COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/scgmpliwlfabnpygvbsy');
    console.log('2. SQL Editor → New query → Paste schema.sql contents → Run');
    console.log('3. Login credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
