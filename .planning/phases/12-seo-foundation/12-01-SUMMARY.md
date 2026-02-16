---
phase: 12-seo-foundation
plan: 01
subsystem: routing-seo
tags: [seo, browserrouter, meta-tags, og-tags, canonical, noindex, react-19]

dependency-graph:
  requires: [10-05]
  provides: [clean-urls, per-page-seo, canonical-urls, hash-redirect, seo-component]
  affects: [12-02, 14-vehicle-detail-pages]

tech-stack:
  added: []
  patterns: [react-19-native-meta-hoisting, browserrouter-spa, hash-redirect-pattern, reusable-seo-component]

key-files:
  created:
    - triple-j-auto-investment-main/components/SEO.tsx
  modified:
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/pages/Home.tsx
    - triple-j-auto-investment-main/pages/About.tsx
    - triple-j-auto-investment-main/pages/Inventory.tsx
    - triple-j-auto-investment-main/pages/Contact.tsx
    - triple-j-auto-investment-main/pages/Services.tsx
    - triple-j-auto-investment-main/pages/Finance.tsx
    - triple-j-auto-investment-main/pages/FAQ.tsx
    - triple-j-auto-investment-main/pages/VinLookup.tsx
    - triple-j-auto-investment-main/pages/Policies.tsx
    - triple-j-auto-investment-main/pages/PaymentOptions.tsx
    - triple-j-auto-investment-main/pages/Legal.tsx
    - triple-j-auto-investment-main/pages/NotFound.tsx
    - triple-j-auto-investment-main/pages/Login.tsx
    - triple-j-auto-investment-main/pages/CustomerLogin.tsx
    - triple-j-auto-investment-main/pages/CustomerDashboard.tsx

decisions:
  - id: 12-01-01
    summary: "React 19 native title/meta hoisting used instead of react-helmet"
    rationale: "React 19 supports <title> and <meta> in component JSX with automatic hoisting to <head>. No additional dependency needed."
  - id: 12-01-02
    summary: "Single og:image site-wide (GoldTripleJLogo.png)"
    rationale: "Small dealer site -- one brand logo is appropriate for OG image across all pages"
  - id: 12-01-03
    summary: "Static index.html OG tags kept as fallback for non-JS crawlers"
    rationale: "React 19 dynamic tags override static for JS-capable crawlers; static tags serve as fallback baseline"
  - id: 12-01-04
    summary: "CustomerDashboard uses shared SEO variable for loading and main returns"
    rationale: "Component has early return for loading state; SEO component must appear in both code paths"

metrics:
  duration: ~10 minutes
  completed: 2026-02-16
---

# Phase 12 Plan 01: BrowserRouter Migration + Per-Page SEO Metadata Summary

BrowserRouter replaces HashRouter for clean SEO-friendly URLs. Reusable SEO component created with React 19 native meta hoisting. All 15 customer-facing pages receive unique keyword-optimized titles, descriptions, canonical URLs, and OG tags. Four private pages get noindex protection. Legacy hash URLs silently redirect to clean paths.

## What Was Done

### Task 1: BrowserRouter Migration + HashRedirect + SEO Component
**Commit:** 7dc6df1

1. **BrowserRouter migration** -- Changed single import in App.tsx from `HashRouter as Router` to `BrowserRouter as Router`. The `as Router` alias means all downstream JSX stays unchanged.

2. **HashRedirect component** -- Added component that checks `window.location.hash` on mount and redirects `/#/path` to `/path` using `navigate(path, { replace: true })`. Rendered right after `<ScrollToTop />` inside the Router.

3. **SEO.tsx component** -- Created reusable component that accepts `title`, `description`, `path`, optional `ogTitle`/`ogDescription`, and `noindex` boolean. Uses React 19 native `<title>` and `<meta>` (auto-hoisted to `<head>`) -- no react-helmet dependency. Includes canonical URL, OG tags, and og:image pointing to GoldTripleJLogo.png.

### Task 2: Per-Page SEO Metadata (15 pages)
**Commit:** 11f9f63

**10 public pages with keyword-optimized metadata:**

| Page | Path | Title |
|------|------|-------|
| Home | `/` | Triple J Auto Investment \| Used Cars Houston \| Sales & Rentals |
| Inventory | `/inventory` | Used Cars for Sale in Houston \| Triple J Auto Investment |
| About | `/about` | About Triple J Auto Investment \| Houston Pre-Owned Dealer |
| Contact | `/contact` | Contact Triple J Auto Investment \| Houston Car Dealer \| (832) 400-9760 |
| Services | `/services` | Auto Services & Car Rentals Houston \| Triple J Auto Investment |
| Finance | `/finance` | Car Financing Houston \| Buy Here Pay Here \| Triple J Auto Investment |
| FAQ | `/faq` | FAQ \| Triple J Auto Investment Houston \| Common Questions |
| VinLookup | `/vin` | Free VIN Check Houston \| Triple J Auto Investment |
| Policies | `/policies` | Dealer Policies \| Triple J Auto Investment Houston |
| PaymentOptions | `/payment-options` | Payment Options \| Triple J Auto Investment Houston |

**1 dynamic page:**

| Page | Path | Title Pattern |
|------|------|---------------|
| Legal | `/legal/:section` | {Section Title} \| Triple J Auto Investment |

**4 private pages with noindex:**

| Page | Path | noindex |
|------|------|---------|
| NotFound | `/404` | yes |
| Login | `/login` | yes |
| CustomerLogin | `/customer/login` | yes |
| CustomerDashboard | `/customer/dashboard` | yes |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **React 19 native meta hoisting** -- No react-helmet or react-helmet-async needed. React 19 auto-hoists `<title>` and `<meta>` from component JSX to `<head>`.
2. **Single og:image site-wide** -- `GoldTripleJLogo.png` used for all pages. Appropriate for a small dealer site.
3. **Static index.html OG tags preserved** -- React 19 dynamic tags override them for JS-capable crawlers; static tags serve as baseline fallback for non-JS crawlers.
4. **CustomerDashboard shared SEO variable** -- Component has an early return for loading state, so SEO component is defined as a variable and rendered in both code paths.

## Verification Results

- Build passes with zero TypeScript errors
- BrowserRouter confirmed in built output (HashRouter absent)
- 15 pages with SEO import confirmed
- 4 private pages with noindex confirmed
- All 10 public pages have unique titles and descriptions
- Legal.tsx dynamically builds title from URL section param
- Canonical URLs point to https://triplejautoinvestment.com/...
- Vercel config already has catch-all rewrite (`/(.*) -> /index.html`) for BrowserRouter SPA support

## Next Phase Readiness

- Clean URLs are active -- all subsequent pages (Phase 14 vehicle detail pages) will inherit clean URL patterns
- SEO component is reusable -- Phase 14 vehicle pages can import and use it directly
- Canonical URLs prevent duplicate content between hash and clean URLs during transition
