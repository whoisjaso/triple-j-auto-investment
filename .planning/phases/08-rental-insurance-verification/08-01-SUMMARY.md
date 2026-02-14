---
phase: 08-rental-insurance-verification
plan: 01
subsystem: rental-insurance
tags: [supabase, postgresql, migration, typescript, service-layer, insurance, texas-compliance]
depends_on:
  requires: [06-01, 07-01]
  provides: [rental_insurance table, insurance_alerts table, insuranceService.ts, insurance types]
  affects: [08-02, 08-03]
tech-stack:
  added: []
  patterns: [insurance-service-transformer, dual-verification-flags, customer-insurance-cache, insurance-card-upload]
key-files:
  created:
    - triple-j-auto-investment-main/supabase/migrations/08_rental_insurance.sql
    - triple-j-auto-investment-main/services/insuranceService.ts
  modified:
    - triple-j-auto-investment-main/types.ts
decisions:
  - id: integer-coverage-amounts
    description: "Use INTEGER for coverage amounts (whole dollars), not DECIMAL"
    rationale: "Coverage amounts are always whole dollar values ($30,000). Avoids floating point display issues and string coercion from Supabase DECIMAL."
  - id: separate-insurance-alerts-table
    description: "Create insurance_alerts separate from plate_alerts"
    rationale: "Per RESEARCH.md Pitfall 6: keeps plate and insurance concerns separate, simpler migration, no CHECK constraint modification on existing table."
  - id: dedicated-updated-at-function
    description: "Dedicated update_insurance_updated_at() function instead of generic"
    rationale: "Same pattern as update_plates_updated_at() from Phase 7. Generic function may not exist in all environments."
  - id: parseFloat-for-dealer-decimals
    description: "parseFloat for dealer_coverage_daily_rate and dealer_coverage_total"
    rationale: "Supabase returns DECIMAL(10,2) as strings per Pitfall 2. Coverage INTEGER columns use direct assignment."
  - id: pure-validation-function
    description: "validateInsuranceCoverage is a pure function with no DB calls"
    rationale: "Enables reuse in both service layer (createInsurance, updateInsurance) and UI layer (real-time validation) without side effects."
  - id: booking-unique-constraint
    description: "UNIQUE constraint on rental_insurance(booking_id) for 1:1 relationship"
    rationale: "Each booking has exactly one insurance record. Enforced at DB level with DO block idempotent guard."
metrics:
  duration: "~5 minutes"
  completed: 2026-02-13
---

# Phase 8 Plan 01: Database, Types & Service Layer Summary

Insurance data foundation with rental_insurance table, insurance_alerts table, TypeScript types, and 13-function service layer following established plateService.ts patterns. Texas 30/60/25 minimum coverage validation as pure function.

## What Was Built

### Task 1: Database Migration (08_rental_insurance.sql)
- **rental_insurance table** (1:1 with rental_bookings via UNIQUE constraint)
  - Policy details: insurance_company, policy_number, effective_date (DATE), expiration_date (DATE)
  - Coverage amounts: bodily_injury_per_person, bodily_injury_per_accident, property_damage (all INTEGER)
  - Verification: verification_status CHECK ('pending','verified','failed','overridden'), verified_by, verified_at, verification_notes
  - System flags: coverage_meets_minimum, expires_during_rental (computed by app layer)
  - Dealer coverage: dealer_coverage_daily_rate, dealer_coverage_total (DECIMAL(10,2))
  - Insurance card: card_image_url (Supabase Storage URL)
- **insurance_alerts table** (parallel to plate_alerts, separate per RESEARCH.md)
  - alert_type CHECK ('expiring_soon','expired','coverage_below_minimum','missing_insurance')
  - severity CHECK ('warning','urgent')
  - Partial unique index: uq_insurance_active_alert ON (booking_id, alert_type) WHERE resolved_at IS NULL
- **Customer pre-fill columns** on rental_customers: last_insurance_company, last_policy_number, last_insurance_expiry
- **Trigger**: update_insurance_updated_at() on rental_insurance BEFORE UPDATE
- **RLS**: Admin CRUD on rental_insurance, admin SELECT/INSERT/UPDATE on insurance_alerts (no DELETE -- immutable)
- **Indexes**: uq_insurance_active_alert, idx_insurance_alerts_booking_resolved, idx_insurance_alerts_active

### Task 2: TypeScript Types and insuranceService.ts
- **types.ts** extended with RENTAL INSURANCE TYPES section:
  - InsuranceType, InsuranceVerificationStatus, InsuranceAlertType, InsuranceAlertSeverity type aliases
  - RentalInsurance interface (22 fields mapping 1:1 with DB columns)
  - InsuranceVerificationFlags interface (5 boolean flags for dual verification)
  - InsuranceAlert interface (9 fields)
  - TEXAS_MINIMUM_COVERAGE constant (30000/60000/25000)
  - TEXAS_MINIMUM_LABEL ('30/60/25')
  - INSURANCE_STATUS_LABELS record
  - Optional insurance field added to RentalBooking interface
- **insuranceService.ts** with 13 functions:
  - Transformers: transformInsurance (parseFloat for DECIMAL, direct for INTEGER), transformInsuranceAlert
  - CRUD: getInsuranceForBooking, createInsurance, updateInsurance
  - Verification: verifyInsurance, failInsurance, overrideInsurance
  - Upload: uploadInsuranceCard (insurance-cards bucket, same pattern as uploadPlatePhoto)
  - Pure validation: validateInsuranceCoverage (zeroed-time date comparison, Texas minimum check)
  - Alerts: getActiveInsuranceAlerts
  - Customer cache: updateCustomerInsuranceCache, getCustomerLastInsurance

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| INTEGER for coverage amounts | Whole dollar values, avoids DECIMAL string coercion issues |
| Separate insurance_alerts table | Keeps concerns separated from plate_alerts, simpler migration |
| Dedicated updated_at trigger function | Generic may not exist in all environments (Phase 7 pattern) |
| parseFloat for dealer DECIMAL columns only | Coverage amounts are INTEGER (direct); only dealer rates are DECIMAL |
| Pure validateInsuranceCoverage function | No DB calls enables reuse in service + UI layer |
| UNIQUE on booking_id | Enforces 1:1 at DB level with idempotent DO block guard |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| b6350e5 | feat(08-01): rental insurance database migration |
| 2f3edba | feat(08-01): TypeScript types and insurance service layer |

## Verification Results

1. Migration SQL is syntactically valid and idempotent (IF NOT EXISTS, DO blocks)
2. TypeScript compiles with no new errors (all errors are pre-existing per STATE.md)
3. insuranceService.ts follows same patterns as plateService.ts (transformer, CRUD, upload)
4. TEXAS_MINIMUM_COVERAGE matches official Texas 30/60/25 requirement
5. No DECIMAL used for coverage amounts (INTEGER only)
6. DATE type used for date-only fields (effective_date, expiration_date), not TIMESTAMPTZ

## Next Phase Readiness

Plan 08-02 (Insurance Verification UI) can proceed:
- rental_insurance table defined with all columns
- insuranceService.ts provides complete CRUD + validation + upload
- Types exported for import into UI components
- RentalBooking.insurance optional field ready for join queries

Plan 08-03 (Edge Function extension) can proceed:
- insurance_alerts table defined with partial unique index for upsert dedup
- InsuranceAlert type available for Edge Function response handling

### TODOs
- [ ] Apply migration 08_rental_insurance.sql to Supabase
- [ ] Create Supabase Storage bucket 'insurance-cards' for card image uploads
- [ ] Configure insurance-cards bucket access policy for authenticated uploads
