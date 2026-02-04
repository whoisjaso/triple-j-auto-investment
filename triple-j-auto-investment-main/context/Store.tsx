import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Vehicle, VehicleStatus, Lead, User } from '../types';
import { supabase } from '../supabase/config';
import { authService } from '../lib/auth';

// Import extracted modules
import {
  loadVehicles as loadVehiclesModule,
  addVehicle as addVehicleModule,
  updateVehicle as updateVehicleModule,
  removeVehicle as removeVehicleModule,
  FALLBACK_VEHICLES
} from '../lib/store/vehicles';
import {
  syncWithGoogleSheets as syncModule,
  GOOGLE_SHEET_URL
} from '../lib/store/sheets';
import {
  loadLeads as loadLeadsModule,
  addLead as addLeadModule
} from '../lib/store/leads';

// UNCHANGED: Context type interface (identical to original lines 11-29)
interface StoreContextType {
  vehicles: Vehicle[];
  leads: Lead[];
  user: User | null;
  lastSync: Date | null;
  isLoading: boolean;
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State declarations (same as before)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Create wrapper that calls module with current state/setters
  // Note: Using ref to track vehicles for loadVehicles to avoid stale closure
  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  const loadVehicles = async () => {
    await loadVehiclesModule(
      { setVehicles, setIsLoading, setConnectionError },
      vehiclesRef.current
    );
  };

  const loadLeads = async () => {
    await loadLeadsModule(setLeads);
  };

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
      console.warn('Warning: New version detected! Clearing old cached state...');
      localStorage.removeItem('supabase.auth.token');
      localStorage.setItem('tj_build_version', lastBuildVersion);
      // Force a hard reload to clear all cached JS
      if (typeof window !== 'undefined' && !window.location.search.includes('refreshed=1')) {
        console.log('Forcing hard refresh for new version...');
        window.location.href = window.location.pathname + '?refreshed=1';
        return; // Stop execution, page will reload
      }
    }
    localStorage.setItem('tj_build_version', lastBuildVersion);

    // 1. Verify Session First (Fastest check)
    console.log("Verifying Identity Protocol...");
    authService.getSession().then(sessionUser => {
      if (sessionUser) {
        setUser({ email: sessionUser.email, isAdmin: sessionUser.isAdmin });
        console.log("Session restored:", sessionUser.email);
      } else {
        console.log("No active session found. Operating in public mode.");
      }
    }).catch(err => {
      console.error("Auth Session Check Failed:", err);
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
      console.log("Auto-sync disabled. Use manual sync in admin panel if needed.");
    };

    initializeData();

    // 4. Setup real-time subscriptions
    const vehicleSubscription = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        console.log('Vehicle data changed, reloading...');
        loadVehicles();
      })
      .subscribe();

    const leadSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        console.log('Lead data changed, reloading...');
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

  // Auth functions (delegate to authService - unchanged from original)
  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    console.log('Authenticating with Supabase...');

    const authUser = await authService.login(email, password);
    if (authUser) {
      setUser({ email: authUser.email, isAdmin: authUser.isAdmin });
      console.log('Login successful:', authUser.email);
      return true;
    }

    console.error('Login failed');
    return false;
  };

  const triggerRecovery = () => {
    console.log("Security Alert: Unauthorized access attempt. Email dispatched.");
  };

  const logout = async (): Promise<void> => {
    console.log('Logging out...');
    await authService.logout();
    setUser(null);
    console.log('Logout successful');
  };

  // Vehicle CRUD wrappers - delegate to extracted module
  const addVehicle = async (v: Vehicle): Promise<void> => {
    await addVehicleModule(v, loadVehicles);
  };

  const updateVehicle = async (id: string, v: Partial<Vehicle>): Promise<void> => {
    await updateVehicleModule(id, v, user, loadVehicles);
  };

  const removeVehicle = async (id: string): Promise<void> => {
    await removeVehicleModule(id, loadVehicles);
  };

  // Sheets sync wrapper - delegate to extracted module
  const syncWithGoogleSheets = async (silent: boolean = false): Promise<string> => {
    return syncModule(
      {
        isSyncingRef,
        vehicles: vehiclesRef.current,
        setLastSync,
        setVehicles,
        loadVehiclesFn: loadVehicles,
        fallbackVehicles: FALLBACK_VEHICLES
      },
      silent
    );
  };

  // Lead wrapper - delegate to extracted module
  const addLead = async (l: Lead): Promise<void> => {
    await addLeadModule(l);
  };

  // Registration update (kept inline - only ~20 lines)
  const updateRegistration = async (id: string, status: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ registration_status: status })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Failed to update registration status:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Registration status updated:', data[0]);
      } else {
        console.warn('Registration update completed but no data returned');
      }
    } catch (error) {
      console.error('Unexpected error updating registration:', error);
    }
  };

  const resetToDefault = () => {
    if (window.confirm("DANGER: This will sync from Google Sheets and may overwrite database changes. Proceed?")) {
      syncWithGoogleSheets(false);
    }
  };

  // UNCHANGED: Provider value (identical shape to original)
  return (
    <StoreContext.Provider value={{
      vehicles,
      leads,
      user,
      lastSync,
      isLoading,
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

// UNCHANGED: Hook export (identical to original)
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
