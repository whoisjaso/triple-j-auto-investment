import React from 'react';
import { supabase } from '../../supabase/config';
import { Vehicle, VehicleStatus } from '../../types';

// --- CONFIGURATION ---
export const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHeta2U3ATyxE4hlQC3-kVCV8Iu-hnJYQIij68ptCBZYVw4C4vxIiu2fli5ltWXdsb7uVKxXco9WE3/pub?output=csv";

// --- VEHICLE CAPTION GENERATOR ---
export const generateVehicleCaption = (make: string, model: string, year: number, mileage: number, price: number) => {
  const templates = [
    `Reliable and well-maintained. This ${year} ${make} ${model} has ${mileage.toLocaleString()} miles and has been inspected for quality. Great option for daily driving and family use.`,
    `A dependable choice. The ${year} ${make} ${model} offers solid value with ${mileage.toLocaleString()} miles on the odometer. Clean title and ready for its next owner.`,
    `Well-kept ${year} ${make} ${model} with ${mileage.toLocaleString()} miles. Practical, fuel-efficient, and perfect for everyday commuting. Come see it at our Houston lot.`,
    `This ${year} ${make} ${model} is a smart pick for families and commuters. With ${mileage.toLocaleString()} miles and regular maintenance, it has plenty of life left.`,
    `Looking for an affordable, reliable ride? This ${year} ${make} ${model} with ${mileage.toLocaleString()} miles is a great value. Inspected and ready to go.`,
    `Clean title ${year} ${make} ${model} with ${mileage.toLocaleString()} miles. Honest pricing, no hidden fees. Stop by Triple J Auto Investment to take it for a test drive.`
  ];

  const index = (year + mileage + model.length) % templates.length;
  return templates[index];
};

// --- CSV PARSER (handles escaped quotes, trims BOM) ---
export const parseCSVLine = (str: string) => {
  // Strip BOM if present
  if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);

  const arr: string[] = [];
  let quote = false;
  let col = "";
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') {
      // Handle escaped quote ("") inside quoted field
      if (quote && i + 1 < str.length && str[i + 1] === '"') {
        col += '"';
        i++; // skip next quote
        continue;
      }
      quote = !quote;
      continue;
    }
    if (c === ',' && !quote) { arr.push(col.trim()); col = ""; continue; }
    col += c;
  }
  arr.push(col.trim());
  return arr;
};

// --- STATUS NORMALIZER (case-insensitive mapping) ---
const normalizeStatus = (raw: string): VehicleStatus => {
  if (!raw) return VehicleStatus.AVAILABLE;
  const s = raw.trim().toLowerCase();
  if (s === 'draft') return VehicleStatus.DRAFT;
  if (s === 'sold' || s === 'sold out') return VehicleStatus.SOLD;
  if (s === 'pending' || s === 'hold' || s === 'reserved') return VehicleStatus.PENDING;
  return VehicleStatus.AVAILABLE; // "available", "in stock", "active", or anything else
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

    // Split CSV properly — handle newlines inside quoted fields
    const lines: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') inQuote = !inQuote;
      if ((c === '\n' || c === '\r') && !inQuote) {
        if (current.trim() !== '') lines.push(current);
        // Skip \r\n pair
        if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
        current = "";
        continue;
      }
      current += c;
    }
    if (current.trim() !== '') lines.push(current);

    if (lines.length < 2) {
      deps.isSyncingRef.current = false;
      deps.setLastSync(new Date());
      if (deps.vehicles.length === 0) deps.setVehicles(deps.fallbackVehicles);
      return "Sheet Empty. Backup Protocols Standby.";
    }

    const headers = parseCSVLine(lines[0].toLowerCase());

    const findIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    // Price column: MUST prioritize "Current List Price" over "Target List Price"
    let priceIdx = headers.findIndex(h => h.includes('current list') && !h.includes('target'));
    if (priceIdx === -1) {
      priceIdx = headers.findIndex(h =>
        (h.includes('list price') || h.includes('retail') || h.includes('asking') || h.includes('selling'))
        && !h.includes('target')
      );
    }
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
      dateAdded: findIdx(['date', 'added', 'intake']),
      soldPrice: findIdx(['sold price', 'sale price', 'sold for']),
      soldDate: findIdx(['sold date', 'sale date']),
      costTowing: findIdx(['tow', 'transport', 'logistics']),
      costMechanical: findIdx(['mechanic', 'repair']),
      costCosmetic: findIdx(['cosmetic', 'detail', 'body']),
      costOther: findIdx(['other cost', 'misc', 'fee']),
    };

    if (idx.vin === -1) {
      deps.isSyncingRef.current = false;
      console.warn("VIN Column Missing. Sheet structure invalid.");
      if (deps.vehicles.length === 0) deps.setVehicles(deps.fallbackVehicles);
      return "ERROR: Invalid Sheet Structure.";
    }

    console.log(`[Sheets Sync] Found ${lines.length - 1} data rows. Header columns mapped:`, idx);

    const dbRows: any[] = [];
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);

      const vin = row[idx.vin]?.trim().toUpperCase();
      if (!vin || vin.length < 3) {
        skippedCount++;
        console.warn(`[Sheets Sync] Row ${i + 1}: Skipped — empty or invalid VIN: "${row[idx.vin]}"`);
        continue;
      }

      const make = idx.make > -1 ? (row[idx.make] || 'Unknown').trim() : 'Unknown';
      const model = idx.model > -1 ? (row[idx.model] || 'Vehicle').trim() : 'Vehicle';
      const year = idx.year > -1 ? (parseInt(row[idx.year]) || new Date().getFullYear()) : new Date().getFullYear();
      const mileage = idx.mileage > -1 ? (parseInt(row[idx.mileage]?.replace(/[^0-9]+/g, "")) || 0) : 0;
      const price = idx.price > -1 ? (parseFloat(row[idx.price]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const cost = idx.cost > -1 ? (parseFloat(row[idx.cost]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const dateAdded = idx.dateAdded > -1 && row[idx.dateAdded]?.trim() ? row[idx.dateAdded].trim() : new Date().toISOString().split('T')[0];

      // Parse optional cost breakdown columns
      const costTowing = idx.costTowing > -1 ? (parseFloat(row[idx.costTowing]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const costMechanical = idx.costMechanical > -1 ? (parseFloat(row[idx.costMechanical]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const costCosmetic = idx.costCosmetic > -1 ? (parseFloat(row[idx.costCosmetic]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const costOther = idx.costOther > -1 ? (parseFloat(row[idx.costOther]?.replace(/[^0-9.-]+/g, "")) || 0) : 0;

      // Parse sold price and date
      const soldPrice = idx.soldPrice > -1 ? (parseFloat(row[idx.soldPrice]?.replace(/[^0-9.-]+/g, "")) || null) : null;
      const soldDate = idx.soldDate > -1 && row[idx.soldDate]?.trim() ? row[idx.soldDate].trim() : null;

      let description = idx.desc > -1 ? row[idx.desc] : '';
      if (!description || description.trim().length < 10) {
        description = generateVehicleCaption(make, model, year, mileage, price);
      }

      let imageUrl = (idx.image > -1 && row[idx.image]) ? row[idx.image].trim() : '';
      if (!imageUrl || imageUrl.length < 5) {
        imageUrl = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2830&auto=format&fit=crop';
      }

      const galleryStr = (idx.gallery > -1 && row[idx.gallery]) ? row[idx.gallery] : '';
      const gallery = galleryStr ? galleryStr.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 5) : [];

      const diagStr = (idx.diagnostics > -1 && row[idx.diagnostics]) ? row[idx.diagnostics] : '';
      const diagnostics = diagStr ? diagStr.split('|').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];

      // Normalize status with case-insensitive mapping
      const rawStatus = idx.status > -1 ? row[idx.status] : '';
      const status = normalizeStatus(rawStatus);

      // Build DB row for batch upsert
      const dbRow: any = {
        vin: vin,
        make: make,
        model: model,
        year: year,
        price: price,
        cost: cost,
        cost_towing: costTowing,
        cost_mechanical: costMechanical,
        cost_cosmetic: costCosmetic,
        cost_other: costOther,
        mileage: mileage,
        status: status,
        description: description,
        image_url: imageUrl,
        gallery: gallery,
        diagnostics: diagnostics,
        registration_status: 'Pending',
        date_added: dateAdded,
      };

      // Only include sold fields if they have values (avoid overwriting with null)
      if (soldPrice) dbRow.sold_price = soldPrice;
      if (soldDate) dbRow.sold_date = soldDate;

      dbRows.push(dbRow);
    }

    console.log(`[Sheets Sync] Parsed ${dbRows.length} vehicles (${skippedCount} rows skipped).`);

    if (dbRows.length === 0) {
      deps.isSyncingRef.current = false;
      deps.setLastSync(new Date());
      return `SYNC: 0 vehicles found in sheet (${skippedCount} rows skipped).`;
    }

    // Batch upsert in chunks of 50 for reliability
    const CHUNK_SIZE = 50;
    let successCount = 0;
    let failCount = 0;
    const failedVins: string[] = [];

    for (let i = 0; i < dbRows.length; i += CHUNK_SIZE) {
      const chunk = dbRows.slice(i, i + CHUNK_SIZE);

      const { error } = await supabase
        .from('vehicles')
        .upsert(chunk, {
          onConflict: 'vin',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`[Sheets Sync] Batch upsert failed for chunk ${i / CHUNK_SIZE + 1}:`, error);
        // Fall back to individual upserts for this chunk
        for (const row of chunk) {
          const { error: singleError } = await supabase
            .from('vehicles')
            .upsert(row, { onConflict: 'vin', ignoreDuplicates: false });

          if (singleError) {
            failCount++;
            failedVins.push(row.vin);
            console.warn(`[Sheets Sync] FAILED: ${row.vin} (${row.year} ${row.make} ${row.model}) — ${singleError.message}`);
          } else {
            successCount++;
          }
        }
      } else {
        successCount += chunk.length;
      }
    }

    deps.isSyncingRef.current = false;
    deps.setLastSync(new Date());

    // Build result message
    let msg = `SYNC COMPLETE: ${successCount}/${dbRows.length} vehicles synced.`;
    if (failCount > 0) {
      msg += ` ${failCount} FAILED: ${failedVins.join(', ')}`;
      console.error(`[Sheets Sync] ${failCount} vehicles failed to sync:`, failedVins);
    }
    if (skippedCount > 0) {
      msg += ` (${skippedCount} rows skipped — no VIN)`;
    }

    console.log(`[Sheets Sync] ${msg}`);

    // Reload from database to get UUIDs
    await deps.loadVehiclesFn();

    return msg;
  } catch (error) {
    console.warn("[Sheets Sync] Google Sheets sync failed:", error);

    if (deps.vehicles.length === 0) {
      console.warn("[Sheets Sync] No vehicles found, loading fallback data.");
      deps.setVehicles(deps.fallbackVehicles);
    }

    deps.isSyncingRef.current = false;
    return "SYNC FAILED. Using existing Supabase data.";
  }
}
