---
phase: 10-brand-truth
plan: 06
subsystem: bilingual-translations
tags: [i18n, bilingual, translations, finance, payments, policies, vin-lookup]
dependency-graph:
  requires: [10-01, 10-02, 10-03, 10-04]
  provides: [complete-bilingual-coverage-all-pages]
  affects: [11-production-polish]
tech-stack:
  added: []
  patterns: [bilingual-array-mapping, split-string-bold-pattern]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/utils/translations.ts
    - triple-j-auto-investment-main/pages/VinLookup.tsx
    - triple-j-auto-investment-main/pages/Finance.tsx
    - triple-j-auto-investment-main/pages/PaymentOptions.tsx
    - triple-j-auto-investment-main/pages/Policies.tsx
decisions:
  - id: 10-06-01
    decision: "VIN validation error codes kept as technical strings (ERROR: SYNTAX_INVALID, etc.) -- these are standard technical codes not needing translation"
  - id: 10-06-02
    decision: "Bold text within translated paragraphs (48 hours, 3-5 business days) handled via split-string pattern: introBefore/introHighlight/introAfter and before/holdPeriod/after"
  - id: 10-06-03
    decision: "Payment methods in policies stored as array of {method, detail} objects matching existing services.list pattern"
metrics:
  duration: "8 minutes"
  completed: "2026-02-15"
---

# Phase 10 Plan 06: Bilingual Gap Closure for Finance, PaymentOptions, Policies, and VinLookup Summary

**One-liner:** Complete bilingual coverage for 4 remaining pages with 350+ new translation keys and professional VIN lookup language replacing terminal/hacker jargon.

## What Was Done

### Task 1: Add bilingual translation keys (f01290a)

Added approximately 350 new lines of translation keys to `translations.ts` across both EN and ES sections:

**Finance additions:**
- `finance.form` -- 8 keys (downPayment, creditProfile, credit tiers, vehiclePlaceholder, softInquiryNotice)
- `finance.requirements` -- title + 4-item array
- `finance.rates` -- 3 rate tier objects (label/rate/detail) + disclaimer
- `finance.importantNotice` -- title + content

**PaymentOptions additions:**
- `paymentOptions.cashAdvantages` -- title + 4-item array + IRS note
- `paymentOptions.cashiersRequirements` -- title + 4-item array
- `paymentOptions.debitDetails` -- title + 3-item array
- `paymentOptions.financingRequirements` -- title + 4-item array
- `paymentOptions.personalCheck` -- title + before/holdPeriod/after split

**Policies additions:**
- `policies.asIs` -- title, noWarranties, noReturns, mainWarning, p1, p2, acknowledge, 4-item array
- `policies.payment` -- title, acceptedMethods, methodsTitle, 5-item method/detail array, deposit object
- `policies.titleRegistration` -- title, compliance, introBefore/introHighlight/introAfter, buyerTitle, 4-item array, outOfState label/content
- `policies.inspection` -- title, prePurchaseTitle/Content, testDriveTitle, 4-item array
- `policies.privacyConsent` -- single string

**VinLookup additions:**
- `vinLookup.logs` -- 10 keys (connecting, accessGranted, decoding, extracting, populating, rendering, processing, initializing, connectionFailed, dataError)
- `vinLookup.fields` -- 6 keys (make, model, year, waitingForInput, dataStream, quickDecode)
- `vinLookup.resultLabels` -- 19 keys (manufacturer, model, year, bodyType, detailedConfig, trimLevel, series, transmission, doors, engineSpecs, cylinders, horsepower, drivetrain, fuelSystem, standardCombustion, manufacturingOrigin, plant, mfgEntity, verified)

### Task 2: Wire all 4 pages to translation system (90cf3fe)

**VinLookup.tsx (43 t.vinLookup.* references):**
- Replaced all terminal/hacker log messages: "INITIATING HANDSHAKE" -> t.vinLookup.logs.connecting, "ACCESS GRANTED" -> t.vinLookup.logs.accessGranted, etc.
- Replaced all result section headers: "Chassis Configuration" -> t.vinLookup.resultLabels.bodyType, "Entry Points" -> t.vinLookup.resultLabels.doors, "Powertrain & Performance Matrix" -> t.vinLookup.resultLabels.engineSpecs, etc.
- Replaced "ORIGIN POINT (PLANT)" -> t.vinLookup.resultLabels.manufacturingOrigin
- Replaced "MFG ENTITY" -> t.vinLookup.resultLabels.mfgEntity
- Replaced "Global Asset" fallback -> "N/A"
- Replaced "Data Stream" -> t.vinLookup.fields.dataStream
- Replaced "INITIALIZING..." -> t.vinLookup.logs.initializing
- Replaced "PROCESSING BITSTREAM..." -> t.vinLookup.logs.processing

**Finance.tsx (39 t.finance.* references):**
- "Down Payment" label -> t.finance.form.downPayment
- "Credit Profile" label -> t.finance.form.creditProfile
- All credit tier select options -> t.finance.form.creditExcellent/Good/Fair/Poor
- Vehicle placeholder -> t.finance.form.vehiclePlaceholder
- Soft inquiry notice -> t.finance.form.softInquiryNotice
- REQUIREMENTS heading + 4 items -> t.finance.requirements.title + .items.map()
- ESTIMATED RATES heading + 3 rate entries -> t.finance.rates.title + .excellent/.good/.fair
- Rates disclaimer -> t.finance.rates.disclaimer
- Important Notice heading + content -> t.finance.importantNotice.title/content

**PaymentOptions.tsx (25 t.paymentOptions.* references):**
- ADVANTAGES heading + 4 items -> t.paymentOptions.cashAdvantages.title + .items.map()
- IRS note -> t.paymentOptions.cashAdvantages.irsNote
- REQUIREMENTS (cashier's) heading + 4 items -> t.paymentOptions.cashiersRequirements
- DETAILS heading + 3 items -> t.paymentOptions.debitDetails
- REQUIREMENTS (financing) heading + 4 items -> t.paymentOptions.financingRequirements
- Personal check warning heading + content -> t.paymentOptions.personalCheck (before/holdPeriod/after)

**Policies.tsx (30 t.policies.* references):**
- AS-IS SALES POLICY section -> t.policies.asIs (title, noWarranties, noReturns, mainWarning, p1, p2, acknowledge, items)
- PAYMENT POLICY section -> t.policies.payment (title, acceptedMethods, methodsTitle, methods.map(), deposit)
- TITLE & REGISTRATION section -> t.policies.titleRegistration (title, compliance, intro split, buyerTitle, buyerItems, outOfState)
- INSPECTION & TEST DRIVE section -> t.policies.inspection (title, prePurchaseTitle/Content, testDriveTitle, testDriveItems)
- Privacy consent line -> t.policies.privacyConsent

## Verification Results

1. VinLookup.tsx: grep for terminal jargon (HANDSHAKE, CENTRAL DATABASE, POWERTRAIN, IDENTITY MATRIX, etc.) -- **ZERO matches**
2. Finance.tsx: grep for hardcoded English (Down Payment, Credit Profile, REQUIREMENTS, etc.) -- **ZERO matches**
3. PaymentOptions.tsx: grep for hardcoded English (ADVANTAGES, Same-day pickup, DETAILS, etc.) -- **ZERO matches**
4. Policies.tsx: grep for hardcoded English (AS-IS SALES POLICY, PAYMENT POLICY, BUYER RESPONSIBILITIES, etc.) -- **ZERO matches**
5. TypeScript compilation: **ZERO errors** in any modified file
6. Translation key counts: VinLookup 43, Finance 39, PaymentOptions 25, Policies 30

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 10-06-01 | VIN validation error codes kept as technical strings | Standard technical error codes (ERROR: SYNTAX_INVALID) are universal and not customer-facing prose |
| 10-06-02 | Bold text in paragraphs uses split-string pattern | introBefore/introHighlight/introAfter allows `<strong>` wrapping around highlighted text per-language |
| 10-06-03 | Payment methods stored as {method, detail} object arrays | Matches existing services.list pattern for consistency |

## Success Criteria Status

- [x] BRAND-06 requirement fully satisfied: consistent bilingual tone across ALL pages
- [x] Zero hardcoded English user-facing content in Finance.tsx, PaymentOptions.tsx, Policies.tsx, or VinLookup.tsx
- [x] VinLookup uses professional language ("Connecting to vehicle database...", "Vehicle data retrieved.", "Engine & Performance")
- [x] Spanish-speaking visitors see complete Spanish content on all 4 pages with no English remnants

## Next Phase Readiness

Phase 10 (Brand Truth) gap closure is complete. All customer-facing pages are now fully bilingual with zero hardcoded English content and zero SOVEREIGN framework jargon.
