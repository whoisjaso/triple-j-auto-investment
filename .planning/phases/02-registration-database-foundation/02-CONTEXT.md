# Phase 2: Registration Database Foundation - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema supports registration tracking with customer access. Admin can update any customer's registration status from the dashboard. Status history is preserved with audit trail.

**In scope:** Schema design, status workflow, admin status controls, audit trail
**Out of scope:** Customer-facing portal (Phase 3), notifications (Phase 4), document validation (Phase 5)

</domain>

<decisions>
## Implementation Decisions

### Status Stages & Workflow
- **6 stages (forward progression):**
  1. Sale Complete — Vehicle sold, plates assigned from dealer inventory
  2. Documents Collected — All paperwork received (title, 130-U, insurance)
  3. Submitted to DMV — Packet uploaded to webDEALER
  4. DMV Processing — Awaiting DMV review
  5. Sticker Ready — Registration approved, sticker available for pickup/delivery
  6. Sticker Delivered — Customer received their sticker
- **Rejected status** — Branches from "DMV Processing" only; can return to "Submitted to DMV" for resubmission
- **Forward-only** — Status cannot go backward except Rejected → Submitted
- **Rejection notes** — Optional free text when marking as rejected (notes live in webDEALER, manual entry for reference)
- **Sensible automation** — Status can auto-advance when all required fields for that stage are complete (e.g., all doc checkboxes checked → Documents Collected)
- **One record per sale** — Same registration record tracks full journey including rejections

### Customer Info Captured
- **Vehicle link** — Registration references existing vehicle record (FK), not copied data
- **Full contact info** — Phone, email, and mailing address
- **Bill of Sale link** — Optional FK to Bill of Sale record (not required)
- **Plate number** — Which plate was assigned from dealer inventory at sale
- **Document checklist** — Boolean fields for each required document:
  - Title (front)
  - Title (back)
  - 130-U
  - Insurance proof
  - Inspection
- **Notes field** — Free text for admin comments
- **Key milestone dates:**
  - Sale date
  - Submission date (when sent to DMV)
  - Approval date (when DMV approved)
  - Delivery date (when sticker delivered)
- Milestone dates auto-populate when status advances to relevant stage

### Admin Status Controls
- **Location** — Accessible from both dedicated registrations list page AND vehicle detail page
- **Control type** — Step buttons for each valid next status (e.g., "Mark Submitted", "Mark Approved"), not dropdown
- **Bulk actions** — Select multiple registrations, apply same status change
- **Filtering** — Full filtering: status, date range, customer name/phone search
- **Rejection notes** — Optional when marking as Rejected
- **Confirmation** — All status changes require confirmation dialog
- **Permissions** — Role-based; new "Registration Admin" role required to update registrations

### Audit Trail
- **Scope** — All field changes tracked, not just status
- **Change notes** — Optional note/reason when making any change
- **Visibility** — History tab/section visible on registration detail in admin UI
- **Detail level** — Show old and new values (e.g., "Status changed from Processing to Approved")
- **Retention** — Forever (no automatic cleanup)
- **Deletion** — Soft delete only; registrations can be canceled/archived but never hard deleted
- **Export** — Admin can download history as CSV/PDF for compliance review
- **Timestamps** — UTC stored in database, displayed in user's local timezone

### Claude's Discretion
- Database table structure and naming conventions
- Exact UI component choices (buttons, modals, etc.)
- Loading states and error handling patterns
- RLS policy implementation details
- Supabase migration structure

</decisions>

<specifics>
## Specific Ideas

- Texas dealers provide plates from inventory at time of sale — customer drives off with plates same day
- DMV processing only results in sticker (not plates)
- Rejection only happens at "DMV Processing" stage — DMV provides notes in webDEALER that dealer must address
- "Registration Admin" role is a new role to be created (separate from existing admin roles)
- Timestamps should follow UTC storage / local display pattern used elsewhere in app

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-registration-database-foundation*
*Context gathered: 2026-02-03*
