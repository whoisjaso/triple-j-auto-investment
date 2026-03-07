---
phase: 13-focus-capture
plan: 01
subsystem: ui
tags: [translations, i18n, bilingual, language-detection, hero, authority-metrics]

# Dependency graph
requires:
  - phase: 10-content-rewrite
    provides: "Bilingual translation system (translations.ts with en/es blocks)"
  - phase: 12-seo-foundation
    provides: "React 19 per-page SEO component referencing translation keys"
provides:
  - "New hero translation keys (heading, subheading, tagline, scheduleVisit, callNow, scrollPrompt)"
  - "Authority metrics labels (familiesServed, fiveStarReviews, yearsInBusiness, vehiclesDelivered)"
  - "Se Habla Espanol badge text key"
  - "Browser Accept-Language auto-detection for Spanish-first visitors"
affects: [13-02 hero rebuild, 13-03 authority metrics component, any future bilingual content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "navigator.language detection on first visit with localStorage persistence"
    - "Cultural identity signal (seHabla) kept in Spanish in both language blocks"

key-files:
  created: []
  modified:
    - "triple-j-auto-investment-main/utils/translations.ts"
    - "triple-j-auto-investment-main/context/LanguageContext.tsx"

key-decisions:
  - "Hero keys replaced (title1/title2/subtitle/cta -> heading/subheading/tagline/scheduleVisit/scrollPrompt) -- old keys intentionally broken in Home.tsx for 13-02 to fix"
  - "seHabla key is identical in both en and es ('Se Habla Espanol') -- it is a cultural identity signal, always in Spanish"
  - "Browser detection saves to localStorage immediately so subsequent visits use saved preference"

patterns-established:
  - "Browser language auto-detection: check localStorage first, then navigator.language, default to English"

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 13 Plan 01: Focus Capture Translations & Language Detection Summary

**Bilingual hero/authority/Se Habla translation keys (24 key-value pairs) plus navigator.language auto-detection for Spanish-first visitors**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T18:48:01Z
- **Completed:** 2026-02-17T18:52:13Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- Replaced 5 old hero keys with 6 new keys in both English and Spanish (heading, subheading, tagline, scheduleVisit, callNow, scrollPrompt)
- Added authority metrics block with 5 labels in both languages (title, familiesServed, fiveStarReviews, yearsInBusiness, vehiclesDelivered)
- Added seHabla key in both language blocks (always Spanish as cultural identity signal)
- Enhanced LanguageContext with browser Accept-Language detection for first-time Spanish-speaking visitors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Phase 13 translation keys to translations.ts** - `2c27af6` (feat)
2. **Task 2: Add browser language auto-detection to LanguageContext** - `d847a1a` (feat)

## Files Created/Modified
- `triple-j-auto-investment-main/utils/translations.ts` - Added 24 new key-value pairs: 6 hero keys + 5 authority keys + 1 seHabla key in both en and es blocks
- `triple-j-auto-investment-main/context/LanguageContext.tsx` - Added navigator.language detection fallback for first-time visitors with no localStorage preference

## Decisions Made
- Hero keys are REPLACED, not added alongside old ones. This intentionally breaks Home.tsx (references title1, title2, subtitle, cta) which Plan 13-02 will fix when it rebuilds the hero section
- seHabla key value is "Se Habla Espanol" in BOTH en and es blocks -- it is always displayed in Spanish as a cultural identity signal, not translated to English
- Browser language detection saves detected preference to localStorage immediately, so the auto-detection only runs once per device (subsequent visits use the saved preference)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All translation keys ready for Plan 13-02 (hero rebuild) and Plan 13-03 (authority metrics component)
- Home.tsx will fail to compile until Plan 13-02 updates hero key references (expected and documented)
- Browser language detection is live and functional

---
*Phase: 13-focus-capture*
*Completed: 2026-02-17*
