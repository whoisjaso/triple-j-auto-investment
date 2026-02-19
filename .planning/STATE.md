# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-19
**Session:** Phase 15 COMPLETE (all 3 plans done: 15-01 + 15-02 + 15-03)

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core Value:** Every page, every interaction engineered to move a stranger through a psychological funnel from skeptic to buyer to evangelist -- built on the SOVEREIGN framework (internal only; customer-facing content uses honest automotive dealership language).
**Current focus:** Phase 15 - Engagement Spectrum (COMPLETE -- verified 5/5 must-haves)

**Key Files:**
- `.planning/PROJECT.md` - Project definition
- `.planning/ROADMAP.md` - v2.0 roadmap (Phases 9-19)
- `.planning/REQUIREMENTS.md` - v2.0 requirements (85 total)
- `.planning/PSYCHOLOGICAL-ARCHITECTURE.md` - Blueprint for all design decisions
- `.planning/MILESTONES.md` - Shipped milestones (v1.0)
- `.planning/milestones/v1-ROADMAP.md` - v1 roadmap archive

**Git Remote:**
- Repository: https://github.com/whoisjaso/triple-j-auto-investment
- Branch: master
- Username: whoisjaso

---

## Current Position

**Milestone:** v2.0 Psychological Architecture & Production Launch
**Phase:** 15 of 19 (Engagement Spectrum)
**Plan:** 3 of 3 complete (15-01 + 15-02 + 15-03 done)
**Status:** Phase complete
**Last activity:** 2026-02-19 -- Completed 15-03-PLAN.md (Level 2+3 components, VehicleDetail integration, Contact/Finance updates)

Progress: [██████████████████████████████] 100% (30/30 plans -- Phase 15 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 30 (v2.0: 09-03, 09-04, 10-01, 10-02, 10-03, 10-04, 10-05, 10-06, 11-01, 11-02, 11-03, 11-04, 11-05, 11-06, 11-07, 11-08, 12-01, 12-02, 12-03, 12-04, 13-01, 13-02, 13-03, 14-01, 14-02, 14-03, 14-04, 15-01, 15-02, 15-03)
- v1 baseline: 30 plans in 15 days (2 plans/day avg)

---

## Accumulated Context

### Decisions

- v2.0 starts at Phase 9 (continuous numbering from v1)
- Staying on Supabase Free plan for now (dev/testing) -- Pro upgrade deferred
- Existing Supabase project (scgmpliwlfabnpygvbsy) used for development, not fresh project
- Migrations 04-08 applied via Supabase MCP (tracked in supabase_migrations table)
- pg_cron/pg_net sections skipped in migrations (requires Pro plan)
- 11 phases derived from psychological funnel stages + infrastructure/polish
- Phases 10-12 can partially overlap after Phase 9
- Phase 16 (Intelligence) can start independently after Phase 9
- Edge Functions deployed to existing dev project (not fresh production)
- **[10-01]** Internal JS key names (arsenal, vault, psych) kept unchanged; only customer-visible values rewritten to avoid breaking cross-file references
- **[10-01]** Fake Live Signals replaced with honest dealership info ticker (Option A from plan) rather than removed
- **[10-01]** FAQ Q&A and service descriptions embedded directly in translations.ts as arrays of objects
- **[10-01]** Phone number standardized to (832) 400-9760 across all translation keys
- **[10-02]** About page focuses on business story, values, location -- no fabricated team member names or biographies
- **[10-02]** Services rendered dynamically from t.services.list[] array with icon/link mapping
- **[10-02]** "Logistics Coordination" (out-of-state shipping) removed as unverified service
- **[10-02]** FAQ switched from 5 English-only categories to flat bilingual list from t.faq.questions[]
- **[10-02]** "What We Don't Do" section added to translations as t.services.dontDo for proper bilingual support
- **[10-03]** Footer expanded from 3-column to 4-column layout to add phone, hours, and social links
- **[10-03]** Wire transfer payment option replaced with debit card in PaymentOptions.tsx to match translations and $3K-$8K price range
- **[10-03]** Mobile menu jargon subtitles (ORIGIN POINT, ACQUIRE ASSETS, etc.) removed rather than replaced
- **[10-03]** Desktop/mobile "INTEL" nav label replaced with t.vinLookup.badge for bilingual support
- **[10-04]** Admin-only "Sovereign CFO" prompt in geminiService.ts kept unchanged (not customer-facing)
- **[10-04]** Phone numbers standardized to (832) 400-9760 across entire codebase including emailService.ts and pdfService.ts
- **[10-04]** Codebase-wide jargon sweep confirms zero SOVEREIGN framework terminology in customer-facing content
- **[10-05]** index.html title, meta description, keywords, OG tags, and schema.org all rewritten for honest pre-owned dealer positioning
- **[10-05]** Schema.org priceRange corrected to $3000-$8000 (was $5000-$50000)
- **[10-05]** Schema.org paymentAccepted updated: Wire Transfer replaced with Debit Card (consistent with 10-03)
- **[10-06]** VIN validation error codes kept as technical strings (not translated) -- universal technical codes
- **[10-06]** Bold text in translated paragraphs uses split-string pattern (introBefore/introHighlight/introAfter)
- **[10-06]** Payment methods in policies stored as {method, detail} object arrays matching services.list pattern
- **[11-01]** Console stripping uses esbuild.drop conditional on production mode, preserving dev console output
- **[11-01]** ErrorBoundary wraps main+Suspense block (not entire AppContent) so Navbar/Footer remain visible during page crashes
- **[11-01]** OfflineBanner renders above Navbar with z-[9999] to ensure visibility regardless of page content
- **[11-01]** Maintenance page is fully static HTML with inline CSS (no build dependencies) and stacks both languages
- **[11-01]** lazyWithErrorHandling fallback UI updated from bg-tj-green to bg-black to match site dark aesthetic
- **[11-02]** Inventory uses connectionError from Store to distinguish error vs empty (not heuristic)
- **[11-02]** Contact/Finance forms converted from setTimeout fire-and-forget to async/try-catch for proper error catching
- **[11-02]** CustomerLogin and VinLookup already had proper error handling -- verified, no changes needed
- **[11-02]** About page images are CSS backgrounds (not img tags) so lazy loading N/A; map iframe already had loading="lazy"
- **[11-03]** Responsive padding pattern: p-6 sm:p-10 or p-6 sm:p-12 for all form containers/cards with large fixed padding
- **[11-03]** Touch targets enforced via min-h-[44px] min-w-[44px] with flex centering (preserves visual design)
- **[11-03]** VIN input text-sm sm:text-lg with tighter tracking on mobile (prevents 17-char monospace overflow)
- **[11-03]** Home/Inventory mobile fixes already committed in 11-02 -- no duplicate changes made
- **[11-04]** Canonical button pattern: py-4 px-8 text-xs tracking-[0.3em] for all CTA buttons; hero variant keeps py-5 px-12
- **[11-04]** Canonical card/panel padding: p-6 md:p-8 replaces p-8/p-10/p-12/sm:p-10/sm:p-12
- **[11-04]** Section padding two-tier scale: py-16 md:py-24 (standard) and py-20 md:py-32 (hero/large)
- **[11-04]** tracking-[0.2em] on non-button text (labels, headings, selects, footer headings) preserved unchanged
- **[11-04]** 11-03 responsive pattern (p-6 sm:p-10/p-12) further standardized to p-6 md:p-8 for tighter consistency
- **[11-05]** text-gray-400 (#9CA3AF) chosen as minimum for all readable text on black (~5.5:1 ratio, passes WCAG AA)
- **[11-05]** Focus trap uses vanilla DOM querySelectorAll (no library) to keep bundle minimal
- **[11-05]** Modal containers use tabIndex={-1} with focus:outline-none (programmatic focus targets only)
- **[11-05]** Login.tsx keeps bare outline-none because parent group-focus-within provides visible focus via border change
- **[11-05]** Admin pages excluded from accessibility fixes (out of scope for Phase 11)
- **[11-07]** Viewport meta keeps viewport-fit=cover (iPhone notch) while removing only the zoom-blocking attributes (maximum-scale, user-scalable)
- **[11-07]** Splash screen reduced to 1200ms display + 500ms fade = 1.7s total (was 4.3s), well under 2.5s LCP target
- **[11-08]** Admin pages intentionally excluded from contrast fixes (out of scope per 11-05 decision)
- **[11-08]** placeholder-gray-500/600 left unchanged (placeholders are hints, not content per WCAG)
- **[12-01]** React 19 native title/meta hoisting used instead of react-helmet (no additional dependency)
- **[12-01]** Single og:image site-wide (GoldTripleJLogo.png) -- appropriate for small dealer site
- **[12-01]** Static index.html OG tags kept as fallback for non-JS crawlers; React 19 dynamic tags override for JS-capable crawlers
- **[12-01]** CustomerDashboard uses shared SEO variable for loading and main returns (early return pattern)
- **[12-02]** Static <title> and <meta name="description"> removed from index.html so React 19 per-page metadata (Plan 01) works without duplication
- **[12-02]** Schema @type uses array format ["AutoDealer", "LocalBusiness"] for explicit dual-type declaration
- **[12-02]** geo: namespace and Crawl-delay removed from sitemap.xml and robots.txt respectively (non-standard/unnecessary)
- **[12-02]** FAQ schema payment answer corrected from "wire transfer" to "debit card" (consistent with 10-03)
- **[12-03]** AI crawlers get explicit per-bot allow/disallow blocks (8 bots: GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Applebot-Extended, Amazonbot)
- **[12-03]** sameAs uses real Facebook and Instagram business profile URLs for triplejautoinvestment
- **[12-03]** hreflang en/es/x-default all point to same URL (bilingual toggle on single URL, not separate language URLs)
- **[12-03]** SEO component extracts canonical into local variable for DRY hreflang + canonical + og:url rendering
- **[12-04]** FAQ expanded to 23 questions per language (46 total) from original 8 -- covers financing, price, rental, trust clusters
- **[12-04]** Separate Spanish FAQPage schema with inLanguage="es" (10 high-value questions) rather than mixing languages
- **[12-04]** "Financing Assistance" renamed to "In-House Financing" / "Financiamiento Interno" in services list
- **[12-04]** New bhph{} block added to finance translations (processSteps, whyTitle, whyItems) for structured BHPH content
- **[12-04]** All FAQ answers and service descriptions use answer-capsule format: direct 1-2 sentence answer first, then details
- **[13-01]** Hero keys REPLACED not extended (title1/title2/subtitle/cta -> heading/subheading/tagline/scheduleVisit/scrollPrompt) -- Home.tsx intentionally broken until 13-02 fixes references
- **[13-01]** seHabla key value is "Se Habla Espanol" in BOTH en and es blocks -- cultural identity signal always displayed in Spanish
- **[13-01]** Browser language auto-detection saves to localStorage immediately so it only runs once per device
- **[13-02]** DecryptText component fully removed; replaced by standard framer-motion entrance animations
- **[13-02]** Mouse parallax and scroll parallax removed from hero (simplifies component, reduces re-renders)
- **[13-02]** SVG path data arrays (heroSvgPaths, heroSvgCircles) defined as module-level constants outside component
- **[13-02]** 11 total animated SVG elements (8 paths + 3 circles) -- under 12 limit for mobile performance
- **[13-02]** Hero CTAs use canonical button pattern: Schedule a Visit (primary, /contact) + Call Now (secondary, tel:)
- **[13-02]** Authority metric values (500+, 150+, 3+, 800+) are placeholder estimates marked with TODO(business-data)
- **[13-02]** CountUpNumber component defined outside Home component for reusability
- **[13-03]** Desktop Se Habla indicator: bordered pill badge (text-[9px], rounded-full, border-tj-gold/20) before language toggle
- **[13-03]** Mobile Se Habla indicator: plain text only (text-[8px], no border) to conserve horizontal space
- **[13-03]** SplashScreen removed entirely (not shortened) -- hero animation IS the new first impression for Phase 13's 3-second goal
- **[13-03]** SplashScreen.tsx component file preserved (not deleted) for potential future reference
- **[14-01]** Market estimate uses age+mileage heuristic (1.10x-1.20x multiplier) rather than external API -- close enough for $3K-$8K BHPH range
- **[14-01]** Monthly payment is simple principal/term division (no APR display) -- common BHPH practice
- **[14-01]** Slug format is year-make-model-shortid (6 chars of UUID) for uniqueness across duplicate year/make/model listings
- **[14-02]** AI generators return bilingual {en, es} JSON; Gemini response cleaned of markdown code fences before parse
- **[14-02]** Slug and market estimate auto-computed on save only if empty (not overwritten on every save)
- **[14-03]** VehicleVerifiedBadge lg size shows tooltip text inline below badge label (not hover tooltip) -- mobile-friendly
- **[14-03]** VehicleJsonLd uses Record<string, unknown> for flexible conditional field inclusion in JSON output
- **[14-03]** VehiclePriceBlock disclaimer uses string replacement for ${amount} template (matches translation key pattern)
- **[14-04]** Two-phase data fetch: check store first (fastest), Supabase fallback for direct URL navigation
- **[14-04]** VIN partially masked on detail page (last 6 chars visible) for listed vehicle privacy
- **[14-04]** "View Details" link added alongside (not replacing) Express Interest and Book Now buttons on cards
- **[14-04]** Verified badge on inventory cards placed in right column below SALE & RENTAL badge using flex-col layout

### Completed Work (Phase 9)

- **09-02 (partial):** Migrations 04-08 applied via MCP. Extensions: uuid-ossp + btree_gist enabled. 18 tables total, all with RLS. 11 triggers active. Admin user exists (jobawems@gmail.com, is_admin=true). Missing: phone OTP config (manual).
- **09-03 (partial):** 3 Edge Functions deployed via MCP (process-notification-queue, unsubscribe, check-plate-alerts). 4 storage buckets created (rental-agreements private, 3 public). 5 storage RLS policies. Security fixes: vehicles_backup RLS + registration_notifications policies. Missing: Edge Function secrets (manual), pg_cron/pg_net (Pro plan), app.settings (Pro plan).
- **09-04 (complete):** 22 deprecated files deleted (Docker, Dokploy, dev scripts, outdated docs). .env.production replaced with empty template. .gitignore updated. 5 credential pattern scans return zero matches.

### Completed Work (Phase 10) -- ALL COMPLETE

- **10-01 (complete):** Rewrote translations.ts (376 to 808 lines) with honest bilingual content. All SOVEREIGN jargon replaced. 9 new sections added (about, finance, policies, legal, notFound, vinLookup, paymentOptions, expanded faq+services). Rewrote Home.tsx: removed SubliminalPrime component, removed fake Live Signals ticker, replaced with honest dealership info. All homepage content now from translations.
- **10-02 (complete):** Rewrote About.tsx (329 to 313 lines), Services.tsx (186 to 85 lines), FAQ.tsx (206 to 100 lines). All three pages fully bilingual via t.about.*/t.services.*/t.faq.* keys. Added services.dontDo to translations.ts. Vehicle sales and rentals on Services page. Zero SOVEREIGN jargon on any page.
- **10-03 (complete):** Rewrote footer in App.tsx with real business info (phone, hours, social links, 4-column layout). Cleaned jargon from Finance.tsx, PaymentOptions.tsx, Legal.tsx, Policies.tsx, NotFound.tsx, VinLookup.tsx. All wired to bilingual translation system. Cleaned mobile menu jargon and "INTEL" nav label. Fixed Legal.tsx pre-existing TS error.
- **10-04 (complete):** Replaced FALLBACK_VEHICLES (Rolls-Royce $289K, Mercedes G63 $215K, Lamborghini $265K, Range Rover $85K) with realistic pre-owned vehicles (Honda Accord $6.5K, Toyota Camry $5.2K, Ford Fusion $4.8K, Chevy Equinox $3.9K). Renamed generateOpulentCaption to generateVehicleCaption with honest templates. Rewrote Gemini AI prompt for honest descriptions. Fixed SovereignCrest alt text. Standardized ALL phone numbers to (832) 400-9760 (5 files). Fixed jargon in VinLookup.tsx, Inventory.tsx, LuxuryHero.tsx. Codebase-wide sweep: zero customer-facing jargon.
- **10-05 (complete):** Rewrote all index.html meta tags (title, description, keywords), OG tags (og:title, og:description), and schema.org structured data (description, slogan, priceRange, paymentAccepted, hasOfferCatalog). Zero instances of "luxury", "Sovereign", "Kingdom", or "Identity Precedes Results" remain. All BLOCKER-severity gaps from 10-VERIFICATION.md resolved.
- **10-06 (complete):** Added 350+ bilingual translation keys for Finance, PaymentOptions, Policies, VinLookup. Wired all 4 pages to translation system (43+39+25+30 = 137 new t.* references). Replaced all VinLookup terminal/hacker jargon with professional language. Zero hardcoded English user-facing content remains on any page. All WARNING-severity gaps from 10-VERIFICATION.md resolved.

### Completed Work (Phase 11) -- ALL COMPLETE

- **11-01 (complete):** Console stripping via esbuild.drop (conditional on production mode). ErrorBoundary repositioned to wrap Routes/Suspense block. PageLoader component as branded Suspense fallback. useOnlineStatus hook + OfflineBanner + ConnectionErrorBanner. Static bilingual maintenance.html. 30 polish translation keys in en+es for loading/empty/error/accessibility.
- **11-02 (complete):** Inventory empty/error state separation (skeleton loading, error+retry, empty+CTA). Contact/Finance form error states with bilingual retry UI. CustomerDashboard bilingual empty state. About map iframe skeleton. Image lazy loading on vehicle cards + featured vehicles.
- **11-03 (complete):** Mobile responsiveness across 8 pages at 375px viewport. Footer social icons/legal links/quick links 44px touch targets. Mobile language toggle 44px target. VinLookup responsive grid and VIN input sizing. Finance form grid mobile stacking. About map iframe mobile height. Responsive padding on all form containers and cards (p-6 sm:p-10/p-12). CustomerLogin button touch targets.
- **11-04 (complete):** Visual consistency across all 13 customer-facing pages + footer. Canonical spacing scale (py-16 md:py-24 standard, py-20 md:py-32 hero). Card padding standardized to p-6 md:p-8. All CTA buttons use py-4 px-8 text-xs tracking-[0.3em]. Page horizontal padding standardized to px-4 md:px-6. Footer quick links upgraded to py-3. Zero tracking-[0.2em] on any button element.
- **11-05 (complete):** WCAG AA accessibility basics. Color contrast: text-gray-500/600 replaced with text-gray-400 across all customer-facing pages. Alt text: fixed generic "Detail" alt on Inventory modal, added year/make/model to featured vehicles. Skip-to-content link as first focusable element (bilingual). FAQ accordion: aria-expanded/aria-controls/role="region". Focus trapping on Inventory modal, ImageGallery, ImageLightbox. Mobile menu Escape key. Visible focus indicators (focus:ring-2 focus:ring-tj-gold/50) on all customer-facing inputs.
- **11-06 (complete):** Framer-motion animations on admin and customer pages. Google Sheets sync overhaul. Dashboard ledger modal z-index fix. AI emoji removal from Gemini service.
- **11-07 (complete):** BLOCKER gap closure. Viewport meta: removed maximum-scale=1.0 and user-scalable=no for WCAG 1.4.4 compliance (pinch-to-zoom enabled). SplashScreen: reduced from 4.3s to 1.7s total (1.2s splash + 0.5s fade) for LCP under 2.5s target. Both BLOCKER gaps from 11-VERIFICATION.md resolved.
- **11-08 (complete):** WARNING gap closure. Replaced all text-gray-500/600 with text-gray-400 on 9 customer-facing pages + 4 components (87+ instances). Zero WCAG AA contrast failures remain on any customer-facing page. Build passes.

### Completed Work (Phase 12) -- ALL COMPLETE

- **12-01 (complete):** BrowserRouter replaces HashRouter for clean URLs. HashRedirect component redirects legacy /#/path bookmarks. SEO.tsx component created with React 19 native meta hoisting (title, description, canonical, OG tags, noindex). 10 public pages with keyword-optimized titles/descriptions. Legal.tsx dynamic title from URL param. 4 private pages with noindex. Build passes clean.
- **12-02 (complete):** Fixed robots.txt (added Disallow: /customer/ and /track, removed redundant Allow directives and Crawl-delay). Updated sitemap.xml (all 10 lastmod dates to 2026-02-16, removed non-standard geo: namespace). Fixed index.html schema (@type to ["AutoDealer", "LocalBusiness"], FAQ payment answer "wire transfer" to "debit card"). Removed static <title> and <meta name="description"> for React 19 per-page compatibility.
- **12-03 (complete):** GEO/AEO gap closure. AI crawlers allowed in robots.txt (8 bots). AutoDealer schema enriched with knowsLanguage, additionalType AutoRental, sameAs (Facebook+Instagram). New FinancialProduct JSON-LD for BHPH financing. New Service JSON-LD for car rentals. BreadcrumbList expanded to all 10 public pages. hreflang en/es/x-default in index.html + per-page via SEO.tsx.
- **12-04 (complete):** GEO/AEO gap closure. FAQ expanded from 8 to 23 questions per language (46 total) targeting conversational AI queries. Added BHPH process content to finance (en+es). All service descriptions rewritten with answer-capsule format. FAQ schema expanded to 23 English + 10 Spanish questions. All answers include branded attribution, specific data ($3K-$8K, phone, address).

### Completed Work (Phase 13) -- ALL COMPLETE

- **13-01 (complete):** Added 24 bilingual translation key-value pairs: 6 hero keys (heading, subheading, tagline, scheduleVisit, callNow, scrollPrompt), 5 authority metric labels (familiesServed, fiveStarReviews, yearsInBusiness, vehiclesDelivered + title), 1 seHabla key. Enhanced LanguageContext with navigator.language auto-detection for Spanish-first visitors. Home.tsx intentionally broken (old hero key references) until 13-02.
- **13-02 (complete):** Replaced stock-photo hero with abstract animated SVG background (8 gold bezier paths + 3 floating particles). Wired all hero text to new translation keys. Added Se Habla badge in hero area. Schedule a Visit (primary, /contact) + Call Now (secondary, tel:) CTAs. Added authority metrics strip with animated count-up numbers (useSpring + useInView). Families Served metric with Users icon (LAND-03). 4 metrics with TODO(business-data) placeholders. Removed DecryptText, mouse parallax, scroll parallax. Home.tsx now fully functional.
- **13-03 (complete):** Added persistent "Se Habla Espanol" indicator to navbar (desktop: bordered pill badge, mobile: plain text). Removed SplashScreen wrapper from App component (was 1.7s delay). Content now renders immediately. SplashScreen.tsx file preserved.

### Completed Work (Phase 14) -- ALL COMPLETE

- **14-01 (complete):** Data foundation. DB migration (7 new columns on vehicles table + slug index) via Supabase MCP. Extended Vehicle interface with 7 Phase 14 fields. Store transform (load/add/update) for all 7 fields. vehicleSlug.ts utility (generate/parse). marketEstimateService.ts (estimate market value + monthly payment). 60+ bilingual translation keys for vehicle detail page (vehicleDetail block in en+es).
- **14-02 (complete):** AI content pipeline. Two new Gemini service functions (generateIdentityHeadline, generateVehicleStory) returning bilingual {en, es} JSON. Admin inventory form extended with headline/story textareas, generate buttons, verified checkbox, slug preview. Auto-compute slug and market estimate on save.
- **14-03 (complete):** Vehicle detail page components. VehicleVerifiedBadge (gold opulent badge with crest, sm/lg sizes). VehiclePriceBlock (4-part price transparency with market estimate anchoring). VehicleStorySection (bilingual story with honest condition disclosure). VehicleJsonLd (Schema.org/Car structured data for SEO).
- **14-04 (complete):** Vehicle detail page + route + inventory card updates. VehicleDetail.tsx (549 lines) with 9-section psychological flow: gallery, headline, badge, price block, story, specs, social proof, CTAs. Lazy-loaded via /vehicles/:slug route in App.tsx. Inventory cards augmented with verified badge, identity headline, and "View Details" link to detail page. Existing modal behavior unchanged.

### Completed Work (Phase 15) -- ALL COMPLETE

- **15-01 (complete):** CRM pipeline foundation. DB migration added 4 columns to leads table (vehicle_id, action_type, commitment_level, message) with indexes. Extended Lead interface with 4 optional fields. vehicleLeadService.ts (createVehicleLead, isValidPhone, formatPhoneDisplay). useSavedVehicles.ts localStorage hook with cross-tab sync. ~55 bilingual engagement translation keys.
- **15-02 (complete):** Level 0 + Level 1 components. SaveButton.tsx (heart toggle, 3 sizes, pop animation, localStorage). PaymentCalculator.tsx (expandable slider, down payment $0-2K, term 12/18/24/36 months, real-time estimate). PhoneCaptureForm.tsx (reusable phone capture for all Level 1 actions, formatting, validation, lead creation). Inventory.tsx integration: SaveButton on cards, saved filter toggle, saved empty state.
- **15-03 (complete):** Level 2 + Level 3 components and integration. ScheduleVisitForm.tsx (name + phone + preferred time, schedule_visit leads). AskQuestionForm.tsx (name + phone + free-text question, ask_question leads). ReserveVehicleSection.tsx (gold-accented, name + phone, reserve leads at commitment=3). VehicleDetail.tsx: SaveButton in hero, PaymentCalculator after price, full engagement spectrum Section 9 (Level 1/2/3 + direct call). Contact.tsx + Finance.tsx: added actionType/commitmentLevel/message to existing addLead calls.

### Remaining Phase 15 Work

None -- Phase 15 is fully complete (all 3 plans done).

### Remaining Phase 14 Work

None -- Phase 14 is fully complete (all 4 plans done).

### Remaining Phase 13 Work

None -- Phase 13 is fully complete (all 3 plans done).

### Remaining Phase 9 Work

- **09-01:** Long-lead items (Resend DNS, repo private, A2P 10DLC) -- 100% manual
- **09-02 (remaining):** Phone OTP config in Supabase Auth dashboard -- manual
- **09-03 (remaining):** Edge Function secrets (CLI/dashboard), pg_cron (Pro plan), app.settings (Pro plan)
- **09-05:** Vercel deployment + custom domain -- manual
- **09-06:** Vehicle data migration -- manual
- **09-07:** E2E smoke test -- manual

### Remaining Phase 10 Work

None -- Phase 10 is fully complete (all original plans + gap closure plans).

### Remaining Phase 11 Work

None -- Phase 11 is fully complete (all original plans + gap closure plans).

### Remaining Phase 12 Work

None -- Phase 12 is fully complete (all 4 plans done, including gap closure).

### Blockers/Concerns

- Supabase Free plan limits: no pg_cron, no pg_net, Edge Function limits
- Twilio account status unknown (trial vs paid) -- blocks real OTP
- A2P 10DLC registration may take days/weeks -- start early
- Resend domain verification needs 48+ hours DNS propagation
- Edge Function secrets not set yet -- functions will fail on invocation until configured

---

## Session Continuity

**Last session:** 2026-02-19
**Stopped at:** Phase 15 complete and verified (5/5 must-haves passed)
**Resume file:** None
**Resume:** Phase 15 (Engagement Spectrum) complete and verified. 30 v2.0 plans done. Next: Phase 16 (Behavioral Intelligence) needs discuss/plan, or remaining Phase 9 manual items.
