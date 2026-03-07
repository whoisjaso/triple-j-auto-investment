# Roadmap: Triple J Auto Investment

## Overview

Build Triple J Auto Investment from the ground up -- starting with the simplest foundational pieces (project setup, database, static pages) and layering complexity incrementally through inventory display, lead capture, admin tools, bilingual support, cinematic animation, and launch-ready optimization. Every phase builds on the last. By v0.1, the website is a polished, mobile-first dealership site that converts Facebook Marketplace traffic into lot visits and leads.

Advanced features (rental management, plate tracking, registration workflows, owner portal, AI chat/voice, behavioral tracking, SOVEREIGN psychological architecture) are deferred to v0.2+.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 3 of 8 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Project Foundation | 1/1 | Complete | 2026-03-07 |
| 2 | Database & Types | 1/1 | Complete | 2026-03-07 |
| 3 | Cinematic Homepage & Layout | 2/2 | Complete | 2026-03-07 |
| 4 | Inventory System | 1/TBD | In progress | - |
| 5 | Lead Capture & Contact | TBD | Not started | - |
| 6 | Admin Core | TBD | Not started | - |
| 7 | Bilingual (i18n) | TBD | Not started | - |
| 8 | SEO & Launch | TBD | Not started | - |

## Phase Details

### Phase 1: Project Foundation
Initialize Next.js 15 project with App Router, TypeScript, Tailwind CSS v4. Set up folder structure, design tokens (colors, fonts, spacing from old codebase), Supabase client configuration, and base layout with global styles. Output: a running `next dev` with themed base layout.

### Phase 2: Database & Types
Define Supabase database schema for core entities (vehicles, leads). Create TypeScript types/interfaces ported from old codebase. Build Supabase client helpers and seed data for development. Output: typed data layer ready for queries.

### Phase 3: Cinematic Homepage & Layout
Build the cinematic scroll-driven homepage with three Apple-style frame animations (Maybach X-ray reveal, Key fob rotation, Gold crest glow) on a dark luxury aesthetic (Black + Dark Forest Green + Gold). Lenis smooth scroll for buttery-smooth "floating" feel. Responsive navbar with gold crest, footer with dealer compliance. Plan 01: scroll animations + homepage. Plan 02: navbar + footer layout shell. Output: ultra-luxurious cinematic homepage (Loro Piana / Rolls Royce / Apple.com level) with navigable layout.

### Phase 4: Inventory System
Build vehicle listings page with search, filter (make, year, price range), and sort. Vehicle detail page with image gallery, specs, payment calculator, and lead capture CTAs. Supabase queries with server components. Output: browsable inventory from database.

### Phase 5: Lead Capture & Contact
Create contact page with form, financing/BHPH inquiry page, and inline lead capture components. Store leads in Supabase. Click-to-call and click-to-text CTAs throughout. Output: lead capture funnel from every vehicle and page.

### Phase 6: Admin Core
Admin authentication (Supabase Auth), inventory CRUD (add/edit/delete vehicles), photo upload to Supabase Storage, and VIN decoder integration (NHTSA API). Output: Jason can manage inventory through admin dashboard.

### Phase 7: Bilingual (i18n)
Set up Next.js internationalization for English/Spanish. Translate all public-facing content. Language toggle in navbar. Output: fully bilingual public website.

### Phase 8: SEO & Launch
Meta tags, Open Graph, Vehicle JSON-LD structured data, sitemap, robots.txt. Lighthouse performance optimization (target 90+). Vercel deployment configuration. Output: production-ready, search-optimized deployment.

## Dependencies

```
Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5
                                        │
                              Phase 6 <─┘
                                │
                      Phase 7 <─┘
                        │
                      Phase 8
```

Phase 3 merges old Layout Shell + Homepage + Animation & Polish. Phases 4-5 are sequential after Phase 3. Phase 6 depends on data layer (Phase 2) and lead model (Phase 5).

---
*Roadmap created: 2026-03-06*
*Updated: 2026-03-07 -- Merged Phases 3+4+9 into Cinematic Homepage & Layout, reduced to 8 phases*
