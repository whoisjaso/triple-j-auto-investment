# Requirements: Triple J Auto Investment v2.0

**Defined:** 2026-02-13
**Core Value:** Every page, every interaction, every notification engineered to move a stranger through a psychological funnel from skeptic to buyer to evangelist -- built on the SOVEREIGN framework.

## v2.0 Requirements

Requirements for v2.0 Psychological Architecture & Production Launch. Organized by the blueprint's funnel stages plus infrastructure and polish.

### Deployment Infrastructure

- [ ] **DEPLOY-01**: Fresh Supabase production project created with Pro plan
- [ ] **DEPLOY-02**: Extensions enabled (btree_gist, pg_cron, pg_net) before migrations
- [ ] **DEPLOY-03**: All migrations (02-08) applied in strict order
- [ ] **DEPLOY-04**: Admin user bootstrapped with is_admin=true
- [ ] **DEPLOY-05**: Edge Functions deployed (process-notification-queue, unsubscribe, check-plate-alerts)
- [ ] **DEPLOY-06**: Edge Function secrets configured (Twilio SID/token/phone, Resend key, admin phone/email)
- [ ] **DEPLOY-07**: Storage buckets created with RLS (rental-agreements, rental-photos, plate-photos, insurance-cards)
- [ ] **DEPLOY-08**: Phone OTP auth enabled via Twilio provider
- [ ] **DEPLOY-09**: pg_cron schedules activated and verified (check cron.job_run_details)
- [ ] **DEPLOY-10**: Credential rotation -- all committed keys in 30+ files rotated
- [ ] **DEPLOY-11**: Frontend deployed to Vercel with production environment variables
- [ ] **DEPLOY-12**: Custom domain connected with SSL (DNS cutover from existing site)
- [ ] **DEPLOY-13**: End-to-end smoke test on production (all workflows verified)

### Landing Experience (FATE Stage 1: Focus Capture)

- [x] **LAND-01**: Pattern-interrupt hero -- single powerful visual-first moment, not inventory grid
- [x] **LAND-02**: Authority signals within 3 seconds -- real metrics ("X families served", "X five-star reviews")
- [x] **LAND-03**: Tribe signals -- family-centered imagery, cultural alignment for Hispanic market
- [x] **LAND-04**: "Se Habla Espanol" prominently displayed for Spanish-first visitors
- [x] **LAND-05**: SubliminalPrime component refined -- updated words and execution
- [x] **LAND-06**: Design precision radiates competence -- no clutter, everything intentional
- [x] **LAND-07**: Positioning language -- "automotive investment firm" not "buy a car today"

### Vehicle Listings (FATE Stage 2: Expectancy Building)

- [x] **LIST-01**: Hero images presented magazine-style (aspiration, not fluorescent lot photos)
- [x] **LIST-02**: Identity-first headlines above specs ("Family-Ready Sedan | Reliable. Clean. Ready for Your Next Chapter.")
- [x] **LIST-03**: Triple J Verified badge on inspected vehicles (authority signal)
- [x] **LIST-04**: Price transparency architecture -- Triple J Price, Market Average, You Save, Estimated Monthly
- [x] **LIST-05**: Vehicle Story section -- origin, inspection summary, honest condition reporting
- [x] **LIST-06**: Social proof micro-layer -- "Sells within X days", "X families viewing this vehicle" (real data only)
- [x] **LIST-07**: Vehicle detail pages with unique URLs (indexable by search engines)

### Micro-Commitment Spectrum (FATE Stage 3: Engagement)

- [x] **COMMIT-01**: Level 0 -- Save/Favorite vehicle (heart icon, no information required)
- [x] **COMMIT-02**: Level 0 -- Interactive payment calculator (no form required)
- [x] **COMMIT-03**: Level 1 -- "Get a Price Alert" (phone number only)
- [x] **COMMIT-04**: Level 1 -- "Send Me Similar Vehicles" (phone number only)
- [x] **COMMIT-05**: Level 1 -- "Get the Vehicle Report" (phone number for inspection details)
- [x] **COMMIT-06**: Level 2 -- "Schedule a Visit" (name + phone + vehicle interest)
- [x] **COMMIT-07**: Level 2 -- "Ask a Question About This Vehicle" (contextual inquiry)
- [x] **COMMIT-08**: Level 3 -- "Reserve This Vehicle" (deposit hold)
- [x] **COMMIT-09**: Contact form delivers leads to Supabase (replace setTimeout mock)
- [x] **COMMIT-10**: Every commitment level visible but never forced -- visitor chooses entry point

### Divine AI Chat (FATE Stage 4: Behavioral Response)

- [ ] **DIVINE-01**: AI chat widget on website -- behavioral intelligence, not scripted FAQ
- [ ] **DIVINE-02**: Profile identification within 30 seconds (Provider/Skeptic/First-Timer/Struggler)
- [ ] **DIVINE-03**: Communication adapts to identified psychological profile
- [ ] **DIVINE-04**: PCP closing sequence -- Perception, Context, Permission (no pressure)
- [ ] **DIVINE-05**: Retell AI voice agent prompts updated for rental inquiries
- [ ] **DIVINE-06**: Retell dynamic messaging with specific vehicle context from inquiry
- [ ] **DIVINE-07**: Graceful fallback when Retell/Divine is down (show phone number to call)
- [ ] **DIVINE-08**: Spanish language support for AI interactions (Houston 45% Hispanic)

### Behavioral Follow-Up System

- [ ] **FOLLOW-01**: Tier 1 -- SMS 24hr after browse-only with vehicle they viewed longest
- [ ] **FOLLOW-02**: Tier 2 -- SMS 4hr after save/favorite (scarcity + loss aversion trigger)
- [ ] **FOLLOW-03**: Tier 3 -- SMS/email 1hr after abandoned form ("Your info is saved")
- [ ] **FOLLOW-04**: Tier 4 -- AI voice call 2hr after question without scheduling
- [ ] **FOLLOW-05**: Return visitor recognition -- surface previously viewed vehicles on return

### Intelligence Layer

- [x] **INTEL-01**: Session behavior tracking (views, clicks, dwell time, hesitation points)
- [x] **INTEL-02**: Smart vehicle recommendations based on browsing patterns
- [x] **INTEL-03**: Urgency calibration -- real data only (Just Arrived, Popular, Offer Received)
- [x] **INTEL-04**: Conversion attribution -- source tracking for all actions (ad, page, vehicle, device)
- [x] **INTEL-05**: Customer profile adaptive experience based on behavior signals

### Owner Portal & Retention

- [ ] **PORTAL-01**: Owner Portal section exclusive to Triple J customers (post-purchase)
- [ ] **PORTAL-02**: Vehicle dashboard -- service reminders, warranty status, digital purchase documents
- [ ] **PORTAL-03**: Vehicle value tracker (estimated current value -- endowment reinforcement)
- [ ] **PORTAL-04**: Family Circle referral program -- unique codes, reward tracking, social proof counter
- [ ] **PORTAL-05**: Review generation engine -- personalized request 3 days post-purchase
- [ ] **PORTAL-06**: "Ready to Upgrade?" re-entry loop -- 12-18 months post-purchase curiosity trigger

### Content & Brand Alignment

- [x] **BRAND-01**: Homepage content aligned with automotive investment firm positioning
- [x] **BRAND-02**: About page with real dealership story, team, values, location photos
- [x] **BRAND-03**: Services page accurate to actual business offerings (sales + rentals)
- [x] **BRAND-04**: Social proof updated to real metrics (remove references to vehicles not sold)
- [x] **BRAND-05**: Footer with real business info, consistent tone, dealer license P171632
- [x] **BRAND-06**: Consistent "automotive investment firm" tone across all pages and translations
- [x] **BRAND-07**: Real Google review quotes as static social proof

### UI/UX Polish & Performance

- [x] **POLISH-01**: Mobile-first verification -- all pages tested on 375px, 414px viewports
- [x] **POLISH-02**: Remove user-scalable=no from viewport meta (accessibility)
- [x] **POLISH-03**: Splash screen shortened or removed -- LCP under 2.5 seconds
- [x] **POLISH-04**: Console.log statements removed (100+ instances -- security + performance)
- [x] **POLISH-05**: Loading states for all async operations
- [x] **POLISH-06**: Empty states for zero-data scenarios (fresh production DB)
- [x] **POLISH-07**: Error states when Supabase unreachable or Edge Functions fail
- [x] **POLISH-08**: Consistent spacing system across all pages
- [x] **POLISH-09**: Consistent button/link styles throughout
- [x] **POLISH-10**: Touch targets minimum 44x44px on mobile
- [x] **POLISH-11**: Accessibility basics -- alt text, color contrast WCAG AA, keyboard navigation

### SEO Foundation

- [x] **SEO-01**: BrowserRouter migration from HashRouter (hash URLs invisible to search engines)
- [x] **SEO-02**: React Helmet -- per-page title tags and meta descriptions
- [x] **SEO-03**: sitemap.xml generation
- [x] **SEO-04**: robots.txt
- [x] **SEO-05**: Schema markup accurate to actual business (LocalBusiness, AutoDealer, correct price range)
- [x] **SEO-06**: OG/meta tags accurate per page (not "Used Luxury Cars $5000-$50000")

### GEO/AEO (AI Search Engine Optimization)

- [x] **GEO-01**: AI crawler access -- robots.txt allows GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended, Applebot-Extended, Amazonbot
- [x] **GEO-02**: FinancialProduct schema for Buy Here Pay Here in-house financing
- [x] **GEO-03**: Service schema for car rentals with Houston areaServed
- [x] **GEO-04**: Entity signals -- sameAs, knowsLanguage, additionalType on AutoDealer schema
- [x] **GEO-05**: hreflang tags for bilingual content (en, es, x-default) on every page
- [x] **GEO-06**: Expanded BreadcrumbList covering all 10 public pages
- [x] **GEO-07**: Conversational FAQ expansion (20+ questions) targeting AI search queries in English and Spanish
- [x] **GEO-08**: Answer capsule content format on Finance and Services pages for AI citation
- [x] **GEO-09**: FAQ schema matching expanded content (23 EN + 10 ES questions)
- [x] **GEO-10**: Branded attribution and specific data points in content for AI extractability

## v3.0 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced AI & Automation

- **ADV-01**: A/B testing framework for conversion elements
- **ADV-02**: Vehicle story content auto-generation via AI
- **ADV-03**: Pre-visit priming automation (confirmation emails with lot photos, salesperson face)
- **ADV-04**: Data-driven inventory acquisition recommendations

### Advanced Business Features

- **BIZ-01**: BHPH (Buy Here Pay Here) financing integration (post-OCCC license)
- **BIZ-02**: "Make an Offer" negotiation flow
- **BIZ-03**: Credit application / pre-qualification
- **BIZ-04**: Service scheduling through Owner Portal
- **BIZ-05**: Integration with Obawems auction platform for cross-funnel traffic

### Testing & Security

- **SEC-01**: Comprehensive test coverage (Vitest + Playwright)
- **SEC-02**: Move VITE_ API keys to Edge Functions (Retell, Gemini)
- **SEC-03**: Remove VITE_ADMIN_PASSWORD from codebase
- **SEC-04**: Rate limiting on lead forms

### Advanced Platform

- **PLAT-01**: LoJack GPS integration (pending Spireon API access)
- **PLAT-02**: Push notifications (browser)
- **PLAT-03**: Web3 backend integration (long-term vision)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, mobile-responsive is sufficient |
| Online payment processing | PCI complexity; tracking payments offline, not processing them |
| Multi-location support | Single dealership operation |
| Auction integration | Not part of current business model |
| Automated DMV submission | Manual submission via webDealer, system validates only |
| Live chat (third-party widget) | Divine AI replaces this with behavioral intelligence |
| Test drive scheduling system | "Schedule a Visit" is sufficient; dealer handles specifics by phone |
| Blog/content section | Content creation is ongoing commitment; launch without, add later |
| SSR / Next.js migration | Massive refactor; BrowserRouter + React Helmet sufficient for SEO |
| Full i18n framework (react-intl) | Current translation utility works; replacing is churn |
| Customer account profile editing | Customer can view dashboard, contact dealer for changes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-02 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-03 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-04 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-05 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-06 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-07 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-08 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-09 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-10 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-11 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-12 | Phase 9: Production Infrastructure | Pending |
| DEPLOY-13 | Phase 9: Production Infrastructure | Pending |
| BRAND-01 | Phase 10: Brand Truth | Complete |
| BRAND-02 | Phase 10: Brand Truth | Complete |
| BRAND-03 | Phase 10: Brand Truth | Complete |
| BRAND-04 | Phase 10: Brand Truth | Complete |
| BRAND-05 | Phase 10: Brand Truth | Complete |
| BRAND-06 | Phase 10: Brand Truth | Complete |
| BRAND-07 | Phase 10: Brand Truth | Complete |
| POLISH-01 | Phase 11: Production Polish | Complete |
| POLISH-02 | Phase 11: Production Polish | Complete |
| POLISH-03 | Phase 11: Production Polish | Complete |
| POLISH-04 | Phase 11: Production Polish | Complete |
| POLISH-05 | Phase 11: Production Polish | Complete |
| POLISH-06 | Phase 11: Production Polish | Complete |
| POLISH-07 | Phase 11: Production Polish | Complete |
| POLISH-08 | Phase 11: Production Polish | Complete |
| POLISH-09 | Phase 11: Production Polish | Complete |
| POLISH-10 | Phase 11: Production Polish | Complete |
| POLISH-11 | Phase 11: Production Polish | Complete |
| SEO-01 | Phase 12: SEO Foundation | Complete |
| SEO-02 | Phase 12: SEO Foundation | Complete |
| SEO-03 | Phase 12: SEO Foundation | Complete |
| SEO-04 | Phase 12: SEO Foundation | Complete |
| SEO-05 | Phase 12: SEO Foundation | Complete |
| SEO-06 | Phase 12: SEO Foundation | Complete |
| GEO-01 | Phase 12: SEO Foundation | Complete |
| GEO-02 | Phase 12: SEO Foundation | Complete |
| GEO-03 | Phase 12: SEO Foundation | Complete |
| GEO-04 | Phase 12: SEO Foundation | Complete |
| GEO-05 | Phase 12: SEO Foundation | Complete |
| GEO-06 | Phase 12: SEO Foundation | Complete |
| GEO-07 | Phase 12: SEO Foundation | Complete |
| GEO-08 | Phase 12: SEO Foundation | Complete |
| GEO-09 | Phase 12: SEO Foundation | Complete |
| GEO-10 | Phase 12: SEO Foundation | Complete |
| LAND-01 | Phase 13: Focus Capture | Pending |
| LAND-02 | Phase 13: Focus Capture | Pending |
| LAND-03 | Phase 13: Focus Capture | Pending |
| LAND-04 | Phase 13: Focus Capture | Pending |
| LAND-05 | Phase 13: Focus Capture | Pending |
| LAND-06 | Phase 13: Focus Capture | Pending |
| LAND-07 | Phase 13: Focus Capture | Pending |
| LIST-01 | Phase 14: Expectancy Building | Complete |
| LIST-02 | Phase 14: Expectancy Building | Complete |
| LIST-03 | Phase 14: Expectancy Building | Complete |
| LIST-04 | Phase 14: Expectancy Building | Complete |
| LIST-05 | Phase 14: Expectancy Building | Complete |
| LIST-06 | Phase 14: Expectancy Building | Complete |
| LIST-07 | Phase 14: Expectancy Building | Complete |
| COMMIT-01 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-02 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-03 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-04 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-05 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-06 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-07 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-08 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-09 | Phase 15: Engagement Spectrum | Complete |
| COMMIT-10 | Phase 15: Engagement Spectrum | Complete |
| INTEL-01 | Phase 16: Behavioral Intelligence | Complete |
| INTEL-02 | Phase 16: Behavioral Intelligence | Complete |
| INTEL-03 | Phase 16: Behavioral Intelligence | Complete |
| INTEL-04 | Phase 16: Behavioral Intelligence | Complete |
| INTEL-05 | Phase 16: Behavioral Intelligence | Complete |
| DIVINE-01 | Phase 17: Divine Response | Pending |
| DIVINE-02 | Phase 17: Divine Response | Pending |
| DIVINE-03 | Phase 17: Divine Response | Pending |
| DIVINE-04 | Phase 17: Divine Response | Pending |
| DIVINE-05 | Phase 17: Divine Response | Pending |
| DIVINE-06 | Phase 17: Divine Response | Pending |
| DIVINE-07 | Phase 17: Divine Response | Pending |
| DIVINE-08 | Phase 17: Divine Response | Pending |
| FOLLOW-01 | Phase 18: Behavioral Follow-Up | Pending |
| FOLLOW-02 | Phase 18: Behavioral Follow-Up | Pending |
| FOLLOW-03 | Phase 18: Behavioral Follow-Up | Pending |
| FOLLOW-04 | Phase 18: Behavioral Follow-Up | Pending |
| FOLLOW-05 | Phase 18: Behavioral Follow-Up | Pending |
| PORTAL-01 | Phase 19: Retention Engine | Pending |
| PORTAL-02 | Phase 19: Retention Engine | Pending |
| PORTAL-03 | Phase 19: Retention Engine | Pending |
| PORTAL-04 | Phase 19: Retention Engine | Pending |
| PORTAL-05 | Phase 19: Retention Engine | Pending |
| PORTAL-06 | Phase 19: Retention Engine | Pending |

**Coverage:**
- v2.0 requirements: 95 total (85 original + 10 GEO/AEO)
- Mapped to phases: 95
- Unmapped: 0

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation (traceability complete)*
