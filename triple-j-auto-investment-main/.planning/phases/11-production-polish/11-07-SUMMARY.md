---
phase: 11-production-polish
plan: 07
subsystem: accessibility-performance
tags: [wcag, viewport, lcp, splash-screen, accessibility, performance]
dependency-graph:
  requires: [11-05]
  provides: [WCAG 1.4.4 viewport compliance, LCP under 2.5s]
  affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/index.html
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/components/SplashScreen.tsx
decisions:
  - id: 11-07-01
    decision: "Viewport meta keeps viewport-fit=cover (iPhone notch) while removing zoom restrictions"
    rationale: "viewport-fit=cover is needed for edge-to-edge display on notched devices; only maximum-scale and user-scalable violated WCAG"
  - id: 11-07-02
    decision: "Splash screen reduced to 1200ms display + 500ms fade = 1.7s total"
    rationale: "Must be under 2.5s LCP target; 1.7s gives comfortable margin while still showing branded crest animation"
metrics:
  duration: 2m
  completed: 2026-02-16
  tasks: 2/2
gap_closure: true
---

# Phase 11 Plan 07: BLOCKER Gap Closure (Viewport + LCP) Summary

**One-liner:** Removed viewport zoom restrictions for WCAG 1.4.4 and reduced splash screen from 4.3s to 1.7s for LCP compliance.

## What Was Done

### Task 1: Fix viewport meta tag (POLISH-02)

Removed `maximum-scale=1.0` and `user-scalable=no` from the viewport meta tag in `index.html`. These attributes prevented pinch-to-zoom, violating WCAG 1.4.4 (Resize Text). The `viewport-fit=cover` attribute was preserved for iPhone notch handling.

**Before:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**After:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Commit:** `f23b050`

### Task 2: Reduce SplashScreen to meet LCP target (POLISH-03)

Reduced the splash screen total blocking time from 4.3 seconds to 1.7 seconds:

| Parameter | Before | After |
|-----------|--------|-------|
| Display duration (App.tsx prop) | 3500ms | 1200ms |
| Default duration (SplashScreen.tsx) | 3000ms | 1200ms |
| Fade-out timer | duration + 800ms | duration + 500ms |
| CSS transition duration | 0.8s | 0.5s |
| **Total blocking time** | **4.3s** | **1.7s** |

The sessionStorage skip logic for returning visitors remains intact. The SVG crest tracing animation and visual design are unchanged -- only the timing was reduced.

**Commit:** `8b666db`

## Decisions Made

1. **[11-07-01] Keep viewport-fit=cover:** Only the zoom-blocking attributes were removed. `viewport-fit=cover` is not an accessibility violation and is needed for edge-to-edge rendering on notched iPhones.

2. **[11-07-02] 1200ms + 500ms timing:** The 1.7-second total provides a comfortable 800ms margin under the 2.5-second LCP target, while still showing a partial cycle of the branded crest tracing animation on first visit.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] No `user-scalable=no` in viewport meta
- [x] No `maximum-scale=1.0` in viewport meta
- [x] `viewport-fit=cover` preserved
- [x] App.tsx: `SplashScreen duration={1200}`
- [x] SplashScreen.tsx: default duration 1200
- [x] SplashScreen.tsx: fade timer `duration + 500`
- [x] SplashScreen.tsx: both CSS transitions use 0.5s
- [x] Total splash time: 1.7s (under 2.5s LCP target)
- [x] sessionStorage skip logic preserved
- [x] `npm run build` passes with zero errors

## BLOCKER Resolution

Both BLOCKER-severity gaps from `11-VERIFICATION.md` are now closed:

| Gap ID | Description | Status |
|--------|-------------|--------|
| POLISH-02 | Viewport meta blocks pinch-to-zoom (WCAG 1.4.4) | RESOLVED |
| POLISH-03 | SplashScreen blocks LCP for 4.3s (target: 2.5s) | RESOLVED |

## Files Modified

| File | Change |
|------|--------|
| `triple-j-auto-investment-main/index.html` | Removed zoom-blocking viewport attributes |
| `triple-j-auto-investment-main/App.tsx` | Changed SplashScreen duration prop from 3500 to 1200 |
| `triple-j-auto-investment-main/components/SplashScreen.tsx` | Reduced default duration, fade timer, and CSS transitions |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `f23b050` | fix | Remove viewport zoom restrictions for WCAG 1.4.4 compliance |
| `8b666db` | perf | Reduce splash screen to 1.7s for LCP under 2.5s target |
