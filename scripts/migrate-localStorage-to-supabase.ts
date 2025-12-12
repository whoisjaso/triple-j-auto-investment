import { supabase } from '../supabase/config';

/**
 * ONE-TIME MIGRATION SCRIPT
 * Migrates data from localStorage to Supabase
 *
 * INSTRUCTIONS:
 * 1. Open your site in browser with existing localStorage data
 * 2. Open DevTools console (F12)
 * 3. Copy this entire script
 * 4. Paste into console and press Enter
 * 5. Check console for success/error messages
 *
 * WARNING: Only run this ONCE after schema is set up!
 */

async function migrateToSupabase() {
  console.log('🚀 Starting localStorage → Supabase Migration...');
  console.log('================================================\n');

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ ERROR: Not authenticated. Please login as admin first.');
      return;
    }

    // Get localStorage data
    const localVehicles = localStorage.getItem('tj_vehicles');
    const localLeads = localStorage.getItem('tj_leads');

    if (!localVehicles && !localLeads) {
      console.log('⚠️  No data found in localStorage to migrate.');
      return;
    }

    let vehicleCount = 0;
    let leadCount = 0;

    // MIGRATE VEHICLES
    if (localVehicles) {
      const vehicles = JSON.parse(localVehicles);
      console.log(`📦 Found ${vehicles.length} vehicles in localStorage\n`);

      for (const v of vehicles) {
        try {
          const { error } = await supabase.from('vehicles').insert([{
            vin: v.vin,
            make: v.make,
            model: v.model,
            year: v.year,
            price: v.price,
            cost: v.cost || 0,
            cost_towing: v.costTowing || 0,
            cost_mechanical: v.costMechanical || 0,
            cost_cosmetic: v.costCosmetic || 0,
            cost_other: v.costOther || 0,
            sold_price: v.soldPrice || null,
            sold_date: v.soldDate || null,
            mileage: v.mileage,
            status: v.status,
            description: v.description || null,
            image_url: v.imageUrl || null,
            gallery: v.gallery || [],
            diagnostics: v.diagnostics || [],
            registration_status: v.registrationStatus || 'Pending',
            registration_due_date: v.registrationDueDate || null,
            date_added: v.dateAdded || new Date().toISOString().split('T')[0],
          }]);

          if (error) {
            // If duplicate VIN, skip
            if (error.code === '23505') {
              console.log(`⏭️  Skipped (duplicate): ${v.year} ${v.make} ${v.model} (${v.vin})`);
            } else {
              console.error(`❌ Failed: ${v.vin}`, error.message);
            }
          } else {
            console.log(`✅ Migrated: ${v.year} ${v.make} ${v.model} (${v.vin})`);
            vehicleCount++;
          }
        } catch (err) {
          console.error(`❌ Error migrating vehicle ${v.vin}:`, err);
        }
      }

      console.log(`\n📊 Vehicles: ${vehicleCount} / ${vehicles.length} migrated successfully\n`);
    }

    // MIGRATE LEADS
    if (localLeads) {
      const leads = JSON.parse(localLeads);
      console.log(`📧 Found ${leads.length} leads in localStorage\n`);

      for (const l of leads) {
        try {
          const { error } = await supabase.from('leads').insert([{
            name: l.name,
            email: l.email,
            phone: l.phone,
            interest: l.interest,
            status: l.status || 'New',
            date: l.date || new Date().toISOString(),
          }]);

          if (error) {
            console.error(`❌ Failed: ${l.email}`, error.message);
          } else {
            console.log(`✅ Migrated: ${l.name} (${l.email})`);
            leadCount++;
          }
        } catch (err) {
          console.error(`❌ Error migrating lead ${l.email}:`, err);
        }
      }

      console.log(`\n📊 Leads: ${leadCount} / ${leads.length} migrated successfully\n`);
    }

    console.log('================================================');
    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('Summary:');
    console.log(`  • Vehicles migrated: ${vehicleCount}`);
    console.log(`  • Leads migrated: ${leadCount}\n`);
    console.log('⚠️  BACKUP REMINDER:');
    console.log('Before clearing localStorage, consider saving a backup:');
    console.log('  Vehicles:', localVehicles);
    console.log('  Leads:', localLeads);
    console.log('\nTo clear localStorage after verifying data:');
    console.log('  localStorage.removeItem("tj_vehicles");');
    console.log('  localStorage.removeItem("tj_leads");');

  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
  }
}

// Run migration
migrateToSupabase();

// Also export for potential use in other scripts
export default migrateToSupabase;
