# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-17
**Session:** Phase 13 IN PROGRESS (13-01 complete, 13-02 and 13-03 remaining)

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core Value:** Every page, every interaction engineered to move a stranger through a psychological funnel from skeptic to buyer to evangelist -- built on the SOVEREIGN framework (internal only; customer-facing content uses honest automotive dealership language).
**Current focus:** Phase 13 - Focus Capture (IN PROGRESS -- 13-01 complete, 13-02 and 13-03 remaining)

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
**Phase:** 13 of 19 (Focus Capture)
**Plan:** 1 of 3 completed (13-01)
**Status:** In progress
**Last activity:** 2026-02-17 -- Completed 13-01-PLAN.md (bilingual translation keys + browser language auto-detection)

Progress: [█████████████████████] 100% (21/21 plans completed across v2.0 so far)

## Performance Metrics

**Velocity:**
- Total plans completed: 21 (v2.0: 09-03, 09-04, 10-01, 10-02, 10-03, 10-04, 10-05, 10-06, 11-01, 11-02, 11-03, 11-04, 11-05, 11-06, 11-07, 11-08, 12-01, 12-02, 12-03, 12-04, 13-01)
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

### Completed Work (Phase 13) -- IN PROGRESS

- **13-01 (complete):** Added 24 bilingual translation key-value pairs: 6 hero keys (heading, subheading, tagline, scheduleVisit, callNow, scrollPrompt), 5 authority metric labels (familiesServed, fiveStarReviews, yearsInBusiness, vehiclesDelivered + title), 1 seHabla key. Enhanced LanguageContext with navigator.language auto-detection for Spanish-first visitors. Home.tsx intentionally broken (old hero key references) until 13-02.

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

**Last session:** 2026-02-17
**Stopped at:** Completed 13-01-PLAN.md -- Phase 13 plan 1 of 3
**Resume file:** None
**Resume:** Completed 13-01: Added 24 bilingual translation keys for hero, authority metrics, and Se Habla badge. Enhanced LanguageContext with navigator.language auto-detection for Spanish-first visitors. Home.tsx intentionally broken (old hero key references) until 13-02 rebuilds the hero section. Next: 13-02 (hero rebuild) then 13-03 (authority metrics component).
