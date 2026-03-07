import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'tj_saved_vehicles';

function loadSavedIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage full or unavailable -- silent fail
  }
}

export function useSavedVehicles() {
  const [savedIds, setSavedIds] = useState<string[]>(loadSavedIds);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSavedIds(loadSavedIds());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isSaved = useCallback((vehicleId: string) => {
    return savedIds.includes(vehicleId);
  }, [savedIds]);

  const toggleSave = useCallback((vehicleId: string) => {
    setSavedIds(prev => {
      const next = prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId];
      persistSavedIds(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSavedIds([]);
    persistSavedIds([]);
  }, []);

  return {
    savedIds,
    savedCount: savedIds.length,
    isSaved,
    toggleSave,
    clearAll,
  };
}
