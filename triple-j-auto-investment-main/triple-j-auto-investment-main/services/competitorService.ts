// ================================================================
// COMPETITOR MONITORING SERVICE
// Manual entry + analysis for market comparables
// Data structure ready for future automated scraping
// ================================================================

import { supabase } from '../supabase/config';
import { MarketComparable } from '../types';

// ================================================================
// TRANSFORMER
// ================================================================

function transformComparable(row: any): MarketComparable {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    source: row.source,
    comparablePrice: row.comparable_price,
    comparableYear: row.comparable_year,
    comparableMake: row.comparable_make,
    comparableModel: row.comparable_model,
    comparableMileage: row.comparable_mileage,
    comparableUrl: row.comparable_url,
    fetchedAt: row.fetched_at,
    createdAt: row.created_at,
  };
}

// ================================================================
// CRUD
// ================================================================

export async function getComparablesForVehicle(vehicleId: string): Promise<MarketComparable[]> {
  const { data, error } = await supabase
    .from('market_comparables')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch comparables:', error);
    return [];
  }
  return (data || []).map(transformComparable);
}

export async function addComparable(comparable: {
  vehicleId: string;
  source: string;
  comparablePrice: number;
  comparableYear?: number;
  comparableMake?: string;
  comparableModel?: string;
  comparableMileage?: number;
  comparableUrl?: string;
}): Promise<MarketComparable | null> {
  const { data, error } = await supabase
    .from('market_comparables')
    .insert([{
      vehicle_id: comparable.vehicleId,
      source: comparable.source,
      comparable_price: comparable.comparablePrice,
      comparable_year: comparable.comparableYear || null,
      comparable_make: comparable.comparableMake || null,
      comparable_model: comparable.comparableModel || null,
      comparable_mileage: comparable.comparableMileage || null,
      comparable_url: comparable.comparableUrl || null,
      fetched_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to add comparable:', error);
    return null;
  }
  return transformComparable(data);
}

export async function removeComparable(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('market_comparables')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to remove comparable:', error);
    return false;
  }
  return true;
}

// ================================================================
// ANALYSIS
// ================================================================

export async function computePricePosition(vehicleId: string): Promise<{
  avgMarketPrice: number;
  listingPrice: number;
  priceDelta: number;
  percentDiff: number;
  recommendation: 'underpriced' | 'overpriced' | 'competitive' | 'no_data';
  comparableCount: number;
} | null> {
  // Fetch vehicle
  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .select('price, market_estimate')
    .eq('id', vehicleId)
    .single();

  if (vErr || !vehicle) {
    console.error('Failed to fetch vehicle for price position:', vErr);
    return null;
  }

  // Fetch comparables
  const comparables = await getComparablesForVehicle(vehicleId);

  if (comparables.length === 0 && !vehicle.market_estimate) {
    return {
      avgMarketPrice: 0,
      listingPrice: vehicle.price,
      priceDelta: 0,
      percentDiff: 0,
      recommendation: 'no_data',
      comparableCount: 0,
    };
  }

  // Use comparables if available, fallback to market_estimate
  let avgMarketPrice: number;
  if (comparables.length > 0) {
    avgMarketPrice = Math.round(
      comparables.reduce((s, c) => s + c.comparablePrice, 0) / comparables.length
    );
  } else {
    avgMarketPrice = vehicle.market_estimate || 0;
  }

  const listingPrice = vehicle.price;
  const priceDelta = avgMarketPrice - listingPrice;
  const percentDiff = listingPrice > 0 ? Math.round((priceDelta / listingPrice) * 100) : 0;

  let recommendation: 'underpriced' | 'overpriced' | 'competitive';
  if (percentDiff > 10) {
    recommendation = 'underpriced'; // market avg is 10%+ higher than listing
  } else if (percentDiff < -10) {
    recommendation = 'overpriced'; // listing is 10%+ higher than market
  } else {
    recommendation = 'competitive';
  }

  return {
    avgMarketPrice,
    listingPrice,
    priceDelta,
    percentDiff,
    recommendation,
    comparableCount: comparables.length,
  };
}

export async function getVehiclesWithPriceOpportunity(): Promise<Array<{
  vehicleId: string;
  year: number;
  make: string;
  model: string;
  listingPrice: number;
  avgMarketPrice: number;
  delta: number;
}>> {
  // Vehicles where market avg > listing price by 10%+
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, year, make, model, price, market_estimate')
    .eq('status', 'Available')
    .not('market_estimate', 'is', null);

  if (error || !vehicles) {
    console.error('Failed to fetch vehicles for price opportunity:', error);
    return [];
  }

  const opportunities: Array<{
    vehicleId: string;
    year: number;
    make: string;
    model: string;
    listingPrice: number;
    avgMarketPrice: number;
    delta: number;
  }> = [];

  for (const v of vehicles) {
    if (v.market_estimate && v.price && v.market_estimate > v.price * 1.1) {
      opportunities.push({
        vehicleId: v.id,
        year: v.year,
        make: v.make,
        model: v.model,
        listingPrice: v.price,
        avgMarketPrice: v.market_estimate,
        delta: v.market_estimate - v.price,
      });
    }
  }

  return opportunities.sort((a, b) => b.delta - a.delta);
}
