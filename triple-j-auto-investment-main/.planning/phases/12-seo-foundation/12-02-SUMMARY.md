---
phase: 12-seo-foundation
plan: 02
subsystem: seo
tags: [robots.txt, sitemap, schema-markup, json-ld, seo, crawl-directives]
dependency-graph:
  requires: [10-05]
  provides: [correct-robots-txt, fresh-sitemap-dates, accurate-schema-markup, no-duplicate-title-meta]
  affects: [12-01]
tech-stack:
  added: []
  patterns: [json-ld-multi-type-schema, react19-per-page-meta-compatibility]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/public/robots.txt
    - triple-j-auto-investment-main/public/sitemap.xml
    - triple-j-auto-investment-main/index.html
decisions:
  - id: 12-02-A
    description: "Removed static <title> and <meta name='description'> from index.html to prevent duplication with React 19 per-page metadata hoisting"
  - id: 12-02-B
    description: "Schema @type uses array format ['AutoDealer', 'LocalBusiness'] for explicit dual-type declaration and maximum Google compatibility"
  - id: 12-02-C
    description: "Removed geo: namespace and geo:geo element from sitemap.xml as non-standard extension with no SEO value"
  - id: 12-02-D
    description: "Removed Crawl-delay directive (ignored by Googlebot, unnecessary for small Vercel-hosted site)"
metrics:
  duration: 3m 41s
  completed: 2026-02-16
---

# Phase 12 Plan 02: Static SEO Files Summary

**One-liner:** Fixed robots.txt crawl directives, refreshed sitemap.xml dates to 2026-02-16, corrected schema @type to AutoDealer+LocalBusiness, fixed FAQ payment inconsistency, removed duplicate static title/meta for React 19 compatibility.

## What Was Done

### Task 1: Fix robots.txt and sitemap.xml
**Commit:** `6bcdf95`

**robots.txt changes:**
- Added `Disallow: /customer/` (customer portal should not be indexed)
- Added `Disallow: /track` (private token-based tracking pages)
- Removed 9 redundant `Allow:` directives for individual pages (redundant when `Allow: /` is present)
- Removed `Crawl-delay: 1` (ignored by Googlebot, unnecessary for Vercel CDN)
- Preserved: `Allow: /`, `Disallow: /admin/`, `Disallow: /login`, `Sitemap:` directive

**sitemap.xml changes:**
- Updated all 10 `<lastmod>` dates from `2025-12-09` to `2026-02-16`
- Removed non-standard `xmlns:geo` namespace declaration
- Removed `<geo:geo>` element from homepage URL entry
- Preserved: all 10 URLs, `<changefreq>`, `<priority>` values, `xmlns:image` namespace

### Task 2: Fix index.html schema markup and remove static title/meta
**Commit:** `18c1ea8`

**Static meta removal:**
- Removed `<title>Triple J Auto Investment | Pre-Owned Cars Houston | Sales & Rentals</title>`
- Removed `<meta name="description" content="...">` (9-line span)
- Preserved: `<meta name="keywords">`, all OG tags, geo tags, favicon, fonts, importmap

**Schema markup fixes:**
- Changed `"@type": "AutoDealer"` to `"@type": ["AutoDealer", "LocalBusiness"]` for explicit dual-type compatibility with Google structured data processing
- Fixed FAQ payment answer from "wire transfer" + "personal checks" to "debit card" (consistent with Phase 10-03 PaymentOptions.tsx and Phase 10-05 schema paymentAccepted)
- Verified `paymentAccepted` field still reads "Cash, Cashier's Check, Debit Card, Financing" (no regression)

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` succeeds | PASS |
| `dist/robots.txt` has `Disallow: /customer/` | PASS |
| `dist/robots.txt` has `Disallow: /track` | PASS |
| `dist/sitemap.xml` has 10x `2026-02-16` dates | PASS (10 matches) |
| `dist/sitemap.xml` has 0x `2025-12-09` dates | PASS (0 stale) |
| `dist/index.html` has no `<title>` tag | PASS (0 matches) |
| `dist/index.html` has no `<meta name="description">` | PASS (0 matches) |
| `dist/index.html` has `<meta name="keywords">` | PASS |
| Schema `@type` includes `LocalBusiness` | PASS |
| FAQ payment says "debit card" | PASS |
| Zero "wire transfer" in dist/index.html | PASS |
| All 3 JSON-LD blocks valid JSON | PASS (Node.js JSON.parse) |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **[12-02-A] Static title/meta removal:** Removed to prevent duplication with React 19 per-page metadata from Plan 01. React 19 appends new meta tags rather than replacing existing static ones, so browsers would always use the static title, defeating per-page titles.

2. **[12-02-B] Array @type format:** Used `["AutoDealer", "LocalBusiness"]` array syntax rather than just adding a second `@type` key. This is the correct JSON-LD way to declare multiple types and ensures Google processes both.

3. **[12-02-C] Geo namespace removal:** Removed `xmlns:geo` and `<geo:geo>` from sitemap as it is a non-standard extension (not part of sitemaps.org spec) that adds no indexing benefit.

4. **[12-02-D] Crawl-delay removal:** Removed because Googlebot ignores it entirely, and the site is hosted on Vercel CDN which handles traffic efficiently.

## Next Phase Readiness

Plan 12-02 is complete. This plan is a dependency for Plan 12-01 (per-page meta tags), which needs the static title/meta removed so React 19 per-page metadata does not duplicate. Both plans can now be considered as a complete SEO foundation when 12-01 is executed.
