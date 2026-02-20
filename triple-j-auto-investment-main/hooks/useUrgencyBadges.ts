// Phase 16: Behavioral Intelligence - Urgency Badges Hook
//
// Fetches view counts and offer data from Supabase, refreshes every 5 minutes.
// Returns a getBadges(vehicle) function that components call for each vehicle.
// Errors are gracefully swallowed -- badges are optional, site works without them.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/config';
import { Vehicle } from '../types';
import { computeBadges, UrgencyBadgeData } from '../services/urgencyService';

const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface UseUrgencyBadgesReturn {
  getBadges: (vehicle: Vehicle) => UrgencyBadgeData[];
  loading: boolean;
  refresh: () => void;
}

export function useUrgencyBadges(): UseUrgencyBadgesReturn {
  const [viewCountMap, setViewCountMap] = useState<Map<string, number>>(new Map());
  const [offerSet, setOfferSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fire both queries in parallel
      const [viewResult, leadResult] = await Promise.all([
        supabase
          .from('vehicle_view_counts')
          .select('vehicle_id, views_7d'),
        supabase
          .from('leads')
          .select('vehicle_id')
          .gte('commitment_level', 3),
      ]);

      // Build view count map
      if (!viewResult.error && viewResult.data) {
        const map = new Map<string, number>();
        for (const row of viewResult.data) {
          if (row.vehicle_id && typeof row.views_7d === 'number') {
            map.set(row.vehicle_id, row.views_7d);
          }
        }
        setViewCountMap(map);
      } else if (viewResult.error) {
        console.warn('Urgency badges: view counts fetch failed:', viewResult.error.message);
      }

      // Build offer set
      if (!leadResult.error && leadResult.data) {
        const set = new Set<string>();
        for (const row of leadResult.data) {
          if (row.vehicle_id) {
            set.add(row.vehicle_id);
          }
        }
        setOfferSet(set);
      } else if (leadResult.error) {
        console.warn('Urgency badges: leads fetch failed:', leadResult.error.message);
      }
    } catch (err) {
      console.warn('Urgency badges: data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Refetch every 5 minutes
    intervalRef.current = setInterval(fetchData, REFETCH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  const getBadges = useCallback(
    (vehicle: Vehicle): UrgencyBadgeData[] => {
      return computeBadges(
        vehicle,
        viewCountMap.get(vehicle.id) || 0,
        offerSet.has(vehicle.id)
      );
    },
    [viewCountMap, offerSet]
  );

  return { getBadges, loading, refresh: fetchData };
}
