
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { Lead, AppError, ErrorCodes } from '../types';
import { sendLeadNotification } from '../services/emailService';
import { supabase } from '../supabase/config';

interface StoreContextType {
  leads: Lead[];
  lastSync: Date | null;
  lastError: AppError | null;
  clearLastError: () => void;
  addLead: (l: Lead) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<AppError | null>(null);

  const isInitializedRef = useRef(false);

  // Clear last error (for use by StoreErrorBridge after consuming)
  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  // Helper to create AppError objects
  const createAppError = useCallback((code: string, message: string, details?: string): AppError => ({
    code,
    message,
    details,
    timestamp: new Date(),
    retryable: ![ErrorCodes.RLS_NOT_ADMIN, ErrorCodes.DB_DUPLICATE, ErrorCodes.DB_CONSTRAINT].includes(code as any),
  }), []);

  // --- SUPABASE DATA INITIALIZATION ---
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true; // Strict Mode protection

    console.log('Initializing Store Context (Leads only)...');

    // Load leads from Supabase
    loadLeads();

    // Setup real-time subscription for leads
    const leadSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        console.log('Lead data changed, reloading...');
        loadLeads();
      })
      .subscribe();

    // Cleanup
    return () => {
      leadSubscription.unsubscribe();
    };
  }, []);

  // --- DATA LOADING FUNCTIONS ---
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
      console.log(`Loaded ${data?.length || 0} leads from Supabase`);
    } catch (error) {
      console.error('Unexpected error loading leads:', error);
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
        setLastError(createAppError(ErrorCodes.DB_UNKNOWN, 'Failed to save lead. Please try again.', error.message));
        return;
      }

      console.log('Lead added successfully');

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
      setLastError(createAppError(ErrorCodes.DB_UNKNOWN, 'Failed to add lead. Please try again.', error instanceof Error ? error.message : undefined));
    }
  };

  return (
    <StoreContext.Provider value={{
      leads,
      lastSync,
      lastError,
      clearLastError,
      addLead,
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
