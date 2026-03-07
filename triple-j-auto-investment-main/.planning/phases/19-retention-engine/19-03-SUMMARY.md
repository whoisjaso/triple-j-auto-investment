---
phase: 19-retention-engine
plan: 03
subsystem: referral-and-upgrade-ui
tags: [react, referral, upgrade, landing-page, bilingual, mobile-first]
dependency_graph:
  requires:
    - ownerPortalService.ts (getCommunityReferralCount, getReferrerName, logReferralClick, getUpgradeMatches, markReviewCompleted - from 19-01)
    - marketEstimateService.ts (estimateMarketValue - from 14-01)
    - OwnerReferral interface (types.ts - from 19-01)
    - REFERRAL_TIERS constant (types.ts - from 19-01)
    - Registration interface (types.ts)
    - ownerPortal translation block (translations.ts - from 19-01)
    - OwnerPortal.tsx (pages/ - from 19-02)
    - App.tsx (/owner route - from 19-02)
  provides:
    - OwnerReferralSection.tsx (referral code, share/copy, tier progress, community counter)
    - OwnerUpgradeSection.tsx (12-month gate, trade-in estimate, inventory matches, CTA)
    - ReferralLanding.tsx (public warm-handoff page at /refer/:code)
    - /refer/:code route in App.tsx (fully public, no auth)
    - OwnerPortal.tsx (updated with all 6 sections + review button)
  affects:
    - 19-04 (Review Edge Function - portal now has review_completed trigger via "I Left a Review")
tech_stack:
  added: []
  patterns:
    - navigator.share + clipboard.writeText fallback for mobile/desktop share
    - /Mobi|Android/i.test(navigator.userAgent) for device detection
    - useEffect on mount for community referral count fetch
    - computeMonthsOwned() pure function for upgrade gate
    - ReferralVehicleCard as simplified variant of Inventory card (no filters/saves)
    - logReferralClick fires non-blocking (fire-and-forget in useEffect)
key_files:
  created:
    - triple-j-auto-investment-main/components/owner/OwnerReferralSection.tsx
    - triple-j-auto-investment-main/components/owner/OwnerUpgradeSection.tsx
    - triple-j-auto-investment-main/pages/ReferralLanding.tsx
  modified:
    - triple-j-auto-investment-main/App.tsx (ReferralLanding lazy import + /refer/:code route)
    - triple-j-auto-investment-main/pages/OwnerPortal.tsx (6 sections + review button)
decisions:
  - "Share button uses native share on mobile (/Mobi|Android/i) and clipboard fallback on desktop -- same pattern as plan spec"
  - "PURCHASE_PRICE_FALLBACK=5000 reused in OwnerUpgradeSection (same as OwnerValueTracker 19-02 decision) pending ownerPortalService JOIN"
  - "logReferralClick in ReferralLanding is non-blocking (fire-and-forget) so it never delays the UI render"
  - "ReferralLanding inventory grid is a simplified ReferralVehicleCard (no SaveButton, urgency badges, or filters) to keep the page fast and focused"
  - "Invalid referral code shows dealership intro instead of warm intro (graceful fallback per plan spec)"
  - "I Left a Review button disables after click (reviewDone state) to prevent duplicate DB calls"
  - "reviewThanks state shows tp.reviewThanks message inline (no page reload)"
metrics:
  duration: 5 minutes
  completed_date: "2026-03-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
---

# Phase 19 Plan 03: Referral + Upgrade UI Summary

**One-liner:** Family Circle referral program (code sharing, native share/clipboard, tier progress, community counter) plus Ready to Upgrade section (12-month gate, trade-in estimate, inventory matches) plus public /refer/:code landing page with referrer warm intro.

## What Was Built

### Task 1: OwnerReferralSection and OwnerUpgradeSection

**components/owner/OwnerReferralSection.tsx** (168 lines):
- Props: `{ referral: OwnerReferral | null }`
- Null guard: shows "Your referral code is being generated..." message if referral not yet created
- Referral code in `font-mono text-lg tracking-widest text-tj-gold` (e.g., "MAR-7K2P")
- Referral link in `text-[11px] text-gray-400 truncate`
- Share Link button: checks `/Mobi|Android/i.test(navigator.userAgent)` -- if mobile + navigator.share available, uses native share sheet; else copies referralLink to clipboard with 2.5s "Copied!" feedback
- Copy Code button: always copies referralCode to clipboard (secondary style, border-tj-gold/30)
- Personal referral count: text-xl text-white in black/20 card
- Tier progress: maps over `REFERRAL_TIERS` (from types.ts -- 1/$50, 3/$100, 5/$200) with filled/empty circle indicators (Check icon when reached)
- Community counter: fetches `getCommunityReferralCount()` in useEffect, shows "{count} {tp.communityCount}" with Users icon

**components/owner/OwnerUpgradeSection.tsx** (130 lines):
- Props: `{ registration: Registration }`
- `computeMonthsOwned()` pure function: months since purchaseDate
- 12-month gate: `monthsOwned < 12` shows `tp.upgradeNotYet` message only
- Trade-in estimate: `estimateMarketValue(PURCHASE_PRICE_FALLBACK, vehicleYear, mileageAtPurchase + monthsOwned * 1000)` displayed in font-serif text-2xl text-tj-gold
- Matching inventory: `getUpgradeMatches(purchasePrice)` in useEffect, renders up to 3 compact vehicle rows (year/make/model, price, View link to `/vehicles/:slug`)
- "Check back soon" fallback when no matches
- CTA: Link to /contact with bg-tj-gold full-width-on-mobile button

### Task 2: ReferralLanding page + route wiring + OwnerPortal integration

**pages/ReferralLanding.tsx** (175 lines):
- `useParams<{ code: string }>()` extracts referral code from URL
- On mount: `logReferralClick(code, getDeviceType())` non-blocking, `getReferrerName(code)` sets referrerName state
- Loading state: animate-pulse skeleton with referralLandingIntro label and empty placeholder divs -- inventory renders immediately below (not blocked)
- Warm intro (referrerName found): motion.div entrance animation, gold label + "{referrerName} {tp.referralLandingHeading}" serif heading + subtext
- Fallback intro (invalid code): plain heading "Trusted Pre-Owned Vehicles for Houston Families" + same subtext
- `ReferralVehicleCard` subcomponent: aspect-ratio image, year/make/model in gold, price, "View Details" Link to `/vehicles/:slug`
- Inventory grid: 1 col mobile, 2 col md, 3 col lg -- filters for `VehicleStatus.AVAILABLE` only
- SEO: dynamic title with referrerName, noindex=false (referral links indexed for link equity)

**App.tsx** (modified):
- `const ReferralLanding = lazyWithErrorHandling(() => import('./pages/ReferralLanding'), 'Referral')` added to Customer Portal Lazy Loaded section
- `<Route path="/refer/:code" element={<ReferralLanding />} />` placed after `/owner` route (fully public, no ProtectedRoute, no customer auth guard)

**pages/OwnerPortal.tsx** (modified):
- Imports `markReviewCompleted` added to existing ownerPortalService import
- Imports `OwnerReferralSection` and `OwnerUpgradeSection`
- `reviewDone` and `reviewThanks` state for review button
- Full stacked layout now renders all 6 sections:
  1. OwnerVehicleCard
  2. OwnerDocuments
  3. OwnerServiceReminders
  4. OwnerValueTracker
  5. OwnerReferralSection (referral={referral})
  6. OwnerUpgradeSection (registration={registration})
- "I Left a Review" button section: calls `markReviewCompleted(registration.id)` on click, sets `reviewThanks=true` to show `tp.reviewThanks`, button disabled after click

## Verification Results

1. `npx tsc --noEmit`: Zero new type errors (all errors are pre-existing: SEO.tsx hreflang, framer-motion Variants, RegistrationTracker types, Deno types for Edge Functions)
2. `npx vite build`: Succeeded -- OwnerPortal chunk 349.22 kB (104.96 kB gzipped), all new code tree-shaken
3. App.tsx has `/refer/:code` route at line 478 (public, no auth wrapper)
4. ReferralLanding.tsx imports getReferrerName + logReferralClick at line 18
5. OwnerReferralSection has navigator.share check + clipboard fallback for both share and copy paths
6. OwnerUpgradeSection gates on monthsOwned < 12 with upgradeNotYet message
7. OwnerPortal.tsx renders all 6 sections including referral + upgrade
8. "I Left a Review" button at OwnerPortal.tsx lines 172-193
9. All text uses `t.ownerPortal.*` bilingual keys via `tp.*` shorthand

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | 06da7c6 | feat(19-03): create OwnerReferralSection and OwnerUpgradeSection components |
| 2 | 3951a9b | feat(19-03): add ReferralLanding page, wire /refer/:code route, integrate sections into OwnerPortal |

## Deviations from Plan

None -- plan executed exactly as written.

Minor implementation notes within spec:
- `getDeviceType()` defined inline in ReferralLanding.tsx (not imported from attributionService) per plan spec: "check navigator.userAgent for /Mobi|Android/i -> 'mobile', else 'desktop'". attributionService version is identical but importing it cross-service would add a dependency without benefit.
- ReferralVehicleCard renders "View in Inventory" fallback (instead of no link) when vehicle has no slug, ensuring always-actionable CTAs.

## Self-Check: PASSED

Files created:
- FOUND: triple-j-auto-investment-main/components/owner/OwnerReferralSection.tsx
- FOUND: triple-j-auto-investment-main/components/owner/OwnerUpgradeSection.tsx
- FOUND: triple-j-auto-investment-main/pages/ReferralLanding.tsx

Files modified:
- FOUND: triple-j-auto-investment-main/App.tsx (/refer/:code route at line 478)
- FOUND: triple-j-auto-investment-main/pages/OwnerPortal.tsx (OwnerReferralSection at line 167, OwnerUpgradeSection at line 170)

Commits verified:
- FOUND: 06da7c6 (Task 1 - OwnerReferralSection + OwnerUpgradeSection)
- FOUND: 3951a9b (Task 2 - ReferralLanding + App.tsx route + OwnerPortal wiring)
