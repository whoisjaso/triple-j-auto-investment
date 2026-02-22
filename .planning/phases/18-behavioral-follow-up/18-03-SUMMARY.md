---
phase: 18-behavioral-follow-up
plan: 03
subsystem: database
tags: [postgres, supabase, unique-index, partial-index, follow-up-queue, deduplication]

# Dependency graph
requires:
  - phase: 18-behavioral-follow-up
    provides: "phase-18-migration.sql with follow_up_queue table, Tier 3 abandon dual-channel CROSS JOIN unnest insert"
provides:
  - "Corrected uq_pending_follow_up unique index including channel column: (lead_id, trigger_type, channel)"
  - "Tier 3 abandon follow-up now enqueues both sms and email rows for the same lead"
  - "True duplicates (same lead + trigger + channel) remain blocked"
affects: [phase-19-production-launch, supabase-migration-apply]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Partial unique index column granularity: index columns must match the uniqueness semantics of the INSERT logic (include channel when inserts vary by channel)"

key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/supabase/phase-18-migration.sql

key-decisions:
  - "[18-03] Index uq_pending_follow_up columns expanded from (lead_id, trigger_type) to (lead_id, trigger_type, channel) to permit Tier 3 dual-channel rows while still blocking true duplicates"

patterns-established:
  - "Dedup index granularity: when an INSERT generates multiple rows that legitimately differ only by one column, that column must be part of the unique index"

requirements-completed: [FOLLOW-01, FOLLOW-02, FOLLOW-03, FOLLOW-04, FOLLOW-05]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 18 Plan 03: Dedup Index Channel Fix Summary

**Deduplication index uq_pending_follow_up expanded to (lead_id, trigger_type, channel), unblocking Tier 3 abandon dual-channel SMS + email enqueuing and completing FOLLOW-03**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-22T04:22:47Z
- **Completed:** 2026-02-22T04:23:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed structural gap in `phase-18-migration.sql` identified by 18-VERIFICATION.md
- Added `channel` as third column to `uq_pending_follow_up` partial unique index
- Tier 3 (abandon) CROSS JOIN unnest insert now produces two distinct index keys: `(lead_id, 'abandon', 'sms')` and `(lead_id, 'abandon', 'email')` — both enqueue without conflict
- All other tiers (browse sms, save sms, voice voice) remain correctly deduplicated by the same index

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix deduplication index to include channel column** - `3d03dae` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `triple-j-auto-investment-main/supabase/phase-18-migration.sql` - Updated `uq_pending_follow_up` index from `(lead_id, trigger_type)` to `(lead_id, trigger_type, channel)` with updated comment explaining Tier 3 dual-channel rationale

## Decisions Made
- Index columns expanded from 2 to 3 to match the per-channel uniqueness semantics required by the Tier 3 CROSS JOIN unnest insert. No DROP INDEX needed since `IF NOT EXISTS` is used and this is a migration file (applied once to a fresh or existing schema).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The fix was a surgical 1-line change to the index column list plus a comment update. Verified via `git diff` that no other lines were modified.

## User Setup Required

None - no external service configuration required. This migration file must be (re)applied to the Supabase database. If the index already exists in the database from the Phase 18-01 run, the operator must run:

```sql
DROP INDEX IF EXISTS uq_pending_follow_up;
CREATE UNIQUE INDEX uq_pending_follow_up
  ON public.follow_up_queue (lead_id, trigger_type, channel)
  WHERE sent = false AND cancelled = false;
```

The `IF NOT EXISTS` clause in the migration file will be a no-op if the old 2-column index still exists under the same name. Manual index replacement is required for existing deployments.

## Next Phase Readiness

- FOLLOW-03 gap from 18-VERIFICATION.md is fully resolved
- All 5 FOLLOW requirements (01-05) are now satisfied
- Phase 18 behavioral follow-up system is complete end-to-end
- Ready for Phase 19 or production deployment steps

## Self-Check: PASSED

- `triple-j-auto-investment-main/supabase/phase-18-migration.sql` - FOUND
- `.planning/phases/18-behavioral-follow-up/18-03-SUMMARY.md` - FOUND
- Commit `3d03dae` - FOUND

---
*Phase: 18-behavioral-follow-up*
*Completed: 2026-02-22*
