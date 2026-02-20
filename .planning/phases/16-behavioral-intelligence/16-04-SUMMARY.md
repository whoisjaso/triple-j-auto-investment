---
phase: 16-behavioral-intelligence
plan: 04
subsystem: urgency-badges
tags: [urgency, badges, tracking, supabase, react-hooks]
dependency-graph:
  requires: ["16-01"]
  provides: ["urgency badge rendering on inventory + detail pages", "form_open and calculator_use event tracking"]
  affects: ["16-05"]
tech-stack:
  added: []
  patterns: ["data-driven badges from Supabase queries", "onClickCapture form tracking wrappers", "onFirstInteraction callback pattern"]
key-files:
  created:
    - triple-j-auto-investment-main/services/urgencyService.ts
    - triple-j-auto-investment-main/hooks/useUrgencyBadges.ts
    - triple-j-auto-investment-main/components/UrgencyBadge.tsx
  modified:
    - triple-j-auto-investment-main/components/PaymentCalculator.tsx
    - triple-j-auto-investment-main/pages/Inventory.tsx
    - triple-j-auto-investment-main/pages/VehicleDetail.tsx
decisions:
  - id: "16-04-01"
    description: "UrgencyBadge placed in image overlay top-right column on inventory cards (below verified badge + save button)"
  - id: "16-04-02"
    description: "Form tracking uses onClickCapture wrappers with a Set ref to fire once per form per page view (no component modifications needed)"
  - id: "16-04-03"
    description: "PaymentCalculator onFirstInteraction fires on first expand toggle (not on slider change) for simpler implementation"
metrics:
  duration: ~12min
  completed: 2026-02-19
---

# Phase 16 Plan 04: Urgency Badges Summary

Honest urgency badges computed from real Supabase data (vehicle age, view counts, reserve-level leads) rendered on inventory cards and vehicle detail pages, plus form interaction tracking on the detail page.

## What Was Built

### Task 1: Urgency Service and Hook (8d78d79)

**urgencyService.ts** -- Pure logic module with zero Supabase dependency. Exports `computeBadges(vehicle, viewCount, hasOffer)` returning an array of badge data:
- **Just Arrived**: `dateAdded` within last 7 days (7 * 86400000 ms check)
- **Popular**: `viewCount >= 10` from `vehicle_view_counts.views_7d`
- **Offer Received**: `hasOffer` true when any lead has `commitment_level >= 3`

Exports: `UrgencyBadgeType`, `UrgencyBadgeData`, `computeBadges`.

**useUrgencyBadges.ts** -- React hook that fetches view counts and offer data from Supabase:
- Two parallel queries: `vehicle_view_counts.select('vehicle_id, views_7d')` + `leads.select('vehicle_id').gte('commitment_level', 3)`
- Results cached in state as `Map<vehicleId, views_7d>` and `Set<vehicleId>`
- Refreshes every 5 minutes via `setInterval` with cleanup
- Returns `{ getBadges, loading, refresh }` where `getBadges(vehicle)` returns computed badges
- Graceful error handling: console.warn on failure, returns empty badges

### Task 2: UrgencyBadge Component and Page Integrations (679bd61)

**UrgencyBadge.tsx** -- Color-coded badge rendering component:
- `just_arrived`: green (`bg-green-950/60 border-green-500/40 text-green-400`)
- `popular`: amber (`bg-amber-950/60 border-amber-500/40 text-amber-400`)
- `offer_received`: red (`bg-red-950/60 border-red-500/40 text-red-400`)
- Uses `useLanguage()` to select `badge.label` (en) or `badge.labelEs` (es)
- Returns null if badges array is empty
- Styled: `text-[8px] font-bold uppercase tracking-[0.15em] rounded-sm`

**Inventory.tsx** changes:
- Added `useUrgencyBadges()` hook call in Inventory component
- Extended `VehicleCardProps` with `getBadges` prop
- Passes `getBadges` to each VehicleCard in the grid
- UrgencyBadge rendered in the top-right badge column (below verified badge and save button)

**VehicleDetail.tsx** changes:
- Added `useUrgencyBadges()` hook call
- Urgency badges rendered in Section 4 alongside VehicleVerifiedBadge in a flex-wrap row
- Section 4 now conditionally renders if either verified OR urgency badges exist
- Added `trackFormOpen` helper (fire-once via Set ref) for `form_open` events
- Wrapped Level 1 (phone_capture), Level 2 (schedule_visit, ask_question), Level 3 (reserve) with `onClickCapture` tracking
- PaymentCalculator wired with `onFirstInteraction` callback for `calculator_use` event tracking

**PaymentCalculator.tsx** changes:
- Added optional `onFirstInteraction` prop
- Fires callback on first expand toggle (uses `interactedRef` to track)

## Decisions Made

1. **Badge placement on cards**: UrgencyBadge placed in the top-right badge column on inventory cards (same column as SALE & RENTAL, verified badge, save button). This keeps all status indicators co-located.

2. **Form tracking approach**: Used `onClickCapture` wrapper divs with a `Set<string>` ref to fire form_open events once per form type per page view. This avoids modifying the 4 engagement form components (PhoneCaptureForm, ScheduleVisitForm, AskQuestionForm, ReserveVehicleSection).

3. **Calculator tracking trigger**: onFirstInteraction fires on the first expand toggle of PaymentCalculator (not on individual slider changes). This is simpler and still captures the meaningful engagement signal.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

1. urgencyService.ts computes Just Arrived (<=7 days), Popular (>=10 views), Offer Received (commitment_level>=3) -- Confirmed
2. useUrgencyBadges.ts fetches from vehicle_view_counts and leads tables, refreshes every 5 minutes -- Confirmed
3. UrgencyBadge.tsx renders green/amber/red color-coded badges, bilingual -- Confirmed
4. Inventory.tsx renders badges on each vehicle card -- Confirmed
5. VehicleDetail.tsx renders badges in Section 4 area -- Confirmed
6. VehicleDetail.tsx tracks form_open and calculator_use events -- Confirmed
7. No hardcoded or admin-override badges exist -- Confirmed (all data from Supabase queries)
8. Vite build passes successfully -- Confirmed

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8d78d79 | urgencyService.ts + useUrgencyBadges.ts |
| 2 | 679bd61 | UrgencyBadge.tsx + Inventory/VehicleDetail/PaymentCalculator integrations |

## Next Phase Readiness

Plan 16-05 (Integration Wiring) can proceed. This plan provides the urgency badge infrastructure that 16-05 may reference during App.tsx-level wiring and page-level tracking integration.
