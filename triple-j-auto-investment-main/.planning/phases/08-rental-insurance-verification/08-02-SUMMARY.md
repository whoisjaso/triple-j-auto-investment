# Phase 8 Plan 02: Insurance Verification UI Summary

**One-liner:** InsuranceVerification inline panel, booking modal insurance capture, status badges and unverified stats in Rentals page.

---

## What Was Built

### InsuranceVerification.tsx (New - 705 lines)
Self-contained inline panel component that renders inside BookingDetail expansion (same pattern as RegistrationChecker in Registrations.tsx). NOT a modal.

**Sections:**
1. Insurance Info Display / Edit Form -- customer_provided (company, policy, dates, 3 coverage amounts) or dealer_coverage (daily rate with auto-computed total)
2. System Verification Flags -- 5 checks via `validateInsuranceCoverage`: required fields, Texas 30/60/25 minimum, policy not expired, no expiry during rental, card uploaded
3. Admin Verification Actions -- verify (green), reject (red), override (amber) with notes, revoke verification
4. Insurance Card Upload -- file input accepting image/PDF, thumbnail preview with "View Full" link and "Replace" button

**Key behaviors:**
- Pre-fills from customer's last insurance via `getCustomerLastInsurance` when no insurance record exists
- After create/update for customer_provided type, calls `updateCustomerInsuranceCache`
- Override confirmation dialog follows RegistrationChecker pattern (amber button, notes required, logged)
- Collapsible section with badge showing current status

### RentalBookingModal.tsx (Modified)
Added insurance capture subsection INSIDE the existing 'terms' (Agreement) section, below geographic restrictions and above admin notes.

**Insurance subsection:**
- Insurance type toggle: Customer Insurance / Dealer Coverage (button toggle pattern like PaymentMethod)
- Customer provided: Company, Policy #, Effective/Expiration dates, 3 coverage amount fields with Texas minimum placeholders
- Dealer coverage: Daily rate input with auto-computed total display
- Pre-fill from customer's last booking when customer is selected
- "Pre-filled from previous rental" notice when pre-filled

**Review section:** Insurance summary card showing entered info, with amber soft-block warning when validation flags fail: "Insurance issues detected. You can still create the booking and verify later."

**Submit flow:** Insurance creation happens AFTER booking creation via `createInsurance`. If insurance creation fails, booking still succeeds (soft-block). Calls `updateCustomerInsuranceCache` on success.

**Preserved:** SectionKey type and SECTIONS array completely unchanged (4 sections: customer, vehicle, terms, review).

### Rentals.tsx (Modified)
- **Stats bar:** Added "Unverified" stat with Shield icon, amber when count > 0. Grid changed from 4 to 5 columns. Counts active/reserved/overdue bookings without verified or overridden insurance.
- **Insurance badges on Active Rentals rows:** Inline badge next to booking status badge -- "No Ins" (gray), "Ins: Pending" (gray), "Ins: Verified" (green with Shield icon), "Ins: Failed" (red), "Ins: Override" (amber).
- **BookingDetail:** InsuranceVerification panel rendered above Payments section.

### rentalService.ts (Modified)
- Added `rental_insurance(*)` to all booking select queries (getAllBookings, getBookingById, getActiveBookings, getBookingsForMonth, createBooking)
- `transformBooking` now maps `rental_insurance` via imported `transformInsurance`

### insuranceService.ts (Modified)
- Exported `transformInsurance` for use by `rentalService.ts`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Insurance subsection inside terms, not new tab | Per plan guidance: do NOT change SectionKey or SECTIONS (Phase 7 established pattern) |
| Join insurance in booking queries | Avoids N+1 queries; insurance data available for badges and stats without separate fetch |
| Soft-block: booking succeeds with insurance warnings | Per CONTEXT.md, don't block business operations; admin verifies later from BookingDetail |
| 5-column stats grid | Unverified count is critical business metric alongside existing 4 stats |
| Insurance badge inline with status badge | Compact visual indicator without crowding; text-[10px] with abbreviated labels |
| InsuranceVerification above payments in BookingDetail | Insurance should be verified before money changes hands per plan guidance |
| Dynamic import for supabase in revoke | Revoke verification needs direct DB update; lazy import follows existing pattern |

## Deviations from Plan

None -- plan executed exactly as written.

## Files Changed

### Created
- `triple-j-auto-investment-main/components/admin/InsuranceVerification.tsx` (705 lines)

### Modified
- `triple-j-auto-investment-main/components/admin/RentalBookingModal.tsx` (+260 lines: insurance state, pre-fill effect, form in terms section, review summary, post-booking creation)
- `triple-j-auto-investment-main/pages/admin/Rentals.tsx` (+75 lines: import, stats, badges, InsuranceVerification render)
- `triple-j-auto-investment-main/services/rentalService.ts` (+3 lines: import transformInsurance, insurance join in select, insurance in transformer)
- `triple-j-auto-investment-main/services/insuranceService.ts` (+1 line: export transformInsurance)

## Requirements Coverage
- **RINS-01:** Insurance info captured (company, policy, dates, coverage amounts) in booking modal Agreement section and editable in BookingDetail InsuranceVerification panel
- **RINS-02:** Insurance card upload available in InsuranceVerification component (image/PDF, thumbnail preview, replace)
- **RINS-03:** Coverage verification flags auto-computed against Texas 30/60/25 minimums, displayed with green check / red X indicators
- **Insurance visibility:** Badge on booking row, full panel in BookingDetail, unverified count in stats bar

## Commits
- `f6f4e72` feat(08-02): InsuranceVerification inline panel component
- `a764c1b` feat(08-02): insurance UI in booking modal, badges, stats, and BookingDetail

## Duration
~15 minutes

## Next Steps
- Phase 8 Plan 03: Edge Function Extension (extend check-plate-alerts with insurance expiry detection)
- Create Supabase Storage bucket 'insurance-cards' for card image uploads
