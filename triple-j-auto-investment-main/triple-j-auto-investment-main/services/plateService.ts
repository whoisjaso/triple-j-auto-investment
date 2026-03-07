/**
 * Plate Tracking Service
 * Handles all CRUD operations for plates, assignments, alerts,
 * history, and photo uploads.
 *
 * Phase 07-01: Database, Types & Service Layer
 *
 * Tables: plates, plate_assignments, plate_alerts
 * Pattern: Same snake_case -> camelCase transformer pattern as rentalService.ts
 */

import { supabase } from '../supabase/config';
import {
  Plate,
  PlateAssignment,
  PlateAlert,
  PlateType,
  PlateStatus,
  PlateAssignmentType,
  PlateAlertType,
  PlateAlertSeverity,
  Vehicle,
  VehicleStatus,
} from '../types';

// ================================================================
// DATA TRANSFORMERS (snake_case DB -> camelCase TS)
// ================================================================

/**
 * Transform database row to PlateAssignment interface
 * Handles optional vehicle join if present
 */
const transformAssignment = (data: any): PlateAssignment => ({
  id: data.id,
  plateId: data.plate_id,
  vehicleId: data.vehicle_id ?? undefined,
  bookingId: data.booking_id ?? undefined,
  registrationId: data.registration_id ?? undefined,
  customerName: data.customer_name ?? undefined,
  customerPhone: data.customer_phone ?? undefined,
  assignmentType: data.assignment_type as PlateAssignmentType,
  assignedAt: data.assigned_at,
  expectedReturnDate: data.expected_return_date ?? undefined,
  returnedAt: data.returned_at ?? undefined,
  returnConfirmed: data.return_confirmed ?? false,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
  // Optional joins
  plate: data.plates ? transformPlate(data.plates) : undefined,
  vehicle: data.vehicles ? transformVehicleMinimal(data.vehicles) : undefined,
});

/**
 * Transform database row to Plate interface
 * For currentAssignment, filters plate_assignments to only active (returned_at IS NULL)
 */
const transformPlate = (data: any): Plate => {
  // Find active assignment from joined plate_assignments array
  let activeAssignment: PlateAssignment | undefined;
  if (Array.isArray(data.plate_assignments)) {
    const active = data.plate_assignments.find(
      (a: any) => a.returned_at === null || a.returned_at === undefined
    );
    if (active) {
      activeAssignment = transformAssignment(active);
    }
  }

  return {
    id: data.id,
    plateNumber: data.plate_number,
    plateType: data.plate_type as PlateType,
    status: data.status as PlateStatus,
    expirationDate: data.expiration_date ?? undefined,
    photoUrl: data.photo_url ?? undefined,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    currentAssignment: activeAssignment,
  };
};

/**
 * Transform database row to PlateAlert interface
 */
const transformAlert = (data: any): PlateAlert => ({
  id: data.id,
  plateId: data.plate_id,
  alertType: data.alert_type as PlateAlertType,
  severity: data.severity as PlateAlertSeverity,
  firstDetectedAt: data.first_detected_at,
  lastNotifiedAt: data.last_notified_at ?? undefined,
  resolvedAt: data.resolved_at ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
});

/**
 * Transform vehicle DB row to Vehicle interface (minimal for plate queries)
 * Mirrors the transform in rentalService.ts
 */
const transformVehicleMinimal = (v: any): Vehicle => ({
  id: v.id,
  vin: v.vin,
  make: v.make,
  model: v.model,
  year: v.year,
  price: v.price,
  cost: v.cost || 0,
  costTowing: v.cost_towing || 0,
  costMechanical: v.cost_mechanical || 0,
  costCosmetic: v.cost_cosmetic || 0,
  costOther: v.cost_other || 0,
  soldPrice: v.sold_price || undefined,
  soldDate: v.sold_date || undefined,
  mileage: v.mileage,
  status: v.status as VehicleStatus,
  description: v.description || '',
  imageUrl: v.image_url || '',
  gallery: v.gallery || [],
  diagnostics: v.diagnostics || [],
  registrationStatus: v.registration_status as any,
  registrationDueDate: v.registration_due_date || undefined,
  dateAdded: v.date_added,
  listingType: v.listing_type ?? 'sale_only',
  dailyRate: v.daily_rate != null ? parseFloat(v.daily_rate) : undefined,
  weeklyRate: v.weekly_rate != null ? parseFloat(v.weekly_rate) : undefined,
  minRentalDays: v.min_rental_days ?? undefined,
  maxRentalDays: v.max_rental_days ?? undefined,
});

// ================================================================
// PLATE CRUD
// ================================================================

/**
 * Fetch all plates with their current active assignment (if any)
 * Ordered by plate_number ascending
 */
export async function getAllPlates(): Promise<Plate[]> {
  try {
    const { data, error } = await supabase
      .from('plates')
      .select('*, plate_assignments(*)')
      .order('plate_number', { ascending: true });

    if (error) {
      console.error('Error fetching plates:', error);
      return [];
    }

    return (data || []).map(transformPlate);
  } catch (error) {
    console.error('Error fetching plates:', error);
    return [];
  }
}

/**
 * Fetch a single plate by ID with assignments
 */
export async function getPlateById(id: string): Promise<Plate | null> {
  try {
    const { data, error } = await supabase
      .from('plates')
      .select('*, plate_assignments(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Plate not found:', error);
      return null;
    }

    return transformPlate(data);
  } catch (error) {
    console.error('Error fetching plate:', error);
    return null;
  }
}

/**
 * Create a new plate
 */
export async function createPlate(plate: Partial<Plate>): Promise<Plate | null> {
  try {
    const insertData: Record<string, unknown> = {
      plate_number: plate.plateNumber,
      plate_type: plate.plateType,
    };

    // Optional fields
    if (plate.status != null) insertData.status = plate.status;
    if (plate.expirationDate != null) insertData.expiration_date = plate.expirationDate;
    if (plate.photoUrl != null) insertData.photo_url = plate.photoUrl;
    if (plate.notes != null) insertData.notes = plate.notes;

    const { data, error } = await supabase
      .from('plates')
      .insert([insertData])
      .select('*, plate_assignments(*)')
      .single();

    if (error || !data) {
      console.error('Error creating plate:', error);
      return null;
    }

    return transformPlate(data);
  } catch (error) {
    console.error('Error creating plate:', error);
    return null;
  }
}

/**
 * Update an existing plate
 */
export async function updatePlate(id: string, updates: Partial<Plate>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.plateNumber !== undefined) updateData.plate_number = updates.plateNumber;
    if (updates.plateType !== undefined) updateData.plate_type = updates.plateType;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.expirationDate !== undefined) updateData.expiration_date = updates.expirationDate;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('plates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating plate:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating plate:', error);
    return false;
  }
}

/**
 * Delete a plate (only if no active assignments)
 */
export async function deletePlate(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('plates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plate:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting plate:', error);
    return false;
  }
}

// ================================================================
// PLATES-OUT QUERY
// ================================================================

/**
 * Fetch plates currently out (status = 'assigned')
 * Includes active assignment with vehicle info
 */
export async function getPlatesOut(): Promise<Plate[]> {
  try {
    const { data, error } = await supabase
      .from('plates')
      .select('*, plate_assignments(*, vehicles(*))')
      .eq('status', 'assigned')
      .order('plate_number', { ascending: true });

    if (error) {
      console.error('Error fetching plates out:', error);
      return [];
    }

    return (data || []).map(transformPlate);
  } catch (error) {
    console.error('Error fetching plates out:', error);
    return [];
  }
}

// ================================================================
// AVAILABLE PLATES
// ================================================================

/**
 * Fetch available dealer plates (type = 'dealer', status = 'available')
 * Used for plate selection during rental booking creation
 */
export async function getAvailableDealerPlates(): Promise<Plate[]> {
  try {
    const { data, error } = await supabase
      .from('plates')
      .select('*')
      .eq('plate_type', 'dealer')
      .eq('status', 'available')
      .order('plate_number', { ascending: true });

    if (error) {
      console.error('Error fetching available dealer plates:', error);
      return [];
    }

    return (data || []).map(transformPlate);
  } catch (error) {
    console.error('Error fetching available dealer plates:', error);
    return [];
  }
}

// ================================================================
// ASSIGNMENT OPERATIONS
// ================================================================

/**
 * Assign a plate to a rental booking
 * Creates a new plate_assignment record with assignment_type = 'rental'
 * DB trigger auto-updates plate status to 'assigned'
 */
export async function assignPlateToBooking(
  plateId: string,
  bookingId: string,
  vehicleId: string,
  customerName: string,
  customerPhone: string,
  expectedReturnDate: string
): Promise<PlateAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('plate_assignments')
      .insert([{
        plate_id: plateId,
        booking_id: bookingId,
        vehicle_id: vehicleId,
        customer_name: customerName,
        customer_phone: customerPhone,
        assignment_type: 'rental',
        expected_return_date: expectedReturnDate,
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error assigning plate to booking:', error);
      return null;
    }

    return transformAssignment(data);
  } catch (error) {
    console.error('Error assigning plate to booking:', error);
    return null;
  }
}

/**
 * Assign a plate to a sale (buyer's tag)
 * Creates a new plate_assignment record with assignment_type = 'sale'
 * Also updates the plate's expiration_date if it's a buyer's tag
 */
export async function assignPlateToSale(
  plateId: string,
  registrationId: string,
  vehicleId: string,
  customerName: string,
  customerPhone: string,
  expirationDate: string
): Promise<PlateAssignment | null> {
  try {
    // Update plate expiration_date for buyer's tag tracking
    await supabase
      .from('plates')
      .update({ expiration_date: expirationDate })
      .eq('id', plateId);

    const { data, error } = await supabase
      .from('plate_assignments')
      .insert([{
        plate_id: plateId,
        registration_id: registrationId,
        vehicle_id: vehicleId,
        customer_name: customerName,
        customer_phone: customerPhone,
        assignment_type: 'sale',
        expected_return_date: expirationDate,
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error assigning plate to sale:', error);
      return null;
    }

    return transformAssignment(data);
  } catch (error) {
    console.error('Error assigning plate to sale:', error);
    return null;
  }
}

/**
 * Return a plate assignment (mark as returned)
 * DB trigger auto-updates plate status to 'available' if no other active assignments
 */
export async function returnPlateAssignment(
  assignmentId: string,
  returnConfirmed: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('plate_assignments')
      .update({
        returned_at: new Date().toISOString(),
        return_confirmed: returnConfirmed,
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error returning plate assignment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error returning plate assignment:', error);
    return false;
  }
}

/**
 * Swap a plate from one vehicle/booking to another
 * Two sequential operations: close current active assignment, then create new one.
 * Partial unique index prevents double-active, so old must close before new opens.
 */
export async function swapPlateAssignment(
  plateId: string,
  newVehicleId: string,
  newBookingId: string,
  customerName: string,
  customerPhone: string,
  expectedReturnDate: string
): Promise<PlateAssignment | null> {
  try {
    // Step 1: Find and close the current active assignment
    const { data: activeAssignments, error: findError } = await supabase
      .from('plate_assignments')
      .select('id')
      .eq('plate_id', plateId)
      .is('returned_at', null);

    if (findError) {
      console.error('Error finding active assignment for swap:', findError);
      return null;
    }

    if (activeAssignments && activeAssignments.length > 0) {
      const { error: closeError } = await supabase
        .from('plate_assignments')
        .update({
          returned_at: new Date().toISOString(),
          return_confirmed: true,
          notes: 'Closed by plate swap',
        })
        .eq('id', activeAssignments[0].id);

      if (closeError) {
        console.error('Error closing active assignment during swap:', closeError);
        return null;
      }
    }

    // Step 2: Create new assignment
    const { data, error } = await supabase
      .from('plate_assignments')
      .insert([{
        plate_id: plateId,
        vehicle_id: newVehicleId,
        booking_id: newBookingId,
        customer_name: customerName,
        customer_phone: customerPhone,
        assignment_type: 'rental',
        expected_return_date: expectedReturnDate,
      }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating new assignment during swap:', error);
      return null;
    }

    return transformAssignment(data);
  } catch (error) {
    console.error('Error swapping plate assignment:', error);
    return null;
  }
}

// ================================================================
// HISTORY
// ================================================================

/**
 * Fetch assignment history for a plate
 * Ordered by assigned_at descending (newest first)
 */
export async function getPlateHistory(plateId: string): Promise<PlateAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('plate_assignments')
      .select('*, vehicles(*)')
      .eq('plate_id', plateId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching plate history:', error);
      return [];
    }

    return (data || []).map(transformAssignment);
  } catch (error) {
    console.error('Error fetching plate history:', error);
    return [];
  }
}

// ================================================================
// ALERTS
// ================================================================

/**
 * Fetch all active (unresolved) alerts with plate info
 */
export async function getActiveAlerts(): Promise<PlateAlert[]> {
  try {
    const { data, error } = await supabase
      .from('plate_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('first_detected_at', { ascending: false });

    if (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }

    return (data || []).map(transformAlert);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}

/**
 * Resolve an alert (set resolved_at to now)
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('plate_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error resolving alert:', error);
    return false;
  }
}

// ================================================================
// PHOTO UPLOAD
// ================================================================

/**
 * Upload a plate photo to Supabase Storage
 * Stores in 'plate-photos' bucket at path plates/{plateId}/{timestamp}.{ext}
 * Returns public URL or null on failure
 */
export async function uploadPlatePhoto(
  plateId: string,
  file: File
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filePath = `plates/${plateId}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('plate-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading plate photo:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('plate-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      console.error('Error getting public URL for plate photo');
      return null;
    }

    // Update the plate's photo_url
    await supabase
      .from('plates')
      .update({ photo_url: publicUrl })
      .eq('id', plateId);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading plate photo:', error);
    return null;
  }
}

// ================================================================
// UTILITY FUNCTIONS (pure -- no DB calls)
// ================================================================

/**
 * Calculate buyer's tag expiry status.
 * Pure function, no DB call.
 *
 * Returns days remaining and severity tier:
 * - expired: <= 0 days remaining
 * - urgent: <= 7 days remaining (red tier)
 * - warning: <= 14 days remaining (yellow tier)
 * - ok: > 14 days remaining (green tier)
 *
 * Uses date math without time components to avoid timezone issues.
 */
export function calculateTagExpiry(expirationDate: string): {
  daysRemaining: number;
  severity: 'ok' | 'warning' | 'urgent' | 'expired';
} {
  const expiry = new Date(expirationDate);
  const today = new Date();
  // Zero out time components for pure date comparison
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let severity: 'ok' | 'warning' | 'urgent' | 'expired';
  if (daysRemaining <= 0) severity = 'expired';
  else if (daysRemaining <= 7) severity = 'urgent';
  else if (daysRemaining <= 14) severity = 'warning';
  else severity = 'ok';

  return { daysRemaining, severity };
}
