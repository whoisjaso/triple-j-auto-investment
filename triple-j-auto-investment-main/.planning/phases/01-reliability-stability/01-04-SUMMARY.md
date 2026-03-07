---
phase: 01-reliability-stability
plan: 04
subsystem: store-extraction
tags: [refactoring, google-sheets, leads, extraction]

dependency_graph:
  requires: [01-03]
  provides: [lib/store/sheets.ts, lib/store/leads.ts]
  affects: [01-05, 01-06]

tech_stack:
  added: []
  patterns: [module-extraction, dependency-injection]

key_files:
  created:
    - triple-j-auto-investment-main/lib/store/sheets.ts
    - triple-j-auto-investment-main/lib/store/leads.ts
  modified: []

decisions:
  - id: sync-deps-interface
    decision: "Use SyncDependencies interface for dependency injection"
    rationale: "Allows Store.tsx to pass state setters to extracted sync function"
  - id: preserve-exact-logic
    decision: "Copy code exactly without refactoring"
    rationale: "Maintain identical behavior during extraction phase"

metrics:
  duration: "~22 minutes"
  completed: "2026-02-04"
---

# Phase 01 Plan 04: Sheets and Leads Extraction Summary

**One-liner:** Extracted Google Sheets sync (229 lines) and lead management (68 lines) to lib/store/ modules.

## What Was Built

### lib/store/sheets.ts (229 lines)
Extracted all Google Sheets synchronization logic from Store.tsx:

| Export | Type | Description |
|--------|------|-------------|
| `GOOGLE_SHEET_URL` | const | Published Google Sheet CSV URL |
| `generateOpulentCaption` | function | Luxury description generator for vehicles |
| `parseCSVLine` | function | CSV row parser handling quoted fields |
| `SyncDependencies` | interface | Type for dependency injection to sync function |
| `syncWithGoogleSheets` | async function | Main sync logic: fetch CSV, parse, upsert to Supabase |

### lib/store/leads.ts (68 lines)
Extracted lead management from Store.tsx:

| Export | Type | Description |
|--------|------|-------------|
| `loadLeads` | async function | Fetch leads from Supabase, sorted by date |
| `addLead` | async function | Insert lead + send email notification |

## Architecture Pattern

The extraction uses **dependency injection** rather than direct imports:

```typescript
// SyncDependencies interface
interface SyncDependencies {
  isSyncingRef: React.MutableRefObject<boolean>;
  vehicles: Vehicle[];
  setLastSync: React.Dispatch<React.SetStateAction<Date | null>>;
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  loadVehiclesFn: () => Promise<void>;
  fallbackVehicles: Vehicle[];
}
```

This allows Store.tsx to remain the state owner while delegating logic to the extracted module.

## Commits

| Hash | Message |
|------|---------|
| 110bf4c | feat(01-04): extract Google Sheets sync to lib/store/sheets.ts |
| b7e7fa5 | feat(01-04): extract lead management to lib/store/leads.ts |

## Verification Results

- [x] TypeScript compiles: `npx tsc --noEmit` passes for both files
- [x] sheets.ts exports: GOOGLE_SHEET_URL, generateOpulentCaption, parseCSVLine, SyncDependencies, syncWithGoogleSheets
- [x] leads.ts exports: loadLeads, addLead
- [x] No UI files modified (App.tsx, pages/*.tsx unchanged)
- [x] Store.tsx NOT modified (that's Plan 05)

## Line Count Analysis

| File | Lines | Plan Target |
|------|-------|-------------|
| sheets.ts | 229 | ~180 |
| leads.ts | 68 | ~60 |
| **Total** | **297** | ~240 |

Slightly higher than target due to React import and complete JSDoc preservation.

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 05 can now integrate these modules into Store.tsx by:
1. Importing from `lib/store/sheets.ts` and `lib/store/leads.ts`
2. Replacing inline implementations with imported functions
3. Passing state via SyncDependencies interface

**Dependencies satisfied:** Plan 03 (types.ts) and Plan 04 (sheets.ts, leads.ts) are both complete.
