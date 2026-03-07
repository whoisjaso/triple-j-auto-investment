---
phase: 02-database-types
plan: 01
subsystem: database
tags: [supabase, postgresql, typescript, rls]

requires:
  - phase: 01-project-foundation
    provides: Supabase client/server helpers, TypeScript config
provides:
  - SQL schema for vehicles and leads tables with RLS
  - TypeScript types (Vehicle, Lead, VehicleRow, LeadRow, filters, mappers)
  - Typed query helpers (getVehicles, getVehicleBySlug, getFeaturedVehicles, createLead)
  - Seed data (6 vehicles, 3 leads)
affects: [03-layout-shell, 04-homepage, 05-inventory-system, 06-lead-capture, 07-admin-core]

tech-stack:
  added: []
  patterns: [snake-camel-mapping, row-types-plus-app-types, typed-supabase-queries]

key-files:
  created:
    - supabase/schema.sql
    - supabase/seed.sql
    - src/types/database.ts
    - src/lib/supabase/queries/vehicles.ts
    - src/lib/supabase/queries/leads.ts
  modified: []

key-decisions:
  - "Dual type system: VehicleRow (snake_case DB) + Vehicle (camelCase app) with mapper functions"
  - "RLS: anon can SELECT vehicles and INSERT leads; authenticated gets full access"
  - "Vehicle slug pattern: year-make-model-trim (e.g., 2019-toyota-camry-se)"

patterns-established:
  - "DB row types (snake_case) live alongside app types (camelCase) in database.ts"
  - "mapVehicleRow/mapLeadRow convert DB rows to app types"
  - "Query helpers accept SupabaseClient as first arg for server/client flexibility"
  - "VehicleFilters type for composable query filtering"

duration: ~8min
started: 2026-03-07
completed: 2026-03-07
---

# Phase 2 Plan 01: Database & Types Summary

**Supabase schema with vehicles/leads tables, RLS policies, typed query helpers, and 6-vehicle seed dataset for a Houston BHPH dealership.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~8 min |
| Started | 2026-03-07 |
| Completed | 2026-03-07 |
| Tasks | 2 completed |
| Files created | 5 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: SQL schema defines vehicles and leads tables | Pass | 2 tables, constraints, indexes, updated_at trigger |
| AC-2: TypeScript types match the database schema | Pass | Vehicle, Lead, VehicleRow, LeadRow, insert types, filters |
| AC-3: Query helpers provide typed database access | Pass | getVehicles, getVehicleBySlug, getFeaturedVehicles, createLead |
| AC-4: Seed data populates development database | Pass | 6 vehicles ($3.5K-$7.5K), 3 leads, realistic Houston data |

## Accomplishments

- Complete SQL schema with RLS (public browse, public lead submit, admin full access)
- Dual-type system with snake_case DB rows and camelCase app types + mapper functions
- Composable vehicle query filtering (status, make, price range, year range, text search)
- Realistic seed data with Houston-area vehicle descriptions in warm dealership tone

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/schema.sql` | Created | vehicles + leads tables, RLS, indexes, updated_at trigger |
| `supabase/seed.sql` | Created | 6 vehicles + 3 leads with realistic Houston BHPH data |
| `src/types/database.ts` | Created | Vehicle, Lead, Row types, insert types, filters, mappers |
| `src/lib/supabase/queries/vehicles.ts` | Created | getVehicles, getVehicleBySlug, getFeaturedVehicles |
| `src/lib/supabase/queries/leads.ts` | Created | createLead |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Dual type system (Row + App) | Supabase returns snake_case; app uses camelCase | All future code uses camelCase Vehicle/Lead types |
| Mapper functions in database.ts | Centralizes snake-to-camel conversion | Query helpers always return clean app types |
| Query helpers take SupabaseClient param | Works in both Server Components and Client Components | Flexible usage across the app |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Types ready for import in any component
- Query helpers ready for Server Components (Phase 4, 5)
- Lead insert helper ready for forms (Phase 6)
- Schema ready to run in Supabase SQL editor

**Concerns:**
- No Supabase project connected yet (user needs to create project and run schema.sql)
- Seed data uses placeholder image paths — real images needed eventually

**Blockers:** None

---
*Phase: 02-database-types, Plan: 01*
*Completed: 2026-03-07*
