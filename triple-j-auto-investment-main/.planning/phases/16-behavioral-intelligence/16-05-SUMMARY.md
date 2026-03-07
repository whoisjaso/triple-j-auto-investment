---
phase: 16-behavioral-intelligence
plan: 05
title: "Integration Wiring - Admin Panel & App Tracking Init"
subsystem: behavioral-intelligence
tags: [admin, tracking, attribution, utm, session, dashboard]

dependency-graph:
  requires: ["16-01", "16-02", "16-03", "16-04"]
  provides: ["admin-behavior-dashboard", "app-level-tracking-init", "utm-capture"]
  affects: []

tech-stack:
  added: []
  patterns:
    - "Collapsible admin disclosure panel (useState toggle, default collapsed)"
    - "Parallel Supabase queries via Promise.all for admin data loading"
    - "Session grouping by session_id with Map aggregation"
    - "Attribution aggregation (device/source/page) with horizontal bar visualization"

key-files:
  created:
    - triple-j-auto-investment-main/components/admin/AdminBehaviorPanel.tsx
  modified:
    - triple-j-auto-investment-main/pages/admin/Dashboard.tsx
    - triple-j-auto-investment-main/App.tsx

decisions:
  - id: "16-05-01"
    decision: "Behavior Intelligence section default collapsed on dashboard"
    reason: "Keeps existing financial dashboard view clean; admin expands when needed"
  - id: "16-05-02"
    decision: "No auto-refresh on admin panel (fetches once on mount/expand)"
    reason: "Reduces unnecessary Supabase queries; admin can re-expand to refresh"
  - id: "16-05-03"
    decision: "ChevronDown imported to lucide icon set for toggle visual"
    reason: "Clean expand/collapse indicator matching existing admin UI patterns"

metrics:
  duration: "~8 min"
  completed: "2026-02-19"
---

# Phase 16 Plan 05: Integration Wiring - Admin Panel & App Tracking Init Summary

**Admin Behavior Intelligence dashboard panel with three data sections (top viewed vehicles, recent sessions, attribution breakdown) plus App.tsx tracking initialization (useSessionTracking + captureInitialUtm).**

## What Was Built

### Task 1: Admin Behavior Intelligence Panel (AdminBehaviorPanel.tsx)

Created a self-contained admin panel component that fetches and displays behavioral intelligence data from three Supabase tables in parallel:

1. **Top Viewed Vehicles** -- Queries `vehicle_view_counts` for vehicles with >0 views in the last 7 days, ordered by view count (limit 10). Resolves vehicle IDs to year/make/model via the store.

2. **Recent Sessions** -- Queries `session_events` for the 100 most recent events, groups by `session_id` using a Map, displays the 20 most recent unique sessions with event count, pages visited, and timestamp.

3. **Attribution Breakdown** -- Queries `leads` with non-null `session_id` (limit 200), then aggregates into three mini-displays:
   - By Device: horizontal bar chart showing mobile/tablet/desktop lead counts
   - By Source: top 5 UTM sources (nulls grouped as "Direct")
   - By Page: top 5 page paths generating leads

All three sections have empty state messages and a loading skeleton with pulse animation.

### Task 2: Dashboard Integration & App.tsx Tracking Initialization

**Dashboard.tsx:**
- Imported `AdminBehaviorPanel` component
- Added collapsible "Behavior Intelligence" section between the financial overview grid and the leads table
- Default state: collapsed (clean dashboard view preserved)
- Toggle button with Activity icon and Expand/Collapse label + chevron indicator

**App.tsx:**
- Imported `useSessionTracking` from hooks and `captureInitialUtm` from attributionService
- Added `useSessionTracking()` call in AppContent to track `page_view` events on every route change
- Added `useEffect(() => { captureInitialUtm(); }, [])` to capture UTM parameters from the landing URL before SPA navigation strips them
- Both hooks placed inside AppContent (within BrowserRouter context for useLocation access)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| AdminBehaviorPanel fetches from vehicle_view_counts | PASS |
| AdminBehaviorPanel fetches from session_events | PASS |
| AdminBehaviorPanel fetches from leads | PASS |
| Three sections render with correct headings | PASS |
| Empty states shown when no data | PASS |
| Dashboard.tsx includes AdminBehaviorPanel | PASS |
| App.tsx calls useSessionTracking() | PASS |
| App.tsx calls captureInitialUtm() | PASS |
| TypeScript check (zero new errors) | PASS |
| Full production build (npx vite build) | PASS |

## Commits

| Hash | Message |
|------|---------|
| `0bd6892` | feat(16-05): admin Behavior Intelligence panel component |
| `a015285` | feat(16-05): dashboard integration and App.tsx tracking initialization |

## Phase 16 Completion Status

This is plan 5 of 5 for Phase 16 (Behavioral Intelligence). All plans are now complete:

- 16-01: DB migration + tracking foundation (session_events, vehicle_view_counts, trackingService, useSessionTracking)
- 16-02: Conversion attribution (attributionService, UTM capture, lead attribution columns)
- 16-03: Recently viewed + recommendations (useRecentlyViewed, recommendationService, RecentlyViewedRow)
- 16-04: Urgency badges + form tracking (urgencyService, UrgencyBadge, form_open/calculator_use events)
- 16-05: Integration wiring (AdminBehaviorPanel, Dashboard integration, App.tsx tracking init)

**Phase 16 is COMPLETE.**
