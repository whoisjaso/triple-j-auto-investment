---
phase: 07-plate-tracking
plan: 01
subsystem: plate-tracking
tags: [supabase, postgresql, migration, typescript, service-layer]
dependency-graph:
  requires: [06-01]
  provides: [plate-schema, plate-types, plate-service]
  affects: [07-02, 07-03, 07-04]
tech-stack:
  added: []
  patterns: [plate-entity-model, plate-assignment-history, plate-status-trigger, plate-service-transformer]
key-files:
  created:
    - triple-j-auto-investment-main/supabase/migrations/07_plate_tracking.sql
    - triple-j-auto-investment-main/services/plateService.ts
  modified:
    - triple-j-auto-investment-main/types.ts
decisions:
  - id: plate-unique-constraint-via-do-block
    description: "UNIQUE constraint on plate_number via DO block with information_schema guard"
    rationale: "Idempotent pattern -- CREATE TABLE IF NOT EXISTS cannot include inline UNIQUE idempotently"
  - id: dedicated-updated-at-function
    description: "Dedicated update_plates_updated_at() instead of generic update_updated_at_column()"
    rationale: "Generic function may not exist in all environments; self-contained is safer"
  - id: no-delete-on-immutable-tables
    description: "No DELETE RLS policy on plate_assignments and plate_alerts"
    rationale: "Immutable log pattern -- assignments and alerts should be resolved, not deleted"
  - id: client-side-active-assignment-filter
    description: "Filter plate_assignments to active (returned_at IS NULL) client-side in transformPlate"
    rationale: "Supabase PostgREST does not support filtered nested joins; simpler than views"
  - id: two-step-swap
    description: "swapPlateAssignment uses two sequential operations (close + create) instead of atomic"
    rationale: "Partial unique index prevents double-active; if second step fails, plate is safely available"
  - id: expiry-zeroed-hours
    description: "calculateTagExpiry zeroes time components on both dates before comparison"
    rationale: "Avoids off-by-one from timezone differences; pure date comparison"
metrics:
  duration: "3m 18s"
  completed: "2026-02-13"
---

# Phase 7 Plan 01: Plate Tracking Database, Types & Service Layer Summary

**One-liner:** PostgreSQL schema with 3 tables (plates, assignments, alerts), partial unique indexes, SECURITY DEFINER trigger for status sync, plus 15-function plateService.ts with transformer pattern and calculateTagExpiry pure utility.

## What Was Done

### Task 1: Database Migration (07_plate_tracking.sql)
Created complete plate tracking schema with 390 lines of idempotent SQL:

**Tables:**
- `plates` -- First-class plate entity (plate_number, plate_type, status, expiration_date, photo_url, notes). UNIQUE constraint via DO block.
- `plate_assignments` -- Immutable assignment history log with foreign keys to plates, vehicles, rental_bookings, and registrations. Denormalized customer_name/customer_phone for fast dashboard queries.
- `plate_alerts` -- Alert deduplication table (alert_type, severity, first_detected_at, last_notified_at, resolved_at).

**Indexes:**
- `uq_plate_active_assignment` -- Partial unique on plate_assignments(plate_id) WHERE returned_at IS NULL. Prevents two active assignments for the same plate.
- `uq_plate_active_alert` -- Partial unique on plate_alerts(plate_id, alert_type) WHERE resolved_at IS NULL. One active alert per type per plate.
- `idx_plates_status` -- Dashboard filtering by plate status.
- `idx_plate_assignments_plate_id` -- History lookups.
- `idx_plate_assignments_booking_id` -- Rental join queries.

**Triggers:**
- `update_plate_status_on_assignment()` -- SECURITY DEFINER. AFTER INSERT sets plate to 'assigned'; AFTER UPDATE (returned_at set) checks for other active assignments, sets 'available' if none.
- `update_plates_updated_at()` -- BEFORE UPDATE on plates sets updated_at = NOW().

**RLS:** Admin-only on all 3 tables. plate_assignments and plate_alerts have no DELETE policy (immutable log pattern).

### Task 2: TypeScript Types & Service Layer

**types.ts additions (76 lines):**
- Type aliases: PlateType, PlateStatus, PlateAssignmentType, PlateAlertType, PlateAlertSeverity
- Interfaces: Plate (with optional currentAssignment), PlateAssignment (with optional plate/vehicle joins), PlateAlert
- Constants: PLATE_TYPE_LABELS, PLATE_STATUS_LABELS

**plateService.ts (679 lines):**
- **Transformers:** transformPlate (with active assignment extraction from joined array), transformAssignment (with optional vehicle join), transformAlert, transformVehicleMinimal
- **CRUD (5):** getAllPlates, getPlateById, createPlate, updatePlate, deletePlate
- **Queries (2):** getPlatesOut (status = 'assigned' with vehicle joins), getAvailableDealerPlates (type = 'dealer', status = 'available')
- **Assignments (4):** assignPlateToBooking, assignPlateToSale (also updates expiration_date), returnPlateAssignment, swapPlateAssignment (two-step close+create)
- **History (1):** getPlateHistory (with vehicle joins, ordered by assigned_at DESC)
- **Alerts (2):** getActiveAlerts, resolveAlert
- **Photo (1):** uploadPlatePhoto (Supabase Storage bucket 'plate-photos', auto-updates plate.photo_url)
- **Pure utility (1):** calculateTagExpiry (expired/urgent/warning/ok severity tiers, zeroed time components)

## Verification Results

| Check | Result |
|-------|--------|
| Migration SQL is syntactically valid and idempotent | PASS -- IF NOT EXISTS throughout, DO blocks for constraints |
| TypeScript types match DB schema column-for-column | PASS -- All columns mapped with camelCase |
| plateService.ts follows transformer pattern from rentalService.ts | PASS -- Same snake_case to camelCase pattern |
| No new TypeScript compilation errors | PASS -- All errors are pre-existing (RegistrationTracker, Deno, Legal.tsx) |
| Partial unique index pattern matches 04_notification_system.sql | PASS -- Same CREATE UNIQUE INDEX IF NOT EXISTS ... WHERE pattern |

## Decisions Made

1. **UNIQUE constraint via DO block** -- plate_number uniqueness enforced through information_schema guard pattern (same as 06_rental_schema.sql CHECK constraint pattern).
2. **Dedicated updated_at function** -- Created update_plates_updated_at() instead of reusing generic update_updated_at_column() for portability.
3. **No DELETE on immutable tables** -- plate_assignments and plate_alerts only have SELECT, INSERT, UPDATE policies. Aligns with audit trail requirements.
4. **Client-side active assignment filter** -- transformPlate filters plate_assignments array for active (returned_at IS NULL) since PostgREST cannot filter nested joins.
5. **Two-step swap operation** -- swapPlateAssignment closes existing assignment then creates new one. Partial unique index guarantees safety.
6. **Zeroed time components in expiry calculation** -- calculateTagExpiry sets hours/minutes/seconds to 0 on both dates to avoid timezone-related off-by-one errors.

## Deviations from Plan

None -- plan executed exactly as written. Task 1 was already committed from a prior session (506c6ea); Task 2 types were partially written but uncommitted. Both verified and committed cleanly.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 506c6ea | feat(07-01): plate tracking database migration |
| 2 | 69163ee | feat(07-01): TypeScript types and plate service layer |

## Next Phase Readiness

Plan 07-02 (Plates Admin Page) can proceed immediately. It depends on:
- `plates`, `plate_assignments`, `plate_alerts` tables (created in this plan)
- `Plate`, `PlateAssignment`, `PlateAlert` types (added to types.ts)
- `plateService.ts` functions: `getAllPlates`, `getPlatesOut`, `createPlate`, `updatePlate`, `deletePlate`, `getPlateHistory`, `getActiveAlerts`, `resolveAlert`, `calculateTagExpiry`, `uploadPlatePhoto`

**TODOs for deployment:**
- [ ] Apply migration 07_plate_tracking.sql to Supabase
- [ ] Create Supabase Storage bucket 'plate-photos' for plate photo uploads

---

*Plan: 07-01 | Phase: 07-plate-tracking | Completed: 2026-02-13*
