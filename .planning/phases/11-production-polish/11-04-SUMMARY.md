---
phase: 11-production-polish
plan: 04
subsystem: frontend-visual-consistency
tags: [spacing, buttons, padding, tracking, canonical-patterns, visual-consistency]
dependency-graph:
  requires: ["11-02", "11-03"]
  provides: ["POLISH-08 consistent spacing system", "POLISH-09 consistent button/link styles"]
  affects: ["11-05", "11-06"]
tech-stack:
  added: []
  patterns: ["canonical-section-padding (py-16 md:py-24 / py-20 md:py-32)", "canonical-card-padding (p-6 md:p-8)", "canonical-page-padding (px-4 md:px-6)", "canonical-button-tracking (tracking-[0.3em])", "canonical-button-sizing (py-4 px-8 text-xs)"]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/pages/Home.tsx
    - triple-j-auto-investment-main/pages/Inventory.tsx
    - triple-j-auto-investment-main/pages/About.tsx
    - triple-j-auto-investment-main/pages/Contact.tsx
    - triple-j-auto-investment-main/pages/Services.tsx
    - triple-j-auto-investment-main/pages/Finance.tsx
    - triple-j-auto-investment-main/pages/FAQ.tsx
    - triple-j-auto-investment-main/pages/Policies.tsx
    - triple-j-auto-investment-main/pages/PaymentOptions.tsx
    - triple-j-auto-investment-main/pages/VinLookup.tsx
    - triple-j-auto-investment-main/pages/Legal.tsx
    - triple-j-auto-investment-main/pages/NotFound.tsx
    - triple-j-auto-investment-main/App.tsx
decisions:
  - id: "11-04-01"
    decision: "All CTA buttons standardized to py-4 px-8 text-xs tracking-[0.3em]; hero buttons keep py-5 px-12 md:py-6 md:px-16"
    rationale: "Establishes 4 canonical button types with consistent sizing across the entire site"
  - id: "11-04-02"
    decision: "Card/panel padding standardized to p-6 md:p-8 (was p-8, p-10, p-12, sm:p-10, sm:p-12 inconsistently)"
    rationale: "p-6 md:p-8 provides 24px mobile / 32px desktop, balancing content room with visual breathing space"
  - id: "11-04-03"
    decision: "Section padding follows two-tier scale: py-16 md:py-24 (standard) and py-20 md:py-32 (hero/large)"
    rationale: "Eliminates arbitrary values like py-40, py-32 (without responsive), py-24 (without mobile variant)"
  - id: "11-04-04"
    decision: "Footer padding changed to py-16 md:py-20 (slightly less than page sections) with quick links upgraded to py-3"
    rationale: "Footer is a utility area, not a content section; py-3 links ensure touch target compliance"
  - id: "11-04-05"
    decision: "tracking-[0.2em] on non-button text (labels, headings, select elements, footer headings) preserved unchanged"
    rationale: "Canonical tracking-[0.3em] applies only to interactive CTA buttons; label text uses different tracking intentionally"
metrics:
  duration: "~8 minutes"
  completed: "2026-02-16"
---

# Phase 11 Plan 04: Visual Consistency Summary

**One-liner:** Canonical spacing scale (py-16/py-20 + p-6 md:p-8) and button patterns (py-4 px-8 text-xs tracking-[0.3em]) applied across all 13 customer-facing pages plus footer.

## What Was Done

### Task 1: Canonical Patterns + First 6 Pages (e00da5c)

**Canonical patterns established:**

| Pattern | Class | Usage |
|---------|-------|-------|
| Section padding (standard) | `py-16 md:py-24` | Most content sections |
| Section padding (hero/large) | `py-20 md:py-32` | Hero sections, major CTAs |
| Page horizontal padding | `px-4 md:px-6` | All page content wrappers |
| Card/panel padding | `p-6 md:p-8` | All info cards, content panels |
| Primary CTA button | `bg-tj-gold text-black font-bold py-4 px-8 text-xs uppercase tracking-[0.3em]` | Main action buttons |
| Hero CTA (large) | Same + `py-5 px-12 md:py-6 md:px-16` | Hero/full-width CTAs |
| Ghost/outline button | `border border-tj-gold text-tj-gold font-bold py-4 px-8 text-xs uppercase tracking-[0.3em]` | Secondary actions |
| Text link | `text-tj-gold text-xs uppercase tracking-[0.3em]` | Tertiary actions |

**Home.tsx:**
- Featured vehicles section: `py-24` to `py-16 md:py-24`, added `px-4 md:px-6`
- Value pillars section: `py-24 px-6` to `py-16 md:py-24 px-4 md:px-6`
- Pillar cards: `p-6 sm:p-10` to `p-6 md:p-8` (3 cards)
- "What Sets Us Apart" section: `py-16 sm:py-20` to `py-16 md:py-24`
- Cards: `p-6 sm:p-8` to `p-6 md:p-8` (3 cards)
- Mobile "View All" button: `tracking-widest` to `tracking-[0.3em]` + hover states

**Inventory.tsx:**
- "I'm Interested" button: `tracking-[0.25em] text-[10px]` to `tracking-[0.3em] text-xs`
- Modal submit button: `py-5 text-sm tracking-[0.2em]` to `py-4 text-xs tracking-[0.3em]`
- Mobile FAB: `tracking-[0.2em]` to `tracking-[0.3em]`
- "Call Us Now" link: `text-sm tracking-[0.2em]` to `text-xs tracking-[0.3em]`
- Error retry button: `text-[10px] tracking-widest` to `text-xs tracking-[0.3em]`
- Reload button: `text-[10px] tracking-widest px-6` to `text-xs tracking-[0.3em] px-8 font-bold`
- Empty state CTA: `text-[10px] tracking-widest` to `text-xs tracking-[0.3em]`

**About.tsx:**
- Story section: `py-32` to `py-20 md:py-32`
- Values section: `py-40` to `py-20 md:py-32`
- Value cards: `p-10` to `p-6 md:p-8` (3 cards)
- Story text card: `p-6 sm:p-10` to `p-6 md:p-8`
- Bilingual section: `py-32` to `py-16 md:py-24`
- Info card: `p-6 sm:p-12` to `p-6 md:p-8`
- Location info panel: `p-6 sm:p-12` to `p-6 md:p-8`
- CTA section: `py-32 px-6` to `py-20 md:py-32 px-4 md:px-6`
- Directions button: `tracking-[0.2em]` to `tracking-[0.3em]`

**Contact.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Form container: `p-6 sm:p-12` to `p-6 md:p-8`
- Contact info cards: `p-8` to `p-6 md:p-8` (3 cards)
- Error retry button: `text-[10px] tracking-widest py-3` to `text-xs tracking-[0.3em] py-4`

**Services.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Service cards: `p-6 sm:p-10` to `p-6 md:p-8` (5 cards via dynamic rendering)
- "What We Don't Do" section: `p-6 sm:p-12` to `p-6 md:p-8`

**Finance.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Benefit cards: `p-8` to `p-6 md:p-8` (3 cards)
- Form container: `p-6 sm:p-12` to `p-6 md:p-8`
- Sidebar cards: `p-8` to `p-6 md:p-8` (2 cards)
- Error retry button: `text-[10px] tracking-widest py-3` to `text-xs tracking-[0.3em] py-4`

### Task 2: Remaining Pages + Footer (d3b495b)

**FAQ.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- CTA section card: `p-12` to `p-6 md:p-8`

**Policies.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- AS-IS policy section: `p-12` to `p-6 md:p-8`
- Payment policy section: `p-12` to `p-6 md:p-8`
- Title & Registration section: `p-12` to `p-6 md:p-8`
- Inspection section: `p-12` to `p-6 md:p-8`
- Privacy section: `p-12` to `p-6 md:p-8`
- Disclaimer footer: `p-8` to `p-6 md:p-8`

**PaymentOptions.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Payment method cards: `p-6 sm:p-10` to `p-6 md:p-8` (4 cards)
- Personal check warning: `p-8` to `p-6 md:p-8`
- Security notice: `p-8` to `p-6 md:p-8`

**VinLookup.tsx:**
- Page wrapper: `px-4` to `px-4 md:px-6` (terminal UI internals kept as-is)

**Legal.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Content panel: `p-12` to `p-6 md:p-8`

**NotFound.tsx:**
- Page wrapper: `px-6` to `px-4 md:px-6`
- Navigation cards: `p-8` to `p-6 md:p-8` (3 cards)

**App.tsx (Footer):**
- Footer section padding: `py-20` to `py-16 md:py-20`
- Quick links: `py-2` to `py-3` for touch target compliance (5 links + 1 admin link)

## Cross-Page Verification

| Anti-Pattern | Scope | Result |
|---|---|---|
| `tracking-[0.2em]` on button elements | All 13 pages + footer | Zero instances |
| `py-3` on primary CTA buttons | All 13 pages + footer | Zero instances (py-3 only on non-buttons) |
| `py-5`/`py-6` on non-hero CTA buttons | All 13 pages + footer | Zero instances |
| `text-sm` on CTA buttons | Customer-facing pages | Zero instances (admin-only exempt) |
| `p-10`/`p-12` on regular cards | Customer-facing pages | Zero instances (admin-only exempt) |
| Build errors | Full build | Zero errors |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Canonical button sizing:** `py-4 px-8 text-xs tracking-[0.3em]` applied to all CTA buttons. Hero variant keeps larger sizing. This replaces the mix of `py-3`/`py-5`, `text-sm`/`text-[10px]`, and `tracking-[0.2em]`/`tracking-widest`.

2. **Canonical card padding:** `p-6 md:p-8` replaces `p-8`, `p-10`, `p-12`, `sm:p-10`, `sm:p-12`. The 11-03 responsive pattern (`p-6 sm:p-10/p-12`) was further standardized to `p-6 md:p-8` for tighter consistency.

3. **Section padding two-tier scale:** Standard sections use `py-16 md:py-24`, hero/large sections use `py-20 md:py-32`. Eliminates desktop-only fixed values like bare `py-24`, `py-32`, `py-40`.

4. **Non-button tracking preserved:** `tracking-[0.2em]` on labels, headings, select dropdowns, and footer headings kept unchanged. The plan explicitly exempts non-interactive text from the canonical CTA pattern.

5. **Footer quick links touch targets:** Upgraded from `py-2` to `py-3` to match the legal links touch targets established in 11-03.

## Next Phase Readiness

- **11-05 (Visual consistency):** POLISH-08 (spacing) and POLISH-09 (buttons) are now complete. 11-05 can focus on remaining visual items if any.
- **11-06 (Accessibility):** Consistent spacing and button sizes provide a solid foundation for ARIA labels, keyboard navigation, and contrast checks.
