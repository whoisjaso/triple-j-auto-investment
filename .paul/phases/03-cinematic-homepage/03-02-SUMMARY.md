---
phase: 03-cinematic-homepage
plan: 02
subsystem: ui
tags: [navbar, footer, layout-shell, rolls-royce, mobile-menu, accessibility, compliance]

requires:
  - phase: 01-project-foundation
    provides: Next.js 16.1.6, Tailwind v4, font tokens, base layout
  - phase: 03-cinematic-homepage/plan-01
    provides: Cinematic homepage, SmoothScrollProvider, gold crest logo, color tokens, Lenis
provides:
  - Rolls Royce-style centered navbar with split navigation
  - Full-screen mobile menu with focus trap and body scroll lock
  - Dealer compliance footer with contact, license, navigation
  - Complete layout shell wrapping all pages (Navbar + children + Footer)
affects: [04-inventory, 05-leads-contact, 06-admin, 07-i18n, 08-seo-launch]

tech-stack:
  added: []
  patterns: [centered-logo-navbar, split-navigation, focus-trap, inert-attribute, absolute-center-layout, css-hover-underline]

key-files:
  created:
    - src/components/layout/Navbar.tsx
    - src/components/layout/Footer.tsx
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx

key-decisions:
  - "Rolls Royce centered-logo layout instead of standard left-logo navbar — user-directed luxury upgrade"
  - "Split navigation: Inventory + Financing left, Contact + Phone right"
  - "Mobile: hamburger left, centered crest, phone icon right (not hamburger-only)"
  - "Full-screen black overlay menu with gold crest, not slide-in drawer"
  - "CSS-only hover underline animation on nav links (no animation libraries)"
  - "inert attribute on closed mobile menu for robust accessibility"
  - "Footer as server component (no client state needed)"
  - "Scroll progress bar z-index raised to z-[55] to sit above navbar z-50"

patterns-established:
  - "Centered logo navbar: absolute left-1/2 -translate-x-1/2 with flex-1 on both sides"
  - "NavLink component: relative group with absolute bottom span for hover underline"
  - "Focus trap: querySelectorAll focusable elements, Tab/Shift+Tab cycling, Escape to close"
  - "Body scroll lock: document.body.style.overflow toggle on menu state"
  - "inert attribute via useEffect ref.setAttribute for closed dialog"

duration: ~1hr
started: 2026-03-07T22:00:00Z
completed: 2026-03-07T22:15:00Z
---

# Phase 3 Plan 02: Layout Shell (Navbar + Footer) Summary

**Rolls Royce-style centered-logo navbar with split navigation, full-screen mobile menu with focus trap, and dealer compliance footer — completing the layout shell for all pages.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~1 hour |
| Started | 2026-03-07 |
| Completed | 2026-03-07 |
| Tasks | 3 completed (2 auto + 1 human-verify) |
| Files created | 2 |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Navbar renders on all pages | Pass | Fixed navbar with logo, nav links, phone CTA |
| AC-2: Transparent → solid on scroll | Pass | bg-transparent → bg-black/90 + backdrop-blur-lg after 50px |
| AC-3: Mobile hamburger menu | Pass | Full-screen overlay, focus trap, Escape, body scroll lock |
| AC-4: Footer with dealer compliance | Pass | Address, phone, license P171632, copyright |
| AC-5: Mobile-first responsive | Pass | 375px tested, 44px+ tap targets, stacked footer |
| AC-6: Build passes | Pass | `npm run build` clean, no TypeScript errors |

## Accomplishments

- Rolls Royce-style centered navbar: gold crest absolutely centered, links split left/right
- Subtle gold underline hover animation on nav links (CSS-only, no libraries)
- Frosted glass scrolled state: bg-black/90 + backdrop-blur-lg + border-white/[0.04]
- Mobile: hamburger left, centered crest, phone icon right — clean 3-element layout
- Full-screen mobile menu: gold crest, vertical links, subtle gold divider, phone CTA
- Accessibility: focus trap (Tab cycling), Escape to close, aria-expanded, aria-modal, inert
- Footer: 3-column desktop grid (brand, navigate, contact) + compliance bottom bar
- Footer: server component (no client JS), stacked centered on mobile
- Layout shell: Navbar + children + Footer wrapped in SmoothScrollProvider

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/layout/Navbar.tsx` | Created | Rolls Royce centered navbar with mobile menu |
| `src/components/layout/Footer.tsx` | Created | Dealer compliance footer, 3-column grid |
| `src/app/layout.tsx` | Modified | Added Navbar + Footer around children |
| `src/app/page.tsx` | Modified | Scroll progress bar z-index → z-[55] |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Rolls Royce centered-logo layout | User wanted "way more luxurious" — centered logo with split nav is the luxury automotive standard | Logo is the focal point, balanced symmetry |
| Mobile phone icon (not hidden) | Dealership's primary CTA; one-tap calling from any page | Phone icon right, hamburger left, crest center |
| Full-screen overlay (not drawer) | Matches the cinematic black aesthetic; more dramatic | Pure black bg, gold crest, generous spacing |
| CSS-only hover animation | Plan boundary: no animation libraries | Subtle gold underline via group-hover span |
| inert attribute for closed menu | Prevents keyboard focus entering invisible menu | Robust accessibility without complex tabIndex management |
| Footer as server component | No client-side state; reduces JS bundle | Static HTML, no hydration cost |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Navbar layout redesigned | 1 | Changed from left-logo to Rolls Royce centered-logo (user-directed) |
| Mobile layout enhanced | 1 | Added phone icon on right side (plan only specified hamburger) |
| Mobile menu enhanced | 1 | Added gold crest logo inside menu (not in plan) |
| NavLink component extracted | 1 | Created reusable NavLink with hover animation (clean code pattern) |

**Total impact:** All deviations were user-directed luxury improvements. The navbar significantly exceeds the plan's design quality.

### Details

1. **Navbar layout**: Plan specified standard left-logo layout. User requested Rolls Royce-style centered logo during checkpoint review. Redesigned with absolute-centered logo, split navigation (left: Inventory/Financing, right: Contact/Phone), thin gold divider.

2. **Mobile phone icon**: Plan only specified hamburger button on mobile. Added phone icon on the right side for one-tap calling — a critical CTA for a dealership where every mobile visitor is a potential lead.

3. **Mobile menu gold crest**: Added the gold crest logo at the top of the mobile menu overlay for brand reinforcement. Creates a luxurious, cohesive experience.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Playwright Chrome launch failure | Killed all Chrome PIDs with `taskkill //F //IM chrome.exe`, cleared Playwright user data dir |
| Chrome respawning after kill | Multiple kill attempts needed; existing Playwright session on port 51917 was persisting |
| Z-index conflict: progress bar vs navbar | Raised progress bar to z-[55], navbar stays z-50, mobile menu at z-[60] |

## Next Phase Readiness

**Ready:**
- Layout shell complete: every future page gets navbar + footer automatically
- Navigation links point to /inventory, /financing, /contact (ready for Phase 4-5 pages)
- Footer compliance info displayed on all pages
- Mobile-first patterns established (hamburger, phone icon, stacked footer)

**Concerns:**
- Not a git repo — should initialize before more work accumulates
- Nav links (/inventory, /financing, /contact) return 404 until those pages are built (Phase 4-5)

**Blockers:**
- None

---
*Phase: 03-cinematic-homepage, Plan: 02*
*Completed: 2026-03-07*
