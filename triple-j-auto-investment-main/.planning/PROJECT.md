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

*Building toward these in v2.0 — Psychological Architecture & Production Launch:*

- [ ] Production infrastructure (fresh Supabase, migrations, Edge Functions, storage, auth, cron, Vercel)
- [ ] Credential rotation and security hardening
- [ ] SOVEREIGN framework landing experience (pattern-interrupt, authority signals, tribe signals)
- [ ] Vehicle listing psychological architecture (identity headlines, price anchoring, Triple J Verified, vehicle stories)
- [ ] Micro-commitment spectrum (Level 0-3: save, calculate, alerts, schedule, reserve)
- [ ] Divine AI chat with behavioral profiling (Provider/Skeptic/First-Timer/Struggler)
- [ ] Behavioral follow-up system (4-tier re-engagement: SMS, email, AI voice)
- [ ] Intelligence layer (session tracking, smart recommendations, urgency calibration, attribution)
- [ ] Owner Portal (vehicle dashboard, service reminders, value tracker, documents)
- [ ] Family Circle referral program with rewards tracking
- [ ] Review generation engine (personalized 3-day post-purchase)
- [ ] SubliminalPrime refinement
- [ ] Content alignment with automotive investment firm positioning
- [ ] UI/UX polish (mobile-first, performance, accessibility, visual consistency)
- [ ] SEO foundation (BrowserRouter, React Helmet, sitemap, schema markup)
- [ ] Retell AI prompts updated for rentals with dynamic messaging + Spanish

### Out of Scope

- Mobile native app — web-first, mobile-responsive is sufficient
- Online payments processing — tracking payments, not processing them
- Multi-location support — single dealership operation
- Auction integration — not part of current business model
- Automated DMV submission — manual submission via webDealer, system validates only

## Current Milestone: v2.0 Psychological Architecture & Production Launch

**Goal:** Deploy the platform to production and implement the full SOVEREIGN psychological architecture — transforming Triple J's website from a dealership site into an influence machine that moves strangers through a behavioral funnel from skeptic to buyer to evangelist.

**Target features:**
- Production infrastructure (fresh Supabase + Vercel with custom domain)
- SOVEREIGN framework landing experience with FATE triggers (Focus, Authority, Tribe, Emotion)
- Vehicle listings as micro-stories with price anchoring and Triple J Verified badges
- 4-level micro-commitment spectrum (save → alert → schedule → reserve)
- Divine AI chat with behavioral profiling and needs-based adaptation
- 4-tier behavioral follow-up system (browse → save → abandon → question)
- Intelligence layer (session tracking, recommendations, urgency calibration)
- Owner Portal with vehicle dashboard and Family Circle referral program
- Review generation engine and "Ready to Upgrade?" re-entry loop
- UI/UX polish, mobile-first, performance, accessibility
- SEO foundation (BrowserRouter, React Helmet, sitemap)
- Retell AI updated for rentals + Spanish with SOVEREIGN-aligned prompts

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
- Existing site live on custom domain (built in separate IDE session)

**Business Operations:**
- Texas-based independent auto dealer (Triple J Auto Investment)
- Sells vehicles ranging ~$4,000-$5,000
- Active rental fleet with plate tracking and insurance verification
- Uses LoJack for vehicle tracking on rental/financed vehicles
- Registration calculation: [Vehicle Price] x 6.25% + $250
- Retell AI voice agent active — calls customers on inquiry submission
- Long-term vision: Web2 frontend / Web3 backend (Robinhood for dealerships)

**Deployment Status (v2.0 target):**
- Code complete from v1, deploying to fresh Supabase production project
- Migrations 02-08 need to be applied (in order, btree_gist before 06)
- Edge Functions need deployment
- Storage buckets need creation
- API keys (Twilio, Resend) need configuration
- Phone auth needs enabling
- pg_cron schedules need activation
- Frontend needs Vercel deployment with custom domain

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

| Fresh Supabase project for production | Clean slate, proper config from start via MCP | — Pending |

| SOVEREIGN psychological framework | Behavioral architecture for every page — influence machine, not brochure | — Pending |
| Automotive investment firm positioning | "Not a used car lot" — luxury feel for budget vehicles builds trust | — Pending |

---
*Last updated: 2026-02-13 after v2.0 milestone initialization*
