---
phase: 09-inventory-pipeline
plan: 03
subsystem: ui
tags: [admin, pipeline, dashboard, gmail-sync, vehicle-lifecycle, server-actions]

# Dependency graph
requires:
  - phase: 09-01
    provides: pipeline queries (getPipelineVehicles, advanceVehicleStatus), vehicle_events table, PipelineStatus type
  - phase: 09-02
    provides: POST /api/pipeline/sync endpoint (Gmail integration)
provides:
  - Admin pipeline dashboard with stage-grouped vehicle view
  - Gmail sync trigger from UI with results display
  - Vehicle status advancement (Bidding → Available lifecycle)
  - Pipeline navigation in admin sidebar (desktop + mobile)
  - Pipeline stats on admin dashboard
affects: [10-crm, 11-bi]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-component-fetch + client-component-interactivity, server-actions-for-mutations, useTransition-for-pending-state]

key-files:
  created:
    - src/app/admin/pipeline/page.tsx
    - src/components/admin/PipelineClient.tsx
    - src/lib/actions/pipeline.ts
  modified:
    - src/components/admin/AdminSidebar.tsx
    - src/app/admin/page.tsx

key-decisions:
  - "getNextStatus moved to client component — Next.js requires all 'use server' exports to be async"
  - "Pipeline nav ordered between Dashboard and Inventory — matches workflow priority"
  - "4-column stat grid on dashboard: Vehicles | In Pipeline | Total Leads | New Leads"

patterns-established:
  - "Server actions in src/lib/actions/ for admin mutations with revalidatePath"
  - "Stage-grouped card UI pattern for pipeline lifecycle views"

# Metrics
duration: ~30min
started: 2026-03-11T00:00:00Z
completed: 2026-03-11T01:00:00Z
---

# Phase 9 Plan 03: Admin Pipeline Dashboard Summary

**Full admin pipeline dashboard with Gmail sync button, stage-grouped vehicle cards, status advancement controls, sidebar navigation, and dashboard stats integration.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Started | 2026-03-11 |
| Completed | 2026-03-11 |
| Tasks | 3 completed (2 auto + 1 checkpoint) |
| Files modified | 5 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Pipeline Navigation | Pass | Pipeline nav item in sidebar (desktop + 4-tab mobile bottom bar), active state works |
| AC-2: Sync from Gmail | Pass | Gold gradient button, loading spinner, POST /api/pipeline/sync, results banner (created/updated/skipped/errors) |
| AC-3: Pipeline Stage View | Pass | 5 stages (Bidding→Inspection) with colored dot headers, vehicle cards with year/make/model, VIN (truncated on mobile), price, transport details, empty states |
| AC-4: Status Advancement | Pass | Advance button per card, server action calls advanceVehicleStatus, "Publish →" for Inspection stage, revalidates 3 paths |
| AC-5: Pipeline Stats on Dashboard | Pass | getPipelineCount query, "In Pipeline" stat card linking to /admin/pipeline, Pipeline quick action card |

## Accomplishments

- Admin pipeline dashboard replaces Google Sheet workflow for vehicle lifecycle management
- Gmail sync triggerable from UI with real-time results feedback
- Status advancement with single-click progression through Bidding → Available lifecycle
- Pipeline visibility on admin dashboard with live count + quick action

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/app/admin/pipeline/page.tsx` | Created | Server component — fetches pipeline vehicles, groups by stage, passes to client |
| `src/components/admin/PipelineClient.tsx` | Created | Client component — sync button, stage sections, vehicle cards, advance controls |
| `src/lib/actions/pipeline.ts` | Created | Server action — advanceVehicleStatusAction with revalidatePath |
| `src/components/admin/AdminSidebar.tsx` | Modified | Added Pipeline nav item (4th item: Dashboard > Pipeline > Inventory > Leads) |
| `src/app/admin/page.tsx` | Modified | Added getPipelineCount, "In Pipeline" stat card, Pipeline quick action, 4-col grid |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Move getNextStatus to PipelineClient.tsx | Next.js requires all "use server" exports to be async; getNextStatus is sync | Cleaner separation — utility in client, mutation in server action |
| Pipeline nav between Dashboard and Inventory | Pipeline is higher-frequency than inventory management during sourcing phase | Sidebar order: Dashboard > Pipeline > Inventory > Leads |
| 4-column stat grid on dashboard | Natural addition of "In Pipeline" alongside existing 3 stats | Grid: Vehicles / In Pipeline / Total Leads / New Leads |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Essential — fixed build error |
| Scope additions | 0 | None |
| Deferred | 0 | None |

**Total impact:** One essential auto-fix, no scope creep.

### Auto-fixed Issues

**1. Build error: sync function in "use server" file**
- **Found during:** Task 1
- **Issue:** `getNextStatus` (sync utility) exported from `src/lib/actions/pipeline.ts` which has "use server" directive — Next.js requires all exports to be async
- **Fix:** Moved `getNextStatus` and `PIPELINE_ORDER` to PipelineClient.tsx (client component)
- **Files:** `src/lib/actions/pipeline.ts`, `src/components/admin/PipelineClient.tsx`
- **Verification:** `npx tsc --noEmit` passes

## Issues Encountered

None — plan executed cleanly after the one auto-fix.

## Next Phase Readiness

**Ready:**
- Phase 9 complete — full Manheim-to-website pipeline (schema → email parsing → Gmail sync → admin dashboard)
- Vehicle lifecycle management operational (Bidding → Available)
- Foundation set for Phase 10 CRM (leads can now be matched to pipeline vehicles)

**Concerns:**
- Automated hourly Gmail sync deferred (manual button only for now)
- No vehicle event timeline view yet (future enhancement)
- Real inventory migration from Google Sheets still pending (separate from phase work)

**Blockers:**
- None

---
*Phase: 09-inventory-pipeline, Plan: 03*
*Completed: 2026-03-11*
