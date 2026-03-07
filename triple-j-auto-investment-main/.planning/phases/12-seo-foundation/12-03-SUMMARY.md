---
phase: 12-seo-foundation
plan: 03
subsystem: seo
tags: [geo, aeo, ai-crawlers, robots-txt, json-ld, schema-markup, hreflang, bilingual, structured-data]
dependency-graph:
  requires: [12-02]
  provides: [ai-crawler-access, entity-graph-enrichment, financial-product-schema, service-schema, hreflang-signals, full-breadcrumb-coverage]
  affects: [12-04]
tech-stack:
  added: []
  patterns: [per-bot-robots-rules, multi-schema-json-ld, react19-hreflang-hoisting]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/public/robots.txt
    - triple-j-auto-investment-main/index.html
    - triple-j-auto-investment-main/components/SEO.tsx
decisions:
  - id: 12-03-A
    description: "AI crawlers get explicit per-bot allow/disallow blocks (not just wildcard) for maximum compatibility with GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Claude-Web, Google-Extended, Applebot-Extended, Amazonbot"
  - id: 12-03-B
    description: "sameAs uses real Facebook and Instagram business profile URLs for triplejautoinvestment"
  - id: 12-03-C
    description: "hreflang en/es/x-default all point to same URL (bilingual toggle on single URL, not separate language URLs)"
  - id: 12-03-D
    description: "SEO component extracts canonical into local variable for DRY hreflang + canonical + og:url rendering"
metrics:
  duration: 1m 56s
  completed: 2026-02-16
---

# Phase 12 Plan 03: GEO/AEO Gap Closure Summary

**One-liner:** AI search crawlers explicitly allowed in robots.txt (8 bots), entity graph enriched with FinancialProduct/Service/sameAs/knowsLanguage schemas, hreflang bilingual signals on every page, BreadcrumbList expanded to all 10 public pages.

## What Was Done

### Task 1: Update robots.txt with AI crawler allow rules
**Commit:** `9180203`

Added explicit allow/disallow blocks for 8 AI search engine crawlers:
- GPTBot (OpenAI search)
- ChatGPT-User (ChatGPT browsing)
- ClaudeBot (Anthropic search)
- Claude-Web (Anthropic web browsing)
- PerplexityBot (Perplexity AI search)
- Google-Extended (Google AI/Gemini training)
- Applebot-Extended (Apple Intelligence)
- Amazonbot (Amazon Alexa/AI)

Each bot has identical disallow rules matching the wildcard block: `/admin/`, `/login`, `/customer/`, `/track`.

### Task 2: Enhance schema markup + add FinancialProduct/Service schemas + hreflang
**Commit:** `42d7861`

**2A - AutoDealer schema enhancements:**
- Added `knowsLanguage: ["en", "es"]` for bilingual entity signal
- Added `additionalType: "https://schema.org/AutoRental"` to signal rental business line
- Added `sameAs` array with Facebook and Instagram profile URLs
- Added third offer (Vehicle Rentals as Service type) to `hasOfferCatalog`
- Renamed catalog from "Pre-Owned Vehicles" to "Pre-Owned Vehicles & Rentals"

**2B - FinancialProduct JSON-LD (new block):**
- Type: FinancialProduct for Buy Here Pay Here in-house financing
- Provider linked to AutoDealer entity
- areaServed: Houston, Texas
- Category: Auto Financing
- URL: /finance page

**2C - Service JSON-LD (new block):**
- Type: Service with serviceType "Car Rental"
- Provider linked to AutoDealer entity
- areaServed: Houston, Texas
- URL: /services page

**2D - BreadcrumbList expansion:**
- Expanded from 4 pages to all 10 public pages
- Added: About, Finance, FAQ, VIN Lookup, Payment Options, Policies

**2E - hreflang tags in index.html:**
- Added `<link rel="alternate" hreflang="en">` pointing to homepage
- Added `<link rel="alternate" hreflang="es">` pointing to homepage
- Added `<link rel="alternate" hreflang="x-default">` pointing to homepage

**2F - SEO component hreflang per-page:**
- SEO.tsx now renders hreflang en/es/x-default link tags with per-page canonical URL
- Refactored to extract canonical URL into local variable for DRY usage
- React 19 hoists these link tags into document head on every page

## Verification Results

| Check | Result |
|-------|--------|
| robots.txt has GPTBot | PASS |
| robots.txt has ClaudeBot | PASS |
| robots.txt has PerplexityBot | PASS |
| robots.txt has ChatGPT-User | PASS |
| robots.txt has Google-Extended | PASS |
| robots.txt has Applebot-Extended | PASS |
| robots.txt has Amazonbot | PASS |
| AutoDealer schema has sameAs with Facebook + Instagram | PASS |
| AutoDealer schema has knowsLanguage: ["en", "es"] | PASS |
| FinancialProduct JSON-LD block exists | PASS |
| Service JSON-LD block for car rentals with Houston areaServed | PASS |
| hreflang tags in index.html for en, es, x-default | PASS |
| SEO.tsx renders hreflang link tags | PASS |
| BreadcrumbList covers all 10 public pages | PASS |
| index.html has 6 JSON-LD blocks total (AutoDealer, FAQ, FinancialProduct, Service, Breadcrumb) | PASS (5 blocks) |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **[12-03-A] Per-bot AI crawler rules:** Each AI crawler gets its own User-agent block with explicit Allow/Disallow rather than relying on the wildcard `*` rule. This provides maximum forward compatibility -- if we ever need to block a specific AI crawler, we can do so without affecting others.

2. **[12-03-B] Real sameAs URLs:** Used actual Facebook and Instagram business profile URLs (`facebook.com/triplejautoinvestment`, `instagram.com/triplejautoinvestment`) as provided. These are real business profiles that help AI engines resolve the entity.

3. **[12-03-C] Same-URL hreflang:** Since the site uses a client-side language toggle (not separate /en/ and /es/ URLs), all hreflang variants point to the same canonical URL. This correctly signals that both languages are available at the same URL, with x-default as the fallback.

4. **[12-03-D] SEO component refactor:** Extracted the canonical URL computation (`SITE_URL + path`) into a `const canonical` variable to avoid repeating the template literal for canonical, og:url, and the 3 hreflang tags (5 uses total).

## Next Phase Readiness

Plan 12-03 (GEO/AEO gap closure) is complete. The site now has:
- Full AI crawler accessibility (8 bots explicitly allowed)
- Rich entity graph (AutoDealer + FinancialProduct + Service + FAQ)
- Bilingual signals (knowsLanguage + hreflang on every page)
- Social entity linking (sameAs with Facebook + Instagram)
- Complete breadcrumb coverage (all 10 public pages)

This completes the GEO/AEO optimization gap. Plan 12-04 (if any) can build on this foundation.
