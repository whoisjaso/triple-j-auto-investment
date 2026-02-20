# Plan 16-01 Summary: Database Migration + Tracking Foundation

**Completed:** 2026-02-19
**Duration:** ~8 minutes
**Status:** All 2 tasks done

## One-Liner

Session event tracking infrastructure with buffered flush to Supabase, localStorage session UUID, and pg_cron aggregation jobs.

## What Was Done

### Task 1: Database Migration SQL
- Created `session_events` table with 9 columns: id, session_id, event_type (7 valid types via CHECK), vehicle_id (FK), page_path, metadata (JSONB), referrer, device_type, created_at
- Created `vehicle_view_counts` table with 4 columns: vehicle_id (PK FK), views_7d, views_30d, unique_sessions_7d, last_updated
- Added 7 attribution columns to `leads` table: session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type
- 5 indexes on session_events (session_id, vehicle_id partial, event_type, created_at DESC, composite vehicle_view)
- 2 indexes on leads (session_id partial, utm_source partial)
- RLS on session_events: anonymous insert + admin-only select
- RLS on vehicle_view_counts: public select + admin all
- 3 pg_cron jobs: daily view count aggregation (2 AM UTC), weekly 90-day event cleanup (Saturday 3:30 AM), weekly cron history cleanup (Saturday 4 AM)
- CREATE EXTENSION IF NOT EXISTS pg_cron at top

### Task 2: Tracking Service + React Hook + Types
- `trackingService.ts`: getSessionId() with localStorage persistence (`tj_session_id` key), getDeviceType() matching Tailwind breakpoints, trackEvent() fire-and-forget with auto-flush at 20 events, flush() with error re-queuing, 30s setInterval flush, flushOnUnload() via fetch+keepalive with Supabase REST headers, visibilitychange (primary) and beforeunload (fallback) listeners
- `useSessionTracking.ts`: page_view tracking on route change via useLocation + useEffect, re-exports trackEvent and getSessionId for convenience
- `types.ts`: TrackingEventType union (7 types) and TrackingEvent interface (already committed by prior 16-02 session)

## Files Created/Modified

| File | Change |
|------|--------|
| `supabase/phase-16-migration.sql` | NEW: 153-line migration with 2 tables, 7 ALTER columns, RLS, indexes, pg_cron |
| `services/trackingService.ts` | NEW: event buffering service (156 lines) |
| `hooks/useSessionTracking.ts` | NEW: page view tracking hook (39 lines) |
| `types.ts` | TrackingEventType + TrackingEvent (already committed by prior session) |

## Deviations from Plan

### Pre-existing Changes

**types.ts already modified by prior session:**
- A prior session committed `7b55e65` (feat(16-02)) which already added TrackingEventType, TrackingEvent, Attribution interface, and Lead attribution fields to types.ts
- My edit was effectively a no-op since the types already existed
- No conflict -- the prior changes are consistent with this plan's requirements

## Verification

- SQL file contains all required sections: CREATE TABLE session_events, CREATE TABLE vehicle_view_counts, 7 ALTER TABLE leads, RLS policies, indexes, pg_cron schedules
- trackingService.ts exports getSessionId and trackEvent; uses buffer + 30s flush + visibilitychange/beforeunload
- useSessionTracking.ts exports hook tracking page_view on route changes
- TypeScript: zero errors in new files (pre-existing errors in SEO.tsx, About.tsx, edge functions unchanged)

## Commits

| Hash | Message |
|------|---------|
| `f8f8bb5` | feat(16-01): database migration for behavioral intelligence tracking |
| `b0f0e72` | feat(16-01): tracking service, session hook, and TrackingEvent types |

## Ready For

- Plan 16-02: Attribution capture wired into lead creation pipeline (partially done by prior session)
- Plan 16-03: Recently viewed hook, vehicle_view tracking in VehicleDetail, urgency badges
- Plan 16-04: Recommendation service and admin behavior panel
- Plan 16-05: Integration and wiring into app

---
*Plan: 16-01 | Phase: 16-behavioral-intelligence*
*Completed: 2026-02-19*
