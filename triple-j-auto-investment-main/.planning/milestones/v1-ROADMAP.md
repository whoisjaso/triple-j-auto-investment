# Milestone v1: Feature Development

**Status:** SHIPPED 2026-02-13
**Phases:** 1-8
**Total Plans:** 31 (30 complete, 1 deferred)

## Overview

This roadmap delivered a dealership operations platform in 8 phases: stabilizing the existing codebase first, then building the customer-facing registration portal (core value), document validation for DMV submissions, and finally rental management with plate tracking and insurance verification. Phase order was driven by technical dependencies (stability enables features) and business value (registration tracker is core proposition).

## Phases

### Phase 1: Reliability & Stability

**Goal:** The platform is stable enough to build features on without cascading failures.
**Depends on:** None (prerequisite for all other phases)
**Plans:** 6 plans in 3 waves

Plans:
- [x] 01-01: Error handling infrastructure (ErrorModal, useRetry, AppError types)
- [x] 01-02: STAB-01 loop bug fix (hasLoaded state, loading UI)
- [x] 01-03: Extract vehicle CRUD to lib/store/vehicles.ts
- [x] 01-04: Extract sheets sync and leads to lib/store/{sheets,leads}.ts
- [x] 01-05: Integrate modules into Store.tsx facade
- [x] 01-06: Verify decomposition (build, types, structure)

**Details:**
- Error codes grouped by category (RLS, NET, DB)
- Retryable flag on AppError type for UI retry decisions
- hasLoaded flag distinguishes first-load from reload
- Store.tsx reduced from 892 to 281 lines via facade pattern
- Setter injection pattern for extracted module functions

### Phase 2: Registration Database Foundation

**Goal:** Database schema supports registration tracking with customer access.
**Depends on:** Phase 1 (stability - RLS patterns established)
**Plans:** 3 plans in 2 waves

Plans:
- [x] 02-01: Database schema migration (6 stages, audit table, RLS policies)
- [x] 02-02: Service layer and TypeScript type updates
- [x] 02-03: Admin UI updates (step buttons, confirmation dialogs)

**Details:**
- Custom audit trigger (not supa_audit) supporting change notes
- DB-level status transition enforcement
- Step buttons with confirmation dialogs for status advancement
- Document checklist with immediate persistence

### Phase 3: Customer Portal - Status Tracker

**Goal:** Customers can check their registration status without logging in.
**Depends on:** Phase 2 (database schema exists)
**Plans:** 3 plans in 2 waves (2 complete, 1 code-complete/deferred)

Plans:
- [x] 03-01: Token access infrastructure (database migration, service functions)
- [x] 03-02: Visualization components (ProgressArc, ProgressRoad, VehicleIcon)
- [ ] 03-03: CustomerStatusTracker page, routing, admin link display (code-complete, verification deferred)

**Details:**
- 32-char hex token via gen_random_bytes(16)
- Token expiry trigger on sticker_delivered status
- ProgressArc with framer-motion 2.5s arc animation
- ProgressRoad with animated car, responsive orientation
- 3 vehicle icon types (sedan, suv, truck)

### Phase 4: Customer Portal - Notifications & Login

**Goal:** Customers receive updates and returning customers can log in.
**Depends on:** Phase 3 (portal pages exist)
**Plans:** 4 plans in 3 waves

Plans:
- [x] 04-01: Database migration (notification queue, preferences, debounce trigger, phone-auth RLS)
- [x] 04-02: Edge Functions (Twilio SMS, Resend email, queue processor, unsubscribe handler)
- [x] 04-03: Types, services, phone utility, admin notify checkbox + notification history
- [x] 04-04: Customer login (phone OTP), dashboard, notification preferences UI

**Details:**
- Debounce queue with partial unique index + 5-min window
- Template literal HTML emails (no React Email dependency)
- SMS auto-fallback to email on delivery failure
- Token-validated unsubscribe with branded HTML page
- Phone OTP two-step login with resend cooldown

### Phase 5: Registration Checker

**Goal:** Documents are validated before webDEALER submission to prevent DMV rejections.
**Depends on:** Phase 2 (registration records exist to validate against)
**Plans:** 2 plans in 2 waves

Plans:
- [x] 05-01: DB migration (mileage + checker columns, invalidation trigger), VIN validator utility, types + service layer
- [x] 05-02: RegistrationChecker component (all 6 REGC requirements), integration into Registrations.tsx

**Details:**
- 751-line RegistrationChecker.tsx covering 6 REGC requirements
- ISO 3779 VIN check digit validation
- Auto-compute docComplete and vinFormatValid from registration data
- Override with confirmation dialog (logged for compliance)
- DB trigger clears checker_results when VIN/mileage changes

### Phase 6: Rental Management Core

**Goal:** Dealer can manage rental inventory, bookings, and agreements.
**Depends on:** Phase 1 (VehicleContext extracted from Store.tsx)
**Plans:** 6 plans in 4 waves

Plans:
- [x] 06-01: Database migration (rental tables, EXCLUDE constraint, booking ID generator, RLS)
- [x] 06-02: TypeScript types, rentalService.ts, store module, Store.tsx integration
- [x] 06-03: Rentals page, RentalCalendar, active rentals, fleet management, routing
- [x] 06-04: RentalBookingModal (customer form, vehicle selection, date validation)
- [x] 06-05: Rental agreement PDF, SignatureCapture, RentalAgreementModal
- [x] 06-06: Payment tracking, late fees, modal integration, human verification

**Details:**
- EXCLUDE USING gist constraint for database-level double-booking prevention
- TJ-R-YYYY-NNNN booking ID format via DB trigger
- DATE type for rental dates (single-timezone Houston TX)
- 14-clause rental agreement PDF with multi-page handling
- Dual signing flow (digital canvas + manual print-and-confirm)
- Late fee override/waive/reset with inline form

### Phase 7: Plate Tracking

**Goal:** Dealer knows where every plate is at all times.
**Depends on:** Phase 6 (rentals table exists for plate assignments)
**Plans:** 4 plans in 3 waves

Plans:
- [x] 07-01: DB migration (plates, plate_assignments, plate_alerts tables, triggers, RLS), TypeScript types, plateService.ts
- [x] 07-02: Plates admin page (split-view dashboard), PlateAssignmentHistory, routing, nav updates
- [x] 07-03: Rental integration (plate selection in booking, return confirmation, Plates tab in Rentals)
- [x] 07-04: Alert Edge Function (check-plate-alerts), email template, pg_cron schedule

**Details:**
- First-class plate entity with immutable assignment history
- Partial unique index prevents double-active plate assignments
- Split-view dashboard (3/5 urgent, 2/5 reference)
- Batched notifications (one SMS + email per cron run)
- 4-tier tag expiry severity (ok/warning/urgent/expired)

### Phase 8: Rental Insurance Verification

**Goal:** Every rental has verified insurance before vehicle leaves lot.
**Depends on:** Phase 6 (rental records exist to attach insurance to)
**Plans:** 3 plans in 2 waves

Plans:
- [x] 08-01: DB migration (rental_insurance, insurance_alerts tables, RLS, triggers), TypeScript types, insuranceService.ts
- [x] 08-02: InsuranceVerification component, RentalBookingModal insurance section, Rentals.tsx badges/stats
- [x] 08-03: Extend check-plate-alerts Edge Function with insurance expiry detection, email/SMS template updates

**Details:**
- Insurance 1:1 with bookings via UNIQUE constraint
- 5 verification flags computed by pure function (Texas 30/60/25)
- Dual verification: system flags + admin confirms
- Soft-block: booking succeeds with warnings, admin verifies later
- Combined plate + insurance alert pipeline with backward-compatible templates

### Phase 9: LoJack GPS Integration (BLOCKED)

**Goal:** Dealer can view rental vehicle locations for recovery.
**Depends on:** Phase 6 (rental vehicles exist), BLOCKED by Spireon API access
**Plans:** 0 (cannot plan without API documentation)

**Blockers:**
- Spireon API access required - contact vendor for dealer API credentials

---

## Milestone Summary

**Decimal Phases:** None (no emergency insertions needed)

**Key Decisions:**
- 9 phases with comprehensive depth, stability-first ordering
- LoJack isolated in Phase 9 to not block other rental features
- Portal split into 3 phases (DB, UI, Notifications) for clear deliverables
- DATE not TIMESTAMPTZ for rental dates (single-timezone Houston TX)
- EXCLUDE gist constraint for double-booking prevention
- AdminHeader duplicated per page (intentional per research guidance)
- Template literal HTML emails over React Email JSX

**Issues Resolved:**
- Inventory display loop bug (hasLoaded flag)
- RLS silent failure pattern (AppError + retry)
- Store.tsx monolith (facade pattern decomposition)
- AdminHeader missing from Registrations.tsx (added during audit)
- Plates link missing from public Navbar (added during audit)
- Phase 3 and 6 missing verification reports (created during audit)

**Issues Deferred:**
- RENT-05 LoJack GPS (blocked by Spireon API access)
- Phase 3 Plan 03-03 human verification (needs live DB)
- Migrations 02-08 not applied to Supabase
- Edge Functions not deployed
- Storage buckets not created
- API keys not configured
- pg_cron schedules not activated

**Technical Debt Incurred:**
- No test coverage (v2 backlog: STAB-04)
- API keys in frontend bundle (v2 backlog: STAB-05)
- AdminHeader duplicated across 5 admin pages
- Console logging in production code

---

_For current project status, see .planning/STATE.md_
