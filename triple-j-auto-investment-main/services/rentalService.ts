/**
 * Rental Management Service
 * Handles all CRUD operations for rental bookings, customers, payments,
 * condition reports, and vehicle availability.
 *
 * Phase 06-02: TypeScript Types & Service Layer
 *
 * Tables: rental_bookings, rental_customers, rental_payments, rental_condition_reports
 * Pattern: Same snake_case -> camelCase transformer pattern as registrationService.ts
 */

import { supabase } from '../supabase/config';
import {
  Vehicle,
  VehicleStatus,
  ListingType,
  RentalBooking,
  RentalBookingStatus,
  RentalCustomer,
  RentalPayment,
  RentalConditionReport,
  PaymentMethod,
  ConditionChecklistItem,
  FuelLevel,
} from '../types';

// ================================================================
// DATA TRANSFORMERS (snake_case DB -> camelCase TS)
// ================================================================

/**
 * Transform database row to RentalCustomer interface
 */
const transformCustomer = (data: any): RentalCustomer => ({
  id: data.id,
  fullName: data.full_name,
  phone: data.phone,
  email: data.email ?? undefined,
  driversLicenseNumber: data.drivers_license_number,
  address: data.address,
  emergencyContactName: data.emergency_contact_name ?? undefined,
  emergencyContactPhone: data.emergency_contact_phone ?? undefined,
  employerName: data.employer_name ?? undefined,
  employerPhone: data.employer_phone ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

/**
 * Transform database row to RentalBooking interface
 * Parses JSONB arrays (authorized_drivers, permitted_states)
 * and optionally transforms nested joins (customer, vehicle, payments)
 */
const transformBooking = (data: any): RentalBooking => ({
  id: data.id,
  bookingId: data.booking_id,
  vehicleId: data.vehicle_id,
  customerId: data.customer_id,
  startDate: data.start_date,
  endDate: data.end_date,
  actualReturnDate: data.actual_return_date ?? undefined,
  dailyRate: parseFloat(data.daily_rate),
  weeklyRate: data.weekly_rate != null ? parseFloat(data.weekly_rate) : undefined,
  totalCost: parseFloat(data.total_cost),
  status: data.status as RentalBookingStatus,
  agreementSigned: data.agreement_signed ?? false,
  agreementPdfUrl: data.agreement_pdf_url ?? undefined,
  signatureData: data.signature_data ?? undefined,
  authorizedDrivers: Array.isArray(data.authorized_drivers) ? data.authorized_drivers : [],
  outOfStatePermitted: data.out_of_state_permitted ?? false,
  permittedStates: Array.isArray(data.permitted_states) ? data.permitted_states : [],
  mileageOut: data.mileage_out ?? undefined,
  mileageIn: data.mileage_in ?? undefined,
  mileageLimit: data.mileage_limit ?? undefined,
  lateFeeOverride: data.late_fee_override != null ? parseFloat(data.late_fee_override) : undefined,
  lateFeeNotes: data.late_fee_notes ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  // Optional nested joins
  customer: data.rental_customers ? transformCustomer(data.rental_customers) : undefined,
  vehicle: data.vehicles ? transformVehicle(data.vehicles) : undefined,
  payments: data.rental_payments
    ? (data.rental_payments as any[]).map(transformPayment)
    : undefined,
});

/**
 * Transform database row to RentalPayment interface
 */
const transformPayment = (data: any): RentalPayment => ({
  id: data.id,
  bookingId: data.booking_id,
  amount: parseFloat(data.amount),
  paymentMethod: data.payment_method as PaymentMethod,
  paymentDate: data.payment_date,
  notes: data.notes ?? undefined,
  recordedBy: data.recorded_by ?? undefined,
  createdAt: data.created_at,
});

/**
 * Transform database row to RentalConditionReport interface
 * Parses checklist_items and photo_urls JSONB fields
 */
const transformConditionReport = (data: any): RentalConditionReport => ({
  id: data.id,
  bookingId: data.booking_id,
  reportType: data.report_type as 'checkout' | 'return',
  checklistItems: Array.isArray(data.checklist_items) ? data.checklist_items : [],
  fuelLevel: data.fuel_level as FuelLevel,
  mileage: data.mileage,
  photoUrls: Array.isArray(data.photo_urls) ? data.photo_urls : [],
  completedBy: data.completed_by ?? undefined,
  completedAt: data.completed_at,
  createdAt: data.created_at,
});

/**
 * Transform vehicle DB row to Vehicle interface (minimal for availability queries)
 * Mirrors the transform in lib/store/vehicles.ts but includes rental fields
 */
const transformVehicle = (v: any): Vehicle => ({
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
// BOOKING CRUD
// ================================================================

/**
 * Fetch all bookings with customer and payment joins
 * Ordered by start_date descending (newest first)
 */
export async function getAllBookings(): Promise<RentalBooking[]> {
  try {
    const { data, error } = await supabase
      .from('rental_bookings')
      .select('*, rental_customers(*), rental_payments(*)')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return (data || []).map(transformBooking);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

/**
 * Fetch a single booking by ID with all joins
 */
export async function getBookingById(id: string): Promise<RentalBooking | null> {
  try {
    const { data, error } = await supabase
      .from('rental_bookings')
      .select('*, rental_customers(*), rental_payments(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Booking not found:', error);
      return null;
    }

    return transformBooking(data);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

/**
 * Fetch bookings that overlap with a given month (for calendar view)
 * Month is 0-indexed (JS convention): January = 0, December = 11
 */
export async function getBookingsForMonth(year: number, month: number): Promise<RentalBooking[]> {
  try {
    // Month is 0-indexed, so add 1 for the actual month number
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // Calculate month end: last day of the month
    // Create a date on the 1st of the NEXT month, then go back 1 day
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const lastDay = new Date(nextMonthYear, nextMonth, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Bookings that overlap with the month: start_date <= month_end AND end_date >= month_start
    const { data, error } = await supabase
      .from('rental_bookings')
      .select('*, rental_customers(*), rental_payments(*)')
      .lte('start_date', monthEnd)
      .gte('end_date', monthStart)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for month:', error);
      return [];
    }

    return (data || []).map(transformBooking);
  } catch (error) {
    console.error('Error fetching bookings for month:', error);
    return [];
  }
}

/**
 * Fetch active bookings (reserved, active, overdue)
 */
export async function getActiveBookings(): Promise<RentalBooking[]> {
  try {
    const { data, error } = await supabase
      .from('rental_bookings')
      .select('*, rental_customers(*), rental_payments(*)')
      .in('status', ['reserved', 'active', 'overdue'])
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching active bookings:', error);
      return [];
    }

    return (data || []).map(transformBooking);
  } catch (error) {
    console.error('Error fetching active bookings:', error);
    return [];
  }
}

/**
 * Create a new booking
 * Does NOT include booking_id (auto-generated by DB trigger)
 */
export async function createBooking(data: Partial<RentalBooking>): Promise<RentalBooking | null> {
  try {
    const insertData: Record<string, unknown> = {
      vehicle_id: data.vehicleId,
      customer_id: data.customerId,
      start_date: data.startDate,
      end_date: data.endDate,
      daily_rate: data.dailyRate,
      total_cost: data.totalCost,
      status: data.status || 'reserved',
    };

    // Optional fields
    if (data.weeklyRate != null) insertData.weekly_rate = data.weeklyRate;
    if (data.actualReturnDate != null) insertData.actual_return_date = data.actualReturnDate;
    if (data.agreementSigned != null) insertData.agreement_signed = data.agreementSigned;
    if (data.agreementPdfUrl != null) insertData.agreement_pdf_url = data.agreementPdfUrl;
    if (data.signatureData != null) insertData.signature_data = data.signatureData;
    if (data.authorizedDrivers) insertData.authorized_drivers = data.authorizedDrivers;
    if (data.outOfStatePermitted != null) insertData.out_of_state_permitted = data.outOfStatePermitted;
    if (data.permittedStates) insertData.permitted_states = data.permittedStates;
    if (data.mileageOut != null) insertData.mileage_out = data.mileageOut;
    if (data.mileageIn != null) insertData.mileage_in = data.mileageIn;
    if (data.mileageLimit != null) insertData.mileage_limit = data.mileageLimit;
    if (data.lateFeeOverride != null) insertData.late_fee_override = data.lateFeeOverride;
    if (data.lateFeeNotes != null) insertData.late_fee_notes = data.lateFeeNotes;
    if (data.notes != null) insertData.notes = data.notes;

    const { data: result, error } = await supabase
      .from('rental_bookings')
      .insert([insertData])
      .select('*, rental_customers(*), rental_payments(*)')
      .single();

    if (error || !result) {
      console.error('Error creating booking:', error);
      return null;
    }

    return transformBooking(result);
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
}

/**
 * Update an existing booking
 */
export async function updateBooking(id: string, data: Partial<RentalBooking>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.vehicleId !== undefined) updateData.vehicle_id = data.vehicleId;
    if (data.customerId !== undefined) updateData.customer_id = data.customerId;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.actualReturnDate !== undefined) updateData.actual_return_date = data.actualReturnDate;
    if (data.dailyRate !== undefined) updateData.daily_rate = data.dailyRate;
    if (data.weeklyRate !== undefined) updateData.weekly_rate = data.weeklyRate;
    if (data.totalCost !== undefined) updateData.total_cost = data.totalCost;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.agreementSigned !== undefined) updateData.agreement_signed = data.agreementSigned;
    if (data.agreementPdfUrl !== undefined) updateData.agreement_pdf_url = data.agreementPdfUrl;
    if (data.signatureData !== undefined) updateData.signature_data = data.signatureData;
    if (data.authorizedDrivers !== undefined) updateData.authorized_drivers = data.authorizedDrivers;
    if (data.outOfStatePermitted !== undefined) updateData.out_of_state_permitted = data.outOfStatePermitted;
    if (data.permittedStates !== undefined) updateData.permitted_states = data.permittedStates;
    if (data.mileageOut !== undefined) updateData.mileage_out = data.mileageOut;
    if (data.mileageIn !== undefined) updateData.mileage_in = data.mileageIn;
    if (data.mileageLimit !== undefined) updateData.mileage_limit = data.mileageLimit;
    if (data.lateFeeOverride !== undefined) updateData.late_fee_override = data.lateFeeOverride;
    if (data.lateFeeNotes !== undefined) updateData.late_fee_notes = data.lateFeeNotes;
    if (data.notes !== undefined) updateData.notes = data.notes;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('rental_bookings')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    return false;
  }
}

/**
 * Cancel a booking (set status to 'cancelled')
 */
export async function cancelBooking(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rental_bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}

/**
 * Return a booking (set status 'returned', actual_return_date, mileage_in)
 */
export async function returnBooking(
  id: string,
  actualReturnDate: string,
  mileageIn: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rental_bookings')
      .update({
        status: 'returned',
        actual_return_date: actualReturnDate,
        mileage_in: mileageIn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error returning booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error returning booking:', error);
    return false;
  }
}

// ================================================================
// CUSTOMER CRUD
// ================================================================

/**
 * Fetch all rental customers
 */
export async function getAllCustomers(): Promise<RentalCustomer[]> {
  try {
    const { data, error } = await supabase
      .from('rental_customers')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return (data || []).map(transformCustomer);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

/**
 * Fetch a single customer by ID
 */
export async function getCustomerById(id: string): Promise<RentalCustomer | null> {
  try {
    const { data, error } = await supabase
      .from('rental_customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Customer not found:', error);
      return null;
    }

    return transformCustomer(data);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * Create a new rental customer
 */
export async function createCustomer(data: Partial<RentalCustomer>): Promise<RentalCustomer | null> {
  try {
    const insertData: Record<string, unknown> = {
      full_name: data.fullName,
      phone: data.phone,
      drivers_license_number: data.driversLicenseNumber,
      address: data.address,
    };

    if (data.email != null) insertData.email = data.email;
    if (data.emergencyContactName != null) insertData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone != null) insertData.emergency_contact_phone = data.emergencyContactPhone;
    if (data.employerName != null) insertData.employer_name = data.employerName;
    if (data.employerPhone != null) insertData.employer_phone = data.employerPhone;
    if (data.notes != null) insertData.notes = data.notes;

    const { data: result, error } = await supabase
      .from('rental_customers')
      .insert([insertData])
      .select()
      .single();

    if (error || !result) {
      console.error('Error creating customer:', error);
      return null;
    }

    return transformCustomer(result);
  } catch (error) {
    console.error('Error creating customer:', error);
    return null;
  }
}

/**
 * Update a rental customer
 */
export async function updateCustomer(id: string, data: Partial<RentalCustomer>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.driversLicenseNumber !== undefined) updateData.drivers_license_number = data.driversLicenseNumber;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContactName !== undefined) updateData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = data.emergencyContactPhone;
    if (data.employerName !== undefined) updateData.employer_name = data.employerName;
    if (data.employerPhone !== undefined) updateData.employer_phone = data.employerPhone;
    if (data.notes !== undefined) updateData.notes = data.notes;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('rental_customers')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating customer:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating customer:', error);
    return false;
  }
}

/**
 * Search customers by name, phone, email, or driver's license number
 */
export async function searchCustomers(query: string): Promise<RentalCustomer[]> {
  try {
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('rental_customers')
      .select('*')
      .or(
        `full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},drivers_license_number.ilike.${searchTerm}`
      )
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    return (data || []).map(transformCustomer);
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}

// ================================================================
// PAYMENT FUNCTIONS
// ================================================================

/**
 * Fetch all payments for a booking
 */
export async function getPaymentsForBooking(bookingId: string): Promise<RentalPayment[]> {
  try {
    const { data, error } = await supabase
      .from('rental_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return (data || []).map(transformPayment);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

/**
 * Create a payment for a booking
 */
export async function createPayment(data: {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy?: string;
}): Promise<RentalPayment | null> {
  try {
    const insertData: Record<string, unknown> = {
      booking_id: data.bookingId,
      amount: data.amount,
      payment_method: data.paymentMethod,
    };

    if (data.notes != null) insertData.notes = data.notes;
    if (data.recordedBy != null) insertData.recorded_by = data.recordedBy;

    const { data: result, error } = await supabase
      .from('rental_payments')
      .insert([insertData])
      .select()
      .single();

    if (error || !result) {
      console.error('Error creating payment:', error);
      return null;
    }

    return transformPayment(result);
  } catch (error) {
    console.error('Error creating payment:', error);
    return null;
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rental_payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting payment:', error);
    return false;
  }
}

// ================================================================
// CONDITION REPORT FUNCTIONS
// ================================================================

/**
 * Fetch condition reports for a booking
 */
export async function getConditionReports(bookingId: string): Promise<RentalConditionReport[]> {
  try {
    const { data, error } = await supabase
      .from('rental_condition_reports')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching condition reports:', error);
      return [];
    }

    return (data || []).map(transformConditionReport);
  } catch (error) {
    console.error('Error fetching condition reports:', error);
    return [];
  }
}

/**
 * Create a condition report
 */
export async function createConditionReport(
  data: Partial<RentalConditionReport>
): Promise<RentalConditionReport | null> {
  try {
    const insertData: Record<string, unknown> = {
      booking_id: data.bookingId,
      report_type: data.reportType,
      checklist_items: data.checklistItems || [],
      fuel_level: data.fuelLevel,
      mileage: data.mileage,
      photo_urls: data.photoUrls || [],
    };

    if (data.completedBy != null) insertData.completed_by = data.completedBy;

    const { data: result, error } = await supabase
      .from('rental_condition_reports')
      .insert([insertData])
      .select()
      .single();

    if (error || !result) {
      console.error('Error creating condition report:', error);
      return null;
    }

    return transformConditionReport(result);
  } catch (error) {
    console.error('Error creating condition report:', error);
    return null;
  }
}

// ================================================================
// AVAILABILITY FUNCTIONS
// ================================================================

/**
 * Get vehicles available for rental within a date range.
 * Fetches vehicles with listing_type IN ('rental_only', 'both'),
 * then excludes those with conflicting active bookings.
 * Uses two queries with client-side filtering.
 */
export async function getAvailableVehicles(
  startDate: string,
  endDate: string
): Promise<Vehicle[]> {
  try {
    // Query 1: All rental-eligible vehicles
    const { data: allVehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .in('listing_type', ['rental_only', 'both']);

    if (vehiclesError) {
      console.error('Error fetching rental vehicles:', vehiclesError);
      return [];
    }

    if (!allVehicles || allVehicles.length === 0) return [];

    // Query 2: Bookings that conflict with the requested date range
    // A booking conflicts if: status NOT IN (cancelled, returned)
    // AND start_date < endDate AND end_date > startDate (overlap check)
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from('rental_bookings')
      .select('vehicle_id')
      .not('status', 'in', '("cancelled","returned")')
      .lt('start_date', endDate)
      .gt('end_date', startDate);

    if (bookingsError) {
      console.error('Error fetching conflicting bookings:', bookingsError);
      // Return all vehicles if we can't check bookings (graceful degradation)
      return allVehicles.map(transformVehicle);
    }

    // Filter out vehicles with conflicting bookings
    const conflictingVehicleIds = new Set(
      (conflictingBookings || []).map((b: any) => b.vehicle_id)
    );

    const available = allVehicles.filter(
      (v: any) => !conflictingVehicleIds.has(v.id)
    );

    return available.map(transformVehicle);
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    return [];
  }
}

/**
 * Update a vehicle's listing type (sale_only, rental_only, both)
 */
export async function updateVehicleListingType(
  vehicleId: string,
  listingType: ListingType
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ listing_type: listingType })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error updating vehicle listing type:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating vehicle listing type:', error);
    return false;
  }
}

/**
 * Update a vehicle's rental rates and duration limits
 */
export async function updateVehicleRentalRates(
  vehicleId: string,
  dailyRate: number,
  weeklyRate?: number,
  minDays?: number,
  maxDays?: number
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      daily_rate: dailyRate,
    };

    if (weeklyRate !== undefined) updateData.weekly_rate = weeklyRate;
    if (minDays !== undefined) updateData.min_rental_days = minDays;
    if (maxDays !== undefined) updateData.max_rental_days = maxDays;

    const { error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId);

    if (error) {
      console.error('Error updating vehicle rental rates:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating vehicle rental rates:', error);
    return false;
  }
}

// ================================================================
// UTILITY FUNCTIONS (pure -- no DB calls)
// ================================================================

/**
 * Calculate late fee for a booking.
 * Pure function, no DB call.
 *
 * If override is not null, returns the override amount.
 * Otherwise computes days past due from endDate to
 * (actualReturnDate or today), multiplied by dailyRate.
 *
 * @returns { amount, days, isOverridden }
 */
export function calculateLateFee(
  endDate: string,
  actualReturnDate: string | null,
  dailyRate: number,
  override: number | null
): { amount: number; days: number; isOverridden: boolean } {
  if (override !== null) {
    // Admin has overridden (including 0 = waived)
    const returnOrToday = actualReturnDate ? new Date(actualReturnDate) : new Date();
    const end = new Date(endDate);
    const diffMs = returnOrToday.getTime() - end.getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { amount: override, days, isOverridden: true };
  }

  const returnOrToday = actualReturnDate ? new Date(actualReturnDate) : new Date();
  const end = new Date(endDate);
  const diffMs = returnOrToday.getTime() - end.getTime();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const amount = days * dailyRate;

  return { amount, days, isOverridden: false };
}

/**
 * Calculate total booking cost based on dates and rates.
 * If duration >= 7 days and weeklyRate is provided,
 * uses weekly chunks + daily remainder.
 * Otherwise all daily.
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param endDate - ISO date string (YYYY-MM-DD)
 * @param dailyRate - Daily rental rate
 * @param weeklyRate - Optional weekly rate (must be less than 7 * dailyRate to be useful)
 */
export function calculateBookingTotal(
  startDate: string,
  endDate: string,
  dailyRate: number,
  weeklyRate?: number
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (weeklyRate && totalDays >= 7) {
    const fullWeeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    return fullWeeks * weeklyRate + remainingDays * dailyRate;
  }

  return totalDays * dailyRate;
}
