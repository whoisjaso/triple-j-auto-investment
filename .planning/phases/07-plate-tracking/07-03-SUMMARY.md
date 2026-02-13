---
phase: 07-plate-tracking
plan: 03
subsystem: plate-tracking
tags: [react, rental-integration, plate-selection, plate-return, tabs]
dependency-graph:
  requires: [07-01]
  provides: [rental-plate-integration, plate-return-confirmation, plates-tab]
  affects: [07-04]
tech-stack:
  added: []
  patterns: [plate-selection-in-booking, plate-return-confirmation, plates-out-summary-tab]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/components/admin/RentalBookingModal.tsx
    - triple-j-auto-investment-main/pages/admin/Rentals.tsx
decisions:
  - id: plate-selection-inline-in-vehicle-section
    description: "Plate selection rendered as inline subsection within the 'vehicle' section, not a new tab/step"
    rationale: "Per plan guidance: do NOT change the SectionKey type or SECTIONS array"
  - id: plate-required-new-bookings-only
    description: "selectedPlateId required in isVehicleValid for new bookings, not edit mode"
    rationale: "Plates are assigned at creation time; editing a booking should not re-assign plates"
  - id: graceful-degradation-plate-assignment
    description: "Booking creation succeeds even if plate assignment fails; admin warned to assign manually"
    rationale: "Per research pitfall #1: two separate DB operations without a transaction; graceful degradation preferred"
  - id: plates-out-prop-from-parent
    description: "platesOut fetched by parent Rentals component and passed as prop to BookingDetail"
    rationale: "Avoids duplicate fetches per BookingDetail instance; single source of truth"
  - id: plate-return-default-checked
    description: "plateReturned checkbox defaults to true (checked)"
    rationale: "Per CONTEXT.md: defaults to checked, admin unchecks if plate wasn't physically returned"
metrics:
  duration: "7m 0s"
  completed: "2026-02-13"
---

# Phase 7 Plan 03: Rental Integration Summary

**One-liner:** Plate selection grid in RentalBookingModal with auto-fetch on vehicle select, plate return confirmation checkbox in BookingDetail return flow, and Plates summary tab with overdue-first sorting in Rentals page.

## What Was Done

### Task 1: Plate Selection in RentalBookingModal

Modified the existing 1120-line RentalBookingModal to add plate selection as an inline subsection within the 'vehicle' section.

**Imports added:**
- `getAvailableDealerPlates`, `assignPlateToBooking` from plateService
- `Plate` type from types.ts
- `AlertTriangle` icon from lucide-react

**State additions (3):**
- `availablePlates: Plate[]` -- available dealer plates fetched from DB
- `selectedPlateId: string` -- currently selected plate ID
- `loadingPlates: boolean` -- loading state for plate fetch

**Key behavior:**
- useEffect fetches available dealer plates when `selectedVehicleId` changes (new bookings only)
- Auto-selects if only one plate is available
- Plate selection grid displays plate number and expiration date with gold highlight
- Shows amber warning with AlertTriangle if no dealer plates are available
- `isVehicleValid` updated to require `selectedPlateId` for new bookings (edit mode exempt)
- After successful `createBooking`, calls `assignPlateToBooking` with graceful degradation
- If plate assignment fails, booking still succeeds with warning message
- Plate state reset on modal close via `handleClose`

### Task 2: Return Plate Confirmation and Plates Tab in Rentals Page

Modified the existing 1885-line Rentals.tsx with three additions: plate return confirmation in BookingDetail, platesOut data management in the parent component, and a new Plates summary tab.

**A. BookingDetail plate return confirmation:**

- Added `platesOut: Plate[]` prop to BookingDetailProps interface
- Added `plateReturned` state (defaults to true per CONTEXT.md)
- Derived `bookingPlate` via useMemo, finding plate whose `currentAssignment.bookingId` matches
- Plate return confirmation UI: checkbox with plate number display, red warning when unchecked
- `handleProcessReturn` updated: calls `returnPlateAssignment` after successful `returnBooking`
- Graceful degradation: plate return failure doesn't block booking return

**B. Parent component platesOut management:**

- Added `platesOut: Plate[]` state in main Rentals component
- Added `loadPlatesOut` function calling `getPlatesOut()`
- Loads platesOut on 'active' and 'plates' tab changes
- Refreshes platesOut in `handleRefresh` callback
- Passes `platesOut` prop to all BookingDetail instances (calendar tab + active rentals tab)

**C. Plates summary tab:**

- Extended `RentalTab` type to include `'plates'`
- Added CreditCard icon tab button in tab navigation array
- Tab content: header with count + link to /admin/plates (ExternalLink icon)
- Empty state: green CheckCircle with "All plates accounted for"
- Plate list: overdue-first sorting, each plate shows number, type badge, customer info, days remaining/overdue
- Overdue plates: red border, pulsing red text
- Normal plates: gray border, green text

## Verification Results

| Check | Result |
|-------|--------|
| RentalBookingModal has selectedPlateId state, UI, and submit logic | PASS |
| assignPlateToBooking imported and called in handleSubmit | PASS |
| getAvailableDealerPlates imported and called in useEffect | PASS |
| Rentals.tsx has plateReturned state and checkbox | PASS |
| returnPlateAssignment imported and called in handleProcessReturn | PASS |
| RentalTab type includes 'plates' and tab content rendered | PASS |
| getPlatesOut imported and fetch function added | PASS |
| No new TypeScript compilation errors | PASS -- all errors pre-existing |
| Build succeeds | PASS -- built in 50.82s |

## Decisions Made

1. **Plate selection inline in vehicle section** -- Rendered as subsection within existing 'vehicle' tab, not a new modal step. SectionKey type and SECTIONS array unchanged.
2. **Plate required for new bookings only** -- Edit mode skips plate requirement since plates are assigned at creation time.
3. **Graceful degradation on plate assignment** -- Booking creation succeeds even if plate assignment fails; admin warned to assign manually from Plates page.
4. **platesOut prop from parent** -- Fetched once by Rentals component, passed as prop to all BookingDetail instances to avoid duplicate fetches.
5. **Plate return default checked** -- Per CONTEXT.md, "confirm plate returned" checkbox defaults to checked; admin unchecks only if plate wasn't physically returned.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 86d13f0 | feat(07-03): plate selection in RentalBookingModal |
| 2 | 9406470 | feat(07-03): plate return confirmation and Plates tab in Rentals page |

## Next Phase Readiness

Plan 07-04 (Alert Edge Function & Nav Integration) can proceed immediately. It depends on:
- `plates`, `plate_assignments`, `plate_alerts` tables (from 07-01)
- `plateService.ts` functions: `getActiveAlerts`, `resolveAlert`, `calculateTagExpiry` (from 07-01)
- Plates admin page at `/admin/plates` (from 07-02)
- Rental integration with plate assignment/return (this plan)

The rental workflow now has plate tracking at both ends:
- **Booking creation:** Admin selects a dealer plate, which is assigned via `assignPlateToBooking`
- **Booking return:** Admin confirms plate return via checkbox, which calls `returnPlateAssignment`
- **Plates tab:** Quick summary of plates currently out, with link to full management page

---

*Plan: 07-03 | Phase: 07-plate-tracking | Completed: 2026-02-13*
