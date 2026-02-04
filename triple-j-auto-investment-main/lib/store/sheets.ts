import React from 'react';
import { supabase } from '../../supabase/config';
import { Vehicle, VehicleStatus } from '../../types';

// --- CONFIGURATION ---
export const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHeta2U3ATyxE4hlQC3-kVCV8Iu-hnJYQIij68ptCBZYVw4C4vxIiu2fli5ltWXdsb7uVKxXco9WE3/pub?output=csv";

// --- SOVEREIGN CAPTION GENERATOR ---
export const generateOpulentCaption = (make: string, model: string, year: number, mileage: number, price: number) => {
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

// --- CSV PARSER ---
export const parseCSVLine = (str: string) => {
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

// --- SYNC DEPENDENCIES INTERFACE ---
export interface SyncDependencies {
  isSyncingRef: React.MutableRefObject<boolean>;
  vehicles: Vehicle[];
  setLastSync: React.Dispatch<React.SetStateAction<Date | null>>;
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  loadVehiclesFn: () => Promise<void>;
  fallbackVehicles: Vehicle[];
}

// --- GOOGLE SHEETS SYNC FUNCTION ---
export async function syncWithGoogleSheets(
  deps: SyncDependencies,
  silent: boolean = false
): Promise<string> {
  if (!GOOGLE_SHEET_URL) return "ERROR: Config Missing";

  if (deps.isSyncingRef.current) return "Sync in progress...";
  deps.isSyncingRef.current = true;

  try {
    const response = await fetch(GOOGLE_SHEET_URL + '&t=' + Date.now()); // Cache buster
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      deps.isSyncingRef.current = false;
      deps.setLastSync(new Date());
      // Only load fallback if we have literally nothing
      if (deps.vehicles.length === 0) deps.setVehicles(deps.fallbackVehicles);
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
      deps.isSyncingRef.current = false;
      console.warn("VIN Column Missing. Sheet structure invalid.");
      // Don't overwrite existing vehicles with fallback - just return error
      if (deps.vehicles.length === 0) {
        deps.setVehicles(deps.fallbackVehicles);
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

    deps.isSyncingRef.current = false;
    deps.setLastSync(new Date());
    const msg = `SYNC COMPLETE: ${sheetVehicles.length} Assets synced to database.`;
    if (!silent) console.log(msg);

    // Reload from database to get UUIDs
    await deps.loadVehiclesFn();

    return msg;
  } catch (error) {
    console.warn("Google Sheets sync failed:", error);

    // Only load fallback if we have NO vehicles at all - don't overwrite existing data
    if (deps.vehicles.length === 0) {
      console.warn("No vehicles found, loading fallback data.");
      deps.setVehicles(deps.fallbackVehicles);
    }

    deps.isSyncingRef.current = false;
    return "SYNC FAILED. Using existing Supabase data.";
  }
}
