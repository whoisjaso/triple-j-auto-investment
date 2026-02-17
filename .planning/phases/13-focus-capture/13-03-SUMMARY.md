---
phase: 13-focus-capture
plan: 03
subsystem: ui
tags: [navbar, se-habla, cultural-signal, splashscreen, performance, first-impression]

# Dependency graph
requires:
  - phase: 13-focus-capture
    plan: 01
    provides: "t.home.seHabla translation key (always 'Se Habla Espanol' in both languages)"
provides:
  - "Persistent Se Habla Espanol cultural indicator in navbar (desktop + mobile)"
  - "Immediate content rendering (no SplashScreen delay)"
affects: [any future navbar layout changes, LCP performance metrics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cultural identity badge in navbar: static display element (not interactive) using translation key"
    - "Desktop vs mobile indicator variants: bordered pill (desktop) vs plain text (mobile)"

key-files:
  created: []
  modified:
    - "triple-j-auto-investment-main/App.tsx"

key-decisions:
  - "Desktop Se Habla: bordered pill badge (text-[9px], rounded-full, border-tj-gold/20) placed before language toggle"
  - "Mobile Se Habla: plain text only (text-[8px], no border) to conserve horizontal space"
  - "SplashScreen wrapper removed entirely rather than shortened -- hero animation IS the new first impression"
  - "SplashScreen.tsx component file preserved (not deleted) for potential future use"

patterns-established:
  - "Cultural identity signals are static display elements, not interactive buttons"

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 13 Plan 03: Se Habla Navbar Indicator & SplashScreen Removal Summary

**Persistent Se Habla Espanol cultural indicator added to desktop (bordered pill) and mobile (plain text) navbar layouts, plus SplashScreen removal for immediate content visibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T18:54:33Z
- **Completed:** 2026-02-17T18:57:45Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- Added "Se Habla Espanol" bordered pill badge to desktop navbar (right axis, before language toggle)
- Added "Se Habla Espanol" plain text indicator to mobile navbar (before ES/EN toggle and hamburger)
- Both indicators use t.home.seHabla translation key, visible on every page regardless of login state
- Removed SplashScreen wrapper from App component, eliminating 1.7-second delay (1.2s splash + 0.5s fade)
- AppContent now renders immediately -- hero animation is the first visual impression for visitors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add persistent Se Habla Espanol indicator to navbar** - `b1f2019` (feat)
2. **Task 2: Remove SplashScreen for immediate content visibility** - `f7d8d30` (feat)

## Files Created/Modified
- `triple-j-auto-investment-main/App.tsx` - Added Se Habla indicators (desktop pill badge + mobile plain text) to Navbar component; removed SplashScreen import and wrapper from App function

## Decisions Made
- Desktop indicator uses bordered pill badge styling (text-[9px], tracking-[0.2em], text-tj-gold/70, border-tj-gold/20, rounded-full, font-display) for subtle visual presence
- Mobile indicator uses plain text (text-[8px], tracking-[0.15em], no border) to conserve horizontal space alongside ES/EN toggle and hamburger
- SplashScreen removed entirely (not shortened to 500ms) because even a brief delay blocks the hero animation that IS the new first impression per Phase 13's 3-second goal
- SplashScreen.tsx component file preserved in components/ directory (not deleted) for potential future reference or reuse

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial build failed due to Windows file permission error on dist/maintenance.html (EPERM). Resolved by clearing dist directory before rebuild. Not a code issue.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Se Habla indicator is live on all pages via the navbar
- Content loads immediately without splash delay
- Phase 13 is now complete (all 3 plans: 13-01 translations, 13-02 hero rebuild, 13-03 navbar + splash removal)

---
*Phase: 13-focus-capture*
*Completed: 2026-02-17*
