---
phase: 04-inventory
plan: 02
subsystem: ui
tags: [next.js, dynamic-routes, vehicle-detail, payment-calculator, bhph, accessibility]

requires:
  - phase: 04-inventory/01
    provides: VehicleCard with slug links, mock vehicles, getVehicleBySlug query, Vehicle type
provides:
  - /inventory/[slug] vehicle detail page (primary conversion surface)
  - VehicleGallery component (placeholder-ready, future image support)
  - VehicleSpecs grid component (null-safe, semantic markup)
  - PaymentCalculator component (BHPH monthly estimate)
  - VehicleInquiryButton component (Call Now + Inquire CTAs)
  - getMockVehicleBySlug() for development without Supabase
affects: [05-leads, 06-admin]

tech-stack:
  added: []
  patterns: [server-component-default, client-component-minimal, mock-fallback]

key-files:
  created:
    - src/app/inventory/[slug]/page.tsx
    - src/app/inventory/[slug]/layout.tsx
    - src/components/inventory/VehicleGallery.tsx
    - src/components/inventory/VehicleSpecs.tsx
    - src/components/inventory/PaymentCalculator.tsx
    - src/components/inventory/VehicleInquiryButton.tsx
  modified:
    - src/lib/mock-vehicles.ts

key-decisions:
  - "Gallery as server component (no client JS for placeholder state)"
  - "PaymentCalculator is only client component (real-time state updates)"
  - "BHPH: simple division, no interest rate (built into vehicle price)"
  - "CTA Inquire links to /contact?vehicle={name} (Phase 5 will build the form)"

patterns-established:
  - "Detail page pattern: server component with mock/Supabase fallback"
  - "Accessibility: aria-hidden on decorative SVGs, htmlFor/id on labels"
  - "Specs display: dl/dt/dd with null-safe filtering"

completed: 2026-03-07
---

# Phase 4 Plan 02: Vehicle Detail Page Summary

**Server-rendered `/inventory/[slug]` detail page with gallery placeholder, specs grid, BHPH payment calculator, and conversion CTAs — the primary landing surface for Facebook Marketplace traffic.**

## Performance

| Metric | Value |
|--------|-------|
| Tasks | 3 completed (2 auto + 1 checkpoint) |
| Files | 7 (6 created, 1 modified) |
| Build | PASS (0 errors, 0 warnings) |
| Skill audit | All required skills invoked (ui-ux-pro-max, accessibility) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Detail page renders from slug | PASS | Server-rendered with mock/Supabase fallback |
| AC-2: Image gallery with placeholder | PASS | "Photos Coming Soon" with car SVG + body style badge |
| AC-3: Vehicle specs grid | PASS | 2-col dl grid, null-safe, VIN in monospace |
| AC-4: BHPH payment calculator | PASS | $500 down / 24mo default, real-time updates |
| AC-5: Call-to-action buttons | PASS | tel:+18324009760, /contact?vehicle={name} |
| AC-6: Mock data fallback + build | PASS | All 6 slugs resolve, nonexistent → 404 |
| AC-7: Luxury aesthetic + responsive | PASS | 2-col desktop, stacked mobile, gold/cream/black |

## Accomplishments

- Vehicle detail page serves as primary conversion surface for Facebook Marketplace traffic
- BHPH payment calculator makes financing tangible ($270.63/mo for a $6,995 vehicle)
- Only 1 client component (PaymentCalculator) — rest is server-rendered for performance
- Full accessibility: semantic markup, label associations, aria-hidden decorative SVGs, 44px+ tap targets

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/app/inventory/[slug]/page.tsx` | Created | Server-rendered detail page, 2-column layout, mock/Supabase fallback |
| `src/app/inventory/[slug]/layout.tsx` | Created | Dynamic metadata (title + description from vehicle data) |
| `src/components/inventory/VehicleGallery.tsx` | Created | Image gallery with placeholder ("Photos Coming Soon") |
| `src/components/inventory/VehicleSpecs.tsx` | Created | 2-column specs grid (dl/dt/dd, null-safe) |
| `src/components/inventory/PaymentCalculator.tsx` | Created | BHPH monthly estimate calculator (client component) |
| `src/components/inventory/VehicleInquiryButton.tsx` | Created | Call Now + Inquire CTA buttons |
| `src/lib/mock-vehicles.ts` | Modified | Added `getMockVehicleBySlug()` function |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 3 | Essential a11y fixes, no scope creep |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Essential fixes only, no scope creep.

### Auto-fixed Issues

**1. Accessibility: Missing label-input associations**
- **Found during:** Task 2 (PaymentCalculator)
- **Issue:** Labels lacked `htmlFor`, inputs lacked `id` — screen readers couldn't associate them
- **Fix:** Added `htmlFor="calc-down-payment"` / `htmlFor="calc-term"` and matching `id` attributes
- **Files:** `PaymentCalculator.tsx`

**2. Accessibility: Decorative SVGs missing aria-hidden**
- **Found during:** Review across all components
- **Issue:** Decorative SVG icons (phone, envelope, back arrow, car) announced by screen readers
- **Fix:** Added `aria-hidden="true"` to all decorative SVGs
- **Files:** `VehicleGallery.tsx`, `VehicleInquiryButton.tsx`, `page.tsx`

**3. Dead code: Unused SpecRow component**
- **Found during:** Task 1 (VehicleSpecs)
- **Issue:** `SpecRow` function defined but never used (inline JSX used instead)
- **Fix:** Removed dead code
- **Files:** `VehicleSpecs.tsx`

## Next Phase Readiness

**Ready:**
- Inquire button already links to `/contact?vehicle={name}` — Phase 5 (Lead Capture) can build the form
- Vehicle detail page is the anchor for future enhancements (image upload, lightbox, related vehicles)
- Rental inventory pages (v0.2+) can follow the same detail page pattern

**Concerns:**
- No real vehicle images yet (all 6 mock vehicles show placeholder)
- No Supabase connected — mock data only for now

**Blockers:** None

---
*Phase: 04-inventory, Plan: 02*
*Completed: 2026-03-07*
