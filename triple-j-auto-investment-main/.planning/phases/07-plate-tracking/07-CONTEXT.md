# Phase 7: Plate Tracking - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Plates become first-class entities with assignment history, customer tracking, and alerting. The dealer can see where every plate is at all times — whether it's a dealer plate out with a rental customer, a buyer's tag issued at sale, or a permanent plate post-registration. Includes a dedicated admin page plus a quick-view tab in the existing Rentals page.

Requirements: PLAT-01 through PLAT-05 (plates as entities, vehicle assignment, customer tracking, dashboard, alerts).

</domain>

<decisions>
## Implementation Decisions

### Plate Types & Attributes
- Three plate types tracked: **dealer plates** (metal, dealership-owned, loaned during rentals), **buyer's tags** (60-day temporary, state-issued numbers, given at sale), and **permanent plates** (post-registration, customer-owned)
- Fleet size is medium (10-25 dealer plates) — UI should handle this comfortably without pagination initially
- Full plate profile per record: plate number, type, status (available/assigned/expired/lost), expiration date, admin notes, and photo of the plate
- Buyer's tag numbers are **state-issued** — admin enters the pre-assigned number from txDMV, not dealer-generated

### Assignment & Return Workflow
- **Rental bookings:** Plate selection is a **required step during booking creation** — the RentalBookingModal should include a plate selection step from the available pool
- **Sales:** Buyer's tag is tracked **at time of sale** — when the registration record is created, admin enters the buyer's tag number issued to the customer
- **Rental return:** Auto-unassigns plate on return **with a "confirm plate returned" checkbox** — defaults to checked, admin can uncheck if plate wasn't physically returned (flags for follow-up)
- **Reassignment:** Direct swap is allowed — admin can move a plate from Vehicle A to Vehicle B in one step without returning first (history still records both events)

### Dashboard Layout & Info Density
- **Navigation:** Both a dedicated `/admin/plates` page AND a quick summary tab in the Rentals page
  - Rentals page: "Plates" tab alongside Calendar/Active/Fleet showing plates currently out with basic info
  - Dedicated page: full plate management with all features
- **Dedicated page layout:** Split view — left side shows plates currently out (urgent/actionable), right side shows full plate inventory
- **Plates-out info per entry (full density):** Plate number, plate type, customer name, customer phone, vehicle (year/make/model), assignment date, expected return date, days remaining/overdue, admin notes
- **Assignment history:** Claude's discretion on format (timeline vs table) — whatever fits best with existing UI patterns

### Alert Behavior & Urgency
- **Alert triggers (all three):**
  1. Overdue rental returns — plate still out past return date
  2. Expiring buyer's tags — two-tier: **yellow warning at 14 days**, **red urgent at 7 days** before 60-day expiration
  3. Unaccounted plates — assigned but no active booking or registration linked
- **Alert display:** In-app badges (red badge on Plates nav item, alert section at top of dashboard) PLUS SMS/email to admin for urgent alerts
- **Alert frequency:** Immediate — send alert as soon as condition is detected (overdue, expiring, unaccounted)
- Admin SMS/email alerts leverage the existing notification infrastructure from Phase 4 (Edge Functions, Twilio, Resend)

### Claude's Discretion
- Assignment history format (timeline vs log table)
- Exact split view proportions and responsive behavior
- How plate selection integrates into the existing RentalBookingModal flow (new step/tab vs inline section)
- Whether permanent plates need active tracking or are just recorded for reference
- Alert deduplication strategy (don't re-alert for the same overdue plate every hour)

</decisions>

<specifics>
## Specific Ideas

- Plates-out dashboard should feel like a "where are my plates RIGHT NOW" command center — the urgent/left side is what the dealer checks first thing every morning
- Buyer's tag 60-day countdown is a real pain point — dealers get fined if tags expire without registration completion, so this alert is business-critical
- Direct plate swap supports the real workflow: dealer pulls a plate off one car and puts it on another without bureaucratic steps in the software

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-plate-tracking*
*Context gathered: 2026-02-13*
