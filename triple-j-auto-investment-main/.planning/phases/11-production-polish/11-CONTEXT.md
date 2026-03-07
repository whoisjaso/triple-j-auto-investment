# Phase 11: Production Polish - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the site feel production-grade on every device — fast, responsive, accessible, and graceful when things go wrong. Covers mobile responsiveness, performance optimization, loading/error/empty states, visual consistency, and accessibility basics. Does NOT add new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Mobile Experience
- Target viewports: 375px (iPhone SE/older) through 414px (iPhone Plus/Android) — mix of iPhone and Android users
- Content adaptation: Claude's discretion per page — judge what's primary vs secondary and collapse accordingly
- Navigation pattern: Claude's discretion — evaluate current hamburger menu and pick best pattern for the site's page count
- Phone-specific actions (tap-to-call, tap-to-text, directions): Claude's discretion on placement and stickiness based on dealership conversion patterns

### Loading & Error States
- Loading indicators: Claude's discretion per context — skeletons for major content areas, spinners for smaller operations
- Error message tone: Claude's discretion based on severity — gentle retry for minor issues, direct to phone/in-person for major failures
- Empty states: Claude's discretion per context — some warrant illustrations, others clean text
- Offline behavior: Site should have offline awareness (detect and communicate offline state to user)
- Maintenance page: Branded maintenance page with Triple J logo for when the site is intentionally down for adjustments. Professional, reusable for future maintenance windows

### Splash Screen & Performance
- Splash screen: KEEP the full animated splash screen as-is. Brand experience takes priority over raw LCP metric. The 2.5s LCP target applies to content loading after splash, not including splash duration
- Console.log cleanup: Claude's discretion (standard production approach)
- Image optimization: Claude's discretion — pick the right balance for a vehicle listing site with photos
- Animation libraries: KEEP all animations (GSAP, Framer Motion, custom cursor, smooth scroll). Accept the bundle size. Full animations on all devices

### Visual Consistency
- Theme: KEEP the dark luxury aesthetic (black/gold). Polish within this palette — fix inconsistencies but don't change the vibe
- Consistency level: Pixel-perfect consistency across all pages. Same spacing scale, button styles, card styles everywhere. Worth the effort
- Viewport zooming: KEEP user-scalable=no disabled. App-like feel preserved. Acknowledge this is an accessibility trade-off
- Accessibility depth: Claude's discretion — target the success criteria (alt text, WCAG AA contrast, keyboard nav for primary flows) and no more

### Claude's Discretion
- Mobile navigation pattern (hamburger vs bottom nav vs other)
- Phone action placement (sticky vs header/footer)
- Loading state type per context (skeleton vs spinner)
- Error message tone calibration per severity
- Empty state design per context
- Console.log stripping strategy
- Image optimization aggressiveness
- Accessibility implementation depth (meeting success criteria)

</decisions>

<specifics>
## Specific Ideas

- Maintenance page with Triple J logo — professional branded page for when site is down for adjustments. User specifically requested this for future-proofing maintenance windows
- Offline awareness — detect offline state and communicate it to the user (not full offline mode, but clear messaging)
- User values the splash screen animation as part of the brand identity — do not shorten or remove
- All animations (GSAP, Framer Motion, custom cursor, smooth scroll) are considered part of brand identity
- Pixel-perfect consistency is important — user wants professional, polished feel across every page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-production-polish*
*Context gathered: 2026-02-15*
