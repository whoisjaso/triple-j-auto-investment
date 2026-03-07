/**
 * Owner Portal Service (Phase 19 - Retention Engine)
 *
 * All Supabase queries for the Owner Portal:
 * - getOwnerData: fetch registration + vehicle snapshot for the portal header
 * - getReferralData: fetch referral code, link, and stats for the Family Circle section
 * - getCommunityReferralCount: monthly community counter for social proof
 * - logReferralClick: anon-safe click logging on referral landing page
 * - getReferrerName: friendly first-name lookup for referral landing page heading
 * - getUpgradeMatches: find inventory vehicles in the 1.1x-2.0x price range
 * - markReviewCompleted: customer action "I left a review" to suppress follow-up
 *
 * Pattern: snake_case DB columns mapped to camelCase TypeScript fields.
 * All functions handle errors gracefully and return null / [] on failure.
 */

import { supabase } from '../supabase/config';
import type { Registration, OwnerReferral, Vehicle } from '../types';

// ----------------------------------------------------------------
// Internal mapper: registration row → Registration interface
// ----------------------------------------------------------------
function mapRegistration(row: Record<string, unknown>): Registration {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    vehicleId: row.vehicle_id as string | undefined,
    billOfSaleId: row.bill_of_sale_id as string | undefined,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string | undefined,
    customerPhone: row.customer_phone as string | undefined,
    customerAddress: row.customer_address as string | undefined,
    vin: row.vin as string,
    vehicleYear: row.vehicle_year as number,
    vehicleMake: row.vehicle_make as string,
    vehicleModel: row.vehicle_model as string,
    plateNumber: row.plate_number as string | undefined,
    accessToken: row.access_token as string,
    tokenExpiresAt: row.token_expires_at as string | undefined,
    vehicleBodyType: row.vehicle_body_type as string | undefined,
    docTitleFront: row.doc_title_front as boolean,
    docTitleBack: row.doc_title_back as boolean,
    doc130u: row.doc_130u as boolean,
    docInsurance: row.doc_insurance as boolean,
    docInspection: row.doc_inspection as boolean,
    currentStage: row.current_stage as Registration['currentStage'],
    saleDate: row.sale_date as string | undefined,
    submissionDate: row.submission_date as string | undefined,
    approvalDate: row.approval_date as string | undefined,
    deliveryDate: row.delivery_date as string | undefined,
    notes: row.notes as string | undefined,
    rejectionNotes: row.rejection_notes as string | undefined,
    notificationPref: row.notification_pref as Registration['notificationPref'],
    mileage: row.mileage as number | undefined,
    checkerResults: row.checker_results as Registration['checkerResults'],
    checkerCompletedAt: row.checker_completed_at as string | undefined,
    checkerOverride: row.checker_override as boolean,
    checkerOverrideAt: row.checker_override_at as string | undefined,
    isArchived: row.is_archived as boolean,
    purchaseDate: row.purchase_date as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ----------------------------------------------------------------
// Internal mapper: owner_referrals row → OwnerReferral interface
// ----------------------------------------------------------------
function mapOwnerReferral(row: Record<string, unknown>): OwnerReferral {
  return {
    id: row.id as string,
    registrationId: row.registration_id as string,
    customerPhone: row.customer_phone as string,
    referrerName: row.referrer_name as string,
    referralCode: row.referral_code as string,
    referralLink: row.referral_link as string,
    referralCount: row.referral_count as number,
    convertedCount: row.converted_count as number,
    rewardTier: row.reward_tier as number,
    createdAt: row.created_at as string,
  };
}

// ================================================================
// getOwnerData
// ================================================================
/**
 * Fetch the most recent completed registration for a given phone number.
 * Only returns registrations with current_stage = 'sticker_delivered'
 * (i.e., purchase is fully complete and portal is unlocked).
 *
 * Returns null if no completed registration found.
 */
export async function getOwnerData(phone: string): Promise<Registration | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('customer_phone', phone)
      .eq('current_stage', 'sticker_delivered')
      .order('purchase_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[ownerPortalService] getOwnerData error:', error.message);
      return null;
    }
    if (!data) return null;

    return mapRegistration(data as Record<string, unknown>);
  } catch (err) {
    console.error('[ownerPortalService] getOwnerData unexpected error:', err);
    return null;
  }
}

// ================================================================
// getReferralData
// ================================================================
/**
 * Fetch the owner_referrals row for a given phone number.
 * Returns null if the referral record has not yet been created
 * (e.g., trigger fired but row missing due to timing).
 */
export async function getReferralData(phone: string): Promise<OwnerReferral | null> {
  try {
    const { data, error } = await supabase
      .from('owner_referrals')
      .select('*')
      .eq('customer_phone', phone)
      .maybeSingle();

    if (error) {
      console.error('[ownerPortalService] getReferralData error:', error.message);
      return null;
    }
    if (!data) return null;

    return mapOwnerReferral(data as Record<string, unknown>);
  } catch (err) {
    console.error('[ownerPortalService] getReferralData unexpected error:', err);
    return null;
  }
}

// ================================================================
// getCommunityReferralCount
// ================================================================
/**
 * Count total referral clicks this calendar month for the community
 * social proof counter ("X families introduced to Triple J this month").
 */
export async function getCommunityReferralCount(): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', startOfMonth.toISOString());

    if (error) {
      console.error('[ownerPortalService] getCommunityReferralCount error:', error.message);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('[ownerPortalService] getCommunityReferralCount unexpected error:', err);
    return 0;
  }
}

// ================================================================
// logReferralClick
// ================================================================
/**
 * Log a click on a referral link. Anon-safe (no auth required).
 * After inserting the click, increments referral_count on the
 * owner_referrals row (handled by a separate update call here
 * because anon users cannot call RPC functions without explicit grants).
 */
export async function logReferralClick(
  code: string,
  deviceType?: string
): Promise<void> {
  try {
    const normalizedCode = code.toUpperCase();

    // Insert click row (anon INSERT policy on referral_clicks)
    const { error: insertError } = await supabase
      .from('referral_clicks')
      .insert({
        referral_code: normalizedCode,
        device_type: deviceType ?? null,
      });

    if (insertError) {
      console.error('[ownerPortalService] logReferralClick insert error:', insertError.message);
      return;
    }

    // Increment referral_count on owner_referrals (service role needed for update,
    // but we attempt it here for completeness -- Edge Function or server action
    // should handle the increment if anon lacks UPDATE access)
    const { error: updateError } = await supabase.rpc('increment_referral_count', {
      p_code: normalizedCode,
    });

    if (updateError) {
      // Non-fatal: click was logged; count increment may be handled server-side
      console.warn('[ownerPortalService] logReferralClick increment warning:', updateError.message);
    }
  } catch (err) {
    console.error('[ownerPortalService] logReferralClick unexpected error:', err);
  }
}

// ================================================================
// getReferrerName
// ================================================================
/**
 * Look up the referrer's first name by referral code.
 * Used by the ReferralLanding page to display:
 * "[First Name] thinks you'd love Triple J"
 *
 * Returns null if the code is not found.
 */
export async function getReferrerName(code: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('owner_referrals')
      .select('referrer_name')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('[ownerPortalService] getReferrerName error:', error.message);
      return null;
    }
    if (!data) return null;

    const fullName = (data as { referrer_name: string }).referrer_name;
    // Return first name only
    return fullName.split(' ')[0] ?? fullName;
  } catch (err) {
    console.error('[ownerPortalService] getReferrerName unexpected error:', err);
    return null;
  }
}

// ================================================================
// getUpgradeMatches
// ================================================================
/**
 * Find Available inventory vehicles priced between 1.1x and 2.0x
 * the owner's original purchase price. Shows up in the Upgrade section
 * after 12 months of ownership.
 *
 * Returns up to 3 matches ordered by date_added DESC.
 */
export async function getUpgradeMatches(purchasePrice: number): Promise<Vehicle[]> {
  try {
    const minPrice = Math.round(purchasePrice * 1.1);
    const maxPrice = Math.round(purchasePrice * 2.0);

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .eq('status', 'Available')
      .order('date_added', { ascending: false })
      .limit(3);

    if (error) {
      console.error('[ownerPortalService] getUpgradeMatches error:', error.message);
      return [];
    }
    if (!data) return [];

    // Map snake_case DB columns to camelCase Vehicle interface
    return (data as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      make: row.make as string,
      model: row.model as string,
      year: row.year as number,
      price: row.price as number,
      cost: row.cost as number,
      mileage: row.mileage as number,
      vin: row.vin as string,
      status: row.status as Vehicle['status'],
      description: row.description as string,
      imageUrl: row.image_url as string,
      gallery: row.gallery as string[] | undefined,
      dateAdded: row.date_added as string | undefined,
      slug: row.slug as string | undefined,
      identityHeadline: row.identity_headline as string | undefined,
      identityHeadlineEs: row.identity_headline_es as string | undefined,
      isVerified: row.is_verified as boolean | undefined,
      marketEstimate: row.market_estimate as number | undefined,
      listingType: row.listing_type as Vehicle['listingType'],
    }));
  } catch (err) {
    console.error('[ownerPortalService] getUpgradeMatches unexpected error:', err);
    return [];
  }
}

// ================================================================
// markReviewCompleted
// ================================================================
/**
 * Mark a registration's review as completed. This suppresses the
 * 7-day follow-up review request for this owner.
 *
 * Called when the owner taps "I Left a Review" in the portal.
 */
export async function markReviewCompleted(registrationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ review_completed: true })
      .eq('id', registrationId);

    if (error) {
      console.error('[ownerPortalService] markReviewCompleted error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ownerPortalService] markReviewCompleted unexpected error:', err);
    return false;
  }
}
