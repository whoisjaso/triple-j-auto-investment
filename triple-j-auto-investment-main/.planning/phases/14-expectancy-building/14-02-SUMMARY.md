---
phase: 14-expectancy-building
plan: 02
subsystem: ai-content-pipeline
tags: [gemini-ai, bilingual, admin-form, identity-headline, vehicle-story, slug, market-estimate]
dependency-graph:
  requires: [14-01]
  provides: [ai-headline-generator, ai-story-generator, admin-phase14-form]
  affects: [14-03, 14-04]
tech-stack:
  added: []
  patterns: [bilingual-json-ai-response, code-fence-stripping, auto-compute-on-save]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/services/geminiService.ts
    - triple-j-auto-investment-main/pages/admin/Inventory.tsx
decisions:
  - id: 14-02-01
    decision: "AI generators return bilingual {en, es} JSON; Gemini response cleaned of markdown code fences before parse"
    rationale: "Gemini often wraps JSON in ```json blocks; cleanJsonResponse helper handles this reliably"
  - id: 14-02-02
    decision: "Slug and market estimate auto-computed on save only if empty (not overwritten on every save)"
    rationale: "Preserves admin overrides; slug should not change once set (would break URLs)"
metrics:
  duration: ~29 min
  completed: 2026-02-18
---

# Phase 14 Plan 02: AI Content Pipeline & Admin Form Summary

**One-liner:** Two new Gemini AI functions (generateIdentityHeadline, generateVehicleStory) returning bilingual JSON, wired into admin inventory form with generate buttons, verified checkbox, slug preview, and auto-compute on save.

## What Was Done

### Task 1: Add identity headline and vehicle story generators to geminiService.ts
**Commit:** `e6331d9`

- **cleanJsonResponse helper**: Module-level function strips markdown code fences (`json ... `) from Gemini responses before JSON.parse
- **generateIdentityHeadline**: Takes make, model, year, bodyType?, diagnostics[]. Returns `Promise<{ en: string; es: string }>`. Prompt instructs Gemini to produce identity-first headlines (WHO this car is for, max 15 words, format: "[Identity Label] | [descriptive words]"). Falls back to `{year} {make} {model}` on error.
- **generateVehicleStory**: Takes make, model, year, mileage, diagnostics[], description. Returns `Promise<{ en: string; es: string }>`. Prompt instructs Gemini to write 3-5 sentence honest stories with transparent condition disclosure. Falls back to generic contact-us text on error.
- Both use `gemini-2.5-flash` with `thinkingBudget: 1024`
- Both handle no-API-key and parse-failure gracefully with fallback returns

### Task 2: Extend admin inventory form with Phase 14 fields and AI generation buttons
**Commit:** `9f6be38`

- **New imports**: generateIdentityHeadline, generateVehicleStory, generateVehicleSlug, estimateMarketValue, plus Sparkles/BookOpen/ShieldCheck/LinkIcon Lucide icons
- **New state**: isGeneratingHeadline, isGeneratingStory (loading indicators for AI buttons)
- **Phase 14 form section**: New "Phase 14: Listing Enhancement" block between Visuals & Narrative section and submit button, containing:
  - Identity Headline (EN) textarea, 2 rows
  - Identity Headline (ES) textarea, 2 rows
  - "Generate Headlines" button -- calls generateIdentityHeadline, populates both fields, shows Loader2 spinner, disabled if make/model empty
  - Vehicle Story (EN) textarea, 4 rows
  - Vehicle Story (ES) textarea, 4 rows
  - "Generate Story" button -- calls generateVehicleStory, populates both fields, shows Loader2 spinner
  - Triple J Verified checkbox with ShieldCheck icon
  - Slug Preview (read-only) showing current or projected slug
- **handleSubmit**: Auto-generates slug if empty (via generateVehicleSlug), auto-calculates market estimate if empty (via estimateMarketValue)
- **handleCancelEdit**: Resets Phase 14 fields (identityHeadline, identityHeadlineEs, vehicleStory, vehicleStoryEs, isVerified, slug, marketEstimate)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles clean (zero errors in geminiService.ts and Inventory.tsx)
- [x] Vite build succeeds (2m 8s, all chunks generated)
- [x] geminiService.ts exports 3 generate functions (generateVehicleDescription + 2 new)
- [x] Admin Inventory.tsx has "Phase 14: Listing Enhancement" section (3 occurrences of "Phase 14")
- [x] generateIdentityHeadline imported and wired to button onClick
- [x] generateVehicleStory imported and wired to button onClick
- [x] generateVehicleSlug imported and used in handleSubmit + slug preview
- [x] estimateMarketValue imported and used in handleSubmit

## Next Phase Readiness

All downstream plans can now consume:
- AI-generated bilingual headlines and stories stored in database via existing addVehicle/updateVehicle flow
- Admin can generate, review, and edit AI content before saving
- Slug auto-generated on save, visible in preview
- Market estimate auto-calculated on save
- Existing vehicles without AI content will render with fallbacks (handled in Plans 03-04)
