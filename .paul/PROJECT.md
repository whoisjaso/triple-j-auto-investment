# Triple J Auto Investment

## What This Is

A premium dealership website for Triple J Auto Investment LLC that sells pre-owned vehicles ($3-8K) to working families in Houston, built on Next.js with cinematic scroll-driven animation, Supabase-powered live inventory, and AI voice agent integration -- designed to convert Facebook Marketplace traffic into lot visits and closed deals.

## Core Value

Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- the reptilian brain codes Triple J as safe authority within 300ms, the limbic system generates trust through oxytocin-triggering design, and the neocortex receives the ammunition to rationalize what the emotional brain has already decided. The website is not a brochure -- it is a FATE-triggered, PCP-sequenced behavioral funnel that moves Houston's working families from stranger to buyer to evangelist.

## Current State

| Attribute | Value |
|-----------|-------|
| Version | 0.1.0-dev |
| Status | In Development |
| Last Updated | 2026-03-07 |

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

### Out of Scope (v0.1)
- Rental management, plate tracking, registration workflows -- v0.2+
- AI chat (Gemini/Divine), AI voice (Retell) -- v0.2+
- Owner portal, referral system -- v0.2+
- Behavioral tracking, SOVEREIGN psychological layer -- v0.2+

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
*Last updated: 2026-03-10 after Phase 6*
