# Phase 8: Rental Insurance Verification - Research

**Researched:** 2026-02-13
**Domain:** Insurance capture, verification, and monitoring for rental vehicles (Texas)
**Confidence:** HIGH (builds on established codebase patterns, verified Texas insurance requirements)

## Summary

Phase 8 adds insurance verification to the existing rental management system. Every rental booking must have verified insurance before the vehicle leaves the lot. The system captures insurance details (company, policy number, effective dates, coverage amounts), stores insurance card images, validates against Texas minimum requirements, and alerts when coverage expires during active rentals.

Texas requires minimum liability insurance of 30/60/25: $30,000 bodily injury per person, $60,000 per accident, and $25,000 property damage. These minimums have not changed for 2025-2026 and are well-documented by the Texas Department of Insurance. For a small independent dealer like Triple J, the practical approach is: capture the customer's insurance info, validate coverage amounts against Texas minimums programmatically, let the admin make the final verification call, and use a soft-block with override (matching the existing RegistrationChecker override pattern).

**Primary recommendation:** Add a `rental_insurance` table linked to `rental_bookings`, capture insurance during the booking flow as a new section in RentalBookingModal, show verification status as colored badges on booking rows, and extend the existing check-plate-alerts Edge Function to also detect expiring insurance.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (postgres) | existing | Insurance data storage | Already used for all tables |
| Supabase Storage | existing | Insurance card image upload | Already used for rental-photos, plate-photos, rental-agreements |
| React + TypeScript | existing | UI components | Project standard |
| Tailwind CSS | existing | Styling (luxury dark theme) | Project standard |
| lucide-react | existing | Icons (Shield, AlertTriangle, etc.) | Already imported in codebase |
| framer-motion | existing | Modal animations | Already used in RentalBookingModal |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsPDF | existing | Include insurance info in rental agreement PDF | Only if agreement PDF is updated |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual insurance entry | OCR of insurance card | OCR adds significant complexity (Tesseract.js ~2MB, accuracy issues with phone photos, varied card formats) -- NOT recommended for a small dealer. Manual entry takes 30 seconds and is 100% accurate. |
| Per-booking insurance | Customer-level insurance persistence | Customer insurance can be pre-filled from last booking but must be verified per booking (insurance can change between rentals). Store on customer for pre-fill, verify per booking. |
| Separate Edge Function | Extend check-plate-alerts | Fewer functions to deploy and maintain. Insurance expiry check is 20-30 lines inside existing function. |

**Installation:**
No new packages needed. All dependencies already in project.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
  08_rental_insurance.sql          # New migration

services/
  insuranceService.ts              # New service (CRUD, validation, upload)

types.ts                           # Extended with insurance types

components/admin/
  InsuranceVerification.tsx         # Inline component in BookingDetail

pages/admin/
  Rentals.tsx                      # Modified: badges, stats bar, BookingDetail

components/admin/
  RentalBookingModal.tsx           # Modified: new insurance section

supabase/functions/
  check-plate-alerts/index.ts      # Extended: insurance expiry detection
  _shared/email-templates/
    plate-alert.tsx                 # Extended: insurance alert type
```

### Pattern 1: Insurance Data Model
**What:** A `rental_insurance` table linked 1:1 with `rental_bookings`, plus optional customer-level caching on `rental_customers` for pre-fill.
**When to use:** Every booking needs insurance verified.
**Example:**
```sql
-- Source: Established migration pattern from 06_rental_schema.sql, 07_plate_tracking.sql
CREATE TABLE IF NOT EXISTS public.rental_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,

  -- Insurance source
  insurance_type TEXT NOT NULL DEFAULT 'customer_provided'
    CHECK (insurance_type IN ('customer_provided', 'dealer_coverage')),

  -- Policy details
  insurance_company TEXT,
  policy_number TEXT,
  effective_date DATE,
  expiration_date DATE,

  -- Coverage amounts (stored as integers: cents or whole dollars)
  bodily_injury_per_person INTEGER,   -- e.g., 30000
  bodily_injury_per_accident INTEGER, -- e.g., 60000
  property_damage INTEGER,            -- e.g., 25000

  -- Insurance card image
  card_image_url TEXT,

  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'overridden')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- System flags (auto-computed)
  coverage_meets_minimum BOOLEAN DEFAULT false,
  expires_during_rental BOOLEAN DEFAULT false,

  -- Dealer coverage specifics (when insurance_type = 'dealer_coverage')
  dealer_coverage_daily_rate DECIMAL(10,2),
  dealer_coverage_total DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pattern 2: Dual Verification (System + Admin)
**What:** System automatically flags issues (expired, below minimum, missing fields), admin reviews and makes final call.
**When to use:** This is the established pattern from RegistrationChecker (Phase 5).
**Example:**
```typescript
// Source: Mirrors RegistrationChecker auto-compute pattern from Phase 5
interface InsuranceVerificationFlags {
  hasRequiredFields: boolean;       // company, policy#, dates, amounts all present
  coverageMeetsMinimum: boolean;    // >= 30/60/25
  policyNotExpired: boolean;        // effective_date <= today <= expiration_date
  noExpiryDuringRental: boolean;    // expiration_date >= booking.endDate
  cardImageUploaded: boolean;       // card_image_url is not null
}

// System flags + admin final call = dual verification
// Status transitions:
//   pending -> verified (admin approves)
//   pending -> failed (admin rejects)
//   pending -> overridden (admin overrides despite flags)
//   failed -> pending (admin re-reviews)
```

### Pattern 3: Insurance Capture in Booking Flow
**What:** Add insurance section to RentalBookingModal as a step in the existing 4-section flow.
**When to use:** During booking creation.
**Decision:** Add insurance capture INSIDE the existing booking modal as a subsection of the "Agreement" tab (section 3). This keeps the flow cohesive -- the admin is already entering agreement terms, so insurance fits naturally here. Do NOT add a 5th section (per CONTEXT.md note about not changing SectionKey type pattern from Phase 7).
**Example:**
```typescript
// In the Agreement (terms) section of RentalBookingModal, add an insurance subsection
// similar to how plate selection was added to the vehicle section in 07-03
// The insurance fields render inline below the geographic restrictions block
```

### Pattern 4: Soft Block with Override
**What:** Booking creation warns but does not hard-block when insurance is unverified. Admin can override (logged for audit).
**When to use:** Follows RegistrationChecker override pattern exactly.
**Example:**
```typescript
// In review section of RentalBookingModal:
// - Show amber warning if insurance not yet verified
// - Allow booking creation with override button
// - Log override reason

// In BookingDetail (Active Rentals):
// - Show insurance verification panel
// - Admin can verify/reject/override after booking exists
// - Override uses amber "Override" button pattern from RegistrationChecker
```

### Anti-Patterns to Avoid
- **Hard-blocking without override:** CONTEXT.md specifies soft block with override. A hard block would prevent the dealer from operating if their admin isn't available to verify immediately.
- **OCR for insurance cards:** Complexity vastly exceeds value for a small dealer doing 5-20 rentals/week. Manual entry takes 30 seconds.
- **Separate insurance page:** Insurance is a property of a booking, not a standalone entity. Keep it in BookingDetail, not a new admin page.
- **Storing insurance amounts as DECIMAL:** Coverage amounts are whole dollar values ($30,000). Use INTEGER to avoid floating point display issues. No cents needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upload | Custom upload handler | Supabase Storage (same pattern as plateService.uploadPlatePhoto) | Already proven in 3 places in codebase |
| Date comparison | Custom date math | Same zeroed-time pattern from calculateTagExpiry | Avoids timezone off-by-one bugs |
| Override logging | Custom audit system | Same override pattern from RegistrationChecker (saveCheckerOverride) | Established pattern, logged to verification_notes |
| Coverage validation | Complex validation library | Simple comparison: `amount >= TEXAS_MINIMUM` | 3 numeric comparisons, no library needed |
| Alert detection | New Edge Function | Extend check-plate-alerts with insurance expiry check | Fewer deployments, shared notification infrastructure |
| Email/SMS alerts | New notification system | Extend plate-alert.tsx template with insurance alert type | Batched notification pattern already handles this |

**Key insight:** This phase is 90% UI/UX work with a simple data model. The insurance verification logic is straightforward (compare numbers to constants). The complexity is in the user experience: where to capture data, how to display status, when to alert. All infrastructure already exists.

## Common Pitfalls

### Pitfall 1: Insurance Expiration Date Timezone Issues
**What goes wrong:** Comparing expiration_date (DATE) with JavaScript Date() including time component causes off-by-one errors.
**Why it happens:** `new Date('2025-03-15')` in JavaScript creates a UTC midnight date, which in CST is actually March 14th at 6pm.
**How to avoid:** Use the established calculateTagExpiry pattern: zero out time components before comparison. Store expiration_date as DATE type (not TIMESTAMPTZ) in PostgreSQL, same as rental dates.
**Warning signs:** Insurance showing as "expired" on the day it should still be valid.

### Pitfall 2: Supabase Returns DECIMAL as String
**What goes wrong:** dealer_coverage_daily_rate stored as DECIMAL(10,2) comes back as a string from Supabase.
**Why it happens:** PostgreSQL DECIMAL precision cannot be safely represented as JavaScript number.
**How to avoid:** Use parseFloat in transformer (same pattern as transformBooking for daily_rate, total_cost). Or use INTEGER for coverage amounts since they're whole dollar values.
**Warning signs:** `"30000" >= 30000` evaluates to true in JS (string coercion), but `"30000" + 5000` gives `"300005000"`.

### Pitfall 3: Booking Modal Section Navigation Breaking
**What goes wrong:** Adding a 5th section to SECTIONS array or changing SectionKey type breaks existing navigation.
**Why it happens:** Phase 7 established the pattern of NOT changing SectionKey -- plate selection was added as a subsection within the 'vehicle' section.
**How to avoid:** Add insurance fields as a subsection within the 'terms' (Agreement) section. Do NOT modify the SectionKey type or SECTIONS array.
**Warning signs:** TypeScript compile errors on SectionKey, broken tab navigation.

### Pitfall 4: Missing RLS Policy for Storage Bucket
**What goes wrong:** Insurance card upload fails silently because the Supabase Storage bucket doesn't have proper access policies.
**Why it happens:** New buckets are private by default. Need to create 'insurance-cards' bucket and configure access.
**How to avoid:** Document bucket creation as a TODO (same as rental-photos, plate-photos). Use same upload pattern from plateService.uploadPlatePhoto.
**Warning signs:** Upload returns null with no error message in console.

### Pitfall 5: Insurance Pre-fill Stale Data
**What goes wrong:** Pre-filling insurance from a customer's last booking shows expired insurance, admin doesn't notice.
**Why it happens:** Customer's insurance may have changed between rentals.
**How to avoid:** Pre-fill but visually flag: "Pre-filled from last booking on [date]. Please verify current." System auto-flags if dates are expired.
**Warning signs:** Bookings going through with expired pre-filled insurance.

### Pitfall 6: Extending Edge Function Without Testing Alert Types
**What goes wrong:** Adding insurance_expiring alert type to check-plate-alerts but forgetting to update the plate_alerts CHECK constraint, or the email template, or the SMS builder.
**Why it happens:** The alert pipeline has 4 touchpoints: detection, upsert, email template, SMS builder.
**How to avoid:** Create a new `insurance_alerts` table (parallel to plate_alerts) OR extend plate_alerts CHECK constraint. Update ALL template functions. Test the full pipeline.
**Decision:** Use a separate `insurance_alerts` table to keep plate and insurance concerns separate. Simpler migration, no CHECK constraint modification.

## Code Examples

### Texas Minimum Coverage Constants
```typescript
// Source: Texas Department of Insurance (tdi.texas.gov) - 30/60/25 minimums
// Verified: Has not changed for 2025-2026

export const TEXAS_MINIMUM_COVERAGE = {
  bodilyInjuryPerPerson: 30000,    // $30,000
  bodilyInjuryPerAccident: 60000,  // $60,000
  propertyDamage: 25000,           // $25,000
} as const;

export const TEXAS_MINIMUM_LABEL = '30/60/25';
```

### Insurance Verification Pure Function
```typescript
// Source: Mirrors RegistrationChecker auto-compute pattern

export function validateInsuranceCoverage(insurance: {
  bodilyInjuryPerPerson?: number;
  bodilyInjuryPerAccident?: number;
  propertyDamage?: number;
  effectiveDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
}): InsuranceVerificationFlags {
  const min = TEXAS_MINIMUM_COVERAGE;

  return {
    hasRequiredFields: Boolean(
      insurance.insuranceCompany &&
      insurance.policyNumber &&
      insurance.effectiveDate &&
      insurance.expirationDate &&
      insurance.bodilyInjuryPerPerson != null &&
      insurance.bodilyInjuryPerAccident != null &&
      insurance.propertyDamage != null
    ),
    coverageMeetsMinimum:
      (insurance.bodilyInjuryPerPerson ?? 0) >= min.bodilyInjuryPerPerson &&
      (insurance.bodilyInjuryPerAccident ?? 0) >= min.bodilyInjuryPerAccident &&
      (insurance.propertyDamage ?? 0) >= min.propertyDamage,
    policyNotExpired: insurance.expirationDate
      ? new Date(insurance.expirationDate) >= new Date(new Date().toISOString().split('T')[0])
      : false,
    noExpiryDuringRental: true, // Caller must pass booking end date for this check
    cardImageUploaded: false,   // Caller checks separately
  };
}
```

### Insurance Card Upload (Service Layer)
```typescript
// Source: Same pattern as plateService.uploadPlatePhoto

export async function uploadInsuranceCard(
  bookingId: string,
  file: File
): Promise<string | null> {
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

  return urlData?.publicUrl ?? null;
}
```

### Insurance Status Badge Pattern
```typescript
// Source: Matches plate type badge visual language from Plates.tsx

type InsuranceStatus = 'pending' | 'verified' | 'failed' | 'overridden';

const INSURANCE_STATUS_COLORS: Record<InsuranceStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
  verified: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  overridden: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
};
```

### Insurance Alert Detection (Edge Function Extension)
```typescript
// Source: Same detection pattern as overdue rental in check-plate-alerts

// Inside existing Deno.serve handler, add section after plate detection:

// --- Detect expiring insurance ---
const { data: activeBookingsWithInsurance } = await supabase
  .from('rental_insurance')
  .select(`
    id, booking_id, expiration_date,
    rental_bookings!inner ( id, booking_id, status, end_date,
      rental_customers ( full_name, phone )
    )
  `)
  .in('rental_bookings.status', ['reserved', 'active'])
  .eq('verification_status', 'verified');

// Check each: does insurance expire before booking end_date?
// If expires within 7 days of rental period: warning
// If already expired during active rental: urgent
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paper insurance cards | Digital capture + validation | Ongoing industry shift | Enables automated expiry tracking |
| Manual coverage checking | Automated comparison against state minimums | Standard in dealer management systems | Reduces human error |
| Trust-based insurance verification | System flags + admin override | Best practice | Catches expired policies before vehicle leaves lot |

**Deprecated/outdated:**
- Nothing deprecated in this domain. Texas 30/60/25 minimums have been stable for years.

## Open Questions

1. **Dealer-provided coverage pricing model**
   - What we know: CONTEXT.md says support both customer-provided and dealer-provided insurance. The data model supports a daily rate for dealer coverage.
   - What's unclear: Exact pricing structure for dealer coverage (flat daily add-on? tiered by vehicle value?).
   - Recommendation: Design the `dealer_coverage_daily_rate` field as nullable DECIMAL. When dealer_coverage is selected, admin enters the daily surcharge manually. System calculates total based on rental days. This is the most flexible model.

2. **Insurance persistence across bookings for same customer**
   - What we know: Customer may rent multiple times with same insurance.
   - What's unclear: How aggressively to pre-fill.
   - Recommendation: Store last-used insurance info on `rental_customers` table (new columns: `last_insurance_company`, `last_policy_number`, `last_insurance_expiry`). Pre-fill from these when creating a new booking for a returning customer. Always require verification per booking.

3. **Alert delivery method**
   - What we know: CONTEXT.md gives discretion on dashboard-only vs dashboard + SMS/email.
   - What's unclear: Whether the dealer wants insurance expiry alerts via SMS.
   - Recommendation: Dashboard alerts (insurance status badges on booking rows + stats bar count) PLUS extend the existing check-plate-alerts Edge Function for email/SMS. This uses existing infrastructure with minimal new code. Since the Edge Function already runs every 30 minutes and sends batched notifications, adding insurance checks is ~30 lines.

## Sources

### Primary (HIGH confidence)
- Texas Department of Insurance - Auto Insurance Guide (tdi.texas.gov/pubs/consumer/cb020.html) - Texas 30/60/25 minimums verified
- Texas Department of Insurance - Rental Car Insurance Tips (tdi.texas.gov/tips/rental-car-insurance.html) - Rental-specific guidance
- Existing codebase: rentalService.ts, plateService.ts, check-plate-alerts/index.ts - Established patterns
- Existing codebase: RegistrationChecker.tsx - Override pattern
- Existing codebase: RentalConditionReport.tsx - Photo upload pattern
- Existing codebase: 07_plate_tracking.sql - Migration pattern

### Secondary (MEDIUM confidence)
- WebSearch: Texas insurance requirements verified against official TDI source
- WebSearch: Supabase Storage upload patterns verified against codebase

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all patterns established in codebase
- Architecture: HIGH - Direct extension of existing rental + plate patterns
- Texas minimums: HIGH - Verified against Texas Department of Insurance official documentation
- Pitfalls: HIGH - Based on concrete codebase patterns and known issues
- Alert extension: MEDIUM - Extending existing Edge Function is proven pattern but insurance-specific query needs validation

**Research date:** 2026-02-13
**Valid until:** 2026-06-13 (stable domain -- Texas minimums don't change frequently)
