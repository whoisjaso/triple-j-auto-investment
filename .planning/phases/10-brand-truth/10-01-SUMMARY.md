---
phase: 10-brand-truth
plan: 01
subsystem: content
tags: [translations, bilingual, homepage, brand-alignment, content-rewrite]
depends_on:
  requires: []
  provides: [translations-foundation, honest-homepage, bilingual-content-system]
  affects: [10-02, 10-03, 10-04]
tech_stack:
  added: []
  patterns: [translation-key-expansion, bilingual-parity]
key_files:
  created: []
  modified:
    - triple-j-auto-investment-main/utils/translations.ts
    - triple-j-auto-investment-main/pages/Home.tsx
decisions:
  - id: translations-key-structure
    decision: "Keep internal key names (arsenal, vault, psych) unchanged to avoid breaking references across files; only customer-visible values were rewritten"
    rationale: "Renaming keys would cascade to every file that references t.home.arsenal.* etc. -- a refactoring concern separate from content truth"
  - id: signals-section-approach
    decision: "Replaced fake Live Signals ticker with honest dealership info ticker using new t.home.signals translation keys"
    rationale: "Option A from plan (replace with real content) chosen over Option B (remove entirely) to maintain the visual rhythm and communicate real value props"
  - id: faq-questions-embedded
    decision: "FAQ Q&A content embedded directly in translations.ts as array of objects with q/a keys"
    rationale: "Matches existing pattern; keeps all content in single source of truth; both EN and ES have identical 8-question structure"
  - id: services-list-embedded
    decision: "Service descriptions embedded in translations.ts as array of objects with title/desc/detail keys"
    rationale: "Provides complete content for Services page rewrite in 10-03; includes all 5 services (sales, rentals, VIN, financing, trade-in)"
metrics:
  duration: "~6 minutes"
  completed: "2026-02-15"
---

# Phase 10 Plan 01: Translations & Homepage Content Overhaul Summary

**Complete bilingual translations rewrite and homepage cleanup -- removed all SOVEREIGN framework jargon from translations.ts and Home.tsx, replaced with honest automotive dealership language in both English and Spanish, eliminated subliminal components and fake social proof**

## What Was Done

### Task 1: Rewrite translations.ts (d397503)

Rewrote the entire `translations.ts` file from 376 lines to 808 lines. Every existing translation key was rewritten to remove SOVEREIGN framework jargon, and 9 new sections were added for pages that previously had hardcoded English.

**Existing keys rewritten:**
- `nav.*` -- kept structure, labels already clean
- `home.hero.*` -- "ARCHITECT REALITY" / "Identity precedes results" replaced with "YOUR NEXT VEHICLE" / "Reliable pre-owned cars for Houston families"
- `home.ticker` -- "PSYCHOLOGY DRIVES ECONOMICS" replaced with "SERVING HOUSTON FAMILIES", "TRANSPARENT PRICING", etc.
- `home.arsenal.*` -- "The Arsenal" / "Live Allocations" / "Select your instrument of power" replaced with "Our Inventory" / "Featured Vehicles" / "Browse our hand-picked selection"
- `home.pillars.*` -- "The Trinity" / "Operating System V3.0" / psychological jargon replaced with "Why Triple J" / "Our Promise to You" / Trust, Simplicity, Value
- `home.cards.*` -- "Sovereign Vetting" / "Psychological Moonshot" / "Strategic Velocity" replaced with "Vehicle History" / "Our Story" / "Fast & Simple"
- `home.vault.*` -- "THE VAULT" / "Secure Access Only" replaced with "BROWSE ALL" / "Ready to Find Your Car?"
- `inventory.*` -- "The Collection" / "Secure Asset Allocations" / "dossier" / "acquisition" replaced with "Our Vehicles" / "Browse Available Vehicles" / "inquiry" / "details"
- `contact.*` -- "MAKE CONTACT" / "Transmit Message" / "SIGNAL RECEIVED" replaced with "CONTACT US" / "Send Message" / "MESSAGE SENT"
- `login.*` -- "RESTRICTED ACCESS" / "Triple J Sovereign Domain" / "Identity Key" / "Access Cipher" replaced with "ADMIN LOGIN" / "Dealer Portal" / "Email" / "Password"
- `faq.*` -- "Knowledge Base" / "CONTACT HEADQUARTERS" replaced with "Help Center" / "CONTACT US"
- `services.*` -- "Precision operations for the discerning client" replaced with "Everything you need to get on the road with confidence"
- `footer.*` -- "Redefining the standard of luxury and performance" replaced with "Trusted pre-owned vehicles for Houston families"; added location, phone, hours, dealerLicense, followUs, copyright keys

**New sections added:**
- `home.signals.*` -- new keys for the dealership info ticker replacing fake Live Signals
- `home.architecture` -- "What Sets Us Apart" heading
- `about.*` -- hero, story (3 paragraphs), values (3 values), location, CTA
- `finance.*` -- badge, title, subtitle, intro, 3-step process, CTA with phone
- `faq.questions[]` -- 8 FAQ Q&A pairs covering vehicles, financing, rentals, location, hours, bilingual, trade-ins, inspections
- `services.list[]` -- 5 services with title/desc/detail (sales, rentals, VIN, financing, trade-in)
- `policies.*` -- privacy, terms, returns sections
- `legal.*` -- dealer info, disclaimer, backToHome
- `notFound.*` -- title, subtitle, homeButton, contactButton
- `vinLookup.*` -- badge, title, subtitle, placeholder, search, results, noResults
- `paymentOptions.*` -- badge, title, subtitle, methods (cash, financing, debit, cashiers), fraud prevention

**Phone number standardized:** (832) 400-9760 used in `common.phone`, `footer.phone`, `about.location.phone`, `finance.cta.phone`, `paymentOptions.note`, `paymentOptions.fraud.content`.

### Task 2: Rewrite Home.tsx (415fb84)

Rewrote `Home.tsx` from 532 lines to 474 lines. All SOVEREIGN jargon, subliminal components, and fake social proof removed.

**Specific changes:**
1. **Removed SubliminalPrime component** -- entire component definition (lines 43-74) and usage (line 135) deleted. This flashed "AUTHORITY", "CONTROL", "LEGACY", "DOMINION", "SOVEREIGNTY" at visitors.
2. **Kept DecryptText animation** -- now decodes to honest hero text from translations ("YOUR NEXT" / "VEHICLE")
3. **Removed hero status badges** -- "System Override: Active" / "Uplink Established" gone
4. **Rewrote hero subtitle** -- now uses `t.home.hero.subtitle` (no quotes wrapping)
5. **Replaced "Call Now" hardcoded text** -- now uses `t.home.hero.callNow` for bilingual support
6. **Replaced fake Live Signals section** -- removed hardcoded "ASSET SECURED: 2021 G-WAGON", "DOMINION ESTABLISHED: SECTOR 7", "ROLLS ROYCE WRAITH: DEPLOYED", "LAMBORGHINI HURACAN: ALLOCATED", "STATUS: SOVEREIGN". Replaced with `t.home.signals.items` array containing honest dealership info.
7. **Replaced "Intercepted Transmissions" label** -- now uses `t.home.signals.label` ("What We Offer")
8. **Replaced "System Architecture" heading** -- now uses `t.home.architecture` ("What Sets Us Apart")
9. **Replaced Brain icon** with Heart icon for "Our Story" card (more appropriate for family dealership)
10. **Replaced Crosshair icon** with Star icon in ticker marquee
11. **Removed duplicate/stale import** -- cleaned up `import { useLanguage }` that was after inline comment
12. **Variable renames** -- `featuredAssets` to `featuredVehicles`, `hasAssets` to `hasVehicles`
13. **Section comments updated** -- "THE ARSENAL" to "FEATURED VEHICLES", "DOCTRINE PILLARS" to "VALUE PILLARS", "LIVE SIGNALS" to "DEALERSHIP INFO TICKER", "SYSTEM ARCHITECTURE" to "WHAT SETS US APART", "INVENTORY TEASER" to "INVENTORY CTA"

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. **Jargon sweep:** `grep -riE "sovereign|dominion|doctrine|moonshot|cipher|dossier|uplink|indoctrination|architect.reality|psychological"` returns zero customer-facing matches (only internal JS key name `arsenal` appears as object property accessor, not visible to users)
2. **SubliminalPrime gone:** Zero references to SubliminalPrime in Home.tsx
3. **Fake social proof gone:** Zero references to G-Wagon, Rolls Royce, Lamborghini, or "DOMINION ESTABLISHED" in Home.tsx
4. **Translation coverage:** 44 translation references (`t.*`) in Home.tsx
5. **New sections exist:** All 9 new sections (about, services expanded, finance, faq expanded, policies, legal, notFound, vinLookup, paymentOptions) present in both EN and ES with identical key structure
6. **Bilingual parity:** EN and ES objects have identical nested structure

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | d397503 | feat(10-01): rewrite translations.ts with honest bilingual content |
| 2 | 415fb84 | feat(10-01): rewrite Home.tsx -- remove subliminal components and fake social proof |

## Next Phase Readiness

This plan establishes the translation foundation for all other Phase 10 plans:
- **10-02** can now rewrite About.tsx, Footer, and other pages using the new `t.about.*`, `t.legal.*`, `t.notFound.*` keys
- **10-03** can now rewrite Services.tsx, Finance.tsx, FAQ.tsx, VinLookup.tsx, PaymentOptions.tsx, Policies.tsx using the new translation sections
- **10-04** can clean up support files (vehicles.ts, sheets.ts, geminiService.ts, SovereignCrest.tsx) since the content direction is now established

**No blockers for subsequent plans.**
