# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-10)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** v0.1 MILESTONE COMPLETE

## Current Position

Milestone: v0.1 Initial Release — COMPLETE
Phase: 8 of 8 (SEO & Launch) -- COMPLETE
Plan: 08-01 UNIFIED
Status: All 8 phases complete. v0.1 milestone achieved.
Last activity: 2026-03-11 -- Plan 08-01 UNIFY complete, Phase 8 closed, v0.1 milestone complete

Progress:
- Milestone: [##########] 100% ★
- Phase 1: [##########] 100% (complete)
- Phase 2: [##########] 100% (complete)
- Phase 3: [##########] 100% (complete)
- Phase 4: [##########] 100% (complete)
- Phase 5: [##########] 100% (complete)
- Phase 6: [##########] 100% (complete)
- Phase 7: [##########] 100% (complete)
- Phase 8: [##########] 100% (complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [08-01 loop closed — MILESTONE COMPLETE]
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
- Footer as client component (imported by "use client" PublicShell — can't use server-only getTranslations)
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
- i18n: next-intl with prefix-based routing (/en/..., /es/...), localePrefix 'always'
- i18n split into 2 plans: infrastructure (07-01) then component integration (07-02)
- Scroll component CTAs use locale-aware Link from i18n/navigation

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
- Vercel Root Directory needs manual fix in dashboard (currently points to nested Vite codebase)
- html lang attribute: RESOLVED in Phase 8 (dynamic via getLocale)

### Blockers/Concerns
- No Supabase project connected yet -- user needs to create project and run schema.sql
- Vercel deployment blocked: Root Directory setting points to old Vite codebase — must be cleared in Vercel dashboard

## Session Continuity

Last session: 2026-03-11
Stopped at: v0.1 milestone complete — all 8 phases done
Next action: Push to GitHub, then plan v0.2 or deploy to production
Resume file: N/A (milestone boundary)

---
*STATE.md -- Updated after every significant action*
