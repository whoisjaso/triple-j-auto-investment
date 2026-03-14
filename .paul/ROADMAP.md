# Roadmap: Triple J Auto Investment

## Overview

Build Triple J Auto Investment from the ground up -- starting with the simplest foundational pieces (project setup, database, static pages) and layering complexity incrementally through inventory display, lead capture, admin tools, bilingual support, cinematic animation, and launch-ready optimization. v0.1 delivers a polished, mobile-first dealership site. v0.2 transforms the admin side into a Dealer Intelligence System with automated inventory pipeline, real CRM, and business intelligence.

## Milestones

### v0.1 Initial Release (COMPLETE)
Status: COMPLETE
Phases: 8 of 8 complete (2026-03-11)
Deployed: thetriplejauto.com + Supabase connected

### v0.2 Dealer Intelligence System (IN PROGRESS)
Status: In Progress
Phases: 2 of 4 complete
Theme: Automate the Manheim-to-website pipeline, build a real CRM, and add business intelligence — replacing manual Google Sheet workflows with AI-powered automation.

## v0.1 Phases (Complete)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Project Foundation | 1/1 | Complete | 2026-03-07 |
| 2 | Database & Types | 1/1 | Complete | 2026-03-07 |
| 3 | Cinematic Homepage & Layout | 2/2 | Complete | 2026-03-07 |
| 4 | Inventory System | 2/2 | Complete | 2026-03-07 |
| 5 | Lead Capture & Contact | 1/1 | Complete | 2026-03-07 |
| 6 | Admin Core | 2/2 | Complete | 2026-03-10 |
| 7 | Bilingual (i18n) | 2/2 | Complete | 2026-03-11 |
| 8 | SEO & Launch | 1/1 | Complete | 2026-03-11 |

## v0.2 Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 9 | Automated Inventory Pipeline | 3/3 | Complete | 2026-03-11 |
| 10 | CRM | 2/2 | Complete | 2026-03-12 |
| 11 | Business Intelligence | 0/~1 | Planning | - |
| 12 | Advanced Features | TBD | Not started | - |

## v0.2 Phase Details

### Phase 9: Automated Inventory Pipeline
AI-powered email parsing agent that monitors Gmail for Manheim/OVE.com purchase confirmations, DealShield guarantees, and Central Dispatch transport notifications. Auto-creates vehicle records in Supabase with full specs (VIN auto-decode via NHTSA), tracks transport status, and manages the full vehicle lifecycle from PURCHASED → IN_TRANSIT → ARRIVED → LISTED. Eliminates the manual Google Sheet workflow entirely. Output: vehicles automatically flow from Manheim purchase to website listing.

### Phase 10: CRM
Transform the basic leads table into a real CRM with pipeline stages (New → Qualified → Test Drive → Negotiation → Sold → Follow-up), follow-up task management, communication logging, vehicle-to-customer matching, and automated notifications. SMS/call integration via Twilio for follow-ups. Output: Jason can manage his entire sales pipeline from the admin dashboard.

### Phase 11: Business Intelligence
Dashboard analytics: purchase cost vs sale price (profit per vehicle), days-on-lot metrics, lead conversion rates, vehicle type performance, lead source analysis (Facebook, walk-in, referral). Historical reporting and trend visualization. Output: data-driven decisions on what to buy and how to sell.

### Phase 12: Advanced Features
Rentals management, plate tracking, registration workflows, owner portal, AI chat/voice agents, behavioral tracking, SOVEREIGN psychological layer. Scoped and prioritized during Phase 11 planning. Output: full-featured dealership management platform.

## Dependencies

### v0.1
```
Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5
                                        │
                              Phase 6 <─┘
                                │
                      Phase 7 <─┘
                        │
                      Phase 8
```

### v0.2
```
Phase 9 (Pipeline) ──> Phase 10 (CRM) ──> Phase 11 (BI)
                                              │
                                    Phase 12 <─┘
```

Phase 9 is foundational — automated vehicle data feeds Phase 10's CRM matching and Phase 11's analytics. Phase 12 depends on the intelligence layer being in place.

---
*Roadmap created: 2026-03-06*
*Updated: 2026-03-14 -- Phase 10 (CRM) complete, 2/4 v0.2 phases done*
