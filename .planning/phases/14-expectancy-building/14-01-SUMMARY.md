---
phase: 14-expectancy-building
plan: 01
subsystem: vehicle-data-layer
tags: [database, typescript, slug, market-estimate, translations, bilingual]
dependency-graph:
  requires: []
  provides: [vehicle-phase14-fields, vehicle-slug-utility, market-estimate-service, vehicle-detail-translations]
  affects: [14-02, 14-03, 14-04]
tech-stack:
  added: []
  patterns: [snake-to-camelCase-field-mapping, slug-with-short-id-suffix, BHPH-market-estimate-heuristic]
key-files:
  created:
    - triple-j-auto-investment-main/utils/vehicleSlug.ts
    - triple-j-auto-investment-main/services/marketEstimateService.ts
  modified:
    - triple-j-auto-investment-main/types.ts
    - triple-j-auto-investment-main/lib/store/vehicles.ts
    - triple-j-auto-investment-main/utils/translations.ts
decisions:
  - id: 14-01-01
    decision: "Market estimate uses age+mileage heuristic (1.10x-1.20x multiplier) rather than external API"
    rationale: "KBB API requires paid subscription; heuristic is close enough for $3K-$8K BHPH range per CONTEXT.md"
  - id: 14-01-02
    decision: "Monthly payment is simple principal/term division (no APR display)"
    rationale: "Common BHPH practice; avoids Truth in Lending Act complications for estimate display"
  - id: 14-01-03
    decision: "Slug format is year-make-model-shortid (6 chars of UUID) for uniqueness"
    rationale: "Handles duplicate year/make/model listings; short enough for clean URLs"
metrics:
  duration: ~8 min
  completed: 2026-02-18
---

# Phase 14 Plan 01: Data Foundation Summary

**One-liner:** Vehicle type extended with 7 Phase 14 fields, slug generator with UUID suffix, BHPH market estimate heuristic, and 60+ bilingual vehicle detail page translation keys.

## What Was Done

### Task 1: Database Migration (Pre-completed)
Applied via Supabase MCP before this execution session. 7 new columns added to `vehicles` table:
- `slug` (TEXT UNIQUE), `identity_headline` (TEXT), `identity_headline_es` (TEXT), `vehicle_story` (TEXT), `vehicle_story_es` (TEXT), `is_verified` (BOOLEAN DEFAULT false), `market_estimate` (DECIMAL(10,2))
- Index `idx_vehicles_slug` created for slug lookups

### Task 2: Vehicle Type, Store Transform, Slug Utility, Market Estimate Service
**Commit:** `4d537df`

- **types.ts**: Added 7 optional fields to Vehicle interface under `// Phase 14: Expectancy Building` comment
- **lib/store/vehicles.ts**: Added snake-to-camelCase mappings in `loadVehicles` (7 fields), `addVehicle` insert block (7 fields), and `updateVehicle` dbUpdate block (7 fields)
- **utils/vehicleSlug.ts**: New file with `generateVehicleSlug(year, make, model, id)` and `parseVehicleSlug(slug)` -- produces URLs like `2018-honda-accord-a1b2c3`
- **services/marketEstimateService.ts**: New file with `estimateMarketValue(price, year, mileage)` (age/mileage-adjusted 1.10x-1.20x multiplier, rounded to $100) and `estimateMonthlyPayment(price, downPayment, termMonths)` (simple principal/term division)

### Task 3: Bilingual Vehicle Detail Page Translation Keys
**Commit:** `ba7a883`

- **utils/translations.ts**: Added `vehicleDetail` block to both `en` and `es` sections (30+ keys each) covering:
  - Verified badge label and tooltip
  - Price block (Triple J Price, Market Average, You Save, Est. Monthly, disclaimer, market note)
  - Vehicle story heading and fallback text
  - Condition report heading
  - Vehicle specifications labels (Year, Make, Model, Mileage, VIN, Status, Body Type, Condition Notes)
  - Social proof (Listed today/yesterday/X days ago)
  - CTAs (Schedule a Visit, Call Us, Apply for Financing)
  - Navigation (Back to Inventory)
  - Share button
  - Photo gallery (count pattern, no photos message)
  - SEO description template
  - `viewDetails` key for inventory card links (needed by Plan 04)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- [x] Database migration applied (7 columns + index confirmed via Supabase MCP)
- [x] TypeScript compiles clean (zero new errors in modified/created files)
- [x] Vehicle interface has all 7 new fields
- [x] loadVehicles transform maps all 7 snake_case columns
- [x] addVehicle and updateVehicle include reverse mappings
- [x] vehicleSlug.ts exports 2 functions (generateVehicleSlug, parseVehicleSlug)
- [x] marketEstimateService.ts exports 2 functions (estimateMarketValue, estimateMonthlyPayment)
- [x] translations.ts has vehicleDetail in both en (line 226) and es (line 1057), including viewDetails

## Next Phase Readiness

All downstream plans (14-02, 14-03, 14-04) can now consume:
- Extended Vehicle type with Phase 14 fields
- Slug generation for `/vehicles/:slug` routes
- Market estimate calculations for price anchoring UI
- Complete bilingual translation keys for the vehicle detail page
