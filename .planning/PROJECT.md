# Triple J Auto Investment

## What This Is

A comprehensive dealership operations platform for Triple J Auto Investment that handles vehicle sales, rentals, and DMV registration workflows. The platform serves both internal operations (inventory management, document generation, registration processing) and customer-facing needs (registration status tracking portal). Built for a Texas-based independent dealer who sells and rents vehicles.

## Core Value

**Customers can track their registration status in real-time, and paperwork goes through DMV the first time.**

The Domino's Pizza Tracker principle: people don't mind waiting when they understand the process and see progress. Combined with validation that catches errors before submission, this eliminates the two biggest pain points — customer anxiety and DMV rejections.

## Requirements

### Validated

*Existing functionality confirmed working:*

- ✓ Vehicle inventory management with Supabase backend — existing
- ✓ Lead capture and management — existing
- ✓ Customer profile tracking on admin dashboard — existing
- ✓ Auto-populated Bill of Sale generation — existing
- ✓ Auto-populated As-Is Agreement generation — existing
- ✓ Form 130-U generation — existing
- ✓ Email notifications via EmailJS — existing
- ✓ AI voice calls via Retell — existing
- ✓ Admin authentication with role-based access — existing
- ✓ Multi-language support (English/Spanish) — existing
- ✓ Real-time data sync via Supabase subscriptions — existing

### Active

*Building toward these in current milestone:*

**Customer Registration Portal:**
- [ ] Customer-facing registration status tracker with 6 stages
- [ ] Visual progress bar with animations (Golden Crest logo, car animation)
- [ ] Customer access via unique link (texted/emailed)
- [ ] Customer login option for returning customers
- [ ] Admin dashboard controls to update customer status
- [ ] Notifications to customer when status changes

**Registration Checker:**
- [ ] Document completeness validation (Title front/back, 130-U, Affidavit, Inspection)
- [ ] Cross-document consistency checks (mileage, dates, names, VIN)
- [ ] Document ordering validation per txDMV requirements
- [ ] Pre-submission checklist with pass/fail indicators
- [ ] Quick link to [webDealer.txdmv.gov](https://webdealer.txdmv.gov/title/loginAuthenticateUser#) from admin

**Rental Management:**
- [ ] Dual inventory model (vehicles can be: sale-only, rental-only, or both)
- [ ] Availability calendar showing which vehicles are available when
- [ ] Auto-populated rental agreements (like Bill of Sale flow)
- [ ] Customer rental tracking (who has what car, return dates, history)
- [ ] Payments and deposits tracking
- [ ] LoJack vehicle tracker integration

**Reliability & Stability:**
- [ ] Fix inventory display loop bug (vehicles not showing, continuous loading)
- [ ] Address RLS silent failure patterns
- [ ] Stabilize data loading and error handling

### Out of Scope

- Mobile native app — web-first, mobile-responsive is sufficient
- Online payments processing — tracking payments, not processing them
- Multi-location support — single dealership operation
- Auction integration — not part of current business model
- Automated DMV submission — manual submission via webDealer, system validates only

## Context

**Business Operations:**
- Texas-based independent auto dealer (Triple J Auto Investment)
- Sells vehicles ranging ~$4,000-$5,000
- Expanding into vehicle rentals (some inventory overlap with sales)
- Uses LoJack for vehicle tracking on rental/financed vehicles
- Registration calculation: [Vehicle Price] × 6.25% + $250
- Planning to bundle registration cost into vehicle price

**Registration Workflow (Current):**
1. Customer buys car → receives metal plates, 60-day temporary permit
2. Dealer fills out Bill of Sale, As-Is Agreement, 130-U
3. Customer needs to provide: insurance, passing inspection, registration fee
4. Dealer submits to txDMV via [webDealer](https://webdealer.txdmv.gov/title/loginAuthenticateUser#)
5. Documents required: 130-U, Original Title (front/back signed), sometimes reassignment form, active inspection
6. DMV processes and approves
7. Dealer picks up sticker from tax office

**Registration Portal Stages:**
1. Sale Complete — car sold, plates issued, 60-day permit printed
2. Documents Needed — waiting on insurance, inspection, registration fee
3. All Documents Received — preparing submission
4. Submitted to DMV — filed via webDealer
5. DMV Processing — awaiting approval
6. Registration Complete — sticker picked up from tax office

**Technical Environment:**
- React 19 SPA with TypeScript
- Supabase backend (auth, database, real-time subscriptions)
- Existing integrations: Gemini AI (descriptions), Retell AI (voice calls), EmailJS
- Deployed via Dokploy on Hetzner
- Uses pdf-lib and jsPDF for document generation

**Known Issues (from codebase analysis):**
- Inventory display loop bug (vehicles not showing, continuous loading)
- No test coverage
- API keys exposed in frontend bundle (Gemini, Retell)
- Large monolithic files (Store.tsx 892 lines, Inventory.tsx 976 lines)
- RLS silent failure pattern on Supabase operations
- Console logging throughout production code

## Constraints

- **Hosting**: Dokploy + Hetzner — deployment must work with this stack
- **Jurisdiction**: Texas DMV only — all registration rules are txDMV-specific
- **Backend**: Supabase — continue using existing backend, no migration
- **Document Portal**: webDealer.txdmv.gov — system validates, dealer manually submits
- **Vehicle Tracking**: LoJack — integration required for rental fleet management

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 6-stage registration tracker | Maps to actual workflow stages dealer controls | — Pending |
| Dual customer access (link + login) | Quick access for one-time checks, login for repeat customers | — Pending |
| Bundle registration in vehicle price | Simplifies customer experience, ensures payment upfront | — Pending |
| Validation-only (no auto-submit) | Dealer needs control over webDealer submission | — Pending |
| LoJack integration for rentals | Existing hardware, provides vehicle location for rental fleet | — Pending |

---
*Last updated: 2025-01-29 after initialization*
