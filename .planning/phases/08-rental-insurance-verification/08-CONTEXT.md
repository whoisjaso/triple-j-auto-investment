# Phase 8: Rental Insurance Verification - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure every rental has verified insurance before the vehicle leaves the lot. Captures insurance info (company, policy, dates, coverage), stores insurance card photos, validates coverage against Texas minimum requirements, and alerts when coverage expires during an active rental. Covers both customer-provided insurance and dealer-provided coverage options.

</domain>

<decisions>
## Implementation Decisions

### Insurance capture flow
- Both customer-provided insurance and dealer-provided coverage are supported
- Claude's discretion on whether to capture during booking creation (add section to RentalBookingModal) or as a separate step after booking
- Claude's discretion on field set (full details vs essentials) based on Texas requirements research
- Claude's discretion on dealer coverage model (flat daily add-on vs third-party policy) -- design a flexible model that handles either

### Verification behavior
- System validates fields AND admin makes final call (dual verification)
  - System flags: expired policy, coverage below Texas minimums, missing required fields
  - Admin reviews flags, can override and mark verified (logged for audit)
- Claude's discretion on gate strictness -- soft block with override follows existing patterns (RegistrationChecker override precedent)
- Claude should research Texas minimum coverage amounts for rental vehicles
- Insurance verification status visible at ALL levels:
  - Green/red badge on booking row in Active Rentals list
  - Full details inside BookingDetail expansion
  - "Unverified" count in Rentals stats bar

### Expiration alerts
- Claude's discretion on alert delivery method (dashboard-only vs dashboard + SMS/email notification)
- Claude's discretion on warning thresholds (follow existing severity tier patterns from plate/buyer tag alerts)
- Claude's discretion on expired-insurance workflow (contact customer to renew vs escalation)
- Claude's discretion on whether to bundle into existing check-plate-alerts Edge Function or create separate function

### Insurance card handling
- Claude's discretion on who can upload (admin-only vs customer too, based on existing portal capabilities)
- Claude's discretion on OCR vs manual entry (determine if OCR is worth complexity for small dealer)
- Claude's discretion on photo display layout (fit with existing BookingDetail pattern)
- Claude's discretion on insurance persistence across rentals for same customer vs per-booking

### Claude's Discretion
This phase has broad Claude discretion. Key decisions to make during research/planning:
- Capture timing (during booking vs separate step)
- Field set based on Texas insurance requirements
- Dealer coverage model flexibility
- Gate strictness (soft block with override preferred)
- Alert thresholds and delivery method
- Edge Function architecture (bundle vs separate)
- Insurance card OCR feasibility
- Customer data persistence model
- Photo upload and display UX

</decisions>

<specifics>
## Specific Ideas

- Follow the existing override pattern from RegistrationChecker (amber override button, logged for audit)
- Insurance status badges should match the visual language of plate type badges (colored pills)
- Stats bar "Unverified" count follows the existing stats bar pattern from Rentals and Plates pages
- Dual verification: system catches obvious issues, admin has final say

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 08-rental-insurance-verification*
*Context gathered: 2026-02-13*
