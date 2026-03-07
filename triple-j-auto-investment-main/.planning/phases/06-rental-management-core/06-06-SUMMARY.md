---
phase: 06-rental-management-core
plan: 06
subsystem: ui
tags: [react, payment-tracking, late-fee, modal-integration, booking-detail, rental-management]

dependency_graph:
  requires:
    - phase: 06-03
      provides: Rentals.tsx base page with calendar, active rentals, fleet tabs
    - phase: 06-04
      provides: RentalBookingModal.tsx, RentalConditionReport.tsx
    - phase: 06-05
      provides: RentalAgreementModal.tsx, SignatureCapture.tsx, pdfService.ts rental agreement
  provides:
    - Complete rental management hub with all modals integrated
    - Payment recording with mixed methods and running balance
    - Late fee management with override/waive/reset
    - Customer running total across all bookings
    - Inline booking detail expansion with accordion behavior
  affects:
    - 07 (Plate Tracking - rental vehicles may need plate management)
    - 08 (Insurance Verification - rental bookings need insurance checks)

tech_stack:
  added: []
  patterns:
    - booking-detail-expansion-pattern
    - payment-recording-inline-pattern
    - late-fee-override-pattern
    - customer-running-total-pattern
    - accordion-expansion-pattern

key_files:
  created: []
  modified:
    - triple-j-auto-investment-main/pages/admin/Rentals.tsx

decisions:
  - id: booking-detail-inline-expansion
    description: "BookingDetail component renders inline below Active Rentals rows (not as a modal)"
    rationale: "Same pattern as RegistrationChecker in Registrations.tsx; keeps context visible"
  - id: accordion-single-expand
    description: "One booking expanded at a time (accordion behavior)"
    rationale: "Prevents overwhelming the page with multiple expanded detail views"
  - id: late-fee-reset-via-direct-supabase
    description: "Reset late fee to auto-calculate uses direct supabase update to set null"
    rationale: "updateBooking's Partial<RentalBooking> cannot distinguish undefined from null; direct query sets null cleanly"
  - id: pre-fill-payment-amount
    description: "Payment amount input pre-fills with remaining balance"
    rationale: "Most common case is paying remaining balance; saves admin a calculation step"
  - id: customer-total-only-when-multiple
    description: "Customer running total section only shown when customer has >1 booking"
    rationale: "Single-booking customers show all info in the booking detail itself; avoids redundant display"
  - id: calendar-booking-click-navigates
    description: "Clicking a booking bar on calendar switches to Active Rentals tab and expands that booking"
    rationale: "Connects calendar visualization to detailed management view seamlessly"

metrics:
  duration: ~4 minutes
  completed: 2026-02-12
  tasks: 1/1
  lines_modified: ~1033 insertions, ~177 deletions (net ~856 lines added)
---

# Phase 06 Plan 06: Payment Tracking & Dashboard Summary

**One-liner:** BookingDetail inline expansion with payment recording (Cash/Card/Zelle/CashApp), late fee override/waive/reset, customer running total, and full modal integration (booking, agreement, condition report) completing the rental management hub.

## What Was Built

### Task 1: Booking Detail View with Payments and Late Fees (1885 lines total)

Updated `pages/admin/Rentals.tsx` with comprehensive booking management capabilities.

**A. BookingDetail Component (inline expansion, ~510 lines):**
Renders below the clicked row in Active Rentals tab or below the calendar.

1. **Booking Header**: Booking ID (TJ-R-YYYY-NNNN), colored status badge, customer name/phone/DL#, vehicle with thumbnail
2. **Dates & Cost Grid**: Start, End, Actual Return, Duration, Daily Rate, Weekly Rate - responsive 2-6 column grid
3. **Late Fee Management** (conditional, shown only when overdue/returned late):
   - Auto-calculated display: "X days overdue x $Y/day = $Z"
   - Override button: inline form with amount + notes + Save
   - Waive button: sets override to $0 with "Waived by admin" note
   - Reset to Auto button: clears override via direct Supabase update (sets null)
   - Visual distinction: red border when active fees, gray when waived
4. **Payments Section**:
   - Balance summary bar: Total Cost | Late Fees | Payments | Remaining (red if >0, green if paid)
   - Payment history table: Date, Amount, Method badge, Notes, Delete button per row
   - Record Payment form: Amount (pre-filled with remaining), 4 method toggle buttons, Notes, Record button
   - Delete confirmation per payment
5. **Customer Running Total** (shown when >1 booking for customer):
   - Total across N rentals, Total paid, Outstanding balance
   - Aggregates from all non-cancelled bookings for the same customer
6. **Condition Reports** (inline toggle):
   - Checkout Report and Return Report buttons expand RentalConditionReport inline
   - Completed reports show green checkmark; pending show default styling
7. **Return Flow** (inline form for active/overdue bookings):
   - Return date (default today) and Mileage In inputs
   - Confirm Return button calls `returnBooking`
   - Auto-prompts Return Report if none exists after return
8. **Actions Bar**: Generate Agreement, Checkout Report, Return Report, Process Return, Cancel Booking

**B. Modal Wiring:**
- `RentalBookingModal`: Rendered at component bottom, controlled by `showBookingModal` state
- `RentalAgreementModal`: Rendered when `agreementBooking` is set, passes booking/customer/vehicle
- `onBookingCreated` -> refreshBookings + reload tab data
- `onAgreementSigned` -> refreshBookings (updates agreement_signed status)
- `onComplete` for condition reports -> reload reports + refresh

**C. Calendar Tab Enhancement:**
- Clicking a booking bar sets `expandedBookingId` and switches to Active Rentals tab
- BookingDetail also renders inline below calendar when a booking is selected on calendar tab

**D. Active Rentals Tab Enhancement:**
- Chevron icon per row (ChevronDown/ChevronUp) for expand/collapse
- Accordion behavior: expanding one collapses the previous
- Collapsed row shows: Status badge, Booking ID, Vehicle, Customer, Date range, Days remaining/overdue, Late fee
- Expanded row shows full BookingDetail component

**E. Overdue Badge:**
- Stats bar Overdue card: red pulsing badge with count when > 0
- `animate-pulse` CSS on the counter badge

**F. Refresh Pattern:**
- `handleRefresh` callback: refreshBookings from store + reload active tab data
- Called after all mutations: create booking, record payment, cancel, return, agreement sign

## Requirements Addressed

| Requirement | How Addressed |
|-------------|---------------|
| RENT-06 (deposits and payments) | Payment recording with Cash/Card/Zelle/CashApp, running balance per booking |
| RENT-01 (dual inventory) | Fleet tab listing type controls (from 06-03, now fully integrated) |
| RENT-02 (availability calendar) | Calendar with booking bars linked to detail view |
| RENT-04 (rental tracking) | Active Rentals tab with overdue highlighting, days remaining |
| Late fee management | Auto-calculated from dailyRate x days overdue, with override/waive/reset |
| Customer running total | Aggregated across all bookings for a customer, visible in detail view |
| End-to-end workflow | Fleet setup -> Create Booking -> Checkout Report -> Agreement -> Record Payments -> Process Return -> Return Report |

## Verification Results

| Check | Status |
|-------|--------|
| RentalBookingModal imported and rendered | PASS |
| RentalAgreementModal imported and rendered | PASS |
| RentalConditionReport imported and rendered (checkout + return) | PASS |
| Payment recording form with amount, method toggle, notes | PASS |
| Late fee management with override/waive/reset | PASS |
| Balance summary: Total Cost + Late Fees - Payments = Remaining | PASS |
| Customer running total section (shown when >1 booking) | PASS |
| Build passes (`npx tsc --noEmit` - no new errors) | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 2b1f6cf | Payment tracking, late fee management, and full modal integration |

## Technical Notes

- `handleResetLateFee` uses a direct Supabase query instead of `updateBooking` because `Partial<RentalBooking>` cannot distinguish between `undefined` (don't update) and `null` (set to null/auto-calculate). The direct query explicitly sets `late_fee_override: null`.
- Payment amount is pre-filled with `remainingBalance.toFixed(2)` on mount, using `useEffect` with a guard to avoid overwriting user input.
- Customer running total calculation iterates `allBookings` (from store) filtered by `customerId`, computing late fees for each booking independently.
- The `BookingDetail` component loads its own payments and condition reports via `useEffect` on `booking.id`, independent of the parent's data loading.

## Phase 6 Completion Status

This is the final plan (06-06) of Phase 6. All 6 plans are now complete:

| Plan | Focus | Commit(s) | Status |
|------|-------|-----------|--------|
| 06-01 | Rental Database Schema | e648fcd | COMPLETE |
| 06-02 | TypeScript Types & Service Layer | ffdfc7a, 2b76ddd | COMPLETE |
| 06-03 | Rental Admin Page & Calendar | e4de9dd, edf7950 | COMPLETE |
| 06-04 | Booking Modal & Condition Report | 9c883ff, 38c613d | COMPLETE |
| 06-05 | Rental Agreement System | 6021df7, ea0d61a | COMPLETE |
| 06-06 | Payment Tracking & Dashboard | 2b1f6cf | COMPLETE |

**Phase 6 delivers a complete rental management system:**
- Database schema with double-booking prevention (EXCLUDE USING gist)
- Service layer with 23 functions and full CRUD
- Calendar view with color-coded bookings
- Active rentals tracking with overdue highlighting
- Fleet management with listing type controls
- Booking creation with customer profiles and availability filtering
- Rental agreement PDF with digital/manual signature
- Vehicle condition reports with 27-item checklist and photo upload
- Payment tracking with mixed methods and running balance
- Late fee auto-calculation with admin override/waive
- Customer running total across all rentals

## Next Phase Readiness

- Phase 7 (Plate Tracking): Rental vehicles may need plate assignment/tracking
- Phase 8 (Insurance Verification): Rental bookings reference insurance requirements in agreement clauses
- Phase 9 (LoJack GPS): Blocked by Spireon API access
- All rental UI components are self-contained and importable by future phases
