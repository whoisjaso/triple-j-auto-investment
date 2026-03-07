---
phase: 19-retention-engine
plan: 02
subsystem: owner-portal-ui
tags: [react, recharts, owner-portal, customer-experience, bilingual]
dependency_graph:
  requires:
    - ownerPortalService.ts (getOwnerData, getReferralData - from 19-01)
    - marketEstimateService.ts (estimateMarketValue - from 14-01)
    - Registration interface (types.ts)
    - OwnerReferral interface (types.ts - from 19-01)
    - SERVICE_REMINDER_INTERVALS constant (types.ts - from 19-01)
    - ownerPortal translation block (translations.ts - from 19-01)
    - supabase/config.ts (auth guard session check)
  provides:
    - /owner route (lazy-loaded, customer auth guard)
    - OwnerPortal.tsx page (auth guard + data fetch + stacked layout)
    - OwnerVehicleCard.tsx (vehicle placeholder, masked VIN, days owned)
    - OwnerDocuments.tsx (Bill of Sale + As-Is Disclosure entries)
    - OwnerServiceReminders.tsx (3/6/12 month intervals + expandable checklist)
    - OwnerValueTracker.tsx (Recharts mini line chart, currentValue/costPerDay stats)
  affects:
    - 19-03 (Referral Landing - uses same /owner page, referral section to be added)
    - App.tsx (/owner route added to customer portal section)
tech_stack:
  added:
    - recharts (LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip) - already in package.json
  patterns:
    - Auth guard pattern (same as CustomerDashboard.tsx Phase 04-04)
    - supabase.auth.getSession() + onAuthStateChange subscription
    - Promise.all() parallel fetch for ownerData + referralData
    - lazyWithErrorHandling() pattern (same as all other lazy pages in App.tsx)
    - Fixed height={120} on ResponsiveContainer (prevents mobile render bug per research)
    - Custom Tooltip component for Recharts dark theme
    - computeDaysOwned / buildValueHistory pure functions outside component
key_files:
  created:
    - triple-j-auto-investment-main/pages/OwnerPortal.tsx
    - triple-j-auto-investment-main/components/owner/OwnerVehicleCard.tsx
    - triple-j-auto-investment-main/components/owner/OwnerDocuments.tsx
    - triple-j-auto-investment-main/components/owner/OwnerServiceReminders.tsx
    - triple-j-auto-investment-main/components/owner/OwnerValueTracker.tsx
  modified:
    - triple-j-auto-investment-main/App.tsx (lazy import + /owner route)
decisions:
  - "purchasePrice not on Registration interface -- OwnerValueTracker uses BHPH midpoint fallback ($5,000) with TODO for Plan 03 to extend ownerPortalService to JOIN vehicle price"
  - "OwnerDocuments always shows As-Is Disclosure entry even without billOfSaleId (BHPH sales are always as-is)"
  - "Bill of Sale View link uses alert() placeholder -- Supabase storage URL pattern to be wired when documents are stored in buckets"
  - "Value chart conditionally renders only when daysOwned >= 45 (prevents meaningless 1-point chart)"
  - "OwnerValueTracker uses mileageAtPurchase from registration.mileage as base (Phase 19-01 snapshot_mileage_at_purchase trigger)"
  - "SERVICE_REMINDER_INTERVALS imported from types.ts (not hardcoded) for consistency with data layer"
  - "getServiceStatus uses 14-day look-ahead for 'due' state (within 2 weeks = due, past 30 days = overdue, else upcoming)"
metrics:
  duration: 12 minutes
  completed_date: "2026-03-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
---

# Phase 19 Plan 02: Owner Portal UI Summary

**One-liner:** Owner Portal page with auth guard, vehicle card, document links, 3/6/12-month service reminders, and Recharts mini line chart showing vehicle value trajectory at fixed 120px height.

## What Was Built

### Task 1: OwnerPortal page + 4 dashboard components

**pages/OwnerPortal.tsx** (113 lines):
- Auth guard: `supabase.auth.getSession()` on mount, redirects to `/customer/login` if no session
- `supabase.auth.onAuthStateChange` subscription handles session expiry during session
- `Promise.all([getOwnerData(phone), getReferralData(phone)])` parallel fetch
- Three render states: loading (spinner + logo), empty (no completed purchase card + link to /customer/dashboard), full dashboard
- Header: "Owner Portal" gold label + "Welcome back, [firstName]" serif heading
- Single-column stacked layout (max-w-2xl mx-auto), same background as CustomerDashboard
- SEO component with noindex: true
- Plan 03 stubs: referral + upgrade sections noted as upcoming

**components/owner/OwnerVehicleCard.tsx** (79 lines):
- Props: `{ registration: Registration }`
- Gradient placeholder card (bg-gradient-to-br from-tj-green/60 to-black/80) with Car icon + year/make/model text overlay
- Details grid (2 columns): VIN (masked -- shows last 6 chars), purchase date (formatted), days owned (computed), plate number (if available)
- All labels from `t.ownerPortal.*` bilingual keys

**components/owner/OwnerDocuments.tsx** (55 lines):
- Props: `{ registration: Registration }`
- Bill of Sale row (if `billOfSaleId` present): FileText icon + "View" link with 44px touch target
- As-Is Disclosure row (always shown for BHPH): "Available at dealership" text
- Empty state with `t.ownerPortal.noDocuments`

**components/owner/OwnerServiceReminders.tsx** (113 lines):
- Props: `{ registration: Registration }`
- `SERVICE_REMINDER_INTERVALS` (from types.ts) drives 3 intervals: +3, +6, +12 months from purchaseDate
- Status logic: >14 days away = "Upcoming" (gray), within 14 days = "Due" (amber), past 30 days = "Overdue" (green -- shown as potentially completed)
- Icons: Calendar (upcoming), Clock (due), CheckCircle (overdue)
- Expandable checklist button (min-h-[44px]) reveals 6 maintenance items from `t.ownerPortal.maintenanceChecklist`
- Each checklist item has py-3 spacing with a checkbox-style border element

**components/owner/OwnerValueTracker.tsx** (190 lines):
- Props: `{ registration: Registration }`
- `buildValueHistory()`: generates monthly data points (month label e.g. "Mar '26") from purchaseDate to now, estimates mileage at ~1000 miles/month from `mileageAtPurchase` base (80k default)
- `computeValueMetrics()`: currentValue from estimateMarketValue, costPerDay = purchasePrice / max(1, daysOwned)
- Stats row: current estimated value (white serif large), cost per day (gold serif large), purchase price (gray)
- Recharts LineChart: `ResponsiveContainer width="100%" height={120}` (CRITICAL: fixed px height), gold stroke #d4af37, dot={false}, custom dark tooltip
- Chart conditional: only renders if daysOwned >= 45 (2+ months of data); otherwise shows "Value chart will appear after 2 months" message
- `PURCHASE_PRICE_FALLBACK = 5000` -- noted as Plan 03 extension point

### Task 2: /owner route in App.tsx

- `const OwnerPortal = lazyWithErrorHandling(() => import('./pages/OwnerPortal'), 'Owner Portal')` added to Customer Portal Lazy Loaded section
- `<Route path="/owner" element={<OwnerPortal />} />` added after `/customer/dashboard` route
- NOT wrapped in ProtectedRoute (has its own auth guard for customer phone OTP auth)

## Verification Results

1. `npx tsc --noEmit`: Zero new type errors (all errors are pre-existing: SEO.tsx hreflang, framer-motion Variants, RegistrationTracker types, VinLookup)
2. `npx vite build`: Succeeded -- Recharts tree-shaking works, OwnerPortal bundle is 343.59 kB (104 kB gzipped)
3. `/owner` route confirmed at App.tsx line 476
4. Auth guard at OwnerPortal.tsx lines 39 + 75 (mount check + onAuthStateChange)
5. All 4 component files exist in `components/owner/`
6. `height={120}` confirmed at OwnerValueTracker.tsx line 214
7. All text uses `t.ownerPortal.*` bilingual keys (tp.* shorthand) -- 20 total `tp.*` references across 5 files

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | 60b462d | feat(19-02): create OwnerPortal page and owner dashboard components |
| 2 | aed8f1b | feat(19-02): wire /owner route in App.tsx with lazy-loaded OwnerPortal |

## Deviations from Plan

**1. OwnerValueTracker created in Task 1 commit (not Task 2)**

The plan listed OwnerValueTracker under Task 2, but OwnerPortal.tsx (Task 1) imports it. To get clean TypeScript compilation from Task 1 onward, OwnerValueTracker was created alongside the other components and included in the Task 1 commit. This is a staging-order deviation only -- the implementation is complete and matches the plan spec exactly.

**2. purchasePrice not available on Registration interface**

The plan specified `buildValueHistory(purchasePrice, purchaseDate, vehicleYear, mileageAtPurchase)` but the Registration type has no `purchasePrice` or `salePrice` field (Phase 04 registration tracks documents and stages, not financial data). Used `PURCHASE_PRICE_FALLBACK = 5000` (BHPH midpoint) with a code comment noting Plan 03 should extend `ownerPortalService.getOwnerData()` to JOIN vehicles table and surface `sold_price` or `price`. This keeps the chart functional with realistic estimates.

## Self-Check: PASSED

Files created:
- FOUND: triple-j-auto-investment-main/pages/OwnerPortal.tsx
- FOUND: triple-j-auto-investment-main/components/owner/OwnerVehicleCard.tsx
- FOUND: triple-j-auto-investment-main/components/owner/OwnerDocuments.tsx
- FOUND: triple-j-auto-investment-main/components/owner/OwnerServiceReminders.tsx
- FOUND: triple-j-auto-investment-main/components/owner/OwnerValueTracker.tsx

Files modified:
- FOUND: triple-j-auto-investment-main/App.tsx (/owner route at line 476)

Commits verified:
- FOUND: 60b462d (Task 1 - OwnerPortal page + 4 components)
- FOUND: aed8f1b (Task 2 - App.tsx route wiring)
