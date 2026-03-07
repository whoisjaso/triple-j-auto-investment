---
phase: 16-behavioral-intelligence
plan: 03
subsystem: behavioral-intelligence
tags: [recently-viewed, recommendations, localStorage, tracking, dwell-time]
dependency-graph:
  requires: ["16-01"]
  provides: ["useRecentlyViewed hook", "recommendationService", "RecentlyViewedRow component", "vehicle_view + dwell tracking"]
  affects: ["16-04", "16-05"]
tech-stack:
  added: []
  patterns: ["localStorage persistence with cross-tab sync", "content-based similarity scoring", "dwell time tracking via useEffect cleanup"]
key-files:
  created:
    - triple-j-auto-investment-main/hooks/useRecentlyViewed.ts
    - triple-j-auto-investment-main/services/recommendationService.ts
    - triple-j-auto-investment-main/components/RecentlyViewedRow.tsx
  modified:
    - triple-j-auto-investment-main/pages/VehicleDetail.tsx
    - triple-j-auto-investment-main/pages/Inventory.tsx
decisions:
  - "localStorage key 'tj_recently_viewed' with MAX_RECENT=8 entries"
  - "Similarity scoring: make +3, price proximity (20%) +2, year (3yr) +1, mileage (20K) +1 -- max 7 per pair"
  - "Dwell tracking only fires if >= 3 seconds (filters out accidental navigation)"
  - "Recommendations section uses grid layout (2x2 mobile, 4x1 desktop) not horizontal scroll"
  - "RecentlyViewedRow uses horizontal scroll with hidden scrollbar for space efficiency"
metrics:
  duration: "~25 min"
  completed: "2026-02-19"
---

# Phase 16 Plan 03: Recently Viewed + Recommendations Summary

**One-liner:** localStorage recently-viewed hook, content-based vehicle similarity engine, RecentlyViewedRow horizontal scroll, VehicleDetail vehicle_view/dwell tracking + "You Might Also Like" grid

## What Was Done

### Task 1: Recently viewed hook and recommendation service
**Commit:** `5551361`

- **useRecentlyViewed.ts** -- localStorage hook following the useSavedVehicles pattern:
  - Stores `{ vehicleId, viewedAt }` entries under `tj_recently_viewed`
  - Deduplicates on addViewed (moves existing entry to front)
  - Caps at 8 entries (MAX_RECENT)
  - Cross-tab sync via `storage` event listener
  - Returns `{ entries, addViewed, vehicleIds }`

- **recommendationService.ts** -- Pure function module, no Supabase dependency:
  - `scoreSimilarity(a, b)`: Same make +3, price within 20% +2, year within 3 +1, mileage within 20K +1
  - `getRecommendations(viewedVehicles, allVehicles, limit)`: Filters out viewed + non-Available, scores each candidate against ALL viewed vehicles (sum), returns top N

### Task 2: RecentlyViewedRow component and page integrations
**Commit:** `8d99e2f`

- **RecentlyViewedRow.tsx** -- Horizontal scrollable compact vehicle cards:
  - Receives `vehicleIds` prop, looks up vehicles from Store
  - Preserves recently-viewed order (most recent first)
  - Compact cards: w-48/w-56, aspect-video image, year/make/model, price
  - Sold vehicles: grayscale + opacity-40 + "Sold"/"Vendido" overlay
  - Hidden scrollbar for clean aesthetic
  - Links each card to `/vehicles/:slug`

- **VehicleDetail.tsx integrations** (committed via Plan 04 at `679bd61`):
  - `useRecentlyViewed()` hook call with `addViewed(vehicle.id)` on mount
  - `trackEvent({ event_type: 'vehicle_view' })` on mount
  - Dwell tracking via `useEffect` cleanup (fires if >= 3 seconds)
  - `getRecommendations()` via `useMemo` computing 4 similar vehicles
  - "You Might Also Like" grid section (Section 10) after engagement spectrum

- **Inventory.tsx integrations** (committed via Plan 04 at `679bd61`):
  - `useRecentlyViewed()` hook call
  - `<RecentlyViewedRow>` rendered above vehicle grid when `recentIds.length > 0`
  - Wrapped in `py-8 border-b border-white/[0.06] mb-8` section

## Deviations from Plan

### Concurrent Execution
Plan 04 was executed concurrently by another agent and committed VehicleDetail.tsx and Inventory.tsx page integrations as part of its urgency badge work (commits `8d78d79` and `679bd61`). The Plan 03 Task 2 page-level changes (recently viewed rendering, vehicle tracking, recommendations section) were included in those Plan 04 commits. Only the RecentlyViewedRow.tsx component file was committed independently in this plan's Task 2.

No bugs or missing critical functionality were encountered.

## Verification

1. useRecentlyViewed persists under `tj_recently_viewed` -- PASS
2. RecentlyViewedRow renders horizontal scroll of mini cards -- PASS (component created)
3. Sold vehicles grayed out with overlay -- PASS (grayscale + opacity-40 + "Sold" text)
4. VehicleDetail calls addViewed + trackEvent vehicle_view + dwell -- PASS
5. VehicleDetail shows "You Might Also Like" -- PASS (Section 10, grid-cols-2 md:grid-cols-4)
6. Inventory shows "You Recently Viewed" row -- PASS (above grid when recentIds.length > 0)
7. Similarity scoring: make +3, price +2, year +1, mileage +1 -- PASS
8. TypeScript compilation passes (zero new errors) -- PASS

## Next Phase Readiness

Plan 16-04 (urgency badges) is already complete. Plan 16-05 (integration wiring) is the final plan in Phase 16. No blockers.
