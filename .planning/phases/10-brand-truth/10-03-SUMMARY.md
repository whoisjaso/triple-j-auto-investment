---
phase: 10-brand-truth
plan: 03
subsystem: content
tags: [footer, secondary-pages, bilingual, jargon-removal, translations, social-links]
depends_on:
  requires: [10-01]
  provides: [clean-footer, clean-secondary-pages, bilingual-secondary-pages, social-media-links]
  affects: [10-04]
tech_stack:
  added: []
  patterns: [translation-key-consumption, bilingual-page-wiring]
key_files:
  created: []
  modified:
    - triple-j-auto-investment-main/App.tsx
    - triple-j-auto-investment-main/pages/Finance.tsx
    - triple-j-auto-investment-main/pages/PaymentOptions.tsx
    - triple-j-auto-investment-main/pages/Legal.tsx
    - triple-j-auto-investment-main/pages/Policies.tsx
    - triple-j-auto-investment-main/pages/NotFound.tsx
    - triple-j-auto-investment-main/pages/VinLookup.tsx
decisions:
  - id: footer-four-column
    decision: "Expanded footer from 3-column to 4-column layout to accommodate phone, hours, and social links without cramping"
    rationale: "Adding phone number, business hours, and social media links to the footer required more space; 4-column layout at desktop width keeps each section readable"
  - id: wire-transfer-replaced-with-debit
    decision: "Replaced wire transfer payment option with debit card in PaymentOptions.tsx to match the translations.ts content from 10-01"
    rationale: "The translations defined cash, financing, debit, and cashier's check as the four methods; wire transfer for $3K-$8K vehicles is unnecessary and inconsistent with positioning"
  - id: mobile-menu-subtitles-removed
    decision: "Removed mobile menu subtitle text (ORIGIN POINT, ACQUIRE ASSETS, DEEP DATA ANALYSIS, THE PHILOSOPHY) instead of replacing"
    rationale: "These were decorative jargon with no honest equivalent; clean navigation labels are better than forced subtitles"
  - id: vinlookup-jargon-already-cleaned
    decision: "VinLookup header was already partially cleaned (VIN LOOKUP / Vehicle History Report) but not wired to translations; wired remaining text to t.vinLookup.* keys"
    rationale: "A prior edit removed the worst jargon but left hardcoded English; translation wiring ensures bilingual support"
metrics:
  duration: "~11 minutes"
  completed: "2026-02-15"
---

# Phase 10 Plan 03: Footer & Secondary Pages Jargon Cleanup Summary

**Rewrote the footer with real business info (phone, hours, social links) and cleaned all SOVEREIGN jargon from 7 secondary pages, wiring each to the bilingual translation system established in Plan 01**

## What Was Done

### Task 1: Footer Rewrite in App.tsx (19242ff)

Rewrote the Footer component in App.tsx with real business information and expanded from 3-column to 4-column layout.

**Specific changes:**
1. **Removed "Sovereign Entity" copyright** -- replaced with `t.footer.copyright` ("Triple J Auto Investment")
2. **Added phone number** -- clickable `tel:+18324009760` link displaying `t.footer.phone` ("(832) 400-9760")
3. **Added business hours** -- `t.footer.hoursDetail` ("Mon-Sat 9AM-6PM") and `t.footer.closed` ("Closed Sunday")
4. **Added social media links** -- Facebook (facebook.com/thetriplejauto) and X/Twitter (x.com/thetriplejauto) with lucide-react icons
5. **Replaced "Headquarters" heading** -- now uses `t.footer.location` ("Our Location" / "Nuestra Ubicacion")
6. **Translated dealer license label** -- now uses `t.footer.dealerLicense` ("Dealer License" / "Licencia de Distribuidor")
7. **Added more quick links** -- Services, Contact, VIN Lookup added to the quick links column
8. **Replaced "Intel" VIN link** -- now uses `t.vinLookup.title`
9. **Imported new icons** -- Phone, Clock, Facebook, Twitter from lucide-react
10. **Cleaned mobile menu jargon** -- removed subtitles (ORIGIN POINT, ACQUIRE ASSETS, DEEP DATA ANALYSIS, THE PHILOSOPHY), replaced "INTEL" label with translation key

### Task 2: Secondary Pages Cleanup (6fdfac1)

Cleaned jargon from 7 pages and wired all to the bilingual translation system.

**Finance.tsx:**
- Added `useLanguage` hook and `const { t } = useLanguage()`
- Replaced "Capital Strategies" badge with `t.finance.badge`
- Replaced "FINANCING" heading with `t.finance.title`
- Wired subtitle, form labels, CTA section to translation keys
- Changed vehicle interest placeholder from "2021 G-Wagon" to "2018 Honda Civic" (realistic for price range)
- Now fully bilingual via `t.finance.*`, `t.contact.form.*`, `t.common.*` keys

**PaymentOptions.tsx:**
- Added `useLanguage` hook
- Replaced "Financial Instruments" badge with `t.paymentOptions.badge`
- Replaced hardcoded payment method names/descriptions with `t.paymentOptions.methods.*` keys
- Removed old phone number (832) 777-7580 -- fraud section now uses `t.paymentOptions.fraud.content` which has (832) 400-9760
- Replaced "CONTACT HEADQUARTERS" CTA with `t.common.contactUs`
- Replaced wire transfer card with debit card card (matches translations)
- Now fully bilingual

**Legal.tsx:**
- Added `useLanguage` hook
- Removed sovereignty quote: "Compliance is the foundation of sovereignty..."
- Replaced "Return to Base" with `t.legal.backToHome` ("Back to Home" / "Volver al Inicio")
- Replaced "Compliance & Legal" label with `t.legal.subtitle`
- Replaced "Headquarters" label with `t.footer.location`
- Replaced "Official Notice" with `t.legal.disclaimer.title`
- Wired privacy and terms titles to translations for bilingual
- Fixed pre-existing TypeScript error: changed `React.ElementType` to `LucideIcon` for icon type

**Policies.tsx:**
- Added `useLanguage` hook
- Replaced "Legal Framework" badge with `t.footer.legal`
- Wired heading/subtitle to `t.policies.*` keys
- Wired Privacy section to `t.policies.privacy.*` keys
- Wired disclaimer to `t.legal.disclaimer.*` and `t.policies.terms.*` keys
- Replaced "high-value vehicles" in test drive section with general language
- Replaced "Wire Transfer" in payment methods list with "Debit Card"

**NotFound.tsx:**
- Added `useLanguage` hook
- Replaced "SIGNAL NOT FOUND" with `t.notFound.title` ("PAGE NOT FOUND" / "PAGINA NO ENCONTRADA")
- Replaced "Return Home" / "Main Command Center" with `t.notFound.homeButton` / `t.nav.home`
- Replaced "Browse Assets" with `t.common.viewInventory`
- Replaced "Contact Us" / "Initiate Communication" with `t.notFound.contactButton` / `t.contact.subtitle`
- Replaced "Return to Base" footer link with `t.common.backToHome`

**VinLookup.tsx:**
- Added `useLanguage` hook
- Header title/subtitle already cleaned in prior edit, now wired to `t.vinLookup.title` / `t.vinLookup.subtitle`
- Replaced "Target Identifier (VIN)" label with `t.vinLookup.badge`
- Replaced "ENTER VIN SEQUENCE" placeholder with `t.vinLookup.placeholder`
- Replaced "RUN FULL ANALYSIS" / "DECODING..." button text with `t.vinLookup.search` / `t.vinLookup.searching`
- Replaced "Core Identity Matrix" results heading with `t.vinLookup.results`
- Replaced "WAITING FOR TARGET DATA" empty state with `t.vinLookup.placeholder`
- Replaced "Model Designation" label with "Model"

**Login.tsx:**
- Already used `useLanguage()` and `t.login.*` keys -- verified no hardcoded jargon
- All jargon was in translation keys, which were fixed in Plan 01
- No changes needed

**Inventory.tsx:**
- Already used `useLanguage()` and `t.inventory.*` keys -- verified no hardcoded jargon
- All jargon was in translation keys, which were fixed in Plan 01
- No changes needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Mobile menu jargon cleanup in App.tsx**
- **Found during:** Task 2 verification sweep
- **Issue:** Mobile menu navigation had jargon subtitles (ORIGIN POINT, ACQUIRE ASSETS, DEEP DATA ANALYSIS, THE PHILOSOPHY) and "INTEL" label
- **Fix:** Removed subtitle text, replaced "INTEL" with `t.vinLookup.badge`
- **Files modified:** triple-j-auto-investment-main/App.tsx
- **Commit:** 6fdfac1

**2. [Rule 1 - Bug] Legal.tsx pre-existing TypeScript error**
- **Found during:** Task 2
- **Issue:** `React.ElementType` type on icon prop caused TS2322 error when passing `size` prop to `<Icon>`
- **Fix:** Changed type to `LucideIcon` from lucide-react
- **Files modified:** triple-j-auto-investment-main/pages/Legal.tsx
- **Commit:** 6fdfac1

**3. [Rule 2 - Missing Critical] Desktop navbar "INTEL" label**
- **Found during:** Task 2 verification
- **Issue:** Desktop navbar used hardcoded "INTEL" for VIN Lookup link -- not translated
- **Fix:** Changed to `t.vinLookup.badge` ("Vehicle History" / "Historial del Vehiculo")
- **Files modified:** triple-j-auto-investment-main/App.tsx
- **Commit:** 6fdfac1

## Verification Results

1. **Full jargon sweep:** Zero matches for sovereign, cipher, dossier, transmission (except VIN API field), uplink, headquarters, capital strategies, financial instruments, signal not found, command center, return to base, deep layer across all 8 modified files
2. **Phone number consistency:** Zero matches for (832) 777-7580 or (713) 555 across all pages -- all phone numbers now use (832) 400-9760 via translation keys
3. **TypeScript:** Zero errors on all modified files (pre-existing errors in RegistrationTracker.tsx and supabase functions remain unchanged)
4. **Translation system:** All 5 previously-hardcoded pages (Finance, PaymentOptions, Legal, Policies, NotFound) now import `useLanguage` and use `t.*` keys
5. **Social links present:** Facebook and X links in footer with proper URLs and target="_blank"
6. **Footer business info:** Phone (tel: link), hours, address, dealer license P171632 all present

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 19242ff | feat(10-03): rewrite footer with real business info, phone, hours, and social links |
| 2 | 6fdfac1 | feat(10-03): clean jargon from secondary pages and wire to bilingual translations |

## Next Phase Readiness

Plan 10-03 completes the footer and all secondary page rewrites:
- **Footer** now shows real business info on every page in both languages
- **Finance, PaymentOptions, Legal, Policies, NotFound, VinLookup** are clean and bilingual
- **Login, Inventory** were already clean (translation keys fixed in 10-01)

**10-04** (support file cleanup) is the remaining plan and can proceed. It covers vehicles.ts, sheets.ts, geminiService.ts, SovereignCrest.tsx -- files that generate customer-visible content but aren't page components.

**No blockers for subsequent plans.**
