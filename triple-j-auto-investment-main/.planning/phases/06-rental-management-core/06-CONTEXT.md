# Phase 6: Rental Management Core - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin tools for managing rental inventory, bookings, agreements, and payments. Covers dual inventory model (sale/rental/both), availability calendar, auto-populated rental agreements, customer rental tracking, and payment recording. Plate tracking (Phase 7), insurance verification (Phase 8), and GPS integration (Phase 9) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Inventory Classification
- Toggle on vehicle card — inline with existing vehicle detail/edit view (year, make, price, etc.)
- Options: sale-only, rental-only, or both
- Per-vehicle rental rates: daily rate, weekly rate fields on vehicle record
- Vehicle can be listed for sale while currently rented out
- When a "both" vehicle is rented out, show as unavailable in public inventory with expected return date (not hidden)
- Vehicle card shows current rental status only — no rental history on the card
- Both minimum and maximum rental duration enforced (configurable per vehicle or globally)

### Calendar & Booking Flow
- Monthly grid calendar view — see all bookings at a glance, click to drill in
- Full customer profile captured per booking: name, phone, email, driver's license number, full address, emergency contact, employer info
- Overdue rentals surfaced via both: dashboard alert badge (red counter) AND red highlighting on calendar grid

### Rental Agreement Format
- Hybrid approach: enhance existing basic template with comprehensive legal clauses
- Auto-populate from vehicle and customer data (like Bill of Sale flow)
- PDF output for printing and archival
- Comprehensive clauses required:
  - Geographic restrictions: no out-of-state driving unless specifically permitted
  - Mileage limits and approved use areas
  - Liability and damage responsibility
  - Insurance requirements
  - Accident reporting procedures
  - Liability waivers
  - Late return penalties
  - Authorized drivers (named on agreement)
  - Prohibited uses (racing, towing, commercial use, etc.)
- Signature: support both digital signature (finger/stylus/mouse captured as image) and print-and-sign with manual confirmation in system
- Vehicle condition report included: walk-around checklist (exterior, interior, fuel level, mileage) with photo upload slots for pre-existing damage documentation

### Payment & Deposit Tracking
- Mixed payment methods tracked per payment: cash, card, Zelle, CashApp
- Both per-booking balance (total cost vs payments made vs remaining) AND per-customer running total across all rentals
- Late fees: auto-calculated based on daily rate when return date passes, but admin can override or waive
- No security deposits in this phase (deferred)

### Claude's Discretion
- Rental-only vehicle visibility in sales inventory list (filtered by default vs visible with badge)
- Vehicle category grouping for rental fleet (based on existing vehicle data structure)
- Booking creation flow order (vehicle-first vs date-first vs customer-first)
- Calendar click-through behavior and drill-in detail
- Condition report checklist item categories
- Agreement PDF layout and styling
- Late fee calculation timing (daily vs per-incident)

</decisions>

<specifics>
## Specific Ideas

- "Make a cohesive in-depth rental agreement" — not a basic template, needs to protect the dealer
- "No out-of-state drives unless permitted" — explicit geographic restriction clause with permission mechanism
- "Things that don't hold us liable" — liability waivers and damage responsibility clauses are critical
- Rental agreement should follow the same auto-populate pattern as existing Bill of Sale flow
- Condition report with photos provides evidence for damage disputes at return

</specifics>

<deferred>
## Deferred Ideas

- Security deposits (collect at pickup, refund at return) — user wants this but for a future iteration
- Rental history view per vehicle (total revenue, days rented, past bookings) — keep vehicle card clean for now

</deferred>

---

*Phase: 06-rental-management-core*
*Context gathered: 2026-02-12*
