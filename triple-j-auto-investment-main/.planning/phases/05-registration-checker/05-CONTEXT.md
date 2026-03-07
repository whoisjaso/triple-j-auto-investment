# Phase 5: Registration Checker - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Document validation before webDEALER submission to prevent DMV rejections. Admin runs a checklist that verifies document completeness, VIN/mileage consistency across all required documents, SURRENDERED stamp presence, and correct submission ordering. Ends with a link to webDEALER for submission. Document upload/scanning and OCR are NOT in scope.

</domain>

<decisions>
## Implementation Decisions

### Checklist location & flow
- Claude's discretion on where the checker lives in the admin UI (integrated into registration detail, separate section, etc.)
- Checker is always available at any registration stage — not gated by workflow stage
- Failed checks are a soft block with override — admin sees warnings but can proceed with a confirmation ("Are you sure? X checks failed")
- webDEALER link appears at the end of the checker flow (after all checks pass or are overridden) — not a standalone link elsewhere

### Data entry for validation
- System pre-fills VIN and mileage from the existing registration record
- Admin confirms each document matches the pre-filled values (not manual re-entry)
- Mileage requires exact match across all documents — any discrepancy is flagged
- VIN validation includes format check (17 characters, check digit, valid characters) AND cross-document comparison
- All 5 required documents are checked for VIN/mileage wherever those fields appear: Title (front/back), 130-U, Inspection, Insurance proof

### Document ordering guide
- Claude's discretion on presentation format (numbered list, interactive walkthrough, etc.)
- Each document step includes the document name plus a brief tip/note (e.g., "Title (front) — verify SURRENDERED stamp visible")
- Document order is fixed/hardcoded — not admin-configurable (Texas webDEALER has a specific required order)
- Correct webDEALER submission order should be researched during the research phase — not assumed

### Verification interaction
- SURRENDERED stamp check uses two separate checkboxes: "SURRENDERED stamp on front" and "SURRENDERED stamp on back" — both required
- Override confirmation is a simple "Are you sure?" dialog — override is logged but no reason text required
- Claude's discretion on pass/fail visual display (color-coded icons, progress bar, etc.) — should fit existing admin UI style
- Checker results persist until underlying data changes — admin sees last check status without re-running every time

### Claude's Discretion
- Exact placement of checker within admin UI (tab, section, sidebar)
- Pass/fail visual display pattern (traffic light, progress bar, etc.)
- Document ordering guide format (numbered list vs interactive walkthrough)
- Loading states and error handling for checker
- How "persist until changed" is implemented (DB column vs computed on load)

</decisions>

<specifics>
## Specific Ideas

- webDEALER link is the natural endpoint of the checker flow — "all clear, submit now" feeling
- Double checkbox pattern for SURRENDERED stamp makes it hard to accidentally skip checking both sides
- Pre-fill + confirm pattern reduces data entry burden — admin just verifies against physical documents
- Research the exact Texas webDEALER document submission order (don't assume)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-registration-checker*
*Context gathered: 2026-02-11*
