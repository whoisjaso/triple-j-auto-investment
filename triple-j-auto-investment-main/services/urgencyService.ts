// Phase 16: Behavioral Intelligence - Urgency Badge Service
//
// Pure logic module -- no Supabase dependency.
// Computes honest urgency badges from real data:
// - Just Arrived: vehicle dateAdded within last 7 days
// - Popular: 10+ views from vehicle_view_counts
// - Offer Received: commitment_level >= 3 lead exists
//
// Zero admin overrides. Zero hardcoded badges. Data only.

import { Vehicle } from '../types';

export type UrgencyBadgeType = 'just_arrived' | 'popular' | 'offer_received';

export interface UrgencyBadgeData {
  type: UrgencyBadgeType;
  label: string;
  labelEs: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const POPULAR_THRESHOLD = 10;

/**
 * Compute urgency badges for a single vehicle from real data.
 * Returns an array of applicable badges (may be empty, may have multiple).
 */
export function computeBadges(
  vehicle: Vehicle,
  viewCount: number,
  hasOffer: boolean
): UrgencyBadgeData[] {
  const badges: UrgencyBadgeData[] = [];

  // 1. Just Arrived: dateAdded exists and is within the last 7 days
  if (vehicle.dateAdded) {
    const ageMs = Date.now() - new Date(vehicle.dateAdded).getTime();
    if (ageMs >= 0 && ageMs <= SEVEN_DAYS_MS) {
      badges.push({
        type: 'just_arrived',
        label: 'Just Arrived',
        labelEs: 'Recien Llegado',
      });
    }
  }

  // 2. Popular: 10+ views in the last 7 days
  if (viewCount >= POPULAR_THRESHOLD) {
    badges.push({
      type: 'popular',
      label: `Popular \u00b7 ${viewCount} views`,
      labelEs: `Popular \u00b7 ${viewCount} vistas`,
    });
  }

  // 3. Offer Received: at least one lead with commitment_level >= 3
  if (hasOffer) {
    badges.push({
      type: 'offer_received',
      label: 'Offer Received',
      labelEs: 'Oferta Recibida',
    });
  }

  return badges;
}
