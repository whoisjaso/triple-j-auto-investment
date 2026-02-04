import { supabase } from '../../supabase/config';
import { Vehicle, VehicleStatus } from '../../types';
import { VehicleSetters } from './types';

// --- SOVEREIGN BACKUP PROTOCOL (FALLBACK DATA) ---
export const FALLBACK_VEHICLES: Vehicle[] = [
  {
    id: 'backup-1',
    make: 'Rolls-Royce',
    model: 'Wraith',
    year: 2021,
    price: 289000,
    cost: 230000,
    costTowing: 1500,
    costMechanical: 2000,
    costCosmetic: 500,
    costOther: 1200,
    mileage: 12500,
    vin: 'RR-WRTH-BLK-001',
    status: VehicleStatus.AVAILABLE,
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop',
    description: 'A sanctuary of silence. This 2021 Wraith is not driven; it is commanded. With 12,500 miles of sovereign travel, it remains the ultimate instrument of power.',
    gallery: ['https://images.unsplash.com/photo-1631295868223-63265b40d9e4?q=80&w=2070&auto=format&fit=crop'],
    diagnostics: ['Clean Carfax', 'No mechanical faults detected', 'Minor stone chip on lower front valence'],
    registrationStatus: 'Completed',
    dateAdded: '2024-01-15'
  },
  {
    id: 'backup-2',
    make: 'Mercedes-Benz',
    model: 'G 63 AMG',
    year: 2023,
    price: 215000,
    cost: 190000,
    costTowing: 500,
    costMechanical: 0,
    costCosmetic: 1200,
    costOther: 500,
    mileage: 4200,
    vin: 'MB-G63-MATTE-002',
    status: VehicleStatus.PENDING,
    imageUrl: 'https://images.unsplash.com/photo-1520031441872-265e4e98884c?q=80&w=2070&auto=format&fit=crop',
    description: 'The fortress of solitude. Built for those who operate above the terrain. 4,200 miles of verified durability. A brutally efficient projection of authority.',
    gallery: [],
    diagnostics: ['Windshield replaced (OEM)', 'Scheduled B-Service due in 500 miles'],
    registrationStatus: 'Processing',
    dateAdded: '2024-02-01'
  },
  {
    id: 'backup-3',
    make: 'Lamborghini',
    model: 'Huracan Evo',
    year: 2022,
    price: 265000,
    cost: 220000,
    costTowing: 2000, // Enclosed transport
    costMechanical: 4500, // Service
    costCosmetic: 0,
    costOther: 1500, // Fees
    soldPrice: 260000,
    soldDate: '2023-11-15',
    mileage: 6800,
    vin: 'LB-EVO-GRY-003',
    status: VehicleStatus.SOLD,
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2874&auto=format&fit=crop',
    description: 'Kinetic violence tailored for the disciplined mind. 6,800 miles of aggressive dominance. This asset does not ask for attention; it demands submission.',
    gallery: [],
    diagnostics: ['Rear tires at 40% life', 'Interior carbon trim perfect'],
    registrationStatus: 'Completed',
    dateAdded: '2023-10-01'
  },
  {
    id: 'backup-4',
    make: 'Range Rover',
    model: 'Autobiography',
    year: 2020,
    price: 85000,
    cost: 65000,
    costTowing: 400,
    costMechanical: 8500, // Heavy repairs
    costCosmetic: 1200,
    costOther: 250,
    soldPrice: 84000,
    soldDate: '2023-12-01',
    mileage: 35000,
    vin: 'RR-LWB-004',
    status: VehicleStatus.SOLD,
    imageUrl: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?q=80&w=2000&auto=format&fit=crop',
    description: 'Executive transport. Slight electrical gremlins detected in rear entertainment system impacted final margin.',
    gallery: [],
    diagnostics: ['Suspension compressor slow', 'Rear screen intermittent failure'],
    registrationStatus: 'Completed',
    dateAdded: '2023-09-15'
  }
];

// Load vehicles from Supabase (Store.tsx lines 240-331)
export async function loadVehicles(
  setters: VehicleSetters,
  currentVehicles: Vehicle[]
): Promise<void> {
  setters.setIsLoading(true);
  console.log('🔄 Initiating Vehicle Fetch Transaction (Timeout: 10s)...');

  // Safety Valve: Force loader off after 12s regardless of fetch status
  const safetyTimer = setTimeout(() => {
    console.warn('⚠️ Safety Valve: Fetch took too long. Forcing loader off.');
    setters.setIsLoading(false);
  }, 12000);

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .abortSignal(abortController.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error('❌ Failed to load vehicles from Supabase:', error);
      console.error('Error Details:', error.message, error.details, error.hint);

      // Set visible connection error
      const errorMsg = error.message || 'Database connection failed';
      setters.setConnectionError(`Database Error: ${errorMsg}`);

      // Check if this might be a Brave browser blocking issue
      const isBrave = navigator.userAgent.includes('Brave') || (navigator as any).brave;
      if (isBrave && error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn('⚠️ Possible Brave browser blocking detected. Try disabling Shields for this site.');
        setters.setConnectionError('Connection blocked. Try disabling browser shields for this site.');
      }

      // Only load fallback if we really can't connect
      if (currentVehicles.length === 0) {
        console.warn('⚠️ Using FALLBACK assets due to fetch error.');
        setters.setVehicles(FALLBACK_VEHICLES);
      }
      return;
    }

    // Clear any previous connection error on success
    setters.setConnectionError(null);

    console.log(`📡 Supabase Fetch Complete. Found ${data?.length || 0} vehicles.`);

    // Transform snake_case DB fields to camelCase
    const transformed = (data || []).map((v: any) => ({
      id: v.id,
      vin: v.vin,
      make: v.make,
      model: v.model,
      year: v.year,
      price: v.price,
      cost: v.cost || 0,
      costTowing: v.cost_towing || 0,
      costMechanical: v.cost_mechanical || 0,
      costCosmetic: v.cost_cosmetic || 0,
      costOther: v.cost_other || 0,
      soldPrice: v.sold_price || undefined,
      soldDate: v.sold_date || undefined,
      mileage: v.mileage,
      status: v.status as VehicleStatus,
      description: v.description || '',
      imageUrl: v.image_url || '',
      gallery: v.gallery || [],
      diagnostics: v.diagnostics || [],
      registrationStatus: v.registration_status as any,
      registrationDueDate: v.registration_due_date || undefined,
      dateAdded: v.date_added,
    }));

    setters.setVehicles(transformed);
    if (transformed.length === 0) {
      console.warn('⚠️ Supabase returned 0 vehicles. Store updated to empty.');
    } else {
      console.log(`✅ Loaded ${transformed.length} vehicles into Store.`);
    }
  } catch (error) {
    console.error('❌ Unexpected error loading vehicles:', error);
    // Keep existing fallback for catastrophic failure
    if (currentVehicles.length === 0) {
      setters.setVehicles(FALLBACK_VEHICLES);
    }
  } finally {
    clearTimeout(safetyTimer);
    setters.setIsLoading(false);
  }
}

// Add vehicle to Supabase (Store.tsx lines 379-458)
export async function addVehicle(
  vehicle: Vehicle,
  loadVehiclesFn: () => Promise<void>
): Promise<void> {
  try {
    // CRITICAL: Verify session before adding
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('❌ No active session for add:', sessionError);
      alert('❌ ADD FAILED: You are not logged in!\n\nPlease log in again through the Admin page.');
      throw new Error('No active session');
    }

    console.log('🔐 Session verified for add, user:', sessionData.session.user.email);

    // Verify admin status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profileError || !profileData?.is_admin) {
      console.error('❌ User is not admin:', profileError);
      alert('❌ ADD FAILED: Your account is not set as admin.\n\nContact support to verify your admin status.');
      throw new Error('Not an admin user');
    }

    const dateAdded = vehicle.dateAdded || new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('vehicles')
      .insert([{
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        cost: vehicle.cost || 0,
        cost_towing: vehicle.costTowing || 0,
        cost_mechanical: vehicle.costMechanical || 0,
        cost_cosmetic: vehicle.costCosmetic || 0,
        cost_other: vehicle.costOther || 0,
        sold_price: vehicle.soldPrice || null,
        sold_date: vehicle.soldDate || null,
        mileage: vehicle.mileage,
        status: vehicle.status,
        description: vehicle.description || '',
        image_url: vehicle.imageUrl || '',
        gallery: vehicle.gallery || [],
        diagnostics: vehicle.diagnostics || [],
        registration_status: vehicle.registrationStatus || 'Pending',
        registration_due_date: vehicle.registrationDueDate || null,
        date_added: dateAdded,
      }]);

    if (error) {
      console.error('Failed to add vehicle:', error);
      const errorMessage = error.message || 'Unknown error';

      // Check for common issues
      if (errorMessage.includes('too large') || errorMessage.includes('payload')) {
        alert('❌ ADD FAILED: Images are too large!\n\nTry using smaller images (under 500KB each) or fewer photos.');
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        alert('❌ ADD FAILED: A vehicle with this VIN already exists.');
      } else {
        alert(`Failed to add vehicle: ${errorMessage}\n\nCheck console for details.`);
      }
      throw new Error(`Add failed: ${error.message}`);
    }

    console.log('✅ Vehicle added successfully');

    // Manually reload vehicles to ensure UI updates immediately
    await loadVehiclesFn();
  } catch (error) {
    console.error('Unexpected error adding vehicle:', error);
    // Don't double-alert
    if (!(error instanceof Error) || !error.message.includes('Add failed')) {
      alert('Failed to add vehicle. Please try again.');
    }
    throw error;
  }
}

// Update vehicle in Supabase (Store.tsx lines 460-560)
export async function updateVehicle(
  id: string,
  updatedVehicle: Partial<Vehicle>,
  user: { email: string; isAdmin: boolean } | null,
  loadVehiclesFn: () => Promise<void>
): Promise<void> {
  try {
    // CRITICAL: Refresh session to ensure auth token is valid
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('❌ No active session for update:', sessionError);
      alert('❌ UPDATE FAILED: You are not logged in!\n\nPlease log in again through the Admin page.');
      throw new Error('No active session');
    }

    console.log('🔐 Session verified for update, user:', sessionData.session.user.email);

    // Verify admin status in database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profileError || !profileData?.is_admin) {
      console.error('❌ User is not admin or profile missing:', profileError);
      console.error('Profile data:', profileData);
      alert('❌ UPDATE FAILED: Your account is not set as admin in the database.\n\nContact support to verify your admin status.');
      throw new Error('Not an admin user');
    }

    console.log('✅ Admin status verified');

    // Transform camelCase to snake_case for database
    const dbUpdate: any = {};
    if (updatedVehicle.vin !== undefined) dbUpdate.vin = updatedVehicle.vin;
    if (updatedVehicle.make !== undefined) dbUpdate.make = updatedVehicle.make;
    if (updatedVehicle.model !== undefined) dbUpdate.model = updatedVehicle.model;
    if (updatedVehicle.year !== undefined) dbUpdate.year = updatedVehicle.year;
    if (updatedVehicle.price !== undefined) dbUpdate.price = updatedVehicle.price;
    if (updatedVehicle.cost !== undefined) dbUpdate.cost = updatedVehicle.cost;
    if (updatedVehicle.costTowing !== undefined) dbUpdate.cost_towing = updatedVehicle.costTowing;
    if (updatedVehicle.costMechanical !== undefined) dbUpdate.cost_mechanical = updatedVehicle.costMechanical;
    if (updatedVehicle.costCosmetic !== undefined) dbUpdate.cost_cosmetic = updatedVehicle.costCosmetic;
    if (updatedVehicle.costOther !== undefined) dbUpdate.cost_other = updatedVehicle.costOther;
    if (updatedVehicle.soldPrice !== undefined) dbUpdate.sold_price = updatedVehicle.soldPrice;
    if (updatedVehicle.soldDate !== undefined) dbUpdate.sold_date = updatedVehicle.soldDate || null;
    if (updatedVehicle.mileage !== undefined) dbUpdate.mileage = updatedVehicle.mileage;
    if (updatedVehicle.status !== undefined) dbUpdate.status = updatedVehicle.status;
    // Always update description (even if empty string) to ensure it saves
    if (updatedVehicle.description !== undefined) dbUpdate.description = updatedVehicle.description || '';
    if (updatedVehicle.imageUrl !== undefined) dbUpdate.image_url = updatedVehicle.imageUrl || '';
    if (updatedVehicle.gallery !== undefined) dbUpdate.gallery = updatedVehicle.gallery || [];
    // Always update diagnostics (even if empty array) to ensure it saves
    if (updatedVehicle.diagnostics !== undefined) dbUpdate.diagnostics = updatedVehicle.diagnostics || [];
    if (updatedVehicle.registrationStatus !== undefined) dbUpdate.registration_status = updatedVehicle.registrationStatus;
    if (updatedVehicle.registrationDueDate !== undefined) dbUpdate.registration_due_date = updatedVehicle.registrationDueDate || null;
    if (updatedVehicle.dateAdded !== undefined) dbUpdate.date_added = updatedVehicle.dateAdded;

    console.log('🔄 Updating vehicle:', id, 'with data:', dbUpdate);
    console.log('👤 Current user:', user?.email || 'Not authenticated');

    const { data, error } = await supabase
      .from('vehicles')
      .update(dbUpdate)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase update error:', error);
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error.details || error.hint || '';
      const errorCode = error.code || '';
      alert(`Failed to update vehicle:\n${errorMessage}\n${errorDetails}\n\nError Code: ${errorCode}\n\nCheck console for details.`);
      throw new Error(`Update failed [${errorCode}]: ${errorMessage}`);
    }

    if (data && data.length > 0) {
      console.log('✅ Vehicle updated successfully:', data[0]);
      // Manually reload vehicles to ensure UI updates immediately
      await loadVehiclesFn();
    } else {
      // RLS silently blocks updates by returning empty array with no error
      // This means the update was REJECTED, not successful!
      console.error('❌ Update returned no data - RLS may have blocked the update');
      console.error('Current auth state:', user?.email || 'NOT AUTHENTICATED');

      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        alert('❌ UPDATE FAILED: You are not logged in!\n\nPlease log out and log back in to refresh your session.');
        throw new Error('Not authenticated');
      }

      alert('❌ UPDATE FAILED: Your changes were not saved.\n\nThis usually means:\n1. Your session expired - try logging out and back in\n2. The vehicle was deleted by someone else\n3. Database permissions issue\n\nCheck the browser console for details.');
      throw new Error('Update returned no data - RLS may have blocked');
    }
  } catch (error) {
    console.error('Unexpected error updating vehicle:', error);
    // Don't show another alert if we already showed one above
    if (!(error instanceof Error) || !error.message.includes('RLS')) {
      alert('Failed to update vehicle. Please try again.');
    }
    throw error; // Re-throw so the form doesn't reset
  }
}

// Delete vehicle from Supabase (Store.tsx lines 562-596)
export async function removeVehicle(
  id: string,
  loadVehiclesFn: () => Promise<void>
): Promise<void> {
  try {
    // Verify session before deleting
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      alert('❌ DELETE FAILED: You are not logged in!');
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle. Please check console for details.');
      return;
    }

    if (!data || data.length === 0) {
      console.error('❌ Delete returned no data - RLS may have blocked');
      alert('❌ DELETE FAILED: Permission denied or vehicle not found.');
      return;
    }

    console.log('✅ Vehicle deleted successfully');
    // Reload vehicles to update UI
    await loadVehiclesFn();
  } catch (error) {
    console.error('Unexpected error deleting vehicle:', error);
    alert('Failed to delete vehicle. Please try again.');
  }
}
