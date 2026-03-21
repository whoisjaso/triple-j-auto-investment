# Triple J Auto Investment

## What This Is

A premium dealership website for Triple J Auto Investment LLC that sells pre-owned vehicles ($3-8K) to working families in Houston, built on Next.js with cinematic scroll-driven animation, Supabase-powered live inventory, and AI voice agent integration -- designed to convert Facebook Marketplace traffic into lot visits and closed deals.

## Core Value

Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- the reptilian brain codes Triple J as safe authority within 300ms, the limbic system generates trust through oxytocin-triggering design, and the neocortex receives the ammunition to rationalize what the emotional brain has already decided. The website is not a brochure -- it is a FATE-triggered, PCP-sequenced behavioral funnel that moves Houston's working families from stranger to buyer to evangelist.

## Current State

| Attribute | Value |
|-----------|-------|
| Version | 0.2.0 |
| Status | Released |
| Last Updated | 2026-03-21 |

## Requirements

### Must Have
- [To be defined during planning]

### Validated
- Next.js project foundation with App Router, TypeScript, Tailwind CSS v4 -- Phase 1
- Supabase schema (vehicles, leads) with RLS and typed query helpers -- Phase 2
- Cinematic scroll-driven homepage with frame animations (Maybach, Keys, Crest) -- Phase 3
- Responsive navbar (Rolls Royce centered layout) + footer with compliance -- Phase 3
- Vehicle listings with search, filter, sort + mock data fallback -- Phase 4
- Vehicle detail page with gallery, specs, BHPH calculator, CTAs -- Phase 4
- NHTSA VIN decoder (standalone page + embedded component) -- Phase 4
- Contact page + financing inquiry page with lead capture forms -- Phase 5
- Lead submission server action (Supabase/mock fallback) -- Phase 5
- Admin auth (password + HMAC cookies) + middleware route protection -- Phase 6
- Admin dashboard with sidebar navigation -- Phase 6
- Inventory CRUD with VIN auto-decode integration -- Phase 6
- Lead management page with status cycling and filtering -- Phase 6
- Dashboard statistics (vehicles, leads, new leads) + recent leads preview -- Phase 6
- Dealer login link in footer for admin discoverability -- Phase 6
- Pipeline schema (vehicle_events, pipeline statuses, transport fields) -- Phase 9
- AI email parsers for Manheim/OVE, DealShield, Central Dispatch -- Phase 9
- Gmail API integration with pipeline sync endpoint -- Phase 9
- Admin pipeline dashboard with stage-grouped vehicles and status advancement -- Phase 9
- Gmail sync trigger from admin UI with real-time results -- Phase 9
- Vehicle lifecycle management (Bidding → Available) replacing Google Sheet workflow -- Phase 9
- 7-stage CRM pipeline (New → Contacted → Qualified → Appointment → Negotiation → Sold → Lost) -- Phase 10
- Lead detail page with notes, tasks, and status pipeline stepper -- Phase 10
- Buyer info capture on lead "Sold" status + editable vehicle buyer fields -- Phase 10
- CRM pipeline board (kanban) at /admin/leads/board with 7 status columns -- Phase 10
- Dashboard lead pipeline breakdown with per-stage count pills -- Phase 10
- List/Board toggle navigation between lead views -- Phase 10
- BI analytics dashboard with KPIs, profitability, lead funnel, source attribution, vehicle performance -- Phase 11
- Active inventory investment tracker (capital tied up in unsold vehicles) -- Phase 11
- Analytics query layer with typed Supabase queries + mock fallback -- Phase 11
- Admin sidebar + dashboard quick action for Analytics navigation -- Phase 11
- Document system: agreement tracker, customer wizard, signature capture -- Phase 12
- Step-by-step customer portal with data-driven field groups per document type -- Phase 12
- On-demand PDF generation via Puppeteer (mobile-friendly download) -- Phase 12
- Admin re-sign capability for completed agreements missing signatures -- Phase 12
- Soft delete with trash tab and restore for agreements -- Phase 12
- Rental renewal flow with pre-fill from existing agreement -- Phase 12
- Auto-calc sales tax (6.25%), TTL reverse breakdown, vehicle + buyer auto-populate -- Phase 12
- Signature URL encoding with 200K char limit and warning on drop -- Phase 12

### Out of Scope (v0.2)
- AI chat (Gemini/Divine), AI voice (Retell) -- v0.3+
- Owner portal, referral system -- v0.3+
- Behavioral tracking, SOVEREIGN psychological layer -- v0.3+
- Automated hourly Gmail sync (Vercel Cron) -- v0.3+
- Supabase Auth (replace middleware password auth) -- v0.3+
- Photo upload to Supabase Storage -- v0.3+

## Target Users

**Primary:** Working Hispanic families in Houston ($3K-$8K budget)
- First-time buyers or credit-challenged
- Family-oriented decision-making (familia first)
- Bilingual (English/Spanish)
- Arriving from Facebook Marketplace listings

**Secondary:** Jason (CEO & Operator)
- Manages inventory, leads, registrations, rentals
- Needs admin dashboard for operations

## Context

**Business Context:**
- Texas-based independent auto dealer (Triple J Auto Investment LLC)
- 8774 Almeda Genoa Road, Houston, TX 77075
- Dealer license P171632
- Vehicles in $3K-$8K range, BHPH (Buy Here Pay Here) financing
- Primary lead source: Facebook Marketplace
- Phone: (832) 400-9760
- Active rental fleet alongside sales

**Technical Context:**
- Rebuilding from scratch on Next.js (previously React/Vite SPA)
- Supabase backend (database, auth, edge functions, storage)
- Cinematic scroll-driven animations
- AI voice agent via Retell
- Vercel deployment
- Bilingual (English/Spanish)

**Psychological Architecture:**
- SOVEREIGN framework governs all design decisions (internal reference only)
- FATE model entry points (Focus, Authority, Tribe, Emotion) built into every page
- PCP sequence (Perception > Context > Permission) drives user flows
- Six Psychological Needs identification integrated into AI chat (Divine)
- Six-Axis Model informs engagement design
- See: `.paul/references/SOVEREIGN-FRAMEWORK.md`

## Constraints

### Technical Constraints
- Next.js on Vercel (serverless)
- Supabase for backend (database, auth, storage, edge functions)
- Must be mobile-first (primary traffic from Facebook Marketplace on phones)
- Bilingual English/Spanish throughout

### Business Constraints
- Texas DMV jurisdiction only -- all registration rules are txDMV-specific
- No online payment processing -- tracking payments, not processing them
- Single dealership operation (no multi-location)
- SOVEREIGN framework language is INTERNAL ONLY -- customer-facing content uses honest, warm dealership language

### Compliance Constraints
- Texas dealer license P171632 must be displayed
- BHPH financing disclosures required
- As-Is vehicle disclosures required

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Next.js rebuild (from React/Vite) | SSR for SEO, App Router, server components, better performance | 2026-03-06 | Active |
| Bottom-up build approach | Start simple, layer complexity incrementally | 2026-03-06 | Active |
| SOVEREIGN framework as internal reference | Guides design decisions without exposing psychological language to customers | 2026-03-06 | Active |
| Next.js 16 + Tailwind v4 | create-next-app latest; CSS-first @theme config | 2026-03-07 | Active |
| Plus Jakarta Sans + Playfair Display + Cormorant Garamond | Match old codebase brand identity | 2026-03-07 | Active |
| BHPH payment calculator: simple division | No interest rate — BHPH builds cost into vehicle price | 2026-03-07 | Active |
| Server components by default, client only for interactivity | PaymentCalculator is only client component on detail page | 2026-03-07 | Active |
| NHTSA VIN decoder proxied through API route | Avoids CORS, adds normalization, alwaysOpen prop for dual usage | 2026-03-07 | Active |
| Lead status cycling (New→Contacted→Closed) via form button | No client component needed; server component page stays fast | 2026-03-10 | Active |
| Subtle "Dealer Login" in footer compliance bar | Discoverable by owner, invisible to customers | 2026-03-10 | Active |
| AI email parsing over Manheim API | Enterprise API is gated/expensive; email data is free and comprehensive | 2026-03-11 | Active |
| Gmail MCP for email access | Infrastructure already connected, simplest integration path | 2026-03-11 | Active |
| Vehicle lifecycle: Bidding→Purchased→In_Transit→Arrived→Inspection→Available | Maps to real Manheim-to-lot workflow stages | 2026-03-11 | Active |
| Server actions for pipeline mutations | revalidatePath pattern keeps server components fast | 2026-03-11 | Active |
| 7-stage CRM pipeline | Matches real sales funnel; "Appointment" stage added for test drives | 2026-03-12 | Active |
| No drag-and-drop on kanban board | Status changes on lead detail page; keeps board simple | 2026-03-12 | Active |
| Buyer info capture on Sold | Auto-captures lead name/phone as buyer; editable on vehicle edit | 2026-03-12 | Active |
| Pure CSS analytics visualization | No charting libraries; CSS bars and progress indicators keep bundle lean | 2026-03-14 | Active |
| Active Inventory Investment | Track capital tied up in unsold vehicles with estimated returns | 2026-03-14 | Active |
| Puppeteer for PDF generation | pdf-lib couldn't match HTML fidelity; Puppeteer renders exact match | 2026-03-18 | Active |
| Data-driven customer wizard | Field groups config per document type drives step generation | 2026-03-16 | Active |
| Signature URL limit 200K | Canvas at 2x DPR produces 40-70K char PNGs; 50K silently dropped | 2026-03-18 | Active |
| Soft delete for agreements | Preserve customer-signed data; admin can trash + restore | 2026-03-21 | Active |
| Auto-calc sales tax 6.25% | Texas standard rate; TTL reverse breakdown for total cost transparency | 2026-03-21 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Facebook Marketplace click-to-lot-visit conversion | TBD | N/A | Not started |
| Time on site | TBD | N/A | Not started |
| Lead capture rate | TBD | N/A | Not started |
| Mobile Lighthouse score | 90+ | N/A | Not started |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js (App Router) | SSR + server components |
| Frontend | React 19 + TypeScript | |
| Styling | Tailwind CSS | |
| Animation | Scroll-driven (GSAP/Framer Motion) | Cinematic feel |
| Database | Supabase (PostgreSQL) | |
| Auth | Supabase Auth | Phone OTP for customers |
| Storage | Supabase Storage | Vehicle photos, documents |
| Edge Functions | Supabase Edge Functions (Deno) | Notifications, AI chat |
| AI Chat | Gemini via Edge Function | Divine behavioral chat |
| AI Voice | Retell | Inbound/outbound calls |
| Hosting | Vercel | |
| Email | Resend | Transactional emails |
| SMS | Twilio | OTP + notifications |

## References

- `.paul/references/SOVEREIGN-FRAMEWORK.md` -- Full psychological architecture

---
*PROJECT.md -- Updated when requirements or context change*
*Last updated: 2026-03-21 after v0.2 Dealer Intelligence System milestone completion*
