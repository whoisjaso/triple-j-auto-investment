import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'tj_recently_viewed';
const MAX_RECENT = 8;

interface RecentlyViewedEntry {
  vehicleId: string;
  viewedAt: string;
}

function loadEntries(): RecentlyViewedEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistEntries(entries: RecentlyViewedEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable -- silent fail
  }
}

export function useRecentlyViewed() {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>(loadEntries);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEntries(loadEntries());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addViewed = useCallback((vehicleId: string) => {
    setEntries(prev => {
      // Remove existing entry for this vehicleId (dedup)
      const filtered = prev.filter(e => e.vehicleId !== vehicleId);
      // Prepend new entry with current ISO timestamp
      const next = [
        { vehicleId, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      persistEntries(next);
      return next;
    });
  }, []);

  return {
    entries,
    addViewed,
    vehicleIds: entries.map(e => e.vehicleId),
  };
}
