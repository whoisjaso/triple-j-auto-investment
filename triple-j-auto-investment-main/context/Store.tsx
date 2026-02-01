
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Vehicle, VehicleStatus, Lead, User } from '../types';
import { sendLeadNotification } from '../services/emailService';
import { supabase } from '../supabase/config';
import { authService } from '../lib/auth';

// --- CONFIGURATION ---
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHeta2U3ATyxE4hlQC3-kVCV8Iu-hnJYQIij68ptCBZYVw4C4vxIiu2fli5ltWXdsb7uVKxXco9WE3/pub?output=csv";

interface StoreContextType {
  vehicles: Vehicle[];
  leads: Lead[];
  user: User | null;
  lastSync: Date | null;
  isLoading: boolean;
  hasLoaded: boolean;
  connectionError: string | null;
  refreshVehicles: () => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  triggerRecovery: () => void;
  logout: () => Promise<void>;
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  syncWithGoogleSheets: (silent?: boolean) => Promise<string>;
  addLead: (l: Lead) => Promise<void>;
  updateRegistration: (id: string, status: string) => Promise<void>;
  resetToDefault: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- SOVEREIGN BACKUP PROTOCOL (FALLBACK DATA) ---
const FALLBACK_ASSETS: Vehicle[] = [
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

// --- SOVEREIGN CAPTION GENERATOR ---
const generateOpulentCaption = (make: string, model: string, year: number, mileage: number, price: number) => {
  const templates = [
    `Experience defines value. This ${year} ${make} ${model} carries the frequency of established power. With ${mileage.toLocaleString()} miles of operational history, it stands as a testament to durability and precision.`,
    `A vessel of proven authority. The ${make} ${model} is not merely built; it is forged. This specific example, seasoned by ${mileage.toLocaleString()} miles, offers a kinetic entry point into the higher echelons of status.`,
    `Time filters the weak. This ${year} ${make} ${model} remains. A sovereign asset with ${mileage.toLocaleString()} miles of legacy, ready to enforce your will upon the asphalt.`,
    `The ${make} ${model}. Engineering that transcends mere transportation. Having conquered ${mileage.toLocaleString()} miles, this machine has been initiated. It requires no introduction, only a capable operator.`,
    `Not for the uninitiated. This ${year} ${make} ${model} bears the marks of experience (${mileage.toLocaleString()} miles), verifying its resilience. A strategic acquisition for the sovereign mind.`,
    `Provenance verified. This ${make} ${model} exists at the intersection of luxury and legacy. With ${mileage.toLocaleString()} miles logged, it has proven its capacity for dominion.`
  ];

  const index = (year + mileage + model.length) % templates.length;
  return templates[index];
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // --- SUPABASE INITIALIZATION ---
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true; // Strict Mode protection

    console.log('Initializing Triple J Command Center with Supabase...');
    // @ts-ignore
    console.log('Targeting Supabase Node:', supabase.supabaseUrl);

    // CACHE BUSTER: Check if user needs a hard refresh
    const lastBuildVersion = '2025-12-28-v2'; // Update this when deploying
    const cachedVersion = localStorage.getItem('tj_build_version');
    if (cachedVersion && cachedVersion !== lastBuildVersion) {
      console.warn('⚠️ New version detected! Clearing old cached state...');
      localStorage.removeItem('supabase.auth.token');
      localStorage.setItem('tj_build_version', lastBuildVersion);
      // Force a hard reload to clear all cached JS
      if (typeof window !== 'undefined' && !window.location.search.includes('refreshed=1')) {
        console.log('🔄 Forcing hard refresh for new version...');
        window.location.href = window.location.pathname + '?refreshed=1';
        return; // Stop execution, page will reload
      }
    }
    localStorage.setItem('tj_build_version', lastBuildVersion);

    // 1. Verify Session First (Fastest check)
    console.log("🔐 Verifying Identity Protocol...");
    authService.getSession().then(sessionUser => {
      if (sessionUser) {
        setUser({ email: sessionUser.email, isAdmin: sessionUser.isAdmin });
        console.log("✅ Session restored:", sessionUser.email);
      } else {
        console.log("ℹ️ No active session found. Operating in public mode.");
      }
    }).catch(err => {
      console.error("⚠️ Auth Session Check Failed:", err);
    });

    // 2. Setup auth state listener
    const authListener = authService.onAuthStateChange(sessionUser => {
      if (sessionUser) {
        setUser({ email: sessionUser.email, isAdmin: sessionUser.isAdmin });
      } else {
        setUser(null);
      }
    });

    // 3. Load data from Supabase and sync from Google Sheets
    const initializeData = async () => {
      // Priority 1: Instant Load from DB
      await loadVehicles();
      await loadLeads();

      // Priority 2: Background Sync (Fire & Forget) - DISABLED to prevent overwriting Supabase data
      // Only sync from Google Sheets if Supabase is empty (manual sync available in admin)
      console.log("🔄 Auto-sync disabled. Use manual sync in admin panel if needed.");
      // setTimeout(() => {
      //   syncWithGoogleSheets(true).catch(err => console.error("Background Sync Failed:", err));
      // }, 100);
    };

    initializeData();

    // 4. Setup real-time subscriptions
    const vehicleSubscription = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        console.log('🔄 Vehicle data changed, reloading...');
        loadVehicles();
      })
      .subscribe();

    const leadSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        console.log('🔄 Lead data changed, reloading...');
        loadLeads();
      })
      .subscribe();

    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
      vehicleSubscription.unsubscribe();
      leadSubscription.unsubscribe();
    };
  }, []);

  // --- DATA LOADING FUNCTIONS ---
  const loadVehicles = async () => {
    // Don't show loading spinner on subsequent real-time triggered reloads
    if (!hasLoaded) {
      setIsLoading(true);
    }

    console.log('Loading vehicles from Supabase...');

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .abortSignal(abortController.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Failed to load vehicles:', error);
        setConnectionError(`Database Error: ${error.message}`);

        // Only use fallback on FIRST load if we have nothing
        if (!hasLoaded && vehicles.length === 0) {
          console.warn('Using fallback assets due to fetch error.');
          setVehicles(FALLBACK_ASSETS);
        }
        // Always mark as loaded so UI doesn't spin forever
        setHasLoaded(true);
        setIsLoading(false);
        return;
      }

      // Clear any previous error on success
      setConnectionError(null);

      // Transform data (keep existing transformation logic)
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

      setVehicles(transformed);
      setHasLoaded(true);
      setIsLoading(false);

      console.log(`Loaded ${transformed.length} vehicles.`);
    } catch (error) {
      console.error('Unexpected error loading vehicles:', error);

      // Handle abort specifically
      if (error instanceof Error && error.name === 'AbortError') {
        setConnectionError('Request timed out. Please try again.');
      }

      // Fallback only if first load and empty
      if (!hasLoaded && vehicles.length === 0) {
        setVehicles(FALLBACK_ASSETS);
      }

      setHasLoaded(true);
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to load leads:', error);
        return;
      }

      setLeads(data || []);
      console.log(`✅ Loaded ${data?.length || 0} leads from Supabase`);
    } catch (error) {
      console.error('Unexpected error loading leads:', error);
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    console.log('🔐 Authenticating with Supabase...');

    const authUser = await authService.login(email, password);
    if (authUser) {
      setUser({ email: authUser.email, isAdmin: authUser.isAdmin });
      console.log('✅ Login successful:', authUser.email);
      return true;
    }

    console.error('❌ Login failed');
    return false;
  };

  const triggerRecovery = () => {
    console.log("Security Alert: Unauthorized access attempt. Email dispatched.");
  };

  const logout = async (): Promise<void> => {
    console.log('🔓 Logging out...');
    await authService.logout();
    setUser(null);
    console.log('✅ Logout successful');
  };

  const addVehicle = async (v: Vehicle): Promise<void> => {
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

      const dateAdded = v.dateAdded || new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('vehicles')
        .insert([{
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
          description: v.description || '',
          image_url: v.imageUrl || '',
          gallery: v.gallery || [],
          diagnostics: v.diagnostics || [],
          registration_status: v.registrationStatus || 'Pending',
          registration_due_date: v.registrationDueDate || null,
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
      await loadVehicles();
    } catch (error) {
      console.error('Unexpected error adding vehicle:', error);
      // Don't double-alert
      if (!(error instanceof Error) || !error.message.includes('Add failed')) {
        alert('Failed to add vehicle. Please try again.');
      }
      throw error;
    }
  };

  const updateVehicle = async (id: string, updatedVehicle: Partial<Vehicle>): Promise<void> => {
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
        await loadVehicles();
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
  };

  const removeVehicle = async (id: string): Promise<void> => {
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
      await loadVehicles();
    } catch (error) {
      console.error('Unexpected error deleting vehicle:', error);
      alert('Failed to delete vehicle. Please try again.');
    }
  };

  const resetToDefault = () => {
    if (window.confirm("DANGER: This will sync from Google Sheets and may overwrite database changes. Proceed?")) {
      syncWithGoogleSheets(false);
    }
  };

  const parseCSVLine = (str: string) => {
    const arr = [];
    let quote = false;
    let col = "";
    for (let c of str) {
      if (c === '"') { quote = !quote; continue; }
      if (c === ',' && !quote) { arr.push(col); col = ""; continue; }
      col += c;
    }
    arr.push(col);
    return arr;
  };

  // REAL Automated Sync with "Source of Truth" Logic
  const syncWithGoogleSheets = async (silent: boolean = false): Promise<string> => {
    if (!GOOGLE_SHEET_URL) return "ERROR: Config Missing";

    if (isSyncingRef.current) return "Sync in progress...";
    isSyncingRef.current = true;

    try {
      const response = await fetch(GOOGLE_SHEET_URL + '&t=' + Date.now()); // Cache buster
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');

      if (lines.length < 2) {
        isSyncingRef.current = false;
        setLastSync(new Date());
        // Only load fallback if we have literally nothing
        if (vehicles.length === 0) setVehicles(FALLBACK_ASSETS);
        return "Sheet Empty. Backup Protocols Standby.";
      }

      const headers = parseCSVLine(lines[0].toLowerCase().trim());

      const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

      // Price column: MUST prioritize "Current List Price" over "Target List Price"
      // First, look specifically for "current list" (excludes "target")
      let priceIdx = headers.findIndex(h => h.includes('current list') && !h.includes('target'));

      // If not found, fall back to other price-related columns (but exclude "target")
      if (priceIdx === -1) {
        priceIdx = headers.findIndex(h =>
          (h.includes('list price') || h.includes('retail') || h.includes('asking') || h.includes('selling'))
          && !h.includes('target')
        );
      }

      // Last resort: any column with "price" (but still exclude "target")
      if (priceIdx === -1) {
        priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('target') && !h.includes('cost'));
      }

      const idx = {
        vin: findIdx(['vin', 'id']),
        make: findIdx(['make', 'brand']),
        model: findIdx(['model']),
        year: findIdx(['year']),
        price: priceIdx,
        cost: findIdx(['cost', 'buy', 'acquisition']),
        mileage: findIdx(['mileage', 'miles', 'odometer']),
        status: findIdx(['status']),
        image: findIdx(['image', 'photo', 'url', 'main']),
        gallery: findIdx(['gallery', 'images', 'photos', 'additional']),
        desc: findIdx(['desc', 'notes', 'caption']),
        diagnostics: findIdx(['diagnostic', 'issues', 'condition', 'flaws']),
        dateAdded: findIdx(['date', 'added', 'intake'])
      };

      if (idx.vin === -1) {
        isSyncingRef.current = false;
        console.warn("VIN Column Missing. Sheet structure invalid.");
        // Don't overwrite existing vehicles with fallback - just return error
        if (vehicles.length === 0) {
          setVehicles(FALLBACK_ASSETS);
        }
        return "ERROR: Invalid Sheet Structure.";
      }

      const sheetVehicles: Vehicle[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 2) continue;

        const vin = row[idx.vin]?.trim().toUpperCase();
        if (!vin) continue;

        const make = idx.make > -1 ? row[idx.make] : 'Unknown';
        const model = idx.model > -1 ? row[idx.model] : 'Special';
        const year = idx.year > -1 ? (parseInt(row[idx.year]) || new Date().getFullYear()) : new Date().getFullYear();
        const mileage = idx.mileage > -1 ? (parseInt(row[idx.mileage]?.replace(/[^0-9]+/g, "")) || 0) : 0;
        const price = idx.price > -1 ? (parseFloat(row[idx.price]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
        const cost = idx.cost > -1 ? (parseFloat(row[idx.cost]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
        const dateAdded = idx.dateAdded > -1 ? row[idx.dateAdded] : new Date().toISOString().split('T')[0];

        let description = idx.desc > -1 ? row[idx.desc] : '';
        if (!description || description.trim().length < 10) {
          description = generateOpulentCaption(make, model, year, mileage, price);
        }

        let imageUrl = (idx.image > -1 && row[idx.image]) ? row[idx.image] : '';
        if (!imageUrl || imageUrl.trim() === '') {
          imageUrl = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2830&auto=format&fit=crop';
        }

        const galleryStr = (idx.gallery > -1 && row[idx.gallery]) ? row[idx.gallery] : '';
        const gallery = galleryStr ? galleryStr.split(',').map(url => url.trim()).filter(url => url.length > 0) : [];

        const diagStr = (idx.diagnostics > -1 && row[idx.diagnostics]) ? row[idx.diagnostics] : '';
        const diagnostics = diagStr ? diagStr.split('|').map(s => s.trim()).filter(s => s.length > 0) : [];

        sheetVehicles.push({
          id: `sheet-${vin}`,
          vin: vin,
          make: make,
          model: model,
          year: year,
          price: price,
          cost: cost,
          costTowing: 0, // Default for sheet import
          costMechanical: 0,
          costCosmetic: 0,
          costOther: 0,
          mileage: mileage,
          status: idx.status > -1 ? (row[idx.status] as VehicleStatus) || VehicleStatus.AVAILABLE : VehicleStatus.AVAILABLE,
          imageUrl: imageUrl,
          gallery: gallery,
          diagnostics: diagnostics,
          description: description,
          registrationStatus: 'Pending',
          dateAdded: dateAdded
        });
      }

      // Insert/upsert vehicles to Supabase
      for (const vehicle of sheetVehicles) {
        const { error } = await supabase
          .from('vehicles')
          .upsert({
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price,
            cost: vehicle.cost,
            cost_towing: vehicle.costTowing,
            cost_mechanical: vehicle.costMechanical,
            cost_cosmetic: vehicle.costCosmetic,
            cost_other: vehicle.costOther,
            mileage: vehicle.mileage,
            status: vehicle.status,
            description: vehicle.description,
            image_url: vehicle.imageUrl,
            gallery: vehicle.gallery,
            diagnostics: vehicle.diagnostics,
            registration_status: vehicle.registrationStatus,
            date_added: vehicle.dateAdded,
          }, {
            onConflict: 'vin',
            ignoreDuplicates: false
          });

        if (error) {
          console.warn(`Failed to sync vehicle ${vehicle.vin}:`, error);
        }
      }

      isSyncingRef.current = false;
      setLastSync(new Date());
      const msg = `SYNC COMPLETE: ${sheetVehicles.length} Assets synced to database.`;
      if (!silent) console.log(msg);

      // Reload from database to get UUIDs
      await loadVehicles();

      return msg;
    } catch (error) {
      console.warn("Google Sheets sync failed:", error);

      // Only load fallback if we have NO vehicles at all - don't overwrite existing data
      if (vehicles.length === 0) {
        console.warn("No vehicles found, loading fallback data.");
        setVehicles(FALLBACK_ASSETS);
      }

      isSyncingRef.current = false;
      return "SYNC FAILED. Using existing Supabase data.";
    }
  };

  const addLead = async (l: Lead): Promise<void> => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: l.name,
          email: l.email,
          phone: l.phone,
          interest: l.interest,
          status: l.status || 'New',
          date: l.date || new Date().toISOString(),
        }]);

      if (error) {
        console.error('Failed to add lead:', error);
        alert('Failed to save lead. Please check console for details.');
        return;
      }

      console.log('✅ Lead added successfully');

      // Send email notification asynchronously (non-blocking)
      try {
        await sendLeadNotification({
          name: l.name,
          email: l.email,
          phone: l.phone,
          interest: l.interest
        });
      } catch (emailError) {
        console.error('Email notification failed, but lead was saved:', emailError);
      }

      // Note: Retell AI outbound call is triggered from Inventory.tsx with full vehicle context
      // This addLead function only saves the lead to database
    } catch (error) {
      console.error('Unexpected error adding lead:', error);
      alert('Failed to add lead. Please try again.');
    }
  };

  const updateRegistration = async (id: string, status: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ registration_status: status })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Failed to update registration status:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Registration status updated:', data[0]);
      } else {
        console.warn('⚠️ Registration update completed but no data returned');
      }
    } catch (error) {
      console.error('Unexpected error updating registration:', error);
    }
  };

  return (
    <StoreContext.Provider value={{
      vehicles,
      leads,
      user,
      lastSync,
      isLoading,
      hasLoaded,
      connectionError,
      refreshVehicles: loadVehicles,
      login,
      triggerRecovery,
      logout,
      addVehicle,
      updateVehicle,
      removeVehicle,
      syncWithGoogleSheets,
      addLead,
      updateRegistration,
      resetToDefault
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
