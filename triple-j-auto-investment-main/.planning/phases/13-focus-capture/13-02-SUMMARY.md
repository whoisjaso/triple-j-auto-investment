---
phase: 13-focus-capture
plan: 02
subsystem: ui
tags: [hero, svg-animation, authority-metrics, count-up, framer-motion, pattern-interrupt, LAND-05, LAND-03]

# Dependency graph
requires:
  - phase: 13-focus-capture
    plan: 01
    provides: "Bilingual hero/authority translation keys + browser language auto-detection"
  - phase: 10-brand-truth
    provides: "Honest translation system and content rewrite"
  - phase: 11-production-polish
    provides: "Canonical button/spacing patterns, accessibility, responsive design"
provides:
  - "Abstract SVG hero animation replacing stock-photo hero (LAND-05 pattern-interrupt)"
  - "Authority metrics strip with animated count-up numbers"
  - "Family-centered iconography via Users icon on Families Served metric (LAND-03)"
  - "Schedule a Visit (primary) + Call Now (secondary) CTAs in hero"
  - "Se Habla Espanol badge in hero area"
affects: [13-03 remaining work, any future hero modifications, any future authority metrics updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Abstract SVG background via motion.path with pathLength animation (8 paths + 3 circles)"
    - "Count-up numbers via useSpring + useTransform + useInView from framer-motion"
    - "Full-bleed hero behind transparent navbar using -mt-36 pt-36 pattern"
    - "Static SVG path data defined outside component to avoid re-creation on re-render"

key-files:
  created: []
  modified:
    - "triple-j-auto-investment-main/pages/Home.tsx"

key-decisions:
  - "DecryptText component removed entirely (replaced by framer-motion entrance animations)"
  - "Mouse parallax state/effects removed (no useState for mouse position, no event listener)"
  - "useScroll parallax removed (hero content no longer scrolls with parallax)"
  - "SVG paths defined as static const array outside component (heroSvgPaths, heroSvgCircles)"
  - "11 total animated SVG elements (8 paths + 3 circles) -- under 12 limit for mobile performance"
  - "Hero CTAs use canonical button pattern (py-4 px-8 text-xs tracking-[0.3em])"
  - "Schedule a Visit links to /contact (not /inventory) -- human connection first"
  - "Authority metric values (500, 150, 3, 800) are placeholder estimates marked with TODO(business-data)"
  - "CountUpNumber component defined outside Home for clean separation and reusability"
  - "Both tasks committed together since both modify same file (Home.tsx) atomically"

patterns-established:
  - "SVG hero animation: static path data array + motion.path with pathLength/opacity loop"
  - "Count-up pattern: useRef + useInView(once) + useSpring + useTransform for number display"
  - "Authority metrics: grid with entrance stagger (motion.div whileInView with delay per index)"

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 13 Plan 02: Hero Rebuild & Authority Metrics Summary

**Abstract SVG animated hero with gold flowing paths replacing stock photo, plus authority metrics strip with animated count-up numbers and family-oriented Users icon (LAND-03/LAND-05)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T18:54:49Z
- **Completed:** 2026-02-17T19:01:00Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- Replaced Unsplash stock car photo hero with abstract animated SVG background (8 gold bezier paths + 3 floating particles)
- Wired all hero text to new translation keys: heading, subheading, tagline, scheduleVisit, callNow, scrollPrompt
- Added Se Habla Espanol badge in hero area with gold accent dot
- Implemented Schedule a Visit (primary, /contact) and Call Now (secondary, tel:) CTAs
- Added authority metrics strip between hero and ticker with animated count-up numbers
- Families Served metric displays Users icon from lucide-react (LAND-03 family-centered imagery)
- Four metrics: 500+ families served, 150+ five-star reviews, 3+ years, 800+ vehicles delivered
- Removed DecryptText component, mouse parallax state/effects, and scroll parallax transforms
- Hero extends full-bleed behind transparent navbar using -mt-36 pt-36 pattern
- All sections below metrics (ticker, featured vehicles, pillars, etc.) remain completely unchanged

## Task Commits

Both tasks committed atomically since they modify the same file:

1. **Tasks 1+2: Hero rebuild + Authority metrics** - `0354a9c` (feat)

## Files Created/Modified
- `triple-j-auto-investment-main/pages/Home.tsx` - Complete hero section replacement (219 insertions, 122 deletions). New: abstract SVG animation, Se Habla badge, positioning language heading/subheading, CTAs, scroll indicator, CountUpNumber component, authority metrics section

## Decisions Made
- DecryptText component (custom character-reveal animation) fully removed and replaced with standard framer-motion entrance animations (opacity + y translation with spring physics)
- Mouse parallax completely removed (no useState for mouse position, no useEffect listener) -- reduces re-renders and simplifies the component
- Old scroll parallax (y1, opacity transforms) removed since the new hero uses entrance animations instead
- SVG path data arrays (heroSvgPaths, heroSvgCircles) are defined as module-level constants outside the component to prevent re-creation on each render
- Authority metric placeholder values are conservative estimates clearly marked with TODO(business-data) comment
- Both tasks committed in single atomic commit since they both modify Home.tsx and the authority metrics depend on the CountUpNumber component which was added alongside the hero
- Hero uses preserveAspectRatio="xMidYMid slice" for proper SVG scaling across viewport sizes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Home.tsx hero now fully functional with new translation keys from 13-01
- Authority metrics are in place with placeholder values -- update with real business data when available (search for TODO(business-data))
- Phase 13 Plan 03 work (if any) can proceed
- Build passes with zero errors, all downstream sections intact

---
*Phase: 13-focus-capture*
*Completed: 2026-02-17*
