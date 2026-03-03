# Homepage Premium Showroom Redesign

**Date:** 2026-02-22
**Status:** Approved
**Goal:** Transform the homepage from stark brutalism to an immersive premium showroom experience using the existing luxury component library and green+gold design language.

## Context

The homepage uses a bare-bones brutalist aesthetic (pure black backgrounds, plain buttons, minimal animation) while the rest of the site (About, Inventory, VehicleDetail) uses rich dark greens, gold glows, gradient overlays, and decorative accents. A full luxury component library exists (`components/luxury/`) but is unused on the homepage.

## Design Decisions

- **Approach:** Upgrade each existing section in-place rather than rewriting from scratch. Content structure stays, visuals transform.
- **Hero:** Ken Burns slow-zoom image with LuxuryHero component (corner accents, AnimatedText character reveal, MagneticButton CTA, scroll indicator, noise texture overlay).
- **Color palette:** Shift from pure black backgrounds to dark greens (`tj-green`, `tj-greenDeep`) with radial gold gradient accents, matching About page.
- **Animations:** ScrollReveal entrance animations on all sections, AnimatedText for key headings, MagneticButton for CTAs.
- **Vehicle cards:** Gold glow on hover, subtle lift, glass-morphism price badges, staggered ScrollReveal entrance.
- **Typography:** Cinzel for major headings, Playfair Display for taglines/subtitles, Inter for body text.
- **Texture:** NoiseOverlay for film grain atmosphere, SmoothScroll for premium scroll feel.

## Section Specifications

### 1. Hero (full viewport)

- LuxuryHero component with hero vehicle image
- Ken Burns CSS animation (slow zoom 110% over 20s, alternate)
- Dark green gradient overlay (`from-tj-green/90 via-tj-green/70 to-transparent`)
- NoiseOverlay at 3-5% opacity
- Gold corner accent borders (top-left, bottom-right)
- AnimatedText: "TRIPLE J AUTO" in Cinzel display font, character-by-character fadeUp
- "INVESTMENT" in spaced uppercase with ultra letter-spacing
- Tagline in Playfair Display italic with fade-in delay
- MagneticButton CTA: "Schedule a Visit" with gold hover fill
- Animated scroll indicator (bouncing chevron)
- Meta badges: "EST. 2021", "SE HABLA ESPANOL" — small, subtle, top area

### 2. Authority Metrics

- Background: `bg-tj-greenDeep` with radial gold gradient center glow
- ScrollReveal fade-up entrance, staggered 100ms per metric
- Count-up numbers in Cinzel font, gold color
- Labels in Inter uppercase micro-text
- Subtle gold hairline separators between metrics on desktop
- Decorative top/bottom hairline borders

### 3. Ticker/Marquee

- Keep existing gold banner — it's a strong brand element
- Add subtle gradient shimmer animation overlay (left-to-right gold highlight)
- Slightly increase padding for breathing room

### 4. Featured Vehicles

- Section background: dark green with subtle radial gradient
- Section heading with AnimatedText, decorative gold line accent
- Vehicle cards:
  - Keep grayscale-to-color hover effect
  - Add gold border glow on hover: `shadow-[0_0_50px_rgba(212,175,55,0.12)]`
  - Subtle lift on hover: `-translate-y-1`
  - Glass-morphism overlay for price badge: `backdrop-blur-md bg-black/40`
  - Gold border-bottom accent line
  - ScrollReveal staggered entrance (100ms between cards)
- "View All Inventory" as MagneticButton

### 5. Value Pillars

- Background: `bg-tj-green` with gradient overlay
- Each pillar card: dark glass-morphism panel with gold top border
- Large opacity-5 background numbers stay (they work well)
- Gold icon accents
- ScrollReveal per pillar with left/right alternating entrance
- Decorative corner accents on cards matching About page style

### 6. Dealership Info Ticker

- Cards with glass-morphism background: `backdrop-blur-md bg-black/30`
- Gold border accent on hover
- Keep green pulsing "live" indicators
- Subtle shadow depth

### 7. Architectural Differences

- Green gradient card backgrounds matching About page values section
- Gold icon with scale-on-hover effect
- Hover glow effect: `shadow-[0_10px_40px_rgba(212,175,55,0.1)]`
- ScrollReveal staggered entrance
- link-brutal underline animation on CTAs

### 8. Inventory CTA (Vault)

- Full-width section with hero vehicle image background
- Dark green gradient overlay
- Large Cinzel heading with AnimatedText
- MagneticButton CTA with gold fill
- Decorative gold corner accents framing the content
- Subtle parallax on background image

## Global Additions

- **NoiseOverlay:** Add to App.tsx at 3% opacity for atmospheric film grain
- **SmoothScroll:** Wrap app content for premium scroll feel via Lenis
- Both are lightweight and already implemented in `components/luxury/`

## Files Modified

- `pages/Home.tsx` — primary redesign target
- `src/index.css` — any new utility classes if needed
- `App.tsx` — add NoiseOverlay + SmoothScroll wrappers

## Files NOT Modified

- All luxury components used as-is from `components/luxury/`
- `tailwind.config.js` — design tokens already defined
- No new dependencies needed

## What Stays the Same

- All 8 section content and messaging
- Mobile responsiveness approach
- i18n/localization via useLanguage
- Featured vehicle data fetching from Supabase
- Authority metrics data
- Link targets and routing
- SEO-relevant content
