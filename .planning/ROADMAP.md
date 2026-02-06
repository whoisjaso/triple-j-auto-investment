# Roadmap: Triple J Auto Investment

**Created:** 2026-01-29
**Depth:** Comprehensive (8-12 phases)
**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

---

## Overview

This roadmap delivers a dealership operations platform in 8 phases: stabilizing the existing codebase first, then building the customer-facing registration portal (core value), document validation for DMV submissions, and finally rental management with plate tracking and insurance verification. Phase order is driven by technical dependencies (stability enables features) and business value (registration tracker is core proposition).

---

## Phases

### Phase 1: Reliability & Stability

**Goal:** The platform is stable enough to build features on without cascading failures.

**Dependencies:** None (prerequisite for all other phases)

**Requirements:**
- STAB-01: Fix inventory display loop bug
- STAB-02: Fix RLS silent failure pattern
- STAB-03: Decompose Store.tsx monolith into separate concerns

**Success Criteria:**
1. Admin can view full vehicle inventory without loading loops or missing vehicles
2. All database updates either succeed with confirmation or fail with clear error messages (no silent failures)
3. Store.tsx is decomposed into modules - each under 300 lines
4. Existing functionality (Bill of Sale, lead management, inventory CRUD) continues working after refactor

**Plans:** 6 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md - Error handling infrastructure (ErrorModal, useRetry, AppError types)
- [x] 01-02-PLAN.md - STAB-01 loop bug fix (hasLoaded state, loading UI)
- [x] 01-03-PLAN.md - Extract vehicle CRUD to lib/store/vehicles.ts
- [x] 01-04-PLAN.md - Extract sheets sync and leads to lib/store/{sheets,leads}.ts
- [x] 01-05-PLAN.md - Integrate modules into Store.tsx facade
- [x] 01-06-PLAN.md - Verify decomposition (build, types, structure)

---

### Phase 2: Registration Database Foundation

**Goal:** Database schema supports registration tracking with customer access.

**Dependencies:** Phase 1 (stability - RLS patterns established)

**Requirements:**
- PORT-03: Admin dashboard controls to update customer registration status

**Success Criteria:**
1. Registrations table exists with 6 status stages, customer info, and validation fields
2. Admin can update any customer's registration status from the dashboard
3. Status history is preserved (audit trail of who changed what, when)
4. RLS policies allow admin write and customer read (by order_id)

**Plans:** 3 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md - Database schema migration (6 stages, audit table, RLS policies)
- [x] 02-02-PLAN.md - Service layer and TypeScript type updates
- [x] 02-03-PLAN.md - Admin UI updates (step buttons, confirmation dialogs)

---

### Phase 3: Customer Portal - Status Tracker

**Goal:** Customers can check their registration status without logging in.

**Dependencies:** Phase 2 (database schema exists)

**Requirements:**
- PORT-01: 6-stage progress tracker with visual progress bar
- PORT-02: Customer access via unique link (texted/emailed after sale)
- PORT-04: Animated progress visualization (Golden Crest logo, car animation)
- PORT-07: Stage descriptions explaining what's happening at each stage

**Success Criteria:**
1. Customer opens unique link and sees their current registration stage (1 of 6)
2. Progress bar visually shows completed vs pending stages with animations
3. Each stage displays clear description of what's happening and what customer needs to do
4. Page is mobile-responsive and loads in under 3 seconds
5. Invalid/expired links show helpful error message (not broken page)

**Plans:** 3 plans in 2 waves

Plans:
- [ ] 03-01-PLAN.md - Token access infrastructure (database migration, service functions)
- [ ] 03-02-PLAN.md - Visualization components (ProgressArc, ProgressRoad, VehicleIcon)
- [ ] 03-03-PLAN.md - CustomerStatusTracker page, routing, admin link display

---

### Phase 4: Customer Portal - Notifications & Login

**Goal:** Customers receive updates and returning customers can log in.

**Dependencies:** Phase 3 (portal pages exist)

**Requirements:**
- PORT-05: Customer login option for returning customers
- PORT-06: SMS/Email notifications when status changes

**Success Criteria:**
1. Customer receives SMS when their registration status changes
2. Customer receives email with status update and link to portal
3. Returning customers can log in with email to see all their registrations
4. Notification preferences can be set (SMS, email, both, none)
5. Notifications are throttled (no spam if admin makes multiple quick updates)

---

### Phase 5: Registration Checker

**Goal:** Documents are validated before webDEALER submission to prevent DMV rejections.

**Dependencies:** Phase 2 (registration records exist to validate against)

**Requirements:**
- REGC-01: Document completeness check (Title front/back, 130-U, Inspection, Insurance proof)
- REGC-02: VIN consistency validation across all documents
- REGC-03: Mileage consistency check across documents
- REGC-04: SURRENDERED stamp verification (front AND back of title)
- REGC-05: Document ordering guide per txDMV requirements
- REGC-06: Quick link to webDealer.txdmv.gov from admin dashboard

**Success Criteria:**
1. Admin sees checklist of required documents with pass/fail status per registration
2. System flags VIN mismatches between Bill of Sale, 130-U, and title
3. System flags mileage inconsistencies across documents (with tolerance threshold)
4. System reminds admin to verify SURRENDERED stamp on both sides of title
5. Document order guide shows correct webDEALER submission sequence
6. One-click link opens webDEALER login in new tab

---

### Phase 6: Rental Management Core

**Goal:** Dealer can manage rental inventory, bookings, and agreements.

**Dependencies:** Phase 1 (VehicleContext extracted from Store.tsx)

**Requirements:**
- RENT-01: Dual inventory model (vehicles marked as: sale-only, rental-only, or both)
- RENT-02: Availability calendar showing which vehicles are available when
- RENT-03: Auto-populated rental agreements (like Bill of Sale flow)
- RENT-04: Customer rental tracking (who has what car, return dates, rental history)
- RENT-06: Deposits and payments tracking

**Success Criteria:**
1. Admin can mark any vehicle as available for sale, rent, or both
2. Calendar view shows which rental vehicles are available on any given date range
3. Rental agreement auto-populates from vehicle and customer data (like Bill of Sale)
4. Admin can see who currently has each rental vehicle and when it's due back
5. Deposits and payments are tracked per rental with running balance
6. Double-booking is prevented by database constraint (not just UI warning)

---

### Phase 7: Plate Tracking

**Goal:** Dealer knows where every plate is at all times.

**Dependencies:** Phase 6 (rentals table exists for plate assignments)

**Requirements:**
- PLAT-01: Plates as first-class entity with assignment history
- PLAT-02: Plate -> Vehicle assignment tracking
- PLAT-03: Plate -> Rental Customer tracking (who has plate, return date)
- PLAT-04: Dashboard view of all plates currently "out" with customers
- PLAT-05: Alerts for unaccounted plates and overdue rentals

**Success Criteria:**
1. Admin can add/edit/view plates as independent entities (not just vehicle attributes)
2. Plate assignment history shows which vehicle had which plate and when
3. System tracks which customer currently has each plate during rentals
4. Dashboard shows all plates currently out with customer name and return date
5. Alerts appear for overdue rentals and plates not returned on time

---

### Phase 8: Rental Insurance Verification

**Goal:** Every rental has verified insurance before vehicle leaves lot.

**Dependencies:** Phase 6 (rental records exist to attach insurance to)

**Requirements:**
- RINS-01: Capture insurance info (company, policy #, effective dates, coverage amounts)
- RINS-02: Photo/scan upload of insurance card
- RINS-03: Coverage verification against minimum requirements
- RINS-04: Expiration alerts if insurance expires during rental period

**Success Criteria:**
1. Insurance info is captured and stored for each rental customer
2. Insurance card image can be uploaded and viewed from rental record
3. System flags if coverage amounts are below Texas minimum requirements
4. Alert appears if customer's insurance will expire during rental period
5. Rental cannot be completed without insurance verification (soft block with override)

---

### Phase 9: LoJack GPS Integration

**Goal:** Dealer can view rental vehicle locations for recovery.

**Dependencies:** Phase 6 (rental vehicles exist), **BLOCKED** by Spireon API access

**Requirements:**
- RENT-05: LoJack GPS integration showing vehicle location

**Success Criteria:**
1. Admin can view last known location of any rental vehicle with LoJack device
2. GPS data refreshes on-demand (not real-time continuous)
3. Location is shown on map within rental vehicle detail view
4. Consent workflow captures customer acknowledgment of GPS tracking before rental

**Blockers:**
- Spireon API access required - contact vendor for dealer API credentials and documentation
- Cannot estimate effort until API documentation is available

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Reliability & Stability | Complete | 3 | 100% (6 plans) |
| 2 - Registration Database Foundation | Complete | 1 | 100% (3 plans) |
| 3 - Customer Portal - Status Tracker | Planned | 4 | 0% (3 plans ready) |
| 4 - Customer Portal - Notifications & Login | Pending | 2 | 0% |
| 5 - Registration Checker | Pending | 6 | 0% |
| 6 - Rental Management Core | Pending | 5 | 0% |
| 7 - Plate Tracking | Pending | 5 | 0% |
| 8 - Rental Insurance Verification | Pending | 4 | 0% |
| 9 - LoJack GPS Integration | Blocked | 1 | 0% |

**Total:** 26 requirements across 9 phases
**Coverage:** 26/26 (100%)

---

## Dependency Graph

```
Phase 1: Reliability & Stability
    |
    +---> Phase 2: Registration Database Foundation
    |         |
    |         +---> Phase 3: Customer Portal - Status Tracker
    |         |         |
    |         |         +---> Phase 4: Customer Portal - Notifications & Login
    |         |
    |         +---> Phase 5: Registration Checker
    |
    +---> Phase 6: Rental Management Core
              |
              +---> Phase 7: Plate Tracking
              |
              +---> Phase 8: Rental Insurance Verification
              |
              +---> Phase 9: LoJack GPS Integration [BLOCKED]
```

**Parallelization Opportunities:**
- Phases 3, 4, 5 (Portal features + Checker) can run parallel to Phases 6, 7, 8 (Rental features)
- After Phase 1 completes, Phase 2 and Phase 6 can start simultaneously
- Phase 9 is independent but blocked by external dependency

---

## Notes

### Research Flags
- STAB-03 (Store.tsx decomposition) must happen before adding new state management - confirmed in Phase 1
- PORT-02 (unique links) requires security design (expiration, verification) - addressed in success criteria
- RENT-05 (LoJack GPS) requires Spireon API access - isolated in Phase 9 as blocked

### External Dependencies
- **Spireon/LoJack API:** Required for Phase 9. Recommend contacting vendor immediately to unblock.
- **SMS Provider:** Required for Phase 4 (PORT-06). Verify existing infrastructure (Twilio? EmailJS SMS?).

### Depth Calibration
- Comprehensive depth (8-12 phases): 9 phases delivered
- Each phase represents a coherent, verifiable capability
- Registration features (Phases 2-5) and Rental features (Phases 6-9) are parallel tracks after Phase 1

---

*Roadmap created: 2026-01-29*
*Last updated: 2026-02-05*
