# Roadmap: Triple J Auto Investment

## Milestones

- **v1.0 Core Operations Platform** - Phases 1-8 (shipped 2026-02-13)
- **v2.0 Psychological Architecture & Production Launch** - Phases 9-19 (in progress)

## Overview

Deploy Triple J Auto Investment to production and implement the full SOVEREIGN psychological architecture -- transforming the site from a dealership operations tool into an influence machine that moves strangers through a behavioral funnel from skeptic to buyer to evangelist. The journey begins with production infrastructure (Phase 9), then makes the existing site honest and polished (Phases 10-12), then builds the psychological funnel stages in order: focus capture landing (Phase 13), expectancy-building listings (Phase 14), micro-commitment spectrum (Phase 15), intelligence layer (Phase 16), Divine AI behavioral response (Phase 17), automated follow-up (Phase 18), and finally the post-purchase retention engine (Phase 19).

## Phases

<details>
<summary>v1.0 Core Operations Platform (Phases 1-8) - SHIPPED 2026-02-13</summary>

See: `.planning/milestones/v1-ROADMAP.md`

8 phases, 30 plans, 151 commits. Delivered inventory management, registration tracker, customer portal with OTP login, SMS/email notifications, document validation, rental management, plate tracking, and insurance verification.

</details>

### v2.0 Psychological Architecture & Production Launch

**Milestone Goal:** Deploy to production and implement the SOVEREIGN psychological architecture -- every page, every interaction engineered to move visitors through the funnel from skeptic to buyer to evangelist.

**Phase Numbering:**
- Integer phases (9, 10, 11...): Planned milestone work
- Decimal phases (9.1, 9.2): Urgent insertions if needed (marked with INSERTED)

- [ ] **Phase 9: Production Infrastructure** - Deploy to production with fresh Supabase, Vercel, and credential rotation
- [x] **Phase 10: Brand Truth** - Align all content with "automotive investment firm" positioning using real business data
- [ ] **Phase 11: Production Polish** - Mobile-first verification, performance, accessibility, and production-grade error handling
- [ ] **Phase 12: SEO Foundation** - BrowserRouter migration, meta tags, sitemap, and schema markup for search visibility
- [ ] **Phase 13: Focus Capture** - SOVEREIGN landing experience with pattern-interrupt, authority, and tribe signals
- [ ] **Phase 14: Expectancy Building** - Vehicle listings as micro-stories with price anchoring and identity framing
- [ ] **Phase 15: Engagement Spectrum** - Micro-commitment ladder from zero-friction saves to vehicle reservations
- [ ] **Phase 16: Behavioral Intelligence** - Session tracking, smart recommendations, urgency calibration, and attribution
- [ ] **Phase 17: Divine Response** - AI chat with behavioral profiling plus Retell voice agent updates
- [ ] **Phase 18: Behavioral Follow-Up** - 4-tier automated re-engagement system triggered by visitor behavior
- [ ] **Phase 19: Retention Engine** - Owner Portal, Family Circle referral program, review generation, and re-entry loop

## Phase Details

### Phase 9: Production Infrastructure
**Goal**: The platform runs on production infrastructure -- real Supabase project, real Vercel deployment, real domain, all v1 workflows verified end-to-end on production
**Depends on**: Nothing (first v2 phase; v1 code complete)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09, DEPLOY-10, DEPLOY-11, DEPLOY-12, DEPLOY-13
**Success Criteria** (what must be TRUE):
  1. Admin can log in to the production site, create a vehicle, and see it in the inventory list
  2. Customer receives a real SMS OTP at their phone number and can log in to the status tracker
  3. Edge Functions fire on schedule -- notification queue processes and plate alerts run (verified in cron.job_run_details)
  4. File uploads work -- rental agreement PDFs, plate photos, and insurance card images save to storage and display correctly
  5. The site loads at the custom domain with valid SSL and all pages render without console errors referencing missing environment variables
**Plans**: 7 plans

Plans:
- [ ] 09-01-PLAN.md -- Long-lead items: Resend account + domain DNS, repo private, A2P 10DLC check
- [ ] 09-02-PLAN.md -- Supabase project creation, extensions, migrations, admin bootstrap, phone OTP
- [ ] 09-03-PLAN.md -- Edge Functions deployment, secrets, storage buckets, cron activation
- [ ] 09-04-PLAN.md -- Credential cleanup: delete deprecated files, remove hardcoded secrets from codebase
- [ ] 09-05-PLAN.md -- Vercel deployment with env vars, custom domain + SSL
- [ ] 09-06-PLAN.md -- Vehicle data migration from dev to production
- [ ] 09-07-PLAN.md -- End-to-end smoke test on production

### Phase 10: Brand Truth
**Goal**: Every page communicates Triple J as a trustworthy automotive investment firm -- real business data, real metrics, real story, honest positioning
**Depends on**: Phase 9 (content changes auto-deploy via Vercel GitHub integration)
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07
**Success Criteria** (what must be TRUE):
  1. A visitor reading the homepage understands Triple J sells and rents pre-owned vehicles in the $3K-$8K range for Houston families -- no "luxury" or "architect reality" language remains
  2. The About page shows the real dealership story, team information, and location photos from 8774 Almeda Genoa
  3. Footer on every page displays correct business info including Texas dealer license P171632, consistent across English and Spanish
  4. All social proof metrics reference real data (actual families served, actual Google review quotes) -- no fabricated counters
**Plans**: 6 plans

Plans:
- [x] 10-01-PLAN.md -- Rewrite translations.ts (complete bilingual content overhaul) and Home.tsx (remove subliminal components, fake social proof)
- [x] 10-02-PLAN.md -- Rewrite About, Services, and FAQ pages with honest content and bilingual support
- [x] 10-03-PLAN.md -- Rewrite footer (App.tsx) and all secondary pages (Finance, PaymentOptions, Legal, Policies, NotFound, VinLookup, Login, Inventory)
- [x] 10-04-PLAN.md -- Fix fallback vehicles, AI prompts, caption generator, phone number standardization, and codebase-wide jargon sweep
- [ ] 10-05-PLAN.md -- (Gap closure) Fix index.html meta tags: remove SOVEREIGN/luxury branding from title, OG, and schema.org
- [ ] 10-06-PLAN.md -- (Gap closure) Move hardcoded English in Finance, PaymentOptions, Policies, VinLookup to bilingual translations

### Phase 11: Production Polish
**Goal**: The site feels production-grade on every device -- fast, responsive, accessible, and graceful when things go wrong
**Depends on**: Phase 9 (needs production environment for realistic testing); can overlap with Phase 10
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09, POLISH-10, POLISH-11
**Success Criteria** (what must be TRUE):
  1. Every page renders correctly on a 375px viewport with no horizontal scroll, and all tap targets meet 44x44px minimum
  2. The site achieves LCP under 2.5 seconds on a throttled 4G connection (no multi-second splash screen blocking content)
  3. Zero console.log output in the production build -- browser DevTools console is clean
  4. When Supabase is unreachable or an Edge Function fails, the user sees a helpful error message instead of a blank screen or infinite spinner
  5. All images have alt text, color contrast passes WCAG AA, and primary flows are navigable by keyboard alone
**Plans**: 6 plans

Plans:
- [ ] 11-01-PLAN.md -- Infrastructure: console stripping, ErrorBoundary fix, Suspense fallback, offline detection, maintenance page, bilingual translation keys
- [ ] 11-02-PLAN.md -- Loading/empty/error states across all customer-facing pages (Inventory, Home, Contact, Finance, CustomerDashboard, etc.)
- [ ] 11-03-PLAN.md -- Mobile responsiveness at 375px + touch targets 44x44px across all customer-facing pages and Navbar/Footer
- [ ] 11-04-PLAN.md -- Spacing standardization + button consistency across all pages (canonical padding scale, 4 button patterns)
- [ ] 11-05-PLAN.md -- Accessibility: color contrast WCAG AA, alt text audit, skip-to-content, keyboard navigation, focus trapping, ARIA
- [ ] 11-06-PLAN.md -- Human verification checkpoint: visual + functional testing across mobile viewports and keyboard

### Phase 12: SEO Foundation
**Goal**: Search engines can discover, crawl, and correctly represent every public page of the site
**Depends on**: Phase 9 (needs production deployment); can overlap with Phases 10-11
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06
**Success Criteria** (what must be TRUE):
  1. All public pages use clean URLs without hash fragments (e.g., /about not /#/about) and direct URL entry works without 404
  2. Each page has a unique, accurate title tag and meta description visible in browser tab and page source
  3. Google Search Console can fetch and render the sitemap.xml, and robots.txt correctly allows/disallows the right paths
  4. Schema markup on the homepage accurately reflects LocalBusiness + AutoDealer with correct price range, address, and dealer license
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD

### Phase 13: Focus Capture
**Goal**: A visitor's first 3 seconds on the site break the "used car lot" script -- they register novelty, authority, and tribe belonging before conscious evaluation begins
**Depends on**: Phase 10 (brand positioning must be established before the landing experience is built on top of it)
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07
**Success Criteria** (what must be TRUE):
  1. The landing page opens with a visual-first hero moment centered on family (not an inventory grid), and first-time visitors see something they have never encountered on a dealership site
  2. Real authority metrics ("X families served", "X five-star reviews") are visible above the fold within the first viewport without scrolling
  3. A Spanish-first visitor immediately sees "Se Habla Espanol" and family-centered imagery reflecting the Hispanic community
  4. The overall design communicates competence and intentionality -- no visual clutter, no generic dealership template feel
**Plans**: TBD

Plans:
- [ ] 13-01: TBD
- [ ] 13-02: TBD

### Phase 14: Expectancy Building
**Goal**: Browsing inventory transforms from a transactional scan into an emotional experience where visitors begin to see themselves owning the vehicle
**Depends on**: Phase 10 (brand language established), Phase 12 (individual vehicle pages need clean URLs for SEO)
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07
**Success Criteria** (what must be TRUE):
  1. Each vehicle listing leads with an aspirational hero image and an identity-first headline (e.g., "Family-Ready Sedan | Reliable. Clean.") before showing year/make/model specs
  2. The price section shows Triple J Price, Market Average, You Save, and Estimated Monthly in a clear visual hierarchy that makes the deal feel obvious
  3. Inspected vehicles display a visible "Triple J Verified" badge that is absent from non-inspected listings
  4. Each vehicle has its own page with a unique URL (e.g., /vehicles/2018-honda-accord) that can be shared and indexed
  5. Vehicle story sections show honest origin and condition information -- imperfections disclosed, not hidden
**Plans**: TBD

Plans:
- [ ] 14-01: TBD
- [ ] 14-02: TBD
- [ ] 14-03: TBD

### Phase 15: Engagement Spectrum
**Goal**: Visitors can take action at whatever commitment level they are psychologically ready for -- from anonymous saves to vehicle reservations -- and every action feeds the CRM pipeline
**Depends on**: Phase 14 (commitment actions live on vehicle listing pages)
**Requirements**: COMMIT-01, COMMIT-02, COMMIT-03, COMMIT-04, COMMIT-05, COMMIT-06, COMMIT-07, COMMIT-08, COMMIT-09, COMMIT-10
**Success Criteria** (what must be TRUE):
  1. A visitor can save/favorite a vehicle with a single tap (no login, no form) and see their saved vehicles on return
  2. The payment calculator works interactively on the listing page without requiring any personal information
  3. Level 1 actions (price alert, similar vehicles, vehicle report) require only a phone number and deliver the visitor into the leads pipeline in Supabase
  4. "Schedule a Visit" and "Ask a Question" forms collect name + phone + vehicle context and create leads in Supabase (no more setTimeout mock)
  5. All commitment levels are visible on the listing page but none are forced -- the visitor chooses their own entry point
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD
- [ ] 15-03: TBD

### Phase 16: Behavioral Intelligence
**Goal**: The platform knows what visitors are doing, recommends the right vehicles, shows honest urgency signals, and tracks where conversions come from
**Depends on**: Phase 9 (needs production database for tracking tables)
**Requirements**: INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05
**Success Criteria** (what must be TRUE):
  1. Session behavior (vehicle views, click patterns, dwell time) is tracked in the database and visible to the admin
  2. Returning visitors see "You recently viewed" with vehicles from their previous sessions
  3. Urgency badges ("Just Arrived", "Popular", "Offer Received") appear only when backed by real inventory data -- no fake scarcity
  4. Every lead capture records its source (which page, which vehicle, which device, referring URL) for conversion attribution
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

### Phase 17: Divine Response
**Goal**: Visitors get intelligent, psychologically-adapted assistance through AI chat on the website and updated Retell voice calls -- with graceful fallbacks when AI services are unavailable
**Depends on**: Phase 15 (AI chat needs commitment endpoints to guide visitors toward action), Phase 16 (behavioral data informs profile identification)
**Requirements**: DIVINE-01, DIVINE-02, DIVINE-03, DIVINE-04, DIVINE-05, DIVINE-06, DIVINE-07, DIVINE-08
**Success Criteria** (what must be TRUE):
  1. A chat widget is accessible on vehicle listing pages and responds conversationally (not scripted FAQ) with knowledge of the specific vehicle being viewed
  2. Within 2-3 exchanges, the chat adapts its communication style based on the visitor's identified profile (Provider/Skeptic/First-Timer/Struggler)
  3. The Retell AI voice agent correctly handles rental inquiries and responds in Spanish when the caller speaks Spanish
  4. When AI services are down, the chat widget shows a direct phone number and the Retell fallback displays the dealership contact information
**Plans**: TBD

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD
- [ ] 17-03: TBD

### Phase 18: Behavioral Follow-Up
**Goal**: Visitors who leave without converting receive timely, behavior-appropriate re-engagement messages that feel like service, not spam
**Depends on**: Phase 16 (needs session behavior data), Phase 17 (Tier 4 uses AI voice calls)
**Requirements**: FOLLOW-01, FOLLOW-02, FOLLOW-03, FOLLOW-04, FOLLOW-05
**Success Criteria** (what must be TRUE):
  1. A browse-only visitor receives an SMS 24 hours later referencing the specific vehicle they viewed longest
  2. A visitor who saved a vehicle receives an SMS within 4 hours with a scarcity signal based on real view data
  3. A visitor who abandoned a form mid-completion receives a message within 1 hour acknowledging their saved progress
  4. A returning visitor sees their previously viewed vehicles surfaced prominently without needing to search again
**Plans**: TBD

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD

### Phase 19: Retention Engine
**Goal**: Every buyer becomes a node in a referral network -- the Owner Portal reinforces their purchase decision, the Family Circle program incentivizes referrals, and the review engine builds social proof
**Depends on**: Phase 9 (needs production infrastructure), Phase 10 (brand consistency in portal)
**Requirements**: PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-04, PORTAL-05, PORTAL-06
**Success Criteria** (what must be TRUE):
  1. A customer who purchased a vehicle can log in to the Owner Portal and see their vehicle dashboard with service reminders, warranty status, and digital copies of purchase documents
  2. The vehicle value tracker shows an estimated current value that reinforces the customer's sense of investment (endowment effect)
  3. Each owner has a unique Family Circle referral code they can share, and the referral page shows their referral count alongside a community counter ("X families referred this month")
  4. Three days after purchase, the customer receives a personalized review request that frames leaving a review as helping other families
  5. Twelve to eighteen months post-purchase, the customer sees a "Ready to Upgrade?" prompt with their vehicle's estimated trade-in value
**Plans**: TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD
- [ ] 19-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17 -> 18 -> 19
(Phases 10, 11, 12 can partially overlap after Phase 9 completes. Phase 16 can start after Phase 9 independently of 10-15.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. Production Infrastructure | v2.0 | 0/7 | Planning complete | - |
| 10. Brand Truth | v2.0 | 6/6 | Complete | 2026-02-15 |
| 11. Production Polish | v2.0 | 0/6 | Planning complete | - |
| 12. SEO Foundation | v2.0 | 0/TBD | Not started | - |
| 13. Focus Capture | v2.0 | 0/TBD | Not started | - |
| 14. Expectancy Building | v2.0 | 0/TBD | Not started | - |
| 15. Engagement Spectrum | v2.0 | 0/TBD | Not started | - |
| 16. Behavioral Intelligence | v2.0 | 0/TBD | Not started | - |
| 17. Divine Response | v2.0 | 0/TBD | Not started | - |
| 18. Behavioral Follow-Up | v2.0 | 0/TBD | Not started | - |
| 19. Retention Engine | v2.0 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-13*
*Milestone: v2.0 Psychological Architecture & Production Launch*
