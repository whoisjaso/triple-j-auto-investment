---
phase: 16-behavioral-intelligence
plan: 06
subsystem: tracking-urgency
tags: [urgency-badges, form-tracking, calculator-tracking, gap-closure]

dependency-graph:
  requires: [16-04, 16-05]
  provides: ["Inventory urgency badges render without crash", "VehicleDetail urgency badges in Section 4", "form_open + calculator_use event tracking wired"]
  affects: [17]

tech-stack:
  added: []
  patterns: ["fire-once tracking via useRef Set", "onClickCapture for parent-level form interaction detection"]

file-tracking:
  key-files:
    created: []
    modified:
      - triple-j-auto-investment-main/pages/Inventory.tsx
      - triple-j-auto-investment-main/pages/VehicleDetail.tsx

decisions:
  - id: "16-06-01"
    decision: "Section 4 in VehicleDetail uses IIFE pattern to compute badges inline and conditionally render section"
    reason: "Allows badges to be computed once and checked alongside isVerified in a single render block"

metrics:
  duration: "~8 minutes"
  completed: "2026-02-20"
---

# Phase 16 Plan 06: Urgency Badges + Form Tracking Gap Closure Summary

**One-liner:** Fixed runtime crash in Inventory.tsx VehicleCard (undeclared badges variable), added urgency badges to VehicleDetail Section 4, and wired fire-once form_open + calculator_use event tracking.

## What Was Done

### Task 1: Fix urgency badge runtime crash in Inventory.tsx and add badges to VehicleDetail.tsx

**Inventory.tsx (BLOCKER fix):**
- Added `const badges = getBadges(vehicle);` on line 70 inside VehicleCard, after `const isSold` and before the return statement
- This was the only missing piece -- imports, props interface, and JSX were already correct
- Without this declaration, `badges.length > 0` on line 104 threw a ReferenceError crashing the entire inventory grid

**VehicleDetail.tsx (urgency badges integration):**
- Added imports for `useUrgencyBadges` hook and `UrgencyBadge` component
- Called `useUrgencyBadges()` hook inside VehicleDetail component
- Replaced Section 4 from a verified-only conditional to a combined badges section:
  - Uses IIFE to compute `const badges = getBadges(vehicle)` inline
  - Renders when EITHER `vehicle.isVerified` OR `badges.length > 0`
  - Shows VehicleVerifiedBadge and UrgencyBadge side by side in a flex-wrap container

**Commit:** `2fe90ab` -- fix(16-06): resolve urgency badge runtime crash and add badges to VehicleDetail

### Task 2: Wire form_open and calculator_use event tracking in VehicleDetail.tsx

**Fire-once tracking helper:**
- Added `useCallback` to React import
- Created `trackedFormsRef` (useRef with Set<string>) for fire-once tracking
- Created `trackFormOpen` callback that checks the Set before firing, preventing duplicate events

**Level 1/2/3 form tracking:**
- Wrapped Level 1 form grid (`<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">`) with `onClickCapture={() => trackFormOpen('level_1')}`
- Wrapped Level 2 form grid with `onClickCapture={() => trackFormOpen('level_2')}`
- Wrapped Level 3 Reserve section container with `onClickCapture={() => trackFormOpen('level_3')}`

**PaymentCalculator tracking:**
- Passed `onFirstInteraction` callback to PaymentCalculator component that fires `calculator_use` event with vehicle_id and page_path
- PaymentCalculator already had the `onFirstInteraction` prop and internal `interactedRef` fire-once logic -- only needed to pass the callback

**Commit:** `eb596f1` -- feat(16-06): wire form_open and calculator_use event tracking in VehicleDetail

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` -- zero errors in Inventory.tsx and VehicleDetail.tsx | PASS |
| `npx vite build` -- production bundle generated | PASS (18.09s) |
| Inventory.tsx: `const badges = getBadges(vehicle)` before `badges.length > 0` | PASS (line 70) |
| VehicleDetail.tsx: useUrgencyBadges imported and called | PASS (lines 18, 85) |
| VehicleDetail.tsx: UrgencyBadge rendered in Section 4 | PASS (line 521) |
| VehicleDetail.tsx: trackedFormsRef with fire-once Set | PASS (line 204) |
| VehicleDetail.tsx: 3 onClickCapture wrappers | PASS (lines 607, 636, 649) |
| VehicleDetail.tsx: onFirstInteraction on PaymentCalculator | PASS (line 545) |
| VehicleDetail.tsx: calculator_use event type | PASS (line 547) |
| VehicleDetail.tsx: form_open event type | PASS (line 209) |
| No other files modified | PASS (only Inventory.tsx + VehicleDetail.tsx) |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Section 4 IIFE pattern** -- Used an immediately-invoked function expression in JSX to compute badges once and conditionally render the section. This avoids computing badges at the top level when the component returns early (loading/not-found states).

## Gap Closure Status

Both verification gaps from 16-VERIFICATION.md are now resolved:

| Gap | Severity | Status |
|-----|----------|--------|
| Gap 1: Inventory urgency badges crash at runtime | BLOCKER | FIXED -- `const badges = getBadges(vehicle)` declared |
| Gap 2: form_open and calculator_use tracking not wired | WARNING | FIXED -- trackFormOpen helper + 3 onClickCapture + onFirstInteraction |

Phase 16 should now pass re-verification with 4/4 truths verified.
