// Phase 16: Vehicle Recommendation Service
//
// Pure function module -- no Supabase dependency.
// Scores vehicle similarity based on make, price, year, and mileage,
// then returns top N recommendations from available inventory.

import type { Vehicle } from '../types';

/**
 * Score similarity between two vehicles.
 * - Same make: +3
 * - Price within 20%: +2
 * - Year within 3: +1
 * - Mileage within 20,000: +1
 * Maximum score per pair: 7
 */
export function scoreSimilarity(a: Vehicle, b: Vehicle): number {
  let score = 0;

  // Same make: +3
  if (a.make.toLowerCase() === b.make.toLowerCase()) {
    score += 3;
  }

  // Price within 20%: +2
  if (a.price > 0 && b.price > 0) {
    const maxPrice = Math.max(a.price, b.price);
    const minPrice = Math.min(a.price, b.price);
    if (maxPrice - minPrice <= maxPrice * 0.2) {
      score += 2;
    }
  }

  // Year within 3: +1
  if (Math.abs(a.year - b.year) <= 3) {
    score += 1;
  }

  // Mileage within 20,000: +1
  if (Math.abs(a.mileage - b.mileage) <= 20000) {
    score += 1;
  }

  return score;
}

/**
 * Get recommended vehicles based on recently viewed vehicles.
 * Filters out viewed vehicles and non-Available vehicles, scores each
 * candidate against ALL viewed vehicles (sum scores), sorts descending,
 * and returns top `limit` vehicles.
 */
export function getRecommendations(
  viewedVehicles: Vehicle[],
  allVehicles: Vehicle[],
  limit = 4
): Vehicle[] {
  if (viewedVehicles.length === 0) return [];

  // Set of viewed vehicle IDs for O(1) exclusion
  const viewedIds = new Set(viewedVehicles.map(v => v.id));

  // Filter candidates: exclude viewed, keep only Available
  const candidates = allVehicles.filter(
    v => !viewedIds.has(v.id) && v.status === 'Available'
  );

  // Score each candidate against ALL viewed vehicles
  const scored = candidates.map(candidate => {
    const totalScore = viewedVehicles.reduce(
      (sum, viewed) => sum + scoreSimilarity(viewed, candidate),
      0
    );
    return { vehicle: candidate, score: totalScore };
  });

  // Sort descending by score, take top limit
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(s => s.vehicle);
}
