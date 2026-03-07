---
phase: "06"
plan: "03"
subsystem: "rental-ui"
tags: ["calendar", "admin-page", "rental-management", "fleet", "booking-visualization"]
dependency-graph:
  requires: ["06-02"]
  provides: ["rental-admin-page", "rental-calendar", "fleet-controls", "rental-route"]
  affects: ["06-04", "06-05", "06-06"]
tech-stack:
  added: []
  patterns: ["tab-navigation-pattern", "fleet-vehicle-row-pattern", "calendar-grid-pattern", "inline-rate-editing-pattern"]
key-files:
  created:
    - "triple-j-auto-investment-main/components/admin/RentalCalendar.tsx"
    - "triple-j-auto-investment-main/pages/admin/Rentals.tsx"
  modified:
    - "triple-j-auto-investment-main/App.tsx"
    - "triple-j-auto-investment-main/pages/admin/Dashboard.tsx"
    - "triple-j-auto-investment-main/pages/admin/Inventory.tsx"
decisions:
  - id: "calendar-no-library"
    summary: "Custom grid-cols-7 calendar with no third-party dependencies"
    rationale: "Per plan spec; avoids bundle size and styling conflicts"
  - id: "adminheader-duplication"
    summary: "AdminHeader duplicated in Rentals.tsx with Rentals nav item"
    rationale: "Per research pitfall #7; each admin page owns its header"
  - id: "fleet-row-component"
    summary: "FleetVehicleRow as separate component with local rate state"
    rationale: "Rate inputs need local state for blur-save pattern; avoids re-renders of entire fleet list"
  - id: "overdue-first-sort"
    summary: "Active Rentals sorted overdue-first, then by soonest end date"
    rationale: "Most urgent items at top for admin attention"
metrics:
  duration: "~5 minutes"
  tasks: "2/2"
  completed: "2026-02-13"
---

# Phase 06 Plan 03: Rental Admin Page & Calendar Summary

**One-liner:** Admin Rentals page with 3-tab layout (Calendar/Active/Fleet), custom monthly calendar grid, overdue tracking, and fleet listing type controls.

## What Was Built

### Task 1: RentalCalendar Component (299 lines)
Custom monthly calendar component at `components/admin/RentalCalendar.tsx`:

- **Grid layout**: Tailwind `grid-cols-7` with day labels (Sun-Sat)
- **Month navigation**: Previous/Next arrows and Today button
- **Booking bars**: Color-coded by status (blue=reserved, green=active, red=overdue, gray=returned)
- **Overdue pulse**: `animate-pulse` on overdue booking bars
- **Date lookup**: `useMemo` builds `Map<string, RentalBooking[]>` keyed by date string for O(1) per-cell lookup
- **Overflow**: Max 4 booking bars per cell, "+N more" indicator for overflow
- **Today highlight**: `ring-1 ring-tj-gold` on current date cell
- **Click handlers**: `onDateClick(dateString)` and `onBookingClick(booking)` props
- **Legend**: Color legend at bottom of calendar
- **Cancelled bookings**: Filtered out (not displayed)

### Task 2: Rentals Admin Page (1028 lines) + Route Wiring
Main rental management page at `pages/admin/Rentals.tsx`:

**Stats Bar (4 cards):**
- Total Bookings (non-cancelled)
- Active count (green)
- Overdue count (red with AlertTriangle pulse when > 0)
- Fleet Size (vehicles with listing_type rental_only or both)

**Calendar Tab:**
- Renders RentalCalendar component
- Fetches bookings via `getBookingsForMonth` on month change
- Inline booking detail panel on booking click (status badge, vehicle, dates, rate, total)
- Quick actions: Return Vehicle, Cancel Booking
- "New Booking" button (sets state for future modal in Plan 04)

**Active Rentals Tab:**
- Sorted: overdue first, then by end_date ascending
- Each row: status badge, booking ID, vehicle info, customer, date range, days remaining/overdue
- Late fee calculation for overdue bookings (using `calculateLateFee`)
- Return button with mileage-in dialog
- View button for booking detail
- Empty state with green checkmark

**Fleet Tab:**
- Search by year/make/model/VIN
- Filter toggle: "Rental Fleet Only" (default) or "All Vehicles"
- FleetVehicleRow component per vehicle:
  - Vehicle image thumbnail
  - Year/Make/Model and VIN
  - "Currently Rented" badge with customer name and return date
  - Vehicle status badge (Available/Sold/Pending)
  - Listing type dropdown (Sale Only / Rental Only / Both)
  - Daily rate and weekly rate inputs (save on blur)

**Return Vehicle Dialog:**
- Modal with mileage-in input
- Calls `returnBooking(id, today, mileageIn)` from rentalService

**Route & Navigation:**
- App.tsx: `AdminRentals` lazy loaded, `/admin/rentals` behind `ProtectedRoute`
- Navbar: Desktop and mobile Rentals link with Key icon
- AdminHeader updated on Dashboard.tsx, Inventory.tsx, and Rentals.tsx with Rentals nav item

## Requirements Addressed

| Requirement | How Addressed |
|-------------|---------------|
| RENT-01 (dual inventory) | Fleet tab: listing type dropdown per vehicle (sale_only/rental_only/both) |
| RENT-02 (availability calendar) | Calendar tab: monthly grid with color-coded booking bars |
| RENT-04 (rental tracking) | Active Rentals tab: who has what car, when due back, days remaining |
| Overdue surfacing | Red highlighting on both calendar (pulse) and active rentals list |
| Admin navigation | Rentals link on all admin pages and main navbar |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e4de9dd | RentalCalendar monthly grid component |
| 2 | edf7950 | Rentals admin page with tabs and route wiring |

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Custom calendar, no library**: Built with Tailwind grid-cols-7, no react-big-calendar or similar. Keeps bundle lean and styling consistent with dark theme.

2. **AdminHeader duplication**: Per research pitfall #7, each admin page owns its own AdminHeader with its navItems array. Added Rentals entry to Dashboard, Inventory, and Rentals. (Registrations.tsx has no AdminHeader to update.)

3. **FleetVehicleRow as separate component**: Rate inputs use local `useState` for the blur-save pattern. Extracting to a child component prevents rate input changes from re-rendering the entire fleet list.

4. **Overdue-first sort order**: Active Rentals tab sorts overdue bookings to the top, then by soonest end_date. This puts the most urgent items at the top for admin attention.

## Next Phase Readiness

- Plan 04 (Booking Modal): Placeholder `showBookingModal` state and `selectedDate` ready for booking creation modal
- Plan 05 (Agreement Modal): Placeholder `showAgreementModal` state ready
- All service imports already wired: `getBookingsForMonth`, `getActiveBookings`, `returnBooking`, `cancelBooking`, `updateVehicleListingType`, `updateVehicleRentalRates`, `calculateLateFee`
