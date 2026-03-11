# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-07)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** Phase 6 -- Admin Core (Plan 06-02 next: Lead Management)

## Current Position

Milestone: v0.1 Initial Release
Phase: 6 of 8 (Admin Core) -- In progress
Plan: 06-02 APPLY complete (Lead Management + Dashboard Stats + Admin Access)
Status: APPLY complete, ready for UNIFY
Last activity: 2026-03-10 -- Plan 06-02 APPLY complete

Progress:
- Milestone: [########░░] 75%
- Phase 1: [##########] 100% (complete)
- Phase 2: [##########] 100% (complete)
- Phase 3: [##########] 100% (complete)
- Phase 4: [##########] 100% (complete)
- Phase 5: [##########] 100% (complete)
- Phase 6: [#####░░░░░] 50% (plan 06-01 complete, 06-02 planned)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [Plan 06-02 applied, ready for UNIFY]
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
- Triple J is also a rental business — rentals feature confirmed for v0.2+
- BHPH payment calculator: simple division (no interest — built into vehicle price)
- Server components by default, client components only for interactivity (PaymentCalculator only)
- Accessibility: aria-hidden on decorative SVGs, htmlFor/id on form labels, 44px+ tap targets
- useActionState (React 19) for form handling, not deprecated useFormStatus
- Scroll animation performance: direct DOM manipulation via refs, cached canvas ctx, translate3d GPU compositing
- Lenis tuned: 1.2s duration, cubic easing, 1.0 wheelMultiplier
- Mobile menu: staggered entrance animation with computed CSS transition delays
- Admin auth: simple password-based with HMAC-signed cookies (no Supabase Auth for v0.1)
- Admin layout: separate from public (PublicShell conditionally hides Navbar/Footer/Lenis)
- VIN auto-decode in admin vehicle form (reuses /api/vin-decode endpoint)

### Deferred Issues
- No Supabase project connected yet -- user needs to create project and run schema.sql
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- No real vehicle images yet (placeholders)
- No pagination on inventory (6 vehicles, not needed until inventory grows)
- Email notifications on lead submission (future enhancement)
- CAPTCHA / rate limiting on forms (future enhancement)
- Photo upload to Supabase Storage (future)
- Next.js 16 "middleware" → "proxy" deprecation (monitor)

### Blockers/Concerns
- No Supabase project connected yet -- user needs to create project and run schema.sql

## Session Continuity

Last session: 2026-03-10
Stopped at: Plan 06-02 APPLY complete
Next action: Run /paul:unify .paul/phases/06-admin/06-02-PLAN.md
Resume file: .paul/phases/06-admin/06-02-PLAN.md

---
*STATE.md -- Updated after every significant action*
