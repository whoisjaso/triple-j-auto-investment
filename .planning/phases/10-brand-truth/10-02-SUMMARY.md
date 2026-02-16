---
phase: 10-brand-truth
plan: 02
subsystem: content
tags: [about-page, services-page, faq-page, bilingual, brand-alignment, content-rewrite]
depends_on:
  requires: [10-01]
  provides: [honest-about-page, honest-services-page, bilingual-faq, services-dontdo-translations]
  affects: [10-03, 10-04]
tech_stack:
  added: []
  patterns: [dynamic-service-rendering, flat-faq-list, translation-driven-content]
key_files:
  created: []
  modified:
    - triple-j-auto-investment-main/pages/About.tsx
    - triple-j-auto-investment-main/pages/Services.tsx
    - triple-j-auto-investment-main/pages/FAQ.tsx
    - triple-j-auto-investment-main/utils/translations.ts
decisions:
  - id: about-no-team-profiles
    decision: "About page focuses on business story, values, and location -- no fabricated team member names or biographies"
    rationale: "Per plan instructions and CONTEXT.md: don't invent team information. Focus on verifiable facts."
  - id: services-dynamic-rendering
    decision: "Services rendered dynamically from t.services.list[] array with icon/link mapping arrays"
    rationale: "Avoids hardcoded service cards; adding/removing services only requires changing translations.ts"
  - id: logistics-removed
    decision: "Removed 'Logistics Coordination' (out-of-state shipping) service -- unverifiable"
    rationale: "Per plan: 'Verify if out-of-state shipping is real. If not, remove. If uncertain, remove.'"
  - id: faq-flat-list
    decision: "Replaced categorized FAQ (5 categories) with flat list of 8 questions from translations"
    rationale: "Simpler structure; all questions now bilingual from t.faq.questions[]; categories were English-only labels"
  - id: dontdo-in-translations
    decision: "Moved 'What We Don't Do' section content into t.services.dontDo translations for proper bilingual support"
    rationale: "Avoids language detection hacks; proper bilingual parity for all customer-visible text"
metrics:
  duration: "~6 minutes"
  completed: "2026-02-15"
---

# Phase 10 Plan 02: About, Services & FAQ Page Rewrites Summary

**Rewrote About.tsx, Services.tsx, and FAQ.tsx to use honest content from the bilingual translation system -- removed all SOVEREIGN framework jargon, wired every page to t.about.*/t.services.*/t.faq.* keys, added vehicle sales and rentals to services, and made all three pages fully bilingual EN/ES**

## What Was Done

### Task 1: Rewrite About.tsx (54796b3)

Complete rewrite of About.tsx from 329 lines of SOVEREIGN jargon to 313 lines of honest dealership content, fully wired to the `t.about.*` translation keys established in Plan 01.

**Removed entirely:**
- "System Restoration Protocol" badge
- "PERCEPTION IS REALITY" heading
- "Subconscious Indoctrination" section label
- "WHO IS WRITING YOUR SCRIPT?" heading
- "The world is a machine of subconscious indoctrination" content
- "psychological leverage" / "sovereignty" quote
- "THE LAW OF IDENTITY" section with Identity/Behavior/Outcome cards
- "OPERATIONAL DOCTRINE" section with psychology/clarity/identity principles
- Terminal/console UI element ("System Output" / "REMOVE FRICTION" / "DECISIVE ACTION")
- "Base of Operations" / "USA / SOUTHERN COMMAND" / "Tactical Approach"
- "The Psychological Moonshot" / "Shift perception. Bend behavior." CTA
- "Initiate Alignment" button text

**Replaced with honest content from translations:**
- Hero: "Our Story" badge, "TRIPLE J AUTO INVESTMENT" title, honest subtitle
- Story section: real dealership story (family-run, Houston, $3K-$8K pre-owned vehicles)
- Values section: Honesty, Family First, Community with honest descriptions
- Info card: address, phone, hours, closed day from translations
- Map section: "Visit Us" with real address, hours, phone, "Get Directions"
- CTA: "Ready to Find Your Next Vehicle?" / "Browse Inventory"

**Icons updated:** Crown/Eye/Fingerprint/Terminal/Target replaced with Heart/Shield/Users/Clock/Phone

**30 translation key references** (`t.about.*`) throughout the page.

### Task 2: Rewrite Services.tsx and FAQ.tsx (ee51f4d)

**Services.tsx** rewritten from 186 lines (mostly hardcoded English jargon) to 85 lines of clean, translation-driven content.

Changes:
1. Replaced 6 hardcoded service cards with dynamic rendering from `t.services.list[]`
2. Removed "VIN Intelligence" / "DEEP DATA ANALYSIS" / "Military-grade vehicle history verification"
3. Removed "Logistics Coordination" (out-of-state shipping -- unverified service)
4. Removed "CAPITAL STRATEGIES" / "high-value asset financing" / "ASSET VALUATION"
5. All 5 services now from translations: Vehicle Sales, Vehicle Rentals, VIN History Reports, Financing Assistance, Trade-In Assessment
6. "What We Don't Do" section moved to `t.services.dontDo` translations for bilingual support
7. "No Pressure Tactics" rewritten: "We believe in honest conversations, not sales tactics" (was "You make decisions from clarity, not emotion")
8. Icons: Truck replaced with Car and Key for sales/rentals

**FAQ.tsx** rewritten from 206 lines (hardcoded English categories) to 100 lines of clean, translation-driven content.

Changes:
1. Replaced 5 hardcoded English FAQ categories (19 total questions) with flat `t.faq.questions[]` array (8 bilingual Q&A pairs)
2. Removed category groupings (PURCHASING, FINANCING, TITLE & REGISTRATION, INSPECTION & CONDITION, LOGISTICS)
3. All 8 questions cover real business topics: vehicle types, financing, rentals, location, hours, bilingual service, trade-ins, inspections
4. Search filter now operates on the flat translations array
5. All structural labels (badge, title, subtitle, searchPlaceholder, noResults, stillHaveQuestions, contactPrompt, contactCta) already from translations

**translations.ts** updated: added `services.dontDo` section to both EN and ES objects with 4 items each.

## Deviations from Plan

### Auto-added Missing Critical Functionality

**1. [Rule 2 - Missing Critical] Added services.dontDo to translations.ts**

- **Found during:** Task 2
- **Issue:** The "What We Don't Do" section in Services.tsx was hardcoded English. The plan said to keep the section but fix the language. Making it bilingual required adding translation keys.
- **Fix:** Added `t.services.dontDo` with `title` and `items[]` array to both EN and ES in translations.ts
- **Files modified:** translations.ts
- **Commit:** ee51f4d

## Verification Results

1. **Jargon sweep:** `grep -riE "sovereign|dominion|doctrine|indoctrination|moonshot|military|tactical|command|perception.is.reality|high.value.asset"` returns zero results across all three pages
2. **TypeScript:** No new errors from About.tsx, Services.tsx, FAQ.tsx, or translations.ts (all errors pre-existing: Deno edge functions, RegistrationTracker legacy types)
3. **Translation wiring:** About.tsx uses `t.about.*` (30 refs), Services.tsx uses `t.services.*` (7 refs), FAQ.tsx uses `t.faq.*` (9 refs)
4. **Bilingual:** All customer-visible text from translations, supporting EN/ES toggle
5. **Rentals present:** Services page lists "Vehicle Rentals" / "Renta de Vehiculos" as second service
6. **useLanguage:** All three pages import and use the hook

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 54796b3 | feat(10-02): rewrite About.tsx -- honest dealership story with bilingual support |
| 2 | ee51f4d | feat(10-02): rewrite Services.tsx and FAQ.tsx -- bilingual with honest content |

## Next Phase Readiness

This plan completes the rewrite of About, Services, and FAQ. Combined with Plan 01 (translations + homepage), the following pages are now clean and bilingual:
- Home.tsx (10-01)
- About.tsx (10-02)
- Services.tsx (10-02)
- FAQ.tsx (10-02)

**Remaining for Phase 10:**
- **10-03** can now rewrite Finance.tsx, VinLookup.tsx, PaymentOptions.tsx, Policies.tsx, Legal.tsx, NotFound.tsx using translation keys already in translations.ts
- **10-04** can clean up support files (vehicles.ts, sheets.ts, geminiService.ts, SovereignCrest.tsx)

**No blockers for subsequent plans.**
