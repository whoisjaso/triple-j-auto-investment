---
phase: 14-expectancy-building
plan: 04
subsystem: vehicle-detail-page
tags: [react, page, route, inventory-cards, bilingual, seo, json-ld, design-system, supabase]
dependency-graph:
  requires: [14-01, 14-02, 14-03]
  provides: [vehicle-detail-page, vehicle-slug-route, inventory-card-phase14-updates]
  affects: [15, 16]
tech-stack:
  added: []
  patterns: [two-phase-data-fetch, store-first-supabase-fallback, lazy-route-registration, minimal-card-augmentation]
key-files:
  created:
    - triple-j-auto-investment-main/pages/VehicleDetail.tsx
  modified:
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/pages/Inventory.tsx
decisions:
  - id: 14-04-01
    decision: "Two-phase data fetch: check store first, Supabase fallback for direct URL nav"
    rationale: "Fastest load for in-app navigation (store already has vehicles); direct URL visits still work via Supabase query"
  - id: 14-04-02
    decision: "VIN partially masked on detail page (show last 6 chars only)"
    rationale: "Privacy for listed vehicles; full VIN available in modal/admin. Matches common automotive listing practice"
  - id: 14-04-03
    decision: "View Details button added alongside Express Interest and Book Now (not replacing)"
    rationale: "Existing modal continues to work for quick browsing; detail page link is additive, not disruptive to existing UX"
  - id: 14-04-04
    decision: "Verified badge placed in right column below SALE & RENTAL badge in card overlay"
    rationale: "Minimal layout change; uses flex-col with gap to stack right-side badges vertically without affecting left status badge"
metrics:
  duration: ~10 min
  completed: 2026-02-18
---

# Phase 14 Plan 04: Vehicle Detail Page and Inventory Card Updates Summary

**One-liner:** 549-line standalone vehicle detail page with 9-section psychological flow (gallery, headline, badge, price, story, specs, social proof, CTAs), lazy-loaded via /vehicles/:slug route, with inventory cards augmented by verified badges, identity headlines, and detail page links.

## What Was Done

### Task 1: Create VehicleDetail.tsx page
**Commit:** `d3d1902`

- **VehicleDetail.tsx** (549 lines): Complete standalone vehicle detail page with 9 sections in psychological flow order:
  1. **Back navigation + Share button** -- ArrowLeft link to /inventory, Share2 button copies URL to clipboard with "Copied!" feedback
  2. **Hero image gallery** -- aspect-[4/3] mobile / aspect-[16/9] desktop, carousel arrows on hover, thumbnail strip below (max 6 visible + overflow button), click opens ImageGallery fullscreen lightbox
  3. **Identity headline + vehicle info** -- bilingual headline from identityHeadline/identityHeadlineEs with year/make/model fallback, mileage, status badge
  4. **Triple J Verified Badge** -- VehicleVerifiedBadge (lg) for inspected vehicles
  5. **Price transparency block** -- VehiclePriceBlock with market estimate anchoring
  6. **Vehicle story** -- VehicleStorySection with bilingual story and condition disclosure
  7. **Vehicle specs grid** -- 2x3 responsive grid with icons (Calendar, Car, Gauge, Hash) showing year, make, model, mileage, masked VIN, status
  8. **Social proof micro-layer** -- "Listed X days ago" calculated from dateAdded with Clock icon
  9. **CTAs** -- Schedule a Visit (primary/gold), Call Us (secondary/border), Apply for Financing (tertiary/subtle)
- **Data fetching**: Two-phase approach -- checks in-memory store first (slug match or shortId prefix match), then Supabase direct query (by slug column, fallback to id prefix). Transform function matches the exact snake_case-to-camelCase mapping from vehicles.ts.
- **SEO**: Dynamic `<SEO>` component with vehicle-specific title/description/canonical, plus `<VehicleJsonLd>` for Schema.org/Car structured data
- **States**: Loading (centered spinner), not-found (Car icon + "Vehicle Not Found" + link back), and main page with all sections
- **Bilingual**: All text from t.vehicleDetail.* keys via useLanguage

### Task 2: Register /vehicles/:slug route in App.tsx
**Commit:** `9958be1`

- Added lazy import: `const VehicleDetail = lazyWithErrorHandling(() => import('./pages/VehicleDetail'), 'Vehicle Detail')`
- Added route `<Route path="/vehicles/:slug" element={<VehicleDetail />} />` after /inventory, before catch-all 404
- Uses existing lazyWithErrorHandling pattern for consistent error handling
- ScrollToTop, AnimatePresence, and Suspense all work automatically for the new route

### Task 3: Minimal inventory grid card updates
**Commit:** `cefe948`

- **Imports added**: Link from react-router-dom, VehicleVerifiedBadge, generateVehicleSlug
- **Change 1 -- Verified badge**: VehicleVerifiedBadge (sm) in card image overlay, placed in right column below SALE & RENTAL badge using flex-col layout. Badge wrapper has `pointer-events-auto` for hover interaction.
- **Change 2 -- Identity headline**: Bilingual headline above year/make line as text-[8px] uppercase text-tj-gold/70 truncated. Uses lang from useLanguage to select identityHeadline vs identityHeadlineEs. Only renders when headline exists.
- **Change 3 -- View Details link**: Link component navigates to `/vehicles/{slug}`, placed after Book Now button in CTA row. Uses `e.stopPropagation()` to prevent triggering card onClick (modal). Falls back to generateVehicleSlug if vehicle.slug is empty.
- **No changes** to modal behavior, card layout, filtering, sorting, or any other existing Inventory.tsx functionality.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- [x] `npx tsc --noEmit` passes with zero errors from VehicleDetail.tsx, App.tsx, and Inventory.tsx
- [x] `npx vite build` succeeds (VehicleDetail-RnYXXCSz.js chunk: 16.54 kB gzipped 5.03 kB)
- [x] VehicleDetail.tsx exists with 549 lines (200+ minimum)
- [x] /vehicles/:slug route registered in App.tsx
- [x] Inventory cards show verified badge, identity headline, and detail page link
- [x] Existing modal continues to work (card onClick unchanged)
- [x] Detail page renders all 9 sections in psychological flow order
- [x] Detail page has SEO meta tags (title, description, canonical) and JSON-LD
- [x] Detail page is bilingual via useLanguage (headline, specs, CTAs, listed text)
- [x] Detail page handles loading, not-found, and missing data gracefully
- [x] All buttons/links meet 44px touch target minimum (min-h-[44px])
- [x] Text contrast meets WCAG AA (text-gray-400 minimum on black backgrounds)

## Next Phase Readiness

Phase 14 (Expectancy Building) is now **complete** -- all 4 plans done:
- 14-01: Data foundation (types, slug utility, market estimate service, translations)
- 14-02: AI content pipeline (Gemini headline/story generation, admin form integration)
- 14-03: Vehicle detail components (badge, price block, story section, JSON-LD)
- 14-04: Vehicle detail page, route registration, inventory card updates

The vehicle detail page is ready for real vehicle data. When vehicles have slug, identityHeadline, vehicleStory, and isVerified populated (via the admin form from 14-02), the full expectancy-building experience activates automatically.
