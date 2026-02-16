---
phase: 11-production-polish
plan: 01
subsystem: infrastructure
tags: [vite, error-handling, offline-detection, bilingual, maintenance-page]
dependencies:
  requires: [10-01, 10-06]
  provides: [PageLoader, OfflineBanner, ConnectionErrorBanner, useOnlineStatus, polish-translation-keys, maintenance-page, console-stripping]
  affects: [11-02, 11-03, 11-04, 11-05, 11-06]
tech-stack:
  added: []
  patterns: [esbuild-drop-console, navigator-onLine-hook, error-boundary-wrapping-routes]
key-files:
  created:
    - triple-j-auto-investment-main/components/PageLoader.tsx
    - triple-j-auto-investment-main/components/OfflineBanner.tsx
    - triple-j-auto-investment-main/components/ConnectionErrorBanner.tsx
    - triple-j-auto-investment-main/hooks/useOnlineStatus.ts
    - triple-j-auto-investment-main/public/maintenance.html
  modified:
    - triple-j-auto-investment-main/vite.config.ts
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/utils/translations.ts
decisions:
  - id: 11-01-01
    decision: "Console stripping uses esbuild.drop conditional on production mode, preserving dev console output"
  - id: 11-01-02
    decision: "ErrorBoundary wraps main+Suspense block (not entire AppContent) so Navbar/Footer remain visible during page crashes"
  - id: 11-01-03
    decision: "OfflineBanner renders above Navbar with z-[9999] to ensure visibility regardless of page content"
  - id: 11-01-04
    decision: "Maintenance page is fully static HTML with inline CSS (no build dependencies) and stacks both languages"
  - id: 11-01-05
    decision: "lazyWithErrorHandling fallback UI updated from bg-tj-green to bg-black to match site dark aesthetic"
metrics:
  duration: 5m
  completed: 2026-02-16
---

# Phase 11 Plan 01: Production Polish Infrastructure Summary

**One-liner:** Console stripping via esbuild.drop, ErrorBoundary repositioned to catch page crashes, branded PageLoader for Suspense, offline/connection banners, static bilingual maintenance page, and 30 polish translation keys for subsequent plans.

## What Was Done

### Task 1: Console Stripping + ErrorBoundary Fix + Suspense Fallback + PageLoader
**Commit:** `25c45b4`

1. **Vite console stripping** -- Added `esbuild.drop: ['console', 'debugger']` to vite.config.ts, conditional on `mode === 'production'`. All 296 console.* statements in the codebase are now stripped at build time without touching source code. Development console output is preserved.

2. **PageLoader component** -- Created `components/PageLoader.tsx` as the branded Suspense fallback. Shows Triple J gold logo with `animate-pulse` and bilingual loading text from `t.common.loading`. Black background matching site aesthetic.

3. **ErrorBoundary repositioned** -- Moved from wrapping only `<BrowserCompatibilityCheck />` to wrapping the `<main>` element containing Routes/Suspense. Now catches any page-level render crash while keeping Navbar and Footer visible. Error UI updated from `bg-tj-green` to `bg-black` with logo, phone number, and reload button.

4. **Suspense fallback replaced** -- Changed `<Suspense fallback={null}>` to `<Suspense fallback={<PageLoader />}>`. Users now see a branded loading screen instead of blank screen while lazy-loaded pages download.

5. **Lazy load error fallback updated** -- The `lazyWithErrorHandling` function's fallback component now uses `bg-black` and includes the Triple J logo and phone number, matching the ErrorBoundary aesthetic.

### Task 2: Offline Detection + Connection Error Banner + Maintenance Page + Translation Keys
**Commit:** `cbbe7e1`

1. **useOnlineStatus hook** -- Created `hooks/useOnlineStatus.ts` using `navigator.onLine` and `online`/`offline` event listeners. Returns boolean `isOnline`.

2. **OfflineBanner component** -- Created `components/OfflineBanner.tsx`. Fixed position at top of viewport (`z-[9999]`), red/dark background, bilingual text from `t.polish.offlineBanner`, WifiOff icon. Self-conditionally renders using `useOnlineStatus`.

3. **ConnectionErrorBanner component** -- Created `components/ConnectionErrorBanner.tsx`. Reads `connectionError` from Store context (which was previously set but never displayed). Amber/warning styling with retry button and phone number link. Bilingual via `t.polish.connectionError/connectionRetry/connectionCallUs`.

4. **App.tsx wiring** -- `OfflineBanner` renders above Navbar (visible regardless of page). `ConnectionErrorBanner` renders inside main element above Routes.

5. **Maintenance page** -- Created `public/maintenance.html` (122 lines). Fully static standalone HTML with inline CSS. Black background, Triple J gold logo, bilingual headings (English + Spanish stacked), phone number, business hours. No build dependencies.

6. **Translation keys** -- Added `polish` section to both `en` and `es` objects in translations.ts with 30 keys each covering: offline banner, connection error, loading states, empty states, error states, and accessibility labels. All Spanish translations use natural conversational language.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lazyWithErrorHandling fallback aesthetic**
- **Found during:** Task 1
- **Issue:** The `lazyWithErrorHandling` function had a fallback component using `bg-tj-green` (same issue as ErrorBoundary), inconsistent with the dark site theme.
- **Fix:** Updated to `bg-black` with Triple J logo and phone number, matching the ErrorBoundary update.
- **Files modified:** `App.tsx`
- **Commit:** `25c45b4`

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 11-01-01 | Console stripping conditional on production mode | Preserves dev console output for debugging |
| 11-01-02 | ErrorBoundary wraps main+Suspense (not entire AppContent) | Navbar/Footer remain visible during page crashes for navigation recovery |
| 11-01-03 | OfflineBanner at z-[9999] above Navbar | Must be visible regardless of any z-index stacking in page content or modals |
| 11-01-04 | Maintenance page is static HTML with stacked languages | Must work without build pipeline; both audiences served without JavaScript |
| 11-01-05 | Updated lazyWithErrorHandling fallback to dark aesthetic | Consistency with ErrorBoundary and site theme |

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` succeeds | PASS |
| vite.config.ts has esbuild.drop for production | PASS |
| ErrorBoundary wraps Routes/Suspense block | PASS |
| Suspense fallback is PageLoader (not null) | PASS |
| OfflineBanner renders conditionally via useOnlineStatus | PASS |
| ConnectionErrorBanner reads connectionError from Store | PASS |
| maintenance.html is standalone and bilingual (122 lines) | PASS |
| translations.ts has polish section in both en and es | PASS |

## Success Criteria Status

- [x] Zero console.* output in production build (POLISH-04 complete via esbuild.drop)
- [x] ErrorBoundary catches page crashes and shows branded error UI
- [x] Lazy page loads show branded loader instead of blank screen
- [x] Offline state detected and communicated to user
- [x] Connection error state surfaced to user (not just console.error)
- [x] Maintenance page exists for future use
- [x] All bilingual translation keys ready for subsequent plans

## Next Phase Readiness

All infrastructure is in place for plans 11-02 through 11-06:
- PageLoader available as Suspense fallback
- OfflineBanner and ConnectionErrorBanner wired into App
- Translation keys (`t.polish.*`) ready for loading states, empty states, error states, and accessibility labels
- Console stripping active in production builds
