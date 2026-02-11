# Requirements: Triple J Auto Investment

**Defined:** 2025-01-29
**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

## v1 Requirements

Requirements for current milestone. Each maps to roadmap phases.

### Reliability & Stability

- [x] **STAB-01**: Fix inventory display loop bug (vehicles not showing, continuous loading)
- [x] **STAB-02**: Fix RLS silent failure pattern (updates appear successful but don't persist)
- [x] **STAB-03**: Decompose Store.tsx monolith into separate contexts (Auth, Vehicle, Rental, Registration)

### Customer Registration Portal

- [ ] **PORT-01**: 6-stage progress tracker with visual progress bar
- [ ] **PORT-02**: Customer access via unique link (texted/emailed after sale)
- [ ] **PORT-03**: Admin dashboard controls to update customer registration status
- [ ] **PORT-04**: Animated progress visualization (Golden Crest logo, car animation)
- [x] **PORT-05**: Customer login option for returning customers
- [x] **PORT-06**: SMS/Email notifications when status changes
- [ ] **PORT-07**: Stage descriptions explaining what's happening at each stage

### Registration Checker

- [ ] **REGC-01**: Document completeness check (Title front/back, 130-U, Inspection, Insurance proof)
- [ ] **REGC-02**: VIN consistency validation across all documents
- [ ] **REGC-03**: Mileage consistency check across documents
- [ ] **REGC-04**: SURRENDERED stamp verification (front AND back of title)
- [ ] **REGC-05**: Document ordering guide per txDMV requirements
- [ ] **REGC-06**: Quick link to [webDealer.txdmv.gov](https://webdealer.txdmv.gov/title/loginAuthenticateUser#) from admin dashboard

### Rental Management

- [ ] **RENT-01**: Dual inventory model (vehicles marked as: sale-only, rental-only, or both)
- [ ] **RENT-02**: Availability calendar showing which vehicles are available when
- [ ] **RENT-03**: Auto-populated rental agreements (like Bill of Sale flow)
- [ ] **RENT-04**: Customer rental tracking (who has what car, return dates, rental history)
- [ ] **RENT-05**: LoJack GPS integration showing vehicle location (requires Spireon API access)
- [ ] **RENT-06**: Deposits and payments tracking

### Plate Tracking

- [ ] **PLAT-01**: Plates as first-class entity with assignment history
- [ ] **PLAT-02**: Plate -> Vehicle assignment tracking
- [ ] **PLAT-03**: Plate -> Rental Customer tracking (who has plate, return date)
- [ ] **PLAT-04**: Dashboard view of all plates currently "out" with customers
- [ ] **PLAT-05**: Alerts for unaccounted plates and overdue rentals

### Rental Insurance Verification

- [ ] **RINS-01**: Capture insurance info (company, policy #, effective dates, coverage amounts)
- [ ] **RINS-02**: Photo/scan upload of insurance card
- [ ] **RINS-03**: Coverage verification against minimum requirements
- [ ] **RINS-04**: Expiration alerts if insurance expires during rental period

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

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

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, mobile-responsive is sufficient for v1 |
| Online payment processing | Tracking payments, not processing them (liability, complexity) |
| Multi-location support | Single dealership operation |
| Auction integration | Not part of current business model |
| Automated DMV submission | Manual submission via webDealer required; system validates only |
| Real-time LoJack tracking refresh | GPS location on-demand is sufficient; continuous tracking adds complexity |
| Customer self-service document upload | Admin uploads documents; customer portal is read-only for status |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Complete |
| STAB-02 | Phase 1 | Complete |
| STAB-03 | Phase 1 | Complete |
| PORT-01 | Phase 3 | Pending |
| PORT-02 | Phase 3 | Pending |
| PORT-03 | Phase 2 | Pending |
| PORT-04 | Phase 3 | Pending |
| PORT-05 | Phase 4 | Complete |
| PORT-06 | Phase 4 | Complete |
| PORT-07 | Phase 3 | Pending |
| REGC-01 | Phase 5 | Pending |
| REGC-02 | Phase 5 | Pending |
| REGC-03 | Phase 5 | Pending |
| REGC-04 | Phase 5 | Pending |
| REGC-05 | Phase 5 | Pending |
| REGC-06 | Phase 5 | Pending |
| RENT-01 | Phase 6 | Pending |
| RENT-02 | Phase 6 | Pending |
| RENT-03 | Phase 6 | Pending |
| RENT-04 | Phase 6 | Pending |
| RENT-05 | Phase 9 | Blocked |
| RENT-06 | Phase 6 | Pending |
| PLAT-01 | Phase 7 | Pending |
| PLAT-02 | Phase 7 | Pending |
| PLAT-03 | Phase 7 | Pending |
| PLAT-04 | Phase 7 | Pending |
| PLAT-05 | Phase 7 | Pending |
| RINS-01 | Phase 8 | Pending |
| RINS-02 | Phase 8 | Pending |
| RINS-03 | Phase 8 | Pending |
| RINS-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26 (100%)
- Complete: 5 (STAB-01, STAB-02, STAB-03, PORT-05, PORT-06)
- Pending: 20
- Blocked: 1 (RENT-05 - needs Spireon API)

---
*Requirements defined: 2025-01-29*
*Last updated: 2026-02-10 after Phase 4 completion*
