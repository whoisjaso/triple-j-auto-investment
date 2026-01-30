# Research Summary

**Project:** Triple J Auto Investment - Milestone 2 Features
**Synthesized:** 2026-01-29
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

Triple J Auto Investment is expanding a React 19 + Supabase dealership platform with three feature areas: a customer-facing registration tracker (Domino's-style 6-stage progress), a document validation system for Texas DMV submissions via webDEALER, and rental management with LoJack GPS integration. The existing stack is modern and well-suited for these additions, requiring only 5 new dependencies (pdfjs-dist, zod, react-day-picker, date-fns, nanoid).

The critical success factor is **fixing existing technical debt before adding features**. The 892-line Store.tsx monolith and known RLS silent failures create compounding risks. Research strongly recommends a "Reliability & Stability" phase first, followed by incremental feature delivery. The document validation and customer portal features are well-documented with HIGH confidence patterns. The rental management LoJack integration carries LOW confidence due to unavailable public API documentation - this requires direct Spireon contact before development.

The core value proposition - "customers can track registration status in real-time, and paperwork goes through DMV the first time" - is achievable with the researched patterns, but only if RLS and Store decomposition issues are addressed first to prevent cascading failures.

---

## Key Findings

### From STACK.md

| Technology | Purpose | Confidence |
|------------|---------|------------|
| framer-motion 12.x (existing) | Progress tracker animations with React 19 support | HIGH |
| pdfjs-dist 5.4.530 | Extract text from uploaded PDFs for validation | HIGH |
| pdf-lib 1.17.1 (existing) | Read form fields from fillable PDFs | HIGH |
| zod 3.24.x | Cross-document validation schemas | HIGH |
| react-day-picker 9.13.0 | Rental availability calendar | HIGH |
| date-fns 4.1.x | Date manipulation for rentals | HIGH |
| nanoid 5.1.6 | Unique portal access tokens | HIGH |
| Supabase Realtime (existing) | Real-time status updates | HIGH |
| LoJack/Spireon API | GPS vehicle tracking | LOW - requires vendor contact |

**Critical finding:** LoJack API access requires direct contact with Spireon. No public documentation available. Build rental core first, GPS integration last.

### From FEATURES.md

**Table Stakes (Must Build):**
- Document completeness checklist (title, 130-U, inspection, reassignments)
- SURRENDERED stamp placement reminder
- Mileage consistency check across documents
- VIN validation (17 chars, check digit, no I/O/Q)
- 6-stage visual progress tracker with current status prominent
- Unique link access (no login required for customers)
- Rental availability calendar
- Rental agreement generation
- Vehicle status tracking (Available/Rented/Maintenance/For Sale)

**Differentiators (Should Build):**
- Cross-document validation (VIN, name, date, mileage matching)
- Document order enforcement (webDEALER requires specific sequence)
- Rejection reason prevention (proactive flagging)
- SMS notifications on stage changes
- Dual inventory mode (same vehicle for sale AND rent)
- Digital vehicle inspection (photo-based condition reports)

**Defer to v2+:**
- Authorization holds (payment processing complexity)
- SPV warning system (requires external pricing data)
- Advanced LoJack features (kill switch, geofencing)
- Multi-language notifications

### From ARCHITECTURE.md

**Recommended Structure:**
1. Extract AuthContext from Store.tsx (during customer portal work)
2. Extract VehicleContext from Store.tsx (during rental work)
3. Create new RentalContext for rental-specific state
4. Create RegistrationContext for registration tracking
5. Customer portal in same SPA with route-based separation (/portal/*)

**Key Patterns:**
- Customer access via unique link, no login required for MVP
- RLS policy allows anon SELECT on registrations filtered by order_id
- Document validation is pure business logic - no new Supabase tables needed
- Separate rentals table with vehicle_id foreign key
- Separate rental_status from sale_status (avoid single status field)

**Database Additions:**
- registrations: add documents_received JSONB, validation_status, validation_errors
- vehicles: add is_rentable, rental_daily_rate, rental_status, lojack_device_id
- rentals: new table with customer info, dates, financial tracking, status

### From PITFALLS.md

**Critical (Must Prevent):**

| Pitfall | Prevention | Phase |
|---------|------------|-------|
| VIN mismatch across documents | Single source of truth, check-digit validation, cross-doc check | Registration Checker |
| Original document requirement violation | Provenance tracking, explicit confirmation workflow | Registration Checker |
| GPS tracking consent violation | Explicit separate consent form, auto-disable on sale | Rental Management |
| RLS silent failures masking data loss | Fix error handling, session verification, never use service key in frontend | Reliability phase |
| Unique link security weakness | Time-limited links, secondary verification, masked PII | Customer Portal |

**Moderate (Plan For):**

| Pitfall | Prevention | Phase |
|---------|------------|-------|
| Notification fatigue | Tier design (SMS critical, email informational), throttling | Customer Portal |
| Double-booking rentals | Database constraint on overlapping dates, optimistic locking | Rental Management |
| Store.tsx monolith cascade | Extract contexts before adding features | Reliability phase |
| Migration breaking live data | Version-controlled migrations, staging environment | All phases |
| Form 130-U field changes | Version detection, flexible field mapping | Registration Checker |

---

## Recommended Stack

**Keep (Existing):**
- React 19.2.0
- TypeScript 5.8.2
- Supabase JS 2.87.1
- framer-motion 12.23.26
- pdf-lib 1.17.1
- Vite 6.2.0
- Tailwind CSS 3.4.19

**Add (5 new dependencies):**
```bash
npm install pdfjs-dist@5.4.530 zod@3.24.2 react-day-picker@9.13.0 date-fns@4.1.0 nanoid@5.1.6
```

**Do Not Add:**
- GSAP (already present, use framer-motion for progress tracker)
- react-big-calendar or FullCalendar (overkill, licensing issues)
- Moment.js (deprecated)
- Custom auth for customers (use order_id as implicit auth)

---

## Feature Priorities

### Phase 1: Reliability & Stability (Prerequisite)
- Fix RLS silent failure patterns
- Add session verification to all write operations
- Extract AuthContext from Store.tsx
- Address inventory display loop bug
- Establish migration discipline

### Phase 2: Customer Portal + Registration Basics
**Features:** 6-stage tracker, unique link access, status history, mobile-responsive
**From FEATURES.md:** Table stakes for status tracking
**Avoid:** Over-promising real-time, notification fatigue (start minimal)

### Phase 3: Registration Checker
**Features:** Document completeness, VIN validation, mileage consistency, SURRENDERED reminder
**From FEATURES.md:** Table stakes + cross-document validation differentiator
**Avoid:** OCR/scan processing (error-prone), automated DMV submission (not possible)

### Phase 4: Rental Management Core
**Features:** Availability calendar, agreement generation, customer records, deposit tracking
**From FEATURES.md:** Table stakes for rental management
**Avoid:** Double-booking (database constraint required), inventory state confusion

### Phase 5: Rental Management Advanced
**Features:** Dual inventory mode, digital inspection, LoJack integration (if API available)
**From FEATURES.md:** Differentiators
**Avoid:** GPS consent violation (build explicit consent workflow)

---

## Build Order

Based on architecture dependencies and pitfall prevention:

```
Phase 1: Reliability & Stability
    |
    +-- RLS fixes, Store decomposition, migration setup
    |
    v
Phase 2: Customer Portal + Registration Foundation
    |
    +-- AuthContext extraction
    +-- RegistrationContext creation
    +-- Portal pages (/portal/track/:orderId)
    +-- Real-time status subscriptions
    |
    v
Phase 3: Registration Checker
    |
    +-- documentValidationService.ts
    +-- VIN validation with check-digit
    +-- Cross-document consistency checks
    +-- Admin validation UI
    |
    v
Phase 4: Rental Management Core
    |
    +-- VehicleContext extraction
    +-- vehicles table rental columns
    +-- rentals table creation
    +-- RentalContext
    +-- Availability calendar
    +-- Booking workflow with DB constraints
    |
    v
Phase 5: Rental Advanced + GPS
    |
    +-- LoJack API integration (if available)
    +-- Digital vehicle inspection
    +-- Consent workflow
```

**Rationale:**
1. **Reliability first** - Research shows RLS and Store issues will compound with new features
2. **Portal early** - Delivers customer value quickly, validates Supabase subscription patterns
3. **Registration checker mid** - Builds on registration foundation, pure business logic
4. **Rental last** - Most complex, requires VehicleContext extraction, GPS API uncertain

---

## Critical Pitfalls Summary

### Legal/Compliance (Address Immediately)
1. **GPS consent violation** - Texas requires explicit written consent for post-sale tracking. Build consent workflow before LoJack integration, not after.
2. **Original document requirements** - webDEALER rejects copies. Track document provenance.

### Technical (Fix Before Features)
1. **RLS silent failures** - 83% of exposed Supabase databases involve RLS misconfiguration. Audit and fix before adding tables.
2. **Store.tsx monolith (892 lines)** - Will become unmaintainable. Extract during relevant feature work.
3. **VIN mismatch cascade** - Single source of truth required. No manual VIN entry on document generation.

### Operational (Design Correctly)
1. **Double-booking** - Use database-level constraints, not app-level checks.
2. **Notification fatigue** - Start minimal, let customers opt up.
3. **Form 130-U changes** - Check revision date, maintain versioned field mappings.

---

## Open Questions / Blockers

### Blocking
1. **LoJack API Access** - Must contact Spireon for dealer API credentials and documentation. Cannot estimate GPS integration effort until API is available.

### Needs Resolution Before Development
2. **PDF Worker Configuration** - pdfjs-dist requires web worker. Vite configuration needed.
3. **Staging Environment** - Research strongly recommends staging before production migrations. Current setup unclear.
4. **SMS Provider** - Notifications require SMS capability. Existing infrastructure status unknown.

### Can Resolve During Development
5. **Date-fns Locale** - Spanish support if needed for rental agreements.
6. **Supabase Storage Tier** - Document uploads may exceed free tier at scale (50GB estimate at 500 rentals/year).

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Stack Recommendations | HIGH | All libraries verified current, official docs consulted, npm stats confirmed |
| Texas DMV Requirements | HIGH | webDEALER user guide, 130-U documentation, TXIADA bulletins |
| Customer Portal UX | HIGH | NN/g research, Domino's/Uber case studies, industry patterns |
| Architecture Patterns | HIGH | Supabase official docs, codebase analysis, React best practices |
| Rental Features | MEDIUM | Industry surveys, not Texas-specific, general patterns |
| LoJack Integration | LOW | No public API documentation, requires vendor contact |
| Pitfall Prevention | HIGH | Official sources, CVE documentation, industry research |

### Gaps to Address During Planning
- LoJack API capabilities and authentication
- Existing SMS infrastructure status
- Current Supabase plan limits
- Staging environment setup requirements

---

## Sources (Aggregated)

### Official Texas DMV
- [TxDMV Form 130-U](https://www.txdmv.gov/sites/default/files/form_files/130-U.pdf)
- [webDEALER Dealer User Guide](https://www.txdmv.gov/sites/default/files/body-files/webDEALER_Dealer_User_Guide.pdf)
- [Motor Vehicle Sales Tax](https://comptroller.texas.gov/taxes/motor-vehicle/sales-use.php)

### Technology Documentation
- [Motion (framer-motion) Docs](https://motion.dev/docs/react-upgrade-guide)
- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist)
- [React DayPicker](https://daypicker.dev/)
- [Zod Documentation](https://zod.dev/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

### UX Research
- [NN/g: 16 Design Guidelines for Status Trackers](https://www.nngroup.com/articles/status-tracker-progress-update/)
- [The Hustle: Domino's Pizza Tracker](https://thehustle.co/originals/how-the-dominos-pizza-tracker-conquered-the-business-world)

### Industry Patterns
- [PDF Parsing Libraries 2025](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)
- [React Calendar Components](https://www.builder.io/blog/best-react-calendar-component-ai)

---

## Ready for Requirements

Research is complete and synthesized. The roadmapper should proceed with phase definition using the following structure:

1. **Reliability & Stability** - Fix RLS, decompose Store, establish migration discipline
2. **Customer Portal** - 6-stage tracker with real-time updates
3. **Registration Checker** - Document validation before webDEALER submission
4. **Rental Management Core** - Calendar, agreements, booking workflow
5. **Rental Management Advanced** - GPS integration (pending API access), inspections

**Recommendation:** Start Phase 1 immediately. Contact Spireon for LoJack API access in parallel to unblock Phase 5 estimates.

---

*Synthesis completed: 2026-01-29*
