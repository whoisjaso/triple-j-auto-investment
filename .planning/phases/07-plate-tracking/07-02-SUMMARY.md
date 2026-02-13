---
phase: 07-plate-tracking
plan: 02
subsystem: plate-tracking
tags: [react, admin-ui, split-view, crud, navigation, lucide-react]
dependency-graph:
  requires: [07-01]
  provides: [plate-admin-page, plate-nav-integration, plate-assignment-history-component]
  affects: [07-03, 07-04]
tech-stack:
  added: []
  patterns: [split-view-dashboard, plate-crud-form, tag-expiry-badge, overdue-first-sort, cross-page-nav-update]
key-files:
  created:
    - triple-j-auto-investment-main/pages/admin/Plates.tsx
    - triple-j-auto-investment-main/components/admin/PlateAssignmentHistory.tsx
  modified:
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/pages/admin/Dashboard.tsx
    - triple-j-auto-investment-main/pages/admin/Inventory.tsx
    - triple-j-auto-investment-main/pages/admin/Rentals.tsx
decisions:
  - id: split-view-proportions
    description: "3/5 plates-out left, 2/5 inventory right on desktop; stacked on mobile"
    rationale: "Plates-out is the urgent/actionable panel checked every morning; gets more space"
  - id: inline-plate-form
    description: "Add/edit plate forms render inline within the inventory panel, not as modals"
    rationale: "Simpler for small forms; avoids modal overhead for 4-5 fields"
  - id: accordion-single-expand-history
    description: "Only one plate's history expanded at a time across both panels"
    rationale: "Same expandedHistoryId state shared; follows BookingDetail accordion pattern from 06-06"
  - id: creditcard-icon-for-plates
    description: "CreditCard lucide-react icon used for Plates nav item across all admin pages"
    rationale: "Distinct from existing icons (LayoutDashboard, Car, ClipboardCheck, Key)"
  - id: type-filter-abbreviations
    description: "Inventory panel shows abbreviated type badges (DLR, Tag, PMT) to save space"
    rationale: "Full labels in plates-out panel; compact badges in inventory list"
metrics:
  duration: "7m 12s"
  completed: "2026-02-13"
---

# Phase 7 Plan 02: Plates Admin Page Summary

**One-liner:** 1099-line Plates.tsx admin page with split-view dashboard (plates out 3/5 + inventory 2/5), 202-line PlateAssignmentHistory timeline, plus route/nav integration across App.tsx and 3 admin pages.

## What Was Done

### Task 1: Plates Admin Page with Split-View Dashboard

**PlateAssignmentHistory.tsx (202 lines):**
- Reusable component accepting `plateId` and `isOpen` props
- Fetches `getPlateHistory(plateId)` on mount when expanded
- Vertical timeline layout with `border-l-2 border-tj-gold/20` line
- Assignment type badges: rental (blue), sale (amber), inventory (gray)
- Shows customer name, phone (clickable tel: link), vehicle info
- Date range: assigned -> returned (or "Currently Out" for active)
- Return confirmation status: green check or red "Not confirmed"
- Notes display for each assignment entry

**Plates.tsx (1099 lines):**

- **AdminHeader:** Duplicated per established pattern (pitfall #7). 5 navItems: Dashboard, Inventory, Registrations, Rentals, Plates. CreditCard icon for Plates. Full mobile menu support.

- **Stats Bar:** 5 summary metrics in horizontal grid:
  - Total Plates (white)
  - Out Now (amber, red pulse badge if any overdue)
  - Available (green)
  - Active Alerts (red when > 0)
  - Expiring Soon (amber, buyer's tags within 14 days)

- **Left Panel - Plates Out (lg:col-span-3):**
  - Shows all plates with status = 'assigned'
  - Each card: plate number (large mono), type badge, customer name + phone, vehicle info, assigned/return dates
  - DaysIndicator component: green for remaining, red pulsing for overdue, amber for due-today
  - Buyer's tag expiry: TagExpiryBadge with 4-tier severity (ok=green, warning=amber, urgent=red, expired=red+pulse)
  - Overdue plates sorted to top (most overdue first, then by nearest return)
  - Red left border + bg-red-900/10 for overdue plates
  - Quick actions: "Returned" button (calls returnPlateAssignment), "History" toggle
  - Empty state: green check "All plates accounted for"

- **Right Panel - Plate Inventory (lg:col-span-2):**
  - Header with "Add Plate" button
  - Filter row: type filter (All/Dealer/Buyer's Tag/Permanent), status filter (All/Available/Assigned/Expired/Lost)
  - Compact plate list with abbreviated type badges (DLR/Tag/PMT)
  - Status badges with severity colors
  - Expiration date with TagExpiryBadge for buyer's tags
  - Current vehicle shown for assigned plates
  - Actions: History toggle, Edit (inline form), Delete (only when no active assignment)
  - Add/Edit form: PlateForm component with plate number, type toggle buttons, expiration date (auto-suggest +60 days for buyer's tags), notes, photo upload
  - Max height with scrollbar for long lists

- **Plate CRUD:** PlateForm reusable component for both add and edit operations. Photo upload via `uploadPlatePhoto`. Delete with confirmation dialog.

- **Responsive:** Stacks vertically on mobile (< lg). Plates-out on top, inventory below.

- **Toast notifications:** Success messages for add/edit/delete/return actions.

### Task 2: Routing, Navigation, and Cross-Page Updates

**App.tsx changes:**
- Added lazy import: `const AdminPlates = lazyWithErrorHandling(() => import('./pages/admin/Plates'), 'Admin Plates')`
- Added route: `<Route path="/admin/plates" element={<ProtectedRoute><AdminPlates /></ProtectedRoute>} />`
- Added `CreditCard` to lucide-react import

**Dashboard.tsx changes:**
- Added `CreditCard` to lucide-react import
- Added `{ path: '/admin/plates', label: 'Plates', icon: CreditCard }` to navItems array

**Inventory.tsx changes:**
- Added `CreditCard` to lucide-react import
- Added `{ path: '/admin/plates', label: 'Plates', icon: CreditCard }` to navItems array

**Rentals.tsx changes:**
- CreditCard was already imported (from prior work)
- Added `{ path: '/admin/plates', label: 'Plates', icon: CreditCard }` to navItems array

## Verification Results

| Check | Result |
|-------|--------|
| Plates.tsx imports from plateService.ts and types.ts | PASS |
| PlateAssignmentHistory.tsx accepts plateId and calls getPlateHistory | PASS |
| AdminHeader in Plates.tsx has 5 navItems | PASS |
| App.tsx has lazy import and Route for /admin/plates | PASS |
| Dashboard.tsx has admin/plates navItem | PASS |
| Inventory.tsx has admin/plates navItem | PASS |
| Rentals.tsx has admin/plates navItem | PASS |
| No new TypeScript compilation errors (pre-existing only) | PASS |
| Build completes successfully (Plates chunk at 28.28 kB) | PASS |
| Plates.tsx >= 400 lines (actual: 1099) | PASS |
| PlateAssignmentHistory.tsx >= 60 lines (actual: 202) | PASS |

## Decisions Made

1. **Split-view proportions (3/5 + 2/5)** -- Plates-out panel is the urgent/actionable side checked every morning; gets 60% width. Inventory is reference/management; 40%.
2. **Inline plate forms (not modals)** -- Add/edit forms for plates render inline within the inventory panel. Only 4-5 fields, modal overhead unnecessary.
3. **Accordion single-expand for history** -- Only one plate's history expanded at a time across both panels. Same `expandedHistoryId` state manages both panels. Follows BookingDetail accordion pattern from 06-06.
4. **CreditCard icon for Plates nav** -- Distinct from existing nav icons. Lucide CreditCard visually resembles a plate/card.
5. **Abbreviated type badges in inventory** -- DLR, Tag, PMT instead of full labels to save horizontal space in the compact inventory list.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 832940c | feat(07-02): plates admin page with split-view dashboard |
| 2 | da78f08 | feat(07-02): routing, navigation, and cross-page plate nav updates |

## Next Phase Readiness

Plan 07-03 (Rental Integration) can proceed immediately. It depends on:
- `Plates.tsx` admin page (created in this plan)
- `PlateAssignmentHistory.tsx` component (created in this plan)
- `/admin/plates` route registered in App.tsx
- Plates nav item in all admin headers
- All service functions from 07-01 (plateService.ts)

Plan 07-03 will:
- Add plate selection step to RentalBookingModal
- Add plate return confirmation to BookingDetail in Rentals.tsx
- Wire plate assignment/return to booking lifecycle

---

*Plan: 07-02 | Phase: 07-plate-tracking | Completed: 2026-02-13*
