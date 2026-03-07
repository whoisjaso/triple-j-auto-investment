# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-07)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** Phase 4 -- Inventory System

## Current Position

Milestone: v0.1 Initial Release
Phase: 4 of 8 (Inventory System) -- In Progress
Plan: 04-01 complete (Vehicle Listings Page + VIN Decoder)
Status: Loop closed, ready for Plan 04-02
Last activity: 2026-03-07 -- Unified Plan 04-01

Progress:
- Milestone: [#####░░░░░] 50%
- Phase 1: [##########] 100% (complete)
- Phase 2: [##########] 100% (complete)
- Phase 3: [##########] 100% (complete)
- Phase 4: [#####░░░░░] 50% (Plan 01 complete — listings + VIN decoder)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop closed]
```

## Accumulated Context

### Decisions
- Next.js rebuild from scratch (not continuing React/Vite codebase)
- Bottom-up approach: simplest foundations first, psychological layers last
- SOVEREIGN framework is internal reference only
- v0.1 scoped to 8 phases: Foundation > Database > Cinematic Homepage > Inventory > Leads > Admin > i18n > Launch
- Advanced features (rentals, plates, registration, owner portal, AI, behavioral tracking) deferred to v0.2+
- Next.js 16.1.6 with Tailwind CSS v4 (CSS-first config via @theme)
- Fonts: Playfair Display (serif), Plus Jakarta Sans (sans), Cormorant Garamond (accent)
- Tailwind source restricted to src/ to avoid old codebase interference
- Dual type system: VehicleRow (snake_case) + Vehicle (camelCase) with mapper functions
- RLS: anon SELECT vehicles + INSERT leads; authenticated full access
- Phase 3 redefined: "Layout Shell" + "Homepage" + "Animation" merged into "Cinematic Homepage & Layout"
- Luxury-first design: Pure black (#000000) palette with gold accents, Apple/Rolls Royce/Loro Piana aesthetic
- Scroll-driven frame animations: Canvas + batched preload + passive scroll + rAF + IntersectionObserver
- Lenis for smooth scroll on desktop; native scroll on touch devices
- Frame assets extracted from user-provided MP4 videos via ffmpeg (not old codebase)
- Rolls Royce-style centered navbar: logo center, links split left/right, phone CTA right with divider
- All sections: 121 WebP frames, black backgrounds, edge-fade radial masks
- Mobile: frame skipping (every 2nd), canvas buffer scaling (50%), IntersectionObserver rAF pausing
- Crest section: no text overlay on animation — crest IS the brand identity
- CSS custom properties for responsive canvas sizing (mobile-first breakpoints)
- Footer as server component (no client JS, no hydration cost)
- Card hover uses translate-y (not scale) to avoid grid layout shifts
- NHTSA VIN decoder proxied through /api/vin-decode route (avoids CORS, adds normalization)
- VinDecoder component supports alwaysOpen prop for embedded vs standalone usage

### Deferred Issues
- Not a git repo -- should initialize git and push to GitHub
- No Supabase project connected yet -- user needs to create project and run schema.sql
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- Vehicle detail page /inventory/[slug] returns 404 (Plan 04-02)
- No real vehicle images yet (placeholders)

### Blockers/Concerns
- Not a git repo -- should initialize git and push to GitHub
- No Supabase project connected yet -- user needs to create project and run schema.sql

## Session Continuity

Last session: 2026-03-07
Stopped at: Plan 04-01 unified, user wants git push
Next action: Initialize git, push to GitHub, then plan 04-02
Resume file: .paul/phases/04-inventory/04-01-SUMMARY.md

---
*STATE.md -- Updated after every significant action*
