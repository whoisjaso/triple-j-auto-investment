# Project Research Summary

**Project:** Triple J Auto Investment -- v1.1 Production Launch & Polish
**Domain:** Customer-facing dealership platform (React SPA + Supabase BaaS)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

Triple J Auto Investment is a Texas independent used car dealership ($4K-$5K vehicles with rental fleet) that has a functionally complete 35,294 LOC codebase built on React 19, Vite 6.2, Supabase, and Tailwind 3.4. The code has never been deployed to production. The v1.1 milestone is purely a deployment and polish effort -- no new features are being built. The core challenge is orchestrating two independent services (Supabase backend and Vercel frontend) with strict ordering dependencies, while simultaneously fixing a severe brand-content mismatch where the site presents itself as a luxury dealership ("ARCHITECT REALITY", "Sovereign Vetting", subliminal messaging) despite selling budget used cars.

The recommended deployment approach is a five-stage pipeline: (1) Create fresh Supabase project with extensions, (2) Apply 9 SQL migrations in strict order, (3) Configure auth/storage/Edge Functions/cron, (4) Deploy frontend to Vercel with correct environment variables, (5) DNS cutover with pre-provisioned SSL. This ordering is non-negotiable -- the frontend embeds Supabase credentials at build time, and Edge Functions reference tables that must exist before deployment. Using MCP for SQL operations and CLI for Edge Function deployment is the right hybrid approach for a single-developer project.

The two highest risks are: (1) **Committed credentials** -- real API keys, admin passwords, and Supabase keys are scattered across 30+ files in the repository including `.env.production`, documentation files, and Docker configs, all of which must be rotated before production launch; and (2) **Silent failures** -- RLS policies returning empty results instead of errors on a fresh project (the admin user must be promoted to `is_admin = true`), storage uploads failing without RLS policies, and cron jobs silently failing for weeks if `app.settings` are not configured. Every deployment stage needs an explicit verification gate.

## Key Findings

### Recommended Stack

No technology changes for this milestone. The existing application stack (React 19, Supabase JS 2.87, Vite 6.2, Tailwind 3.4) is frozen. Research focused exclusively on the deployment and operations tooling layer.

**Core deployment tools:**
- **Vercel (GitHub Integration)**: Frontend hosting -- auto-deploys on push, auto-detects Vite, handles SPA routing via existing `vercel.json` rewrites. No CLI or GitHub Actions needed for a single-developer project.
- **Supabase MCP + CLI Hybrid**: Backend setup -- MCP for project creation, migrations, and SQL operations (can be done within Claude Code sessions); CLI for Edge Function deployment and secrets (only tool that can deploy function code).
- **Supabase Dashboard**: Auth provider configuration -- phone auth with Twilio requires dashboard UI toggles that neither MCP nor CLI can handle.

**Critical plan/account requirements:**
- Supabase **Pro plan ($25/month)** is mandatory -- free tier pauses after 7 days of inactivity
- Twilio must be a **paid production account** -- trial accounts cannot send OTPs to unverified numbers
- A2P 10DLC registration may be needed for Twilio SMS to avoid carrier blocking

**What NOT to add:** Error tracking (Sentry), analytics (PostHog/GA4), testing frameworks (Vitest/Playwright), SSR (Next.js), Docker for Vercel, `supabase config.toml`, or `vite-plugin-vercel`. All are premature or irrelevant for a low-traffic dealership deployment milestone.

### Expected Features

**Must have (table stakes -- cannot launch without):**
- Real inventory data with actual vehicle photos (empty inventory = immediate bounce)
- Content and brand alignment -- remove fake luxury branding (SubliminalPrime, fake social proof ticker, aspirational copy) and replace with honest used car dealer content
- Working contact pathways -- the contact form currently uses a `setTimeout` mock, not real submission
- Mobile responsiveness verified (60%+ of car shopping is on mobile)
- Performance fix -- 3.5-second fixed splash screen blocks all content (53% abandon at >3s)
- Remove `user-scalable=no` from viewport meta (accessibility violation)
- Remove 100+ `console.log` statements (security/performance leak in production)
- End-to-end workflow verification (inquiry to AI call, registration tracker, customer login, admin workflows)
- Legal compliance pages with real content, Texas dealer license number visible

**Should have (professional polish):**
- Accurate meta tags and schema markup (currently says "Used Luxury Cars" with "$5000-$50000" range)
- SEO foundation (React Helmet, BrowserRouter migration from HashRouter, sitemap.xml, robots.txt)
- Real Google reviews as static social proof
- Loading/empty/error states for all async operations
- Retell AI prompt updates to cover rental inquiries and Spanish callers
- Accessibility basics (alt text, color contrast, keyboard nav)
- Consistent visual spacing, button styles, and footer content

**Defer (v2+):**
- Online payment processing (PCI complexity)
- Live chat widget
- Test drive scheduling system
- Blog/content section
- Comprehensive test suite
- API key migration from VITE_ to Edge Functions
- SSR migration (Next.js)
- Customer account profile editing

### Architecture Approach

The deployment follows a strict five-stage pipeline where each stage must complete and be verified before the next begins. The architecture is a standard Jamstack pattern: static SPA on Vercel CDN communicating with Supabase PostgreSQL via RLS-protected APIs, with three Deno Edge Functions for server-side operations (SMS/email notifications, plate/insurance alerts, unsubscribe handling) triggered by pg_cron schedules.

**Major components:**
1. **Supabase PostgreSQL** -- 9 migrations in strict order, requiring btree_gist, pg_cron, and pg_net extensions enabled before specific migrations. `app.settings` must be configured for cron to invoke Edge Functions.
2. **Supabase Auth** -- Email/password for admin, phone OTP via Twilio for customers. Site URL and redirect URLs must point to production domain before any auth flows work.
3. **Supabase Storage** -- 4 private buckets (rental-agreements, rental-photos, plate-photos, insurance-cards) with admin-only RLS policies. Not created by migrations -- must be done manually.
4. **3 Edge Functions** -- Deployed via CLI. `unsubscribe` requires `--no-verify-jwt`. All require 7 secrets set before first invocation. pg_cron invokes them via pg_net.
5. **Vercel SPA** -- `VITE_*` variables baked in at build time. Existing `vercel.json` is production-ready. Root directory must be set to `triple-j-auto-investment-main/`.
6. **DNS/Domain** -- Cutover from existing live site requires pre-provisioned SSL and lowered TTL.

### Critical Pitfalls

1. **Credentials committed to git (CRITICAL)** -- Real API keys, admin password (`adekunle12`), and Supabase keys are in 30+ files. Every committed key must be rotated. Create fresh Supabase project. Remove `VITE_ADMIN_PASSWORD` entirely from codebase.
2. **RLS silent empty results on fresh project (CRITICAL)** -- Admin user profile defaults to `is_admin = false`. Every admin query silently returns empty arrays. Must run `UPDATE profiles SET is_admin = true` after creating admin user. This exact bug occurred during v1.
3. **Migration ordering with extension dependencies (CRITICAL)** -- Migration 04 requires pg_cron + pg_net; migration 06 requires btree_gist. `app.settings` must be configured before migration 04 or its cron schedule silently fails forever.
4. **Storage buckets not created (HIGH)** -- No migration creates the 4 required buckets. Without explicit bucket creation + RLS policies, all file uploads silently fail.
5. **pg_cron jobs silently failing for weeks (HIGH)** -- Notification queue and plate alerts cron jobs fail silently if Edge Functions are not deployed, secrets are not set, or `app.settings` are misconfigured. Must verify `cron.job_run_details` within first day.

## Implications for Roadmap

Based on combined research, the v1.1 milestone should be structured as 5 phases with strict ordering for the first two phases and increasing parallelism for phases 3-5.

### Phase 1: Security Cleanup and Supabase Production Setup
**Rationale:** Cannot deploy anything until credentials are rotated and the production Supabase project exists. This is the foundation everything else depends on. Addresses the number-one critical pitfall (committed credentials) and provides the project URL/keys needed by all subsequent phases.
**Delivers:** Fresh Supabase project with all 9 migrations applied, extensions enabled, admin user bootstrapped, storage buckets created with RLS, Edge Functions deployed with secrets, cron schedules verified.
**Addresses:** TS-06 (end-to-end workflow prerequisites), all deployment infrastructure dependencies
**Avoids:** Pitfalls 1 (credentials), 2 (RLS empty results), 3 (migration ordering), 4 (storage buckets), 5 (auth config), 7 (Edge Function secrets), 12 (cron failures)

### Phase 2: Vercel Deployment and Domain Cutover
**Rationale:** Frontend deployment depends on having the Supabase project URL and anon key from Phase 1. Must be verified on the Vercel preview URL before touching DNS. Domain cutover is the highest-risk operational step and should happen in a dedicated focused session.
**Delivers:** Live production site at `triplejautoinvestment.com` with SSL, connected to production Supabase.
**Addresses:** TS-06 (end-to-end workflows verified on production infrastructure)
**Avoids:** Pitfalls 6 (DNS downtime), 9 (wrong env vars), 10 (CSP blocking), 15 (wrong root directory)

### Phase 3: Content and Brand Realignment
**Rationale:** The site cannot go public with luxury branding for a $4K used car lot. This is the single biggest credibility issue identified across all research. Must be completed before any customer sees the site. Content fixes are independent of infrastructure and can be done rapidly after deployment verification.
**Delivers:** Honest, professional dealership website with real business information, accurate meta tags, removed subliminal components, functional contact pathways, and legal compliance pages.
**Addresses:** TS-01 (real content), TS-04 (working contact paths), TS-05 (legal compliance), PD-01 (brand alignment)
**Avoids:** Customer confusion, loss of trust, potential FTC issues with misleading luxury claims

### Phase 4: UI/UX Polish and Performance
**Rationale:** With infrastructure live and content fixed, this phase addresses the technical polish that separates professional from amateur. Mobile responsiveness is critical (60%+ of traffic). Performance fixes (splash screen, image optimization, console.log cleanup) directly impact bounce rates.
**Delivers:** Production-quality UX -- fast loading, mobile-responsive, proper error handling, accessibility basics.
**Addresses:** TS-02 (mobile), TS-03 (performance), PD-02 (visual consistency), PD-04 (accessibility), PD-05 (error handling)
**Avoids:** High bounce rates from slow loading, broken mobile experience

### Phase 5: SEO Foundation and Retell AI Polish
**Rationale:** SEO and AI polish are important but not launch-blocking. They can be done after the site is live and customer-facing. BrowserRouter migration (from HashRouter) is the highest-complexity item and benefits from being isolated so routing bugs do not block the production launch.
**Delivers:** Search-engine-visible pages, accurate schema markup, sitemap, robots.txt, Retell AI handling rental inquiries and Spanish callers, failure fallbacks for AI calls.
**Addresses:** PD-03 (SEO), PD-06 (Retell AI polish)
**Avoids:** None critical -- this phase is improvement, not risk mitigation

### Phase Ordering Rationale

- **Phases 1-2 are strictly sequential:** Frontend cannot build without Supabase credentials; domain cannot cutover without verified frontend.
- **Phase 3 is sequenced after Phase 2** because content changes need to be verified on the production deployment, though code changes pushed to master auto-deploy via Vercel GitHub integration.
- **Phases 4 and 5 can partially overlap** since they affect different parts of the codebase (UI components vs. routing/SEO).
- **The credential rotation in Phase 1 is a hard prerequisite for everything.** No deployment should happen until every committed secret is rotated.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (BrowserRouter migration):** Complex interaction between React Router, Vercel rewrites, Supabase Auth redirect URLs (currently uses `/#/` prefix), and all existing internal links. Needs a focused investigation before execution.
- **Phase 1 (Twilio A2P 10DLC):** Carrier registration requirements for production SMS messaging may take days or weeks to approve. Needs timeline research and early initiation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Supabase setup):** Extremely well-documented in the ARCHITECTURE.md 28-step deployment checklist. Follow it step-by-step.
- **Phase 2 (Vercel deployment):** Standard Vite-on-Vercel pattern with existing production-ready `vercel.json`.
- **Phase 3 (Content realignment):** Business content decisions, not technical research.
- **Phase 4 (UI polish):** Standard web performance and accessibility patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new technology. Deployment tooling verified against official Vercel and Supabase docs. Existing `vercel.json` confirmed production-ready by direct review. |
| Features | HIGH | Codebase review directly confirmed all content and brand gaps. Industry research (TradePending 2025, Overfuel 2025) validates mobile-first and real-content priorities for dealerships. |
| Architecture | HIGH | Five-stage deployment pipeline derived from hard dependency analysis of migration SQL source code and Vite build-time variable behavior. |
| Pitfalls | HIGH | All critical pitfalls verified by direct codebase grep (30+ files with real credentials) and official Supabase troubleshooting docs. The RLS silent-failure pattern was already hit during v1 development. |

**Overall confidence:** HIGH

### Gaps to Address

- **Twilio account status:** Unknown whether the existing Twilio account is paid/production-ready or still a trial. Trial accounts block real customer OTPs. Must verify before Phase 1 execution.
- **A2P 10DLC registration:** May be required for production SMS. Registration can take days to weeks. Should initiate this process immediately in parallel with Phase 1.
- **Resend domain verification:** Unknown if `triplejautoinvestment.com` is already verified in Resend. DNS propagation takes up to 72 hours. Should start 48+ hours before launch.
- **EmailJS configuration:** Current service/template IDs in `.env` may be placeholders (`YOUR_SERVICE_ID`). Must verify in EmailJS dashboard before frontend deployment.
- **Domain registrar:** Unknown where `triplejautoinvestment.com` is registered. Affects DNS cutover approach (A record vs. nameserver transfer to Vercel).
- **Existing Supabase project:** `.env.production` references `scgmpliwlfabnpygvbsy.supabase.co`. Unclear if this contains production data needing migration or is purely dev/staging.
- **VITE_ADMIN_PASSWORD removal:** Removing this env var may break admin login if the codebase uses it for client-side auth checks. Needs code audit during Phase 1 before removal.
- **Retell AI Spanish support:** Unknown whether Retell supports Spanish-language voice agents. Houston is 45% Hispanic -- matters for customer experience in Phase 5.

## Sources

### Primary (HIGH confidence)
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- deployment requirements, security hardening
- [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) -- OTP configuration
- [Supabase Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) -- pg_cron + pg_net pattern
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS for private buckets
- [Supabase Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets) -- environment variable management
- [Supabase Edge Function Deployment](https://supabase.com/docs/guides/functions/deploy) -- CLI deployment commands
- [Supabase RLS Troubleshooting](https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx) -- silent empty results
- [Vercel Vite Framework Documentation](https://vercel.com/docs/frameworks/frontend/vite) -- build configuration
- [Vercel Zero-Downtime DNS Migration](https://vercel.com/guides/zero-downtime-migration-for-dns) -- SSL pre-provisioning
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode) -- build-time injection behavior
- [Supabase MCP Server](https://github.com/supabase-community/supabase-mcp) -- MCP capabilities for project management

### Secondary (MEDIUM confidence)
- [TradePending 2025 Automotive Consumer Survey](https://tradepending.com/blog/tradepending-2025-automotive-consumer-survey/) -- mobile shopping statistics (51%+ on mobile)
- [Overfuel 2025 Auto Groups Core Web Vitals](https://overfuel.com/resources/blog/north-americas-largest-auto-groups-still-failing-google-core-web-vitals-2025/) -- performance impact on dealership conversion
- [NextLeft Car Dealership SEO Guide 2025](https://nextleft.com/blog/car-dealership-seo-guide-2025-rank-1-locally/) -- local SEO priorities, HashRouter as SEO killer
- [Cars Commerce Online Reputation Best Practices](https://www.carscommerce.inc/car-dealer-online-reputation-best-practices/) -- trust signals and real reviews
- [Clarity Voice 2026 Auto Customer Communication Guide](https://clarityvoice.com/news/2026-auto-customer-communication-game-plan-modernizing-your-dealership-or-service-shop/) -- contact pathway importance
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction) -- SPF/DKIM setup

### Codebase Analysis (HIGH confidence)
- Direct grep confirming 30+ files with committed credentials (`.env.production`, Docker configs, documentation)
- Migration SQL source code analysis confirming extension dependencies and ordering constraints
- Edge Function source code analysis confirming 7 required secrets via `Deno.env.get()` calls
- Homepage/About/Services page review confirming brand-content mismatch with $4K-$5K inventory
- Contact.tsx review confirming `setTimeout` mock instead of real form submission

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
