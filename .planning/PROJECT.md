# Triple J Auto Investment

## What This Is

A comprehensive dealership operations platform for Triple J Auto Investment that handles vehicle sales, rentals, and DMV registration workflows. The platform serves both internal operations (inventory management, document generation, registration processing, rental booking, plate tracking, insurance verification) and customer-facing needs (registration status tracking portal with notifications and login). Built for a Texas-based independent dealer who sells and rents vehicles.

## Core Value

**Customers can track their registration status in real-time, and paperwork goes through DMV the first time.**

The Domino's Pizza Tracker principle: people don't mind waiting when they understand the process and see progress. Combined with validation that catches errors before submission, this eliminates the two biggest pain points — customer anxiety and DMV rejections.

## Requirements

### Validated

*Shipped and verified in v1:*

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
- ✓ Fix inventory display loop bug — v1 (Phase 1)
- ✓ Fix RLS silent failure pattern — v1 (Phase 1)
- ✓ Decompose Store.tsx monolith — v1 (Phase 1)
- ✓ 6-stage registration tracker with progress visualization — v1 (Phase 3)
- ✓ Customer access via unique token link — v1 (Phase 3)
- ✓ Admin registration status controls with audit trail — v1 (Phase 2)
- ✓ Animated progress visualization (ProgressArc, ProgressRoad) — v1 (Phase 3)
- ✓ Customer login with phone OTP — v1 (Phase 4)
- ✓ SMS/Email notifications on status change — v1 (Phase 4)
- ✓ Stage descriptions for each registration stage — v1 (Phase 3)
- ✓ Document completeness validation — v1 (Phase 5)
- ✓ VIN consistency validation with ISO 3779 check digit — v1 (Phase 5)
- ✓ Mileage cross-document consistency — v1 (Phase 5)
- ✓ SURRENDERED stamp verification — v1 (Phase 5)
- ✓ Document ordering guide per txDMV — v1 (Phase 5)
- ✓ Quick link to webDealer.txdmv.gov — v1 (Phase 5)
- ✓ Dual inventory model (sale/rental/both) — v1 (Phase 6)
- ✓ Availability calendar — v1 (Phase 6)
- ✓ Auto-populated rental agreements with PDF generation — v1 (Phase 6)
- ✓ Customer rental tracking with payment history — v1 (Phase 6)
- ✓ Deposits and payments tracking with late fees — v1 (Phase 6)
- ✓ Plates as first-class entity with assignment history — v1 (Phase 7)
- ✓ Plate-to-vehicle and plate-to-customer tracking — v1 (Phase 7)
- ✓ Dashboard view of plates out with customers — v1 (Phase 7)
- ✓ Alerts for unaccounted plates and overdue rentals — v1 (Phase 7)
- ✓ Insurance capture with card upload — v1 (Phase 8)
- ✓ Coverage verification against Texas minimums — v1 (Phase 8)
- ✓ Insurance expiration alerts — v1 (Phase 8)

### Active

*Building toward these in next milestone:*

- [ ] Deploy to production (migrations, Edge Functions, storage, API keys)
- [ ] LoJack GPS integration for rental vehicle location (requires Spireon API)
- [ ] Comprehensive test coverage
- [ ] Move API keys to backend/edge functions

### Out of Scope

- Mobile native app — web-first, mobile-responsive is sufficient
- Online payments processing — tracking payments, not processing them
- Multi-location support — single dealership operation
- Auction integration — not part of current business model
- Automated DMV submission — manual submission via webDealer, system validates only

## Context

**Current State (post-v1):**
- 35,294 LOC across TypeScript/TSX/SQL
- 8 completed phases, 30 executed plans, 151 commits
- Tech stack: React 19, TypeScript, Supabase, Vite, Tailwind CSS
- Edge Functions: Twilio SMS, Resend email, plate/insurance alert cron
- PDF generation: pdf-lib, jsPDF for rental agreements and Bill of Sale
- 8 database migrations (02-08) ready to apply
- 5 admin pages: Dashboard, Inventory, Registrations, Rentals, Plates
- 3 customer pages: StatusTracker, Login, Dashboard

**Business Operations:**
- Texas-based independent auto dealer (Triple J Auto Investment)
- Sells vehicles ranging ~$4,000-$5,000
- Active rental fleet with plate tracking and insurance verification
- Uses LoJack for vehicle tracking on rental/financed vehicles
- Registration calculation: [Vehicle Price] x 6.25% + $250

**Deployment Status:**
- Code complete, not yet deployed to production
- Migrations 02-08 need to be applied to Supabase
- Edge Functions need deployment
- Storage buckets need creation
- API keys (Twilio, Resend) need configuration
- Phone auth needs enabling
- pg_cron schedules need activation

## Constraints

- **Hosting**: Vercel for frontend (decision made during v1)
- **Jurisdiction**: Texas DMV only — all registration rules are txDMV-specific
- **Backend**: Supabase — continue using existing backend, no migration
- **Document Portal**: webDealer.txdmv.gov — system validates, dealer manually submits
- **Vehicle Tracking**: LoJack — integration blocked pending Spireon API access

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 6-stage registration tracker | Maps to actual workflow stages dealer controls | ✓ Good — clean stage progression |
| Dual customer access (link + login) | Quick access for one-time checks, login for repeat customers | ✓ Good — token + phone OTP |
| Validation-only (no auto-submit) | Dealer needs control over webDealer submission | ✓ Good — checker validates, dealer submits |
| LoJack integration for rentals | Existing hardware, provides vehicle location | — Pending (Spireon API blocked) |
| Store.tsx facade pattern | Decompose monolith while preserving API | ✓ Good — 892 to 281 lines |
| EXCLUDE gist for double-booking | Database-level constraint eliminates race conditions | ✓ Good — impossible to double-book |
| DATE not TIMESTAMPTZ for rentals | Single-timezone Houston TX business | ✓ Good — no off-by-one bugs |
| Template literal HTML emails | Avoids React Email dependency in Deno | ✓ Good — simpler Edge Functions |
| AdminHeader per page (duplicated) | Each page owns navigation state | ✓ Good — consistent pattern |
| Soft-block insurance verification | Don't block business operations | ✓ Good — booking succeeds, admin verifies later |
| Vercel over Dokploy | Simpler for static Vite/React SPA | — Pending deployment |

---
*Last updated: 2026-02-13 after v1 milestone*
