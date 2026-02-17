# Phase 13: Focus Capture - Research

**Researched:** 2026-02-17
**Domain:** Landing page hero redesign, animated abstract SVG, authority metrics, bilingual UX
**Confidence:** HIGH

## Summary

This research investigates what exists in the codebase today that Phase 13 will modify, what animation tools are available, and the correct patterns for implementing an abstract animated hero, count-up authority metrics, and enhanced bilingual detection. The scope is narrow: replace the current hero section in `Home.tsx` and add an authority metrics strip below it. Everything below those two sections stays untouched.

The codebase already has Framer Motion 12.x, GSAP 3.14, Three.js/R3F, and Lenis installed. The hero currently uses an Unsplash stock car photo with parallax and a "decrypt text" animation. The existing luxury component library (`components/luxury/`) provides reusable building blocks (AnimatedText, ScrollReveal, MagneticButton, NoiseOverlay) but the LuxuryHero component itself is NOT used in production -- Home.tsx has its own inline hero. The SubliminalPrime component was already removed in Phase 10 (LAND-05 requirement is now about creating a NEW refined version, not editing an existing one). Language detection currently uses only localStorage -- there is NO browser Accept-Language detection.

**Primary recommendation:** Build the new hero directly in Home.tsx (replacing the existing hero div), using Framer Motion for the abstract animation (SVG paths with motion.path), keep GSAP for scroll-triggered authority metrics. Use `useInView` + `useSpring` from framer-motion for count-up numbers. Add Accept-Language detection to LanguageContext. Add "Se Habla Espanol" to both the hero area and the Navbar.

## Standard Stack

The established libraries/tools already installed in this project:

### Core (Already Installed -- DO NOT add new dependencies)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `framer-motion` | ^12.23.26 | Component animations, SVG path animation, useInView, useSpring | Installed, heavily used |
| `gsap` + `@gsap/react` | ^3.14.2 / ^2.1.2 | ScrollTrigger, timeline animations | Installed, used in luxury/ |
| `react` | ^19.2.0 | UI framework | Installed |
| `tailwindcss` | ^3.4.19 | Styling | Installed |
| `lucide-react` | ^0.554.0 | Icons | Installed |
| `lenis` | ^1.3.17 | Smooth scrolling | Installed |

### Available but NOT Currently Used in Home.tsx
| Library | Purpose | Where Used Currently |
|---------|---------|---------------------|
| `three` + `@react-three/fiber` + `@react-three/drei` | 3D rendering | LuxuryLogo3D (splash screen only) |
| GSAP ScrollTrigger | Scroll-driven animations | LuxuryHero, ScrollReveal components |

### DO NOT Install
| Library | Why Not |
|---------|---------|
| `countup.js` | Framer Motion useSpring + useTransform handles count-up natively |
| `react-intersection-observer` | Framer Motion useInView is already available (0.6kb) |
| `lottie-react` | SVG path animation via motion.path is sufficient for abstract shapes |
| Any CSS animation library | Tailwind + Framer Motion cover all needs |

## Architecture Patterns

### Current Home.tsx Structure (What Gets Modified)
```
Home.tsx (503 lines)
  |
  +-- SEO component
  +-- motion.div wrapper (page fade-in)
  |
  +-- HERO SECTION (lines 106-190) <<<--- REPLACE THIS
  |     +-- Background: Unsplash car photo with mouse parallax
  |     +-- DecryptText component (inline, lines 11-42)
  |     +-- h1 with title1/title2 from translations
  |     +-- Subtitle paragraph
  |     +-- CTAs: "View Inventory" + "Call Now"
  |     +-- Scroll indicator
  |
  +-- TICKER (lines 192-205) <<<--- KEEP AS-IS (or minimal tweak)
  |
  +-- FEATURED VEHICLES (lines 207-300) <<<--- KEEP AS-IS
  +-- VALUE PILLARS (lines 302-378) <<<--- KEEP AS-IS
  +-- DEALERSHIP INFO (lines 380-406) <<<--- KEEP AS-IS
  +-- WHAT SETS US APART (lines 408-471) <<<--- KEEP AS-IS
  +-- INVENTORY CTA (lines 473-497) <<<--- KEEP AS-IS
```

### New Structure (After Phase 13)
```
Home.tsx
  |
  +-- SEO component
  +-- motion.div wrapper
  |
  +-- NEW HERO SECTION <<<--- New component or inline
  |     +-- Abstract animated SVG background (continuous loop)
  |     +-- "Se Habla Espanol" indicator (top-right or badge)
  |     +-- Positioning language ("Automotive Investment Firm")
  |     +-- CTAs: "Schedule a Visit" + "Call Now"
  |     +-- Scroll indicator
  |
  +-- NEW AUTHORITY METRICS STRIP <<<--- New section
  |     +-- Count-up numbers (triggered on scroll into view)
  |     +-- "X Families Served" / "X Five-Star Reviews" / etc.
  |
  +-- TICKER (keep as-is)
  +-- FEATURED VEHICLES (keep as-is)
  +-- ... rest unchanged
```

### Recommended Component Breakdown
```
components/
  +-- hero/
  |     +-- HeroBackground.tsx     # Abstract SVG animation (motion.path + motion.circle)
  |     +-- HeroContent.tsx        # Text, CTAs, Se Habla badge
  |     +-- AuthorityMetrics.tsx   # Count-up numbers strip
  |     +-- CountUpNumber.tsx      # Reusable animated number
  |
  (Alternative: build inline in Home.tsx if components are not reused)
```

### Pattern 1: Abstract SVG Hero Animation with Framer Motion
**What:** Animated geometric/flowing shapes using motion.path and motion.circle elements
**When to use:** The hero background -- continuous subtle loop
**Why Framer Motion over Canvas/Three.js:** The project already loads Three.js for LuxuryLogo3D but using it for the hero background would be heavy. SVG path animation via Framer Motion is lightweight, GPU-accelerated, and matches the existing animation ecosystem.

```tsx
// Abstract flowing paths animation pattern
import { motion } from 'framer-motion';

const HeroBackground = () => {
  // Generate bezier curve paths programmatically
  const paths = Array.from({ length: 8 }, (_, i) => ({
    d: `M -100 ${200 + i * 60} Q ${400 + i * 30} ${100 - i * 20} ${900 + i * 20} ${300 + i * 40}`,
    delay: i * 0.3,
  }));

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
      <defs>
        <linearGradient id="goldPath" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(212,175,55,0)" />
          <stop offset="50%" stopColor="rgba(212,175,55,0.3)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </linearGradient>
      </defs>
      {paths.map((path, i) => (
        <motion.path
          key={i}
          d={path.d}
          stroke="url(#goldPath)"
          strokeWidth={1 + Math.random()}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: path.delay,
          }}
        />
      ))}
    </svg>
  );
};
```

### Pattern 2: Count-Up Numbers with useInView + useSpring
**What:** Numbers animate from 0 to target when scrolled into view
**When to use:** Authority metrics section
**Source:** BuildUI recipe, verified with Framer Motion docs

```tsx
import { useRef, useEffect } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

const CountUpNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>{suffix}
    </span>
  );
};
```

### Pattern 3: Browser Language Auto-Detection
**What:** Detect Accept-Language on first visit, set initial language
**When to use:** LanguageContext initialization

```tsx
// In LanguageContext.tsx - enhanced initialization
useEffect(() => {
  const savedLang = localStorage.getItem('tj_lang') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    setLangState(savedLang);
    return;
  }

  // Auto-detect from browser Accept-Language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  if (browserLang.startsWith('es')) {
    setLangState('es');
    localStorage.setItem('tj_lang', 'es');
  }
  // English is default, no action needed
}, []);
```

### Anti-Patterns to Avoid
- **DO NOT use Three.js/Canvas for the hero background:** The 3D logo already loads Three.js for the splash screen. Adding a Canvas-based hero doubles GPU load and creates render conflicts on mobile. SVG via Framer Motion is lighter and integrates with the existing animation ecosystem.
- **DO NOT use requestAnimationFrame loops for the abstract animation:** Framer Motion handles animation frames internally. Using raw rAF alongside motion components causes jank and memory leaks.
- **DO NOT remove the DecryptText component without replacing it:** It is currently the only text animation in the hero. The new hero needs its own text entrance animation (use Framer Motion variants, not the custom DecryptText).
- **DO NOT use the LuxuryHero component as-is:** It has hardcoded English text, uses a video background (which conflicts with the abstract animation approach), and references GSAP class selectors (.hero-title-line) that create coupling issues.
- **DO NOT add Intersection Observer polyfill:** Framer Motion's useInView uses the native IntersectionObserver API, which has 97%+ browser support. The project already sets a minimum browser requirement via BrowserCompatibilityCheck.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number count-up animation | Custom setInterval counter | `useSpring` + `useTransform` from framer-motion | Spring physics feel natural; setInterval creates janky stepped animation |
| Scroll detection for metrics | Custom scroll listener | `useInView` from framer-motion (0.6kb) | Handles threshold, margin, once flag, cleanup automatically |
| Text entrance animation | Custom DecryptText (already in code) | Framer Motion `variants` with `staggerChildren` | Declarative, interruptible, hardware-accelerated |
| SVG path animation | CSS @keyframes with stroke-dasharray | `motion.path` with `pathLength` | Framer Motion handles path length calculation, easing, and looping |
| Language detection | Custom Accept-Language parser | `navigator.language` (built-in) | Simple string check, no parsing needed |
| Smooth scroll indicator | Custom scroll animation | Framer Motion `animate` prop with `repeat: Infinity` | Already used in the codebase (see current scroll indicator) |

**Key insight:** Every animation need in this phase is already solvable with the installed framer-motion library. No new animation dependencies should be added.

## Common Pitfalls

### Pitfall 1: Hero Section Has pt-36 Padding From Navbar
**What goes wrong:** The new hero section looks misaligned because the `<main>` wrapper in App.tsx applies `pt-36` (9rem / 144px) to account for the fixed navbar (h-24 md:h-32).
**Why it happens:** The current hero in Home.tsx uses `h-screen` which visually masks the padding. But if the new hero is also `h-screen`, it actually extends 144px below the viewport.
**How to avoid:** Either (a) keep `h-screen` and accept the padding overlap (current behavior), or (b) use `min-h-screen -mt-36` to extend behind the navbar for a true full-bleed hero. The navbar already has a transparent-to-black gradient overlay that works with content behind it.
**Warning signs:** Hero text appears lower than expected; scroll indicator is cut off at the bottom.

### Pitfall 2: SplashScreen Delays Hero by 1.7s
**What goes wrong:** The SplashScreen component (in App.tsx line 632) wraps ALL content with a 1200ms splash + 500ms fade. First-time visitors wait 1.7 seconds before seeing ANYTHING. This directly conflicts with the "3-second first impression" goal.
**Why it happens:** SplashScreen was built for brand establishment, not conversion-optimized landing.
**How to avoid:** Decision is Claude's discretion per CONTEXT.md. Recommendation: REMOVE the SplashScreen for the home page OR reduce duration dramatically. The splash uses `sessionStorage` to only show once per session, so returning visitors already skip it. But first-time visitors (the target audience for Phase 13) always see it.
**Warning signs:** Time-to-interactive exceeds 3 seconds; bounce rate on landing page.

### Pitfall 3: Stock Photo Background Bleeds Through
**What goes wrong:** The current hero has an Unsplash car photo background (line 109). If only the foreground content is replaced without removing the background, both the old photo AND the new abstract animation render simultaneously.
**Why it happens:** The background is an `absolute inset-0` div with the image, separate from the content div.
**How to avoid:** Remove or replace ALL of lines 107-119 (the three background layers: photo, stardust texture, radial gradient). The new abstract SVG animation replaces all three.

### Pitfall 4: Mouse Parallax State Updates on Every Frame
**What goes wrong:** The current hero uses `onMouseMove` with `useState` + `useSpring` for parallax (lines 47-79). If this pattern is kept but a new SVG animation also runs, the constant state updates can cause unnecessary re-renders of the SVG paths.
**Why it happens:** `useState` for mouse position triggers component re-renders.
**How to avoid:** If mouse interactivity is kept for the new hero, use `useMotionValue` instead of `useState` for mouse position. MotionValues update without triggering React re-renders.

### Pitfall 5: Missing Translation Keys
**What goes wrong:** New hero text (e.g., "Schedule a Visit", "Automotive Investment Firm", "Se Habla Espanol" badge, authority metric labels) is hardcoded in English.
**Why it happens:** Developer adds new UI text without adding corresponding keys to translations.ts.
**How to avoid:** Every visible text string MUST have a corresponding key in BOTH `t.en` and `t.es` in `utils/translations.ts`. Plan translation keys BEFORE writing components. The existing pattern is `t.home.hero.*` for hero content.

### Pitfall 6: SVG Animation Performance on Mobile
**What goes wrong:** Too many animated SVG paths (20+) with complex transitions cause frame drops on budget Android phones.
**Why it happens:** Each motion.path is a separate animated element. Budget phones have limited GPU compositing layers.
**How to avoid:** Keep animated path count under 12. Use `will-change: transform` sparingly. Consider reducing animation complexity on mobile via a media query or `window.matchMedia('(prefers-reduced-motion: reduce)')`. Test on throttled CPU in DevTools.

## Code Examples

### Current Home.tsx Hero (What Gets Replaced)
```tsx
// Source: triple-j-auto-investment-main/pages/Home.tsx lines 106-190
// This entire block gets replaced:

{/* --- HERO SECTION --- */}
<div className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
  {/* Background: Unsplash car photo + stardust + radial gradient */}
  <div className="absolute inset-0 pointer-events-none">
    <motion.div className="absolute inset-0 bg-[url('https://images.unsplash.com/...')] ..." />
    <div className="absolute inset-0 bg-[url('...')] opacity-30 animate-pulse" />
    <div className="absolute inset-0 bg-[radial-gradient(...)]" />
  </div>

  {/* Content: DecryptText title + subtitle + CTAs */}
  <motion.div style={{ y: y1, opacity }} className="relative z-10 text-center ...">
    <h1>
      <DecryptText text={t.home.hero.title1} />
      <DecryptText text={t.home.hero.title2} />
    </h1>
    <p>{t.home.hero.subtitle}</p>
    <Link to="/inventory">View Inventory</Link>
    <a href="tel:...">Call Now</a>
  </motion.div>

  {/* Scroll indicator */}
  <motion.div className="absolute bottom-12 ...">SCROLL</motion.div>
</div>
```

### Current Translation Keys Used by Hero
```typescript
// Source: utils/translations.ts
// English (lines 68-74):
home: {
  hero: {
    title1: "YOUR NEXT",
    title2: "VEHICLE",
    subtitle: "Reliable pre-owned cars for Houston families. Transparent pricing, no surprises.",
    cta: "View Inventory",
    callNow: "Call Now"
  },
  // ... rest of home translations
}

// Spanish (lines 844-850):
home: {
  hero: {
    title1: "TU PROXIMO",
    title2: "VEHICULO",
    subtitle: "Carros usados confiables para familias de Houston. Precios transparentes, sin sorpresas.",
    cta: "Ver Inventario",
    callNow: "Llamar Ahora"
  },
}
```

### Current Navbar Language Toggle (Where "Se Habla" Could Go)
```tsx
// Source: App.tsx lines 194-201 (desktop nav)
<button
  onClick={toggleLang}
  className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors mr-4"
>
  <Globe size={12} />
  <span>{lang === 'en' ? 'ESPANOL' : 'ENGLISH'}</span>
</button>

// Source: App.tsx lines 234-239 (mobile nav)
<button
  onClick={toggleLang}
  className="text-tj-gold p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
>
  <span className="text-[10px] font-bold">{lang === 'en' ? 'ES' : 'EN'}</span>
</button>
```

### Current LanguageContext (What Gets Enhanced)
```tsx
// Source: context/LanguageContext.tsx
// Currently: Only checks localStorage, NO browser detection
useEffect(() => {
  const savedLang = localStorage.getItem('tj_lang') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    setLangState(savedLang);
  }
}, []);
// Missing: navigator.language check for first-time visitors
```

### Current SplashScreen Integration (Decision Point)
```tsx
// Source: App.tsx line 632
<SplashScreen duration={1200}>
  <AppContent />
</SplashScreen>
// SplashScreen.tsx: 1200ms display + 500ms fade = 1.7s before content
// Uses sessionStorage('splashShown') to skip on subsequent visits
```

### Framer Motion Imports Already Used in Home.tsx
```tsx
// Source: Home.tsx line 5
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
// Will need to ADD: useInView
// Full import for Phase 13:
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue } from 'framer-motion';
```

### Existing Design Tokens (From tailwind.config.js)
```
Colors:
  tj-green: #011c12 (body background)
  tj-gold: #D4AF37 (primary accent)
  tj-goldDim: #8a7329 (dimmed gold)
  tj-dark: #000805 (card backgrounds)
  tj-silver: #C0C0C0 (unused)

Fonts:
  font-sans: Inter (body text)
  font-serif: Playfair Display (italic accents)
  font-display: Cinzel (headings, nav)

Key animations:
  animate-marquee: 35s linear infinite translateX
  animate-gold-pulse: drop-shadow glow cycle
  animate-gold-float: vertical float
```

### CTA Button Canonical Pattern
```tsx
// From CONTEXT decisions: py-4 px-8 text-xs tracking-[0.3em]
// Current hero uses slightly larger: px-12 md:px-16 py-5 md:py-6
// Phase 13 should use the canonical pattern for consistency:
<a
  href="tel:+18324009760"
  className="group relative overflow-hidden bg-transparent border-2 border-white text-white py-4 px-8 text-xs font-bold tracking-[0.3em] uppercase hover:bg-tj-gold hover:border-tj-gold hover:text-black transition-all duration-300"
>
  <Phone size={14} /> Call Now
</a>
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 13) | Impact |
|------------------------|------------------------|--------|
| Unsplash stock car photo hero | Abstract SVG animation (geometric/flowing) | Breaks "used car lot" expectation |
| "YOUR NEXT VEHICLE" heading | "Automotive Investment Firm" positioning language | Reframes from commodity to premium |
| "View Inventory" primary CTA | "Schedule a Visit" primary CTA | Pushes human connection first |
| No authority signals above fold | Count-up metrics strip | Builds trust in 3 seconds |
| Language toggle only (no auto-detect) | Browser language detection + toggle | Spanish-first visitors get native experience |
| "Se Habla Espanol" only in ticker | "Se Habla Espanol" in hero + navbar persistent | Tribe signal visible immediately |
| 1.7s splash screen delay | Remove or dramatically reduce splash | Content visible in under 1 second |

## Key Files That Will Be Modified

| File | What Changes | Lines Affected |
|------|-------------|----------------|
| `pages/Home.tsx` | Hero section replaced, authority metrics added, DecryptText possibly removed | Lines 11-42 (DecryptText), 106-190 (hero) |
| `utils/translations.ts` | New hero text keys, authority metric labels, "Se Habla" badge text | `t.home.hero.*` section in both en/es |
| `context/LanguageContext.tsx` | Add navigator.language detection | `useEffect` initialization block |
| `App.tsx` (Navbar) | Add "Se Habla Espanol" persistent indicator | Navbar desktop (lines 193-201) and mobile |
| `App.tsx` (SplashScreen) | Potentially remove or shorten SplashScreen | Line 632 |
| `tailwind.config.js` | Potentially add new keyframe for SVG animation if needed | animations/keyframes section |

## Key Files That Will NOT Be Modified (Confirmed Scope)
- `components/luxury/LuxuryHero.tsx` -- NOT used in production, leave as-is
- `components/luxury/LuxurySplashScreen.tsx` -- NOT used in production (SplashScreen.tsx is the active one)
- `components/SovereignCrest.tsx` -- Used elsewhere, not in hero
- `components/CrestLoader.tsx` -- Used for loading states, not hero

## Open Questions

Things that couldn't be fully resolved:

1. **What specific authority metrics are available?**
   - What we know: CONTEXT says "families served", "five-star reviews", "years in business" as options
   - What's unclear: The actual numbers. Are there real Google reviews? How many families have been served?
   - Recommendation: Use placeholder numbers in code (e.g., `500+`, `4.9`, `2025`) with clear comments that these should be updated with real data. Structure the component to pull from a config object that's easy to update.

2. **LAND-05: SubliminalPrime "refined"**
   - What we know: The original SubliminalPrime was removed in Phase 10 because it flashed "AUTHORITY/DOMINION/SOVEREIGNTY" -- which was unprofessional
   - What's unclear: LAND-05 says "refined, updated words and execution." Does this mean rebuild it with better words, or is this requirement satisfied by the abstract animation itself serving as the subliminal "pattern interrupt"?
   - Recommendation: The abstract SVG animation IS the refined SubliminalPrime -- it creates subconscious novelty without literal flashing words. If word-based priming is still desired, it should be done through the positioning language ("Automotive Investment Firm") and authority metrics, not through a hidden/flashing component.

3. **Should the hero extend behind the navbar?**
   - What we know: Current hero uses `h-screen` within `<main className="pt-36">`, so there's a 144px gap between the top of the viewport and the hero. The navbar is transparent with gradient fade.
   - What's unclear: Whether the abstract animation should bleed behind the transparent navbar for maximum visual impact
   - Recommendation: YES, the hero should extend behind the navbar. Use negative margin (`-mt-36`) and extra padding to compensate, or restructure the hero to be outside the `<main>` padding context. The transparent navbar gradient was designed for exactly this use case.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct reading of Home.tsx, App.tsx, LanguageContext.tsx, SplashScreen.tsx, translations.ts, tailwind.config.js, all luxury/ components
- **package.json** -- Confirmed framer-motion ^12.23.26, gsap ^3.14.2, react ^19.2.0
- **Framer Motion useInView docs** -- [motion.dev/docs/react-use-in-view](https://motion.dev/docs/react-use-in-view) -- 0.6kb, uses IntersectionObserver, `once` flag supported

### Secondary (MEDIUM confidence)
- **BuildUI AnimatedNumber recipe** -- [buildui.com/recipes/animated-number](https://buildui.com/recipes/animated-number) -- Verified useSpring + useTransform pattern for count-up
- **shadcn Paths Background** -- [shadcn.io/background/paths](https://www.shadcn.io/background/paths) -- Reference pattern for SVG path animation in hero backgrounds
- **Motion SVG animation patterns** -- [tomcaraher.dev](https://tomcaraher.dev/posts/animating-svgs), [blog.noelcserepy.com](https://blog.noelcserepy.com/how-to-animate-svg-paths-with-framer-motion) -- SVG pathLength animation with Framer Motion

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in package.json
- Architecture: HIGH -- based on direct codebase analysis of every file that will change
- Animation patterns: HIGH -- useSpring/useInView verified against official Framer Motion docs and BuildUI recipes
- Bilingual approach: HIGH -- navigator.language is a standard Web API, current LanguageContext code reviewed
- Pitfalls: HIGH -- identified through direct code reading, not speculation

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no library upgrades expected)
