# Phase 13: Focus Capture - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A visitor's first 3 seconds on the site break the "used car lot" script -- they register novelty, authority, and tribe belonging before conscious evaluation begins. This phase covers the hero section and the first scroll section (authority metrics strip) of the homepage. The rest of the homepage below these sections stays as-is from Phase 10 work. No new capabilities (chat, commitment actions, vehicle pages) -- those belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Hero Visual Approach
- Animated illustration with abstract motion -- geometric or flowing shapes evoking speed, trust, aspiration. No literal family/vehicle imagery in the hero animation itself
- Continuous subtle loop -- gentle ongoing motion (floating particles, flowing gradients) that feels alive without being distracting
- Claude's Discretion: Full-bleed immersive vs contained layout -- pick what works best with animated abstract motion on the dark luxury theme

### Authority Signals
- Animated count-up numbers when they scroll into view -- eye-catching, modern
- Metrics only, no testimonial quotes on the landing page -- keep it to numbers
- Claude's Discretion: Which real metrics to display (families served, reviews, years in business -- pick the most impactful combination from available data)
- Claude's Discretion: Placement relative to hero (overlaid vs just-below strip) -- pick what works best with the animated hero

### Bilingual/Cultural Experience
- Browser language auto-detect (Accept-Language header) AND prominent visible toggle -- both mechanisms
- "Se Habla Espanol" visible in hero area AND as a persistent site-wide indicator throughout the site
- Claude's Discretion: Whether visual imagery/design shifts subtly when viewing in Spanish, or stays identical with only text changing
- Claude's Discretion: Whether a first-visit language selection splash helps or hurts the 3-second first impression goal

### Visual Identity & Mood
- Keep dark luxury aesthetic -- black/dark backgrounds with gold accents, consistent with current site
- Primary hero CTA: "Schedule a Visit" / "Call Now" direction -- push toward human connection first, not inventory browsing
- Scope: Hero section + first scroll section (authority metrics). Rest of homepage stays as-is
- Claude's Discretion: Whether to keep the 1.7s splash screen before the hero or remove it for faster first impression
- Claude's Discretion: Whether to add parallax fade scroll transition between hero and authority section, or use clean section break

### Claude's Discretion
- Hero layout approach (full-bleed vs contained)
- Authority metrics placement and specific numbers to show
- Scroll transition effects (parallax vs clean break)
- Splash screen keep/remove decision
- Language splash modal on first visit
- Cultural visual adaptation in Spanish mode
- Typography and spacing within the dark luxury framework
- Mobile hero adaptation approach

</decisions>

<specifics>
## Specific Ideas

- Abstract motion animation should break the "used car lot" expectation -- visitors should see something they've never encountered on a dealership site
- The animation should feel premium despite the $3K-$8K price range -- the dark luxury aesthetic bridges this gap
- CTA pushes toward human connection ("Schedule a Visit" / "Call Now") because the $3K-$8K buyer likely needs financing conversation
- Bilingual experience should feel native, not bolted-on -- "Se Habla Espanol" as identity signal, not afterthought

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 13-focus-capture*
*Context gathered: 2026-02-17*
