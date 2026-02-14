/**
 * Insurance Verification Service
 * Handles all CRUD operations for rental insurance records,
 * coverage validation, card image uploads, and customer pre-fill cache.
 *
 * Phase 08-01: Database, Types & Service Layer
 *
 * Tables: rental_insurance, insurance_alerts, rental_customers (pre-fill columns)
 * Pattern: Same snake_case -> camelCase transformer pattern as plateService.ts
 */

import { supabase } from '../supabase/config';
import {
  RentalInsurance,
  InsuranceAlert,
  InsuranceVerificationFlags,
  InsuranceType,
  InsuranceVerificationStatus,
  InsuranceAlertType,
  InsuranceAlertSeverity,
  TEXAS_MINIMUM_COVERAGE,
} from '../types';

// ================================================================
// DATA TRANSFORMERS (snake_case DB -> camelCase TS)
// ================================================================

/**
 * Transform database row to RentalInsurance interface.
 * Uses parseFloat for DECIMAL columns (dealer_coverage_daily_rate, dealer_coverage_total).
 * Uses direct assignment for INTEGER columns (bodily_injury_*, property_damage).
 */
export const transformInsurance = (data: any): RentalInsurance => ({
  id: data.id,
  bookingId: data.booking_id,
  insuranceType: data.insurance_type as InsuranceType,
  insuranceCompany: data.insurance_company ?? undefined,
  policyNumber: data.policy_number ?? undefined,
  effectiveDate: data.effective_date ?? undefined,
  expirationDate: data.expiration_date ?? undefined,
  bodilyInjuryPerPerson: data.bodily_injury_per_person ?? undefined,
  bodilyInjuryPerAccident: data.bodily_injury_per_accident ?? undefined,
  propertyDamage: data.property_damage ?? undefined,
  cardImageUrl: data.card_image_url ?? undefined,
  verificationStatus: data.verification_status as InsuranceVerificationStatus,
  verifiedBy: data.verified_by ?? undefined,
  verifiedAt: data.verified_at ?? undefined,
  verificationNotes: data.verification_notes ?? undefined,
  coverageMeetsMinimum: data.coverage_meets_minimum ?? false,
  expiresDuringRental: data.expires_during_rental ?? false,
  // DECIMAL columns: parseFloat per Pitfall 2
  dealerCoverageDailyRate: data.dealer_coverage_daily_rate != null
    ? parseFloat(data.dealer_coverage_daily_rate)
    : undefined,
  dealerCoverageTotal: data.dealer_coverage_total != null
    ? parseFloat(data.dealer_coverage_total)
    : undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

/**
 * Transform database row to InsuranceAlert interface.
 */
const transformInsuranceAlert = (data: any): InsuranceAlert => ({
  id: data.id,
  bookingId: data.booking_id,
  alertType: data.alert_type as InsuranceAlertType,
  severity: data.severity as InsuranceAlertSeverity,
  firstDetectedAt: data.first_detected_at,
  lastNotifiedAt: data.last_notified_at ?? undefined,
  resolvedAt: data.resolved_at ?? undefined,
  notes: data.notes ?? undefined,
  createdAt: data.created_at,
});

// ================================================================
// INSURANCE CRUD
// ================================================================

/**
 * Fetch insurance record for a specific booking.
 * Returns null if no insurance record exists (booking has no insurance yet).
 */
export async function getInsuranceForBooking(
  bookingId: string
): Promise<RentalInsurance | null> {
  try {
    const { data, error } = await supabase
      .from('rental_insurance')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error || !data) {
      // PGRST116 = "no rows returned" -- expected for bookings without insurance
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching insurance for booking:', error);
      }
      return null;
    }

    return transformInsurance(data);
  } catch (error) {
    console.error('Error fetching insurance for booking:', error);
    return null;
  }
}

/**
 * Create a new insurance record for a booking.
 * Computes coverage_meets_minimum and expires_during_rental flags before inserting.
 */
export async function createInsurance(data: {
  bookingId: string;
  insuranceType: InsuranceType;
  insuranceCompany?: string;
  policyNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  bodilyInjuryPerPerson?: number;
  bodilyInjuryPerAccident?: number;
  propertyDamage?: number;
  dealerCoverageDailyRate?: number;
  dealerCoverageTotal?: number;
  bookingEndDate?: string;
}): Promise<RentalInsurance | null> {
  try {
    // Compute system flags
    const flags = validateInsuranceCoverage(
      {
        bodilyInjuryPerPerson: data.bodilyInjuryPerPerson,
        bodilyInjuryPerAccident: data.bodilyInjuryPerAccident,
        propertyDamage: data.propertyDamage,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate,
        insuranceCompany: data.insuranceCompany,
        policyNumber: data.policyNumber,
      },
      data.bookingEndDate
    );

    const insertData: Record<string, unknown> = {
      booking_id: data.bookingId,
      insurance_type: data.insuranceType,
      coverage_meets_minimum: flags.coverageMeetsMinimum,
      expires_during_rental: !flags.noExpiryDuringRental,
    };

    // Optional fields
    if (data.insuranceCompany != null) insertData.insurance_company = data.insuranceCompany;
    if (data.policyNumber != null) insertData.policy_number = data.policyNumber;
    if (data.effectiveDate != null) insertData.effective_date = data.effectiveDate;
    if (data.expirationDate != null) insertData.expiration_date = data.expirationDate;
    if (data.bodilyInjuryPerPerson != null) insertData.bodily_injury_per_person = data.bodilyInjuryPerPerson;
    if (data.bodilyInjuryPerAccident != null) insertData.bodily_injury_per_accident = data.bodilyInjuryPerAccident;
    if (data.propertyDamage != null) insertData.property_damage = data.propertyDamage;
    if (data.dealerCoverageDailyRate != null) insertData.dealer_coverage_daily_rate = data.dealerCoverageDailyRate;
    if (data.dealerCoverageTotal != null) insertData.dealer_coverage_total = data.dealerCoverageTotal;

    const { data: result, error } = await supabase
      .from('rental_insurance')
      .insert([insertData])
      .select()
      .single();

    if (error || !result) {
      console.error('Error creating insurance record:', error);
      return null;
    }

    return transformInsurance(result);
  } catch (error) {
    console.error('Error creating insurance record:', error);
    return null;
  }
}

/**
 * Update an existing insurance record.
 * Recomputes system flags if coverage amounts or dates change.
 */
export async function updateInsurance(
  id: string,
  data: {
    insuranceType?: InsuranceType;
    insuranceCompany?: string;
    policyNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    bodilyInjuryPerPerson?: number;
    bodilyInjuryPerAccident?: number;
    propertyDamage?: number;
    dealerCoverageDailyRate?: number;
    dealerCoverageTotal?: number;
    cardImageUrl?: string;
    verificationNotes?: string;
    bookingEndDate?: string;
  }
): Promise<RentalInsurance | null> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.insuranceType !== undefined) updateData.insurance_type = data.insuranceType;
    if (data.insuranceCompany !== undefined) updateData.insurance_company = data.insuranceCompany;
    if (data.policyNumber !== undefined) updateData.policy_number = data.policyNumber;
    if (data.effectiveDate !== undefined) updateData.effective_date = data.effectiveDate;
    if (data.expirationDate !== undefined) updateData.expiration_date = data.expirationDate;
    if (data.bodilyInjuryPerPerson !== undefined) updateData.bodily_injury_per_person = data.bodilyInjuryPerPerson;
    if (data.bodilyInjuryPerAccident !== undefined) updateData.bodily_injury_per_accident = data.bodilyInjuryPerAccident;
    if (data.propertyDamage !== undefined) updateData.property_damage = data.propertyDamage;
    if (data.dealerCoverageDailyRate !== undefined) updateData.dealer_coverage_daily_rate = data.dealerCoverageDailyRate;
    if (data.dealerCoverageTotal !== undefined) updateData.dealer_coverage_total = data.dealerCoverageTotal;
    if (data.cardImageUrl !== undefined) updateData.card_image_url = data.cardImageUrl;
    if (data.verificationNotes !== undefined) updateData.verification_notes = data.verificationNotes;

    // Recompute system flags if coverage amounts or dates changed
    const coverageChanged =
      data.bodilyInjuryPerPerson !== undefined ||
      data.bodilyInjuryPerAccident !== undefined ||
      data.propertyDamage !== undefined;
    const datesChanged =
      data.effectiveDate !== undefined ||
      data.expirationDate !== undefined;

    if (coverageChanged || datesChanged) {
      // Need to fetch current record to merge with updates for validation
      const { data: current, error: fetchError } = await supabase
        .from('rental_insurance')
        .select('*')
        .eq('id', id)
        .single();

      if (!fetchError && current) {
        const merged = {
          bodilyInjuryPerPerson: data.bodilyInjuryPerPerson ?? current.bodily_injury_per_person,
          bodilyInjuryPerAccident: data.bodilyInjuryPerAccident ?? current.bodily_injury_per_accident,
          propertyDamage: data.propertyDamage ?? current.property_damage,
          effectiveDate: data.effectiveDate ?? current.effective_date,
          expirationDate: data.expirationDate ?? current.expiration_date,
          insuranceCompany: data.insuranceCompany ?? current.insurance_company,
          policyNumber: data.policyNumber ?? current.policy_number,
        };

        const flags = validateInsuranceCoverage(merged, data.bookingEndDate);
        updateData.coverage_meets_minimum = flags.coverageMeetsMinimum;
        updateData.expires_during_rental = !flags.noExpiryDuringRental;
      }
    }

    const { data: result, error } = await supabase
      .from('rental_insurance')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !result) {
      console.error('Error updating insurance record:', error);
      return null;
    }

    return transformInsurance(result);
  } catch (error) {
    console.error('Error updating insurance record:', error);
    return null;
  }
}

// ================================================================
// VERIFICATION OPERATIONS
// ================================================================

/**
 * Mark insurance as verified by admin.
 * Sets verification_status='verified', verified_by, verified_at=NOW(), notes.
 */
export async function verifyInsurance(
  id: string,
  verifiedBy: string,
  notes?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      verification_status: 'verified',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.verification_notes = notes;
    }

    const { error } = await supabase
      .from('rental_insurance')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error verifying insurance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying insurance:', error);
    return false;
  }
}

/**
 * Mark insurance as failed by admin.
 * Sets verification_status='failed', verified_by, verified_at=NOW(), notes (required).
 */
export async function failInsurance(
  id: string,
  verifiedBy: string,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rental_insurance')
      .update({
        verification_status: 'failed',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id);

    if (error) {
      console.error('Error failing insurance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error failing insurance:', error);
    return false;
  }
}

/**
 * Override insurance verification despite system flags.
 * Sets verification_status='overridden'. Follows RegistrationChecker override pattern.
 * Notes are required to document why the override was made.
 */
export async function overrideInsurance(
  id: string,
  overriddenBy: string,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rental_insurance')
      .update({
        verification_status: 'overridden',
        verified_by: overriddenBy,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id);

    if (error) {
      console.error('Error overriding insurance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error overriding insurance:', error);
    return false;
  }
}

// ================================================================
// INSURANCE CARD UPLOAD
// ================================================================

/**
 * Upload an insurance card image to Supabase Storage.
 * Stores in 'insurance-cards' bucket at path insurance/{bookingId}/{timestamp}.{ext}.
 * On success, updates the rental_insurance row's card_image_url.
 * Returns public URL or null on failure.
 *
 * Same pattern as plateService.uploadPlatePhoto.
 */
export async function uploadInsuranceCard(
  bookingId: string,
  file: File
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filePath = `insurance/${bookingId}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('insurance-cards')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading insurance card:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('insurance-cards')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      console.error('Error getting public URL for insurance card');
      return null;
    }

    // Update the rental_insurance row's card_image_url
    await supabase
      .from('rental_insurance')
      .update({ card_image_url: publicUrl })
      .eq('booking_id', bookingId);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading insurance card:', error);
    return null;
  }
}

// ================================================================
// VALIDATION (pure function -- no DB calls)
// ================================================================

/**
 * Validate insurance coverage against Texas minimum requirements.
 * PURE FUNCTION: No database calls, no side effects.
 *
 * Compares coverage amounts against TEXAS_MINIMUM_COVERAGE (30/60/25).
 * Checks policy dates using zeroed-time comparison (same as calculateTagExpiry).
 *
 * @param insurance - Partial insurance data to validate
 * @param bookingEndDate - Optional booking end date for expiry-during-rental check
 * @returns InsuranceVerificationFlags with all validation results
 */
export function validateInsuranceCoverage(
  insurance: Partial<RentalInsurance>,
  bookingEndDate?: string
): InsuranceVerificationFlags {
  const min = TEXAS_MINIMUM_COVERAGE;

  // Check required fields
  const hasRequiredFields = Boolean(
    insurance.insuranceCompany &&
    insurance.policyNumber &&
    insurance.effectiveDate &&
    insurance.expirationDate &&
    insurance.bodilyInjuryPerPerson != null &&
    insurance.bodilyInjuryPerAccident != null &&
    insurance.propertyDamage != null
  );

  // Check coverage meets Texas minimums
  const coverageMeetsMinimum =
    (insurance.bodilyInjuryPerPerson ?? 0) >= min.bodilyInjuryPerPerson &&
    (insurance.bodilyInjuryPerAccident ?? 0) >= min.bodilyInjuryPerAccident &&
    (insurance.propertyDamage ?? 0) >= min.propertyDamage;

  // Check policy not expired (zeroed-time comparison per Pitfall 1)
  let policyNotExpired = false;
  if (insurance.expirationDate) {
    const expiry = new Date(insurance.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    policyNotExpired = expiry.getTime() >= today.getTime();
  }

  // Check insurance doesn't expire during rental period
  let noExpiryDuringRental = true;
  if (insurance.expirationDate && bookingEndDate) {
    const expiry = new Date(insurance.expirationDate);
    const endDate = new Date(bookingEndDate);
    expiry.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    noExpiryDuringRental = expiry.getTime() >= endDate.getTime();
  }

  // Card image check
  const cardImageUploaded = Boolean(insurance.cardImageUrl);

  return {
    hasRequiredFields,
    coverageMeetsMinimum,
    policyNotExpired,
    noExpiryDuringRental,
    cardImageUploaded,
  };
}

// ================================================================
// ALERTS
// ================================================================

/**
 * Fetch all active (unresolved) insurance alerts.
 * Ordered by first_detected_at descending (newest first).
 */
export async function getActiveInsuranceAlerts(): Promise<InsuranceAlert[]> {
  try {
    const { data, error } = await supabase
      .from('insurance_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('first_detected_at', { ascending: false });

    if (error) {
      console.error('Error fetching active insurance alerts:', error);
      return [];
    }

    return (data || []).map(transformInsuranceAlert);
  } catch (error) {
    console.error('Error fetching active insurance alerts:', error);
    return [];
  }
}

// ================================================================
// CUSTOMER INSURANCE CACHE (pre-fill)
// ================================================================

/**
 * Update the customer's cached insurance info for pre-fill on next booking.
 * Stores last-used insurance company, policy number, and expiry on rental_customers.
 */
export async function updateCustomerInsuranceCache(
  customerId: string,
  insurance: Partial<RentalInsurance>
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {};

    if (insurance.insuranceCompany !== undefined) {
      updateData.last_insurance_company = insurance.insuranceCompany;
    }
    if (insurance.policyNumber !== undefined) {
      updateData.last_policy_number = insurance.policyNumber;
    }
    if (insurance.expirationDate !== undefined) {
      updateData.last_insurance_expiry = insurance.expirationDate;
    }

    if (Object.keys(updateData).length === 0) return;

    const { error } = await supabase
      .from('rental_customers')
      .update(updateData)
      .eq('id', customerId);

    if (error) {
      console.error('Error updating customer insurance cache:', error);
    }
  } catch (error) {
    console.error('Error updating customer insurance cache:', error);
  }
}

/**
 * Fetch the customer's cached insurance info for pre-fill.
 * Returns null if no cached data exists.
 */
export async function getCustomerLastInsurance(
  customerId: string
): Promise<{ company?: string; policyNumber?: string; expiry?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('rental_customers')
      .select('last_insurance_company, last_policy_number, last_insurance_expiry')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching customer last insurance:', error);
      }
      return null;
    }

    // Return null if all cache fields are empty
    if (!data.last_insurance_company && !data.last_policy_number && !data.last_insurance_expiry) {
      return null;
    }

    return {
      company: data.last_insurance_company ?? undefined,
      policyNumber: data.last_policy_number ?? undefined,
      expiry: data.last_insurance_expiry ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching customer last insurance:', error);
    return null;
  }
}
