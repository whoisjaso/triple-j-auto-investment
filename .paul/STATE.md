# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-10)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** Phase 7 -- Bilingual (i18n)

## Current Position

Milestone: v0.1 Initial Release
Phase: 7 of 8 (Bilingual / i18n) -- Not started
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-10 -- Phase 6 complete, transitioned to Phase 7

Progress:
- Milestone: [########░░] 75%
- Phase 1: [##########] 100% (complete)
- Phase 2: [##########] 100% (complete)
- Phase 3: [##########] 100% (complete)
- Phase 4: [##########] 100% (complete)
- Phase 5: [##########] 100% (complete)
- Phase 6: [##########] 100% (complete)
- Phase 7: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [06-02 loop closed, Phase 6 complete]
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
- Scroll-driven frame animations: Canvas + ImageBitmap + rAF-only + IntersectionObserver (no double-smoothing)
- Lenis lerp mode (0.08) for smooth scroll on desktop; native scroll on touch devices
- Frame assets extracted from user-provided MP4 videos via ffmpeg (not old codebase)
- Rolls Royce-style centered navbar: logo center, links split left/right, phone CTA right with divider
- All sections: 121 WebP frames, black backgrounds, edge-fade radial masks
- Mobile: frame skipping (every 2nd), canvas buffer scaling (50%), IntersectionObserver rAF pausing
- Crest section: no text overlay on animation — crest IS the brand identity
- CSS custom properties for responsive canvas sizing (mobile-first breakpoints)
- Footer as server component with subtle "Dealer Login" link in compliance bar
- Card hover uses translate-y (not scale) to avoid grid layout shifts
- NHTSA VIN decoder proxied through /api/vin-decode route (avoids CORS, adds normalization)
- VinDecoder component supports alwaysOpen prop for embedded vs standalone usage
- Triple J is also a rental business — rentals feature confirmed for v0.2+
- BHPH payment calculator: simple division (no interest — built into vehicle price)
- Server components by default, client components only for interactivity
- Accessibility: aria-hidden on decorative SVGs, htmlFor/id on form labels, 44px+ tap targets
- useActionState (React 19) for form handling, not deprecated useFormStatus
- Mobile menu: staggered entrance animation with computed CSS transition delays
- Admin auth: simple password-based with HMAC-signed cookies (no Supabase Auth for v0.1)
- Admin layout: separate from public (PublicShell conditionally hides Navbar/Footer/Lenis)
- VIN auto-decode in admin vehicle form (reuses /api/vin-decode endpoint)
- Lead status cycling via form button (server component, no client JS on leads page)

### Deferred Issues
- No Supabase project connected yet -- user needs to create project and run schema.sql
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- No real vehicle images yet (placeholders)
- No pagination on inventory (6 vehicles, not needed until inventory grows)
- Email notifications on lead submission (future enhancement)
- CAPTCHA / rate limiting on forms (future enhancement)
- Photo upload to Supabase Storage (future)
- Next.js 16 "middleware" → "proxy" deprecation (monitor)
- Mock lead status changes not persisted (page refresh resets in mock mode)

### Blockers/Concerns
- No Supabase project connected yet -- user needs to create project and run schema.sql

## Session Continuity

Last session: 2026-03-10
Stopped at: Phase 6 complete, ready to plan Phase 7
Next action: /paul:plan for Phase 7 (Bilingual / i18n)
Resume file: .paul/ROADMAP.md

---
*STATE.md -- Updated after every significant action*
