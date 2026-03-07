# Requirements Archive: v1 Feature Development

**Archived:** 2026-02-13
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

## v1 Requirements

### Reliability & Stability

- [x] **STAB-01**: Fix inventory display loop bug (vehicles not showing, continuous loading)
- [x] **STAB-02**: Fix RLS silent failure pattern (updates appear successful but don't persist)
- [x] **STAB-03**: Decompose Store.tsx monolith into separate contexts (Auth, Vehicle, Rental, Registration)

### Customer Registration Portal

- [x] **PORT-01**: 6-stage progress tracker with visual progress bar
- [x] **PORT-02**: Customer access via unique link (texted/emailed after sale)
- [x] **PORT-03**: Admin dashboard controls to update customer registration status
- [x] **PORT-04**: Animated progress visualization (Golden Crest logo, car animation)
- [x] **PORT-05**: Customer login option for returning customers
- [x] **PORT-06**: SMS/Email notifications when status changes
- [x] **PORT-07**: Stage descriptions explaining what's happening at each stage

### Registration Checker

- [x] **REGC-01**: Document completeness check (Title front/back, 130-U, Inspection, Insurance proof)
- [x] **REGC-02**: VIN consistency validation across all documents
- [x] **REGC-03**: Mileage consistency check across documents
- [x] **REGC-04**: SURRENDERED stamp verification (front AND back of title)
- [x] **REGC-05**: Document ordering guide per txDMV requirements
- [x] **REGC-06**: Quick link to webDealer.txdmv.gov from admin dashboard

### Rental Management

- [x] **RENT-01**: Dual inventory model (vehicles marked as: sale-only, rental-only, or both)
- [x] **RENT-02**: Availability calendar showing which vehicles are available when
- [x] **RENT-03**: Auto-populated rental agreements (like Bill of Sale flow)
- [x] **RENT-04**: Customer rental tracking (who has what car, return dates, rental history)
- [ ] **RENT-05**: LoJack GPS integration showing vehicle location — BLOCKED (Spireon API access required)
- [x] **RENT-06**: Deposits and payments tracking

### Plate Tracking

- [x] **PLAT-01**: Plates as first-class entity with assignment history
- [x] **PLAT-02**: Plate -> Vehicle assignment tracking
- [x] **PLAT-03**: Plate -> Rental Customer tracking (who has plate, return date)
- [x] **PLAT-04**: Dashboard view of all plates currently "out" with customers
- [x] **PLAT-05**: Alerts for unaccounted plates and overdue rentals

### Rental Insurance Verification

- [x] **RINS-01**: Capture insurance info (company, policy #, effective dates, coverage amounts)
- [x] **RINS-02**: Photo/scan upload of insurance card
- [x] **RINS-03**: Coverage verification against minimum requirements
- [x] **RINS-04**: Expiration alerts if insurance expires during rental period

## v2 Requirements (Deferred)

### Advanced Validation

- **REGC-07**: SPV (Standard Presumptive Value) warning if sale price seems unusual
- **REGC-08**: Automatic signature presence detection on documents
- **REGC-09**: Integration with NHTSA VIN decoder for enhanced validation

### Advanced Rental Features

- **RENT-07**: Digital vehicle inspection checklist (pre/post rental)
- **RENT-08**: Damage documentation with photos
- **RENT-09**: Automated late fee calculations
- **RENT-10**: Rental revenue reporting and analytics

### Platform Improvements

- **PLAT-06**: Bulk plate import from Google Sheets (migration tool)
- **STAB-04**: Comprehensive test coverage
- **STAB-05**: Move API keys to backend/edge functions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, mobile-responsive is sufficient for v1 |
| Online payment processing | Tracking payments, not processing them (liability, complexity) |
| Multi-location support | Single dealership operation |
| Auction integration | Not part of current business model |
| Automated DMV submission | Manual submission via webDealer required; system validates only |
| Real-time LoJack tracking refresh | GPS location on-demand is sufficient; continuous tracking adds complexity |
| Customer self-service document upload | Admin uploads documents; customer portal is read-only for status |

## Traceability (Final)

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Complete |
| STAB-02 | Phase 1 | Complete |
| STAB-03 | Phase 1 | Complete |
| PORT-01 | Phase 3 | Complete |
| PORT-02 | Phase 3 | Complete |
| PORT-03 | Phase 2 | Complete |
| PORT-04 | Phase 3 | Complete |
| PORT-05 | Phase 4 | Complete |
| PORT-06 | Phase 4 | Complete |
| PORT-07 | Phase 3 | Complete |
| REGC-01 | Phase 5 | Complete |
| REGC-02 | Phase 5 | Complete |
| REGC-03 | Phase 5 | Complete |
| REGC-04 | Phase 5 | Complete |
| REGC-05 | Phase 5 | Complete |
| REGC-06 | Phase 5 | Complete |
| RENT-01 | Phase 6 | Complete |
| RENT-02 | Phase 6 | Complete |
| RENT-03 | Phase 6 | Complete |
| RENT-04 | Phase 6 | Complete |
| RENT-05 | Phase 9 | Blocked (Spireon API) |
| RENT-06 | Phase 6 | Complete |
| PLAT-01 | Phase 7 | Complete |
| PLAT-02 | Phase 7 | Complete |
| PLAT-03 | Phase 7 | Complete |
| PLAT-04 | Phase 7 | Complete |
| PLAT-05 | Phase 7 | Complete |
| RINS-01 | Phase 8 | Complete |
| RINS-02 | Phase 8 | Complete |
| RINS-03 | Phase 8 | Complete |
| RINS-04 | Phase 8 | Complete |

## Milestone Summary

**Shipped:** 25 of 26 v1 requirements
**Adjusted:** PORT-01/02/04/07 originally "Pending" in traceability but code-complete (verification added during audit)
**Blocked:** RENT-05 (LoJack GPS) — requires Spireon API access, isolated in Phase 9

---
*Archived: 2026-02-13 as part of v1 milestone completion*
