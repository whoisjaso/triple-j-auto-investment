---
phase: 09-inventory-pipeline
plan: 01
subsystem: database, api
tags: [supabase, postgresql, email-parsing, pipeline, nhtsa, vin-decoder, regex]

requires:
  - phase: 02-database
    provides: vehicles + leads tables, RLS, Supabase connection
  - phase: 04-inventory
    provides: vehicle types, queries, NHTSA VIN decoder
provides:
  - Expanded vehicle lifecycle schema (8 statuses)
  - vehicle_events audit trail table
  - Email parsers for OVE, DealShield, Central Dispatch
  - Pipeline query functions with NHTSA auto-fill
  - classifyEmail() routing function
affects: [09-02 Gmail integration, 09-03 admin pipeline UI, 10-crm]

tech-stack:
  added: []
  patterns: [pure email parsers with regex, event-sourced vehicle lifecycle, pipeline status enum]

key-files:
  created:
    - supabase/migration-09-pipeline.sql
    - src/types/pipeline.ts
    - src/lib/email-parsers/ove-parser.ts
    - src/lib/email-parsers/dealshield-parser.ts
    - src/lib/email-parsers/central-dispatch-parser.ts
    - src/lib/email-parsers/index.ts
    - src/lib/supabase/queries/pipeline.ts
  modified:
    - supabase/schema.sql
    - src/types/database.ts
    - src/lib/mock-vehicles.ts

key-decisions:
  - "Pipeline fields optional on VehicleInsert — existing admin form unaffected"
  - "Pure regex parsers with no npm dependencies — machine-generated emails are consistent"
  - "Event-sourced audit trail via vehicle_events table with JSONB event_data"
  - "NHTSA auto-fill in pipeline queries, not parsers — parsers stay pure"

patterns-established:
  - "Email parsers are pure functions: (subject, body) → ParsedType | null"
  - "Pipeline queries handle Supabase writes + event logging as atomic units"
  - "classifyEmail() routes by sender + subject pattern before parsing"

duration: ~20min
started: 2026-03-11T00:00:00Z
completed: 2026-03-11T00:00:00Z
---

# Phase 9 Plan 01: Pipeline Schema & Email Parsers Summary

**Expanded Supabase schema with 8-stage vehicle lifecycle, vehicle_events audit trail, and pure email parsers for Manheim/OVE, DealShield, and Central Dispatch — data foundation for the automated inventory pipeline.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 4 completed (3 auto + 1 checkpoint) |
| Files created | 7 |
| Files modified | 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Vehicle Pipeline Statuses | Pass | 8 statuses in CHECK constraint, 16 pipeline columns added, migration applied to Supabase |
| AC-2: Vehicle Events Audit Trail | Pass | vehicle_events table with FK cascade, JSONB event_data, RLS for anon + authenticated |
| AC-3: OVE Purchase Confirmation Parser | Pass | Regex extracts Y/M/M/Trim/VIN from subject, dollar amounts + mileage + colors from body |
| AC-4: DealShield Guarantee Parser | Pass | VIN from subject, Key:Value pairs from plain text body |
| AC-5: Central Dispatch Transport Parser | Pass | Load ID + status + carrier from subject, ETAs + vehicles with VINs from body |
| AC-6: Pipeline Query Functions | Pass | createVehicleFromPurchase with NHTSA, updateVehicleFromGuarantee, updateVehicleFromTransport, event logging |

## Accomplishments

- Supabase production schema expanded with full vehicle lifecycle (Bidding → Purchased → In_Transit → Arrived → Inspection → Available → Pending → Sold) — migration applied live
- Three email parsers built as pure functions covering all Cox Automotive email sources with unified processEmail() router
- Pipeline query layer bridges parsed email data → Supabase records with automatic NHTSA VIN decoding for engine/transmission/drivetrain specs
- vehicle_events audit trail provides full provenance from email source → vehicle record

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migration-09-pipeline.sql` | Created | DDL migration: expanded status CHECK, 16 new columns, vehicle_events table, RLS, indexes |
| `supabase/schema.sql` | Modified | Master schema updated to reflect v0.2 pipeline additions |
| `src/types/database.ts` | Modified | VehicleStatus expanded to 8 values, Vehicle/VehicleRow + pipeline fields, VehicleInsert with optional pipeline columns |
| `src/types/pipeline.ts` | Created | PipelineStatus, VehicleEvent types, ParsedPurchase/Guarantee/Transport interfaces, classifyEmail() |
| `src/lib/email-parsers/ove-parser.ts` | Created | parseOvePurchaseConfirmation() — extracts Y/M/M, VIN, costs, colors, location from Manheim emails |
| `src/lib/email-parsers/dealshield-parser.ts` | Created | parseDealShieldGuarantee() — extracts VIN, guarantee dates/price from DealShield emails |
| `src/lib/email-parsers/central-dispatch-parser.ts` | Created | parseCentralDispatchNotification() — extracts load ID, status, carrier, ETAs, vehicle VINs |
| `src/lib/email-parsers/index.ts` | Created | Barrel exports + unified processEmail() router |
| `src/lib/supabase/queries/pipeline.ts` | Created | createVehicleFromPurchase, updateVehicleFromGuarantee, updateVehicleFromTransport, event logging, pipeline queries |
| `src/lib/mock-vehicles.ts` | Modified | Added null pipeline field defaults to all 6 mock vehicles |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Pipeline fields optional on VehicleInsert | Existing admin create form doesn't set pipeline fields — making them required would break it | Zero regressions on admin vehicle CRUD |
| Pure regex parsers, no npm dependencies | All source emails are machine-generated templates with consistent patterns — complex HTML/text parsing libraries are overkill | Simpler, faster, zero dependency bloat |
| NHTSA call in pipeline queries, not parsers | Parsers should be pure (no network); NHTSA enrichment is a query-time concern | Clean separation: parsing vs enrichment |
| Retail price defaults to 0 on pipeline creation | Admin sets retail price when listing — purchase_price tracks wholesale cost separately | Clear cost vs price distinction |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Essential — VehicleInsert type needed restructuring |
| Scope additions | 0 | None |
| Deferred | 0 | None |

**Total impact:** One essential type fix, no scope creep.

### Auto-fixed Issues

**1. TypeScript: VehicleInsert required pipeline fields**
- **Found during:** Task 1 (verify step — tsc --noEmit)
- **Issue:** VehicleInsert = Omit<VehicleRow, ...> made all pipeline fields required, breaking existing admin create action and mock data
- **Fix:** Introduced PipelineColumns type union and used Partial<Pick<>> to make pipeline fields optional on insert. Added PIPELINE_DEFAULTS spread to mock vehicles.
- **Files:** src/types/database.ts, src/lib/mock-vehicles.ts
- **Verification:** npx tsc --noEmit passes clean

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| VehicleInsert type broke existing code | Restructured with Partial<Pick<>> for pipeline columns |

## Next Phase Readiness

**Ready:**
- Schema foundation complete — vehicle lifecycle statuses, pipeline columns, event tracking all live in Supabase
- Email parsers ready to receive raw email data from any source (Gmail API, MCP, webhook)
- Pipeline queries ready to create/update vehicles from parsed data
- NHTSA integration proven from v0.1 — auto-fills specs seamlessly

**Concerns:**
- Gmail API access requires Google OAuth2 credentials (client ID, secret, refresh token for triplejautoinvestment@gmail.com) — needs setup before Plan 09-02
- Email parsers tested against known patterns from research, not yet against live emails — may need regex tuning

**Blockers:**
- None

---
*Phase: 09-inventory-pipeline, Plan: 01*
*Completed: 2026-03-11*
