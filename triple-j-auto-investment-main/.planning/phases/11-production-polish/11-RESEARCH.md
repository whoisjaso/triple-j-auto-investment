# Phase 11: Production Polish - Research

**Researched:** 2026-02-15
**Domain:** Mobile responsiveness, performance, accessibility, error handling, visual consistency
**Confidence:** HIGH (based on direct codebase analysis)

## Summary

This research is based on exhaustive analysis of every customer-facing page and component in the Triple J Auto Investment codebase. The project is a React 19 + Vite + TypeScript + Tailwind CSS single-page application with Supabase backend, deployed to Vercel. It uses a dark luxury aesthetic (black/gold) with heavy animation libraries (Framer Motion, GSAP, Three.js).

The codebase is functional but has significant production-polish gaps: 296 console statements in client code, no offline detection, minimal accessibility (16 ARIA attributes total), inconsistent spacing, a Suspense fallback of `null` (no loading UI for lazy routes), and most images lack lazy loading. The ErrorBoundary exists but only wraps BrowserCompatibilityCheck, not the full app content.

**Primary recommendation:** Work through requirements systematically by page group. The cleanup is mechanical and well-defined -- most issues are consistent patterns that can be fixed with search-and-replace discipline plus targeted per-page fixes.

## Standard Stack

No new libraries are needed. All tools are already in the project.

### Core (Already Installed)
| Library | Version | Purpose | Role in Polish |
|---------|---------|---------|----------------|
| React | ^19.2.0 | UI framework | Error boundaries, Suspense |
| Tailwind CSS | ^3.4.19 | Styling | Spacing system, responsive utilities |
| Framer Motion | ^12.23.26 | Animations | KEEP as-is per CONTEXT |
| Vite | ^6.2.0 | Build tool | Console stripping, bundle optimization |
| Supabase JS | ^2.87.1 | Backend client | Error handling patterns |

### No New Dependencies Required
This phase is entirely about polishing existing code. Do NOT add:
- No accessibility scanning libraries (manual verification is sufficient)
- No CSS-in-JS (Tailwind handles everything)
- No state management for offline (simple `navigator.onLine` + event listeners)
- No skeleton library (Tailwind utility classes suffice)

## Architecture Patterns

### Current Project Structure
```
triple-j-auto-investment-main/
  App.tsx              # Router, Navbar, Footer, ErrorBoundary, SplashScreen
  index.html           # Viewport meta, fonts, schema.org
  src/index.css         # Tailwind directives, global styles
  tailwind.config.js    # Custom theme (colors, fonts, animations)
  pages/               # 18 page components (13 customer-facing, 5 admin)
  components/          # Shared components, admin/, luxury/, tracking/
  context/Store.tsx    # Global state (vehicles, leads, auth)
  services/            # Supabase CRUD, external APIs
  lib/                 # Auth, store modules
  utils/               # Translations, helpers
```

### Customer-Facing Pages (Primary Polish Targets)
These are the pages that need POLISH-01 through POLISH-11 treatment:

| Page | File | Key Content | Mobile Risk |
|------|------|-------------|-------------|
| Home | pages/Home.tsx | Hero, featured vehicles, value pillars, CTA | Hero text 13vw, parallax effects |
| Inventory | pages/Inventory.tsx | Vehicle grid, filters, detail modal | Complex modal, image carousel |
| About | pages/About.tsx | Story, values, map | Background images, iframe map |
| Contact | pages/Contact.tsx | Form, contact info cards | Two-column layout |
| Services | pages/Services.tsx | Service cards grid | Two-column grid |
| Finance | pages/Finance.tsx | Application form, info sidebar | Two-column grid, form fields |
| FAQ | pages/FAQ.tsx | Accordion, search | Straightforward |
| Policies | pages/Policies.tsx | Legal content sections | Long-form text |
| PaymentOptions | pages/PaymentOptions.tsx | Payment method cards | Two-column grid |
| VinLookup | pages/VinLookup.tsx | Terminal UI, VIN decoder | Three-column grid, specialized UI |
| Legal | pages/Legal.tsx | Parameterized legal pages | Simple layout |
| NotFound | pages/NotFound.tsx | 404 page | Three-column grid |
| Login | pages/Login.tsx | Admin login form | Centered form |
| CustomerLogin | pages/CustomerLogin.tsx | OTP phone login | Centered form |
| CustomerDashboard | pages/CustomerDashboard.tsx | Registration list | Data-dependent |
| CustomerStatusTracker | pages/CustomerStatusTracker.tsx | Progress tracking | Already mobile-first |
| RegistrationTracker | pages/RegistrationTracker.tsx | Order lookup | Simple form |

### Pattern 1: Page Layout Template
**What:** Every customer-facing page follows a consistent wrapper pattern
**Current inconsistencies found:**
- Most pages: `min-h-screen bg-black pt-40 pb-20 px-6`
- Home: No top padding (full-screen hero), `bg-black`
- About: `bg-tj-green` (different background)
- Inventory: `bg-black min-h-screen px-4 md:px-6 pb-20`
- VinLookup: `min-h-screen bg-black flex flex-col items-center justify-center px-4 py-24`
- Login/NotFound: `min-h-screen bg-black flex items-center justify-center px-4`

**Recommendation:** The `px-6` pages should verify they work at 375px. Pages with `px-4` already have tighter mobile spacing. Home and About have full-bleed designs that need individual attention.

### Pattern 2: Button Styles (POLISH-09)
**What:** Buttons follow several patterns, some inconsistent
**Current inventory:**
- **Primary CTA:** `bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors` (63 instances)
- **Ghost/Outline:** `border border-tj-gold text-tj-gold hover:bg-tj-gold hover:text-black` (various padding)
- **Text-only:** `text-tj-gold text-xs uppercase tracking-widest hover:text-white transition-colors`
- **Danger:** `text-red-500 hover:text-red-400 transition-colors`
- **Inconsistencies:** Some buttons use `tracking-[0.2em]`, others `tracking-[0.3em]`, padding varies from `py-3` to `py-6`

**Recommendation:** Define 3-4 canonical button patterns in a comment block or shared utility, then audit all buttons for consistency.

### Pattern 3: Card Styles (POLISH-08)
**What:** Info cards and content sections use varied patterns
**Current patterns:**
- `bg-tj-dark border border-white/10 p-8 hover:border-tj-gold/50 transition-all` (common card)
- `bg-black border border-white/10 p-8` (alternate card)
- `bg-black/50 border border-white/5 p-4` (inner card/nested)
- `bg-red-900/10 border border-red-900/30 p-6` (warning card)
- `bg-tj-gold/10 border border-tj-gold/30 p-6` (highlight card)

**Recommendation:** Padding varies (p-6, p-8, p-10, p-12). Standardize on p-6 for mobile-friendly cards, p-8 md:p-10 for full sections.

### Anti-Patterns Found
- **Suspense with null fallback:** `<Suspense fallback={null}>` means lazy-loaded pages show nothing during load. Should show a loading state.
- **ErrorBoundary misplacement:** Only wraps `<BrowserCompatibilityCheck />`, not `<AppContent />`. The main content area has no error boundary.
- **No offline detection:** Zero `navigator.onLine` checks or online/offline event listeners in the entire codebase.
- **Console statements in production:** 296 console.* calls in client code will appear in browser DevTools.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Console stripping | Manual find-replace | Vite `define` or `esbuild.drop` config | One config line strips all console.* in production builds |
| Offline detection | Custom polling | `navigator.onLine` + `window.addEventListener('online'/'offline')` | Browser API is simple and reliable |
| Skeleton loading | Custom component | Tailwind `animate-pulse` on `bg-gray-800` blocks | Already in Tailwind, no extra code |
| Touch target sizing | Custom CSS | Tailwind `min-h-[44px] min-w-[44px]` | Standard Tailwind utility |
| Color contrast checking | Custom tool | Browser DevTools or WebAIM contrast checker | Free, reliable tools |

**Key insight:** Console stripping deserves special attention. The success criterion says "zero console.log output in production build." Vite supports `esbuild.drop: ['console', 'debugger']` in the build config, which strips ALL console calls at build time. This is far more reliable than manually removing 296 statements, and preserves the console logs during development.

## Common Pitfalls

### Pitfall 1: Removing Console Statements Manually
**What goes wrong:** Developer removes console.error calls that are actually important for debugging, or misses some, or the cleanup takes days.
**Why it happens:** 296 statements across 37 files is a large manual task.
**How to avoid:** Use Vite's esbuild drop option to strip console.* at build time only. Keep them in development.
**Warning signs:** If someone starts manually deleting console statements one by one.

### Pitfall 2: Breaking Mobile Layout with Overflow
**What goes wrong:** Horizontal scroll appears at 375px due to elements wider than viewport.
**Why it happens:** Large headings (Home hero uses `text-[13vw]`), fixed-width elements, or padding overflow.
**How to avoid:** Test every page at 375px in Chrome DevTools. Add `overflow-x-hidden` where needed.
**Warning signs:** Home hero text, the marquee ticker, About page decorative frames, VinLookup three-column grid.

### Pitfall 3: Inconsistent Top Padding for Navbar
**What goes wrong:** Content hidden behind fixed navbar or too much empty space.
**Why it happens:** Navbar is `h-24 md:h-32` but main content uses `pt-36`. Some pages use `pt-40`, others `pt-24`.
**How to avoid:** Main content wrapper already has `pt-36`, so page-level top padding is additive. Most pages use `pt-40` which puts them at ~304px from top -- this may be intentional for breathing room.
**Warning signs:** Inventory page uses no extra top padding, relying on the main `pt-36` plus its own `pt-24` on the header area.

### Pitfall 4: Forgetting Empty States for Data-Dependent Components
**What goes wrong:** Fresh production DB shows blank pages or errors.
**Why it happens:** Components assume data exists. No zero-data fallback.
**How to avoid:** Identify all data-dependent renders and add empty state UI.
**Warning signs:** Home featured vehicles section already handles `hasVehicles` check, but CustomerDashboard, admin pages may not.

### Pitfall 5: Error Handling That Silently Fails
**What goes wrong:** Supabase call fails, user sees infinite loading or blank area.
**Why it happens:** Most service calls have try/catch that console.error but don't update UI state.
**How to avoid:** Every async operation needs three states: loading, success, error -- and the error state must render something the user can see.
**Warning signs:** 167 try blocks, 151 catch blocks, but most catches only log to console.

## Detailed Current State Analysis

### POLISH-01: Mobile Viewport Testing (375px-414px)

**Current state:** Pages are built with Tailwind responsive classes but have not been systematically verified at 375px.

**Known mobile risks by page:**

| Page | Risk Level | Issue |
|------|-----------|-------|
| Home | HIGH | Hero text `text-[13vw]` = 48.75px at 375px. Parallax mouse effect irrelevant on mobile. Hero CTAs stack at `sm:flex-row` breakpoint. |
| Inventory | MEDIUM | Filter bar has three dropdowns + search on mobile. Modal is fullscreen on mobile (good). Carousel controls `opacity-0 group-hover:opacity-100` invisible on touch. |
| About | MEDIUM | Decorative border frames hidden on mobile (`hidden md:block`). Map iframe 500px min-height. |
| VinLookup | HIGH | Three-column grid `grid-cols-1 lg:grid-cols-3`. At 375px, the terminal UI input area needs verification. Results grid `grid-cols-2 md:grid-cols-4` -- two columns at 375px may be tight. |
| Finance | MEDIUM | Two-column form grid `grid-cols-2 gap-4` -- fields may be narrow at 375px. |
| Contact | LOW | Two-column layout `grid-cols-1 lg:grid-cols-2` -- stacks on mobile. |
| CustomerStatusTracker | LOW | Already designed mobile-first per Phase 4. |

**Carousel controls on mobile:** The Inventory vehicle card carousel has `opacity-0 group-hover:opacity-100` on navigation arrows. On touch devices, hover states don't exist -- these buttons are effectively invisible. The dot indicators are pointer-events-none. Users can only see images by accident. This needs a swipe gesture or always-visible controls on mobile.

### POLISH-02: Viewport Meta

**Current state:** `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`

**Decision:** KEEP `user-scalable=no` per CONTEXT. No change needed.

### POLISH-03: Splash Screen & LCP

**Current state:**
- `SplashScreen` component wraps entire `AppContent`
- Duration: 3500ms (`duration={3500}` in App.tsx)
- Session-gated: Uses `sessionStorage.getItem('splashShown')` to skip on subsequent loads within same session
- Content is `visibility: hidden` during splash, `opacity: 0` transitioning to 1
- Fade-out phase adds another 800ms

**Decision:** KEEP splash screen as-is per CONTEXT. LCP 2.5s target applies AFTER splash completes. The splash correctly uses `sessionStorage` so it only shows once per session.

**Post-splash performance concerns:**
- Hero image on Home is an external Unsplash URL (not optimized)
- About page loads 3 external Unsplash background images
- Google Fonts loaded via external stylesheet (render-blocking)
- Three.js + GSAP + R3F in bundle (accepted per CONTEXT)

### POLISH-04: Console Statement Cleanup

**Current state: 296 console.* statements in client code (excluding Edge Functions)**

Breakdown:
| Type | Count | Typical Usage |
|------|-------|---------------|
| console.error | 234 | Service call failures, catch blocks |
| console.log | 41 | Debug output, initialization messages, success confirmations |
| console.warn | 21 | Non-critical warnings, fallback notifications |

**By area:**
| Area | Count | Files |
|------|-------|-------|
| Services (rental, registration, plate, insurance) | ~160 | 8 service files |
| Store/lib (vehicles, leads, sheets, auth) | ~55 | 6 files |
| Admin pages | ~30 | 5 admin page files |
| Context/Store | 21 | Store.tsx |
| Customer pages | ~5 | Inventory, CustomerDashboard |
| Admin components | ~20 | BillOfSale, Rental modals |
| Other | ~5 | index.tsx, App.tsx, BrowserCompat |

**Recommendation:** Use Vite's `esbuild.drop` to strip all `console.log` and `console.debug` in production builds. Keep `console.error` and `console.warn` in a structured logging approach, OR strip everything with `esbuild.drop: ['console', 'debugger']` for absolute zero console output.

**Implementation:**
```typescript
// vite.config.ts - add to build config
build: {
  // ... existing rollupOptions ...
  esbuild: {
    drop: ['console', 'debugger'],
  }
}
```

This is ONE line of config and satisfies the "zero console.log in production" success criterion instantly.

### POLISH-05: Loading States for Async Operations

**Current state:**

| Operation | Has Loading State? | Quality |
|-----------|-------------------|---------|
| Vehicle list load | YES | Spinner + "LOADING INVENTORY..." text |
| Lazy page load (Suspense) | NO | `fallback={null}` -- blank screen during load |
| Lead form submit | YES | `Loader2 animate-spin` on button |
| Contact form submit | PARTIAL | Button text changes to "Sending..." but no spinner |
| Finance form submit | PARTIAL | Same pattern as contact |
| VIN lookup | YES | Animated "System Logs" terminal effect |
| Registration tracker | YES | `LoadingCrest` component |
| Customer dashboard | YES | Loading state with logo |
| Admin data loads | VARIES | Some have loading states, some don't |
| Image loading | NO | No lazy loading, no blur-up, no placeholders |

**Missing loading states that need attention:**
1. Suspense fallback (shows nothing while lazy pages load)
2. Image loading (vehicle photos from Supabase storage -- no placeholder or skeleton)
3. Map iframe on About page (no loading state)

### POLISH-06: Empty States for Zero-Data Scenarios

**Current state:**

| Component | Empty State? | Notes |
|-----------|-------------|-------|
| Home featured vehicles | YES | `hasVehicles` check skips section entirely |
| Inventory vehicle grid | PARTIAL | Shows "Connection Issue Detected" with troubleshooting guide when `sortedVehicles.length === 0` -- but this conflates "no data" with "fetch error" |
| FAQ search results | YES | Shows "No results for [query]" |
| Customer dashboard | NO | Loads registrations but no empty state if customer has none |
| Registration tracker | YES | ErrorState component handles not-found, expired, invalid |

**Missing empty states:**
1. Inventory when genuinely empty (not an error, just no vehicles listed)
2. Customer dashboard when customer has no registrations
3. Home featured vehicles -- currently just hides the section, could show a CTA instead

### POLISH-07: Error States for Supabase/Edge Function Failures

**Current state:**
- `ErrorBoundary` class component exists in App.tsx but only wraps `<BrowserCompatibilityCheck />`
- `lazyWithErrorHandling` wrapper provides fallback UI for lazy import failures
- `connectionError` state exists in Store context but is not rendered anywhere in the UI
- Most service calls catch errors and log to console but don't surface errors to users
- Inventory page has a detailed error/empty state but conflates "no data" with "connection error"

**Missing error handling:**
1. ErrorBoundary should wrap `<AppContent />` or at least the `<Routes>` block
2. `connectionError` from Store should render a visible banner/toast
3. Contact form has no error state (just idle/sending/sent)
4. Finance form has no error state (just idle/submitting/submitted)
5. No global "Supabase unreachable" indicator

### POLISH-08: Consistent Spacing System

**Current state (from Tailwind class analysis):**

Padding distribution across all components:
- `p-2` (341 uses), `p-4` (303), `p-3` (191), `p-1` (117), `p-6` (108), `p-8` (54), `p-12` (26), `p-10` (13)

**Assessment:** Spacing is ad-hoc. The most common paddings are small (p-2, p-3, p-4) for inner elements and larger (p-6, p-8, p-10, p-12) for section containers. There is no formal spacing scale documented, but the usage roughly follows Tailwind's 4px scale.

**Inconsistencies found:**
- Page section padding: Some use `py-20`, others `py-24`, `py-32`, `py-40`
- Card padding: Mix of `p-6`, `p-8`, `p-10`, `p-12`
- Form input padding: Mix of `p-4` and `p-3`
- Page horizontal padding: Mix of `px-4`, `px-6` (Home, most pages), occasionally `px-8`

**Recommendation:** Define a spacing scale reference:
- Inner elements: `p-2`, `p-3`, `p-4`
- Cards/panels: `p-6` (mobile), `p-8` (desktop) -- use `p-6 md:p-8`
- Page sections: `py-16` or `py-20` on mobile, `py-24` or `py-32` on desktop
- Page horizontal: `px-4` on mobile, `px-6` on desktop

### POLISH-09: Consistent Button/Link Styles

**Current button pattern inventory:**

| Pattern | Usage | Padding | Tracking | Notes |
|---------|-------|---------|----------|-------|
| Primary gold | CTAs, form submits | `py-4` or `py-5` | `tracking-[0.3em]` | Most consistent |
| White primary | Home hero CTA | `py-5 md:py-6 px-12 md:px-16` | `tracking-[0.3em]` | Larger than others |
| Ghost gold | Secondary actions | `py-4 px-8` | `tracking-widest` | Various padding |
| Text link gold | Navigation, small CTAs | No padding | `tracking-widest` | Consistent |
| Danger | Admin logout | N/A | `tracking-widest` | Minimal instances |

**Inconsistencies:**
- Primary CTA button height varies: `py-3` to `py-6`
- Some use `tracking-[0.2em]`, others `tracking-[0.3em]`, others `tracking-widest` (0.1em)
- Font size varies: `text-xs`, `text-sm`, `text-[10px]`

### POLISH-10: Touch Targets (44x44px minimum)

**Current state:**
- Navbar mobile menu button: `p-3` (adequate with icon)
- Language toggle mobile: `p-2` with small text -- likely undersized
- Carousel prev/next on Inventory cards: `px-3` with full height -- adequate width but `opacity-0` on mobile (invisible)
- Close buttons on modals: `p-4 md:p-3` -- good, explicitly larger on mobile
- Footer social links: No padding beyond icon size (20px) -- undersized
- Mobile menu links: `py-4` or `py-2` -- adequate vertically
- FAQ accordion buttons: `p-6` -- generous, well-sized
- Form inputs: `p-4` -- adequate touch targets

**Areas needing attention:**
1. Footer social media icons (Facebook/Twitter) -- 20px icons with no padding
2. Mobile language toggle in navbar -- small touch target
3. Legal page footer links -- `py-1` is too small
4. Inventory carousel controls on mobile -- hidden via hover opacity
5. Various `text-[9px]` or `text-[10px]` links that may lack padding

### POLISH-11: Accessibility Basics

**Current state:**

**Alt text:**
- Logo images: All have `alt="Triple J Auto Investment"` or `alt="Triple J Auto Investment Logo"` -- GOOD
- Decorative images: Footer watermark has `alt="" aria-hidden="true"` -- GOOD
- Vehicle images in cards: `alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}` -- GOOD
- Modal detail image: `alt="Detail"` -- should be more descriptive
- Thumbnail images: `alt=""` in carousel and `alt="Thumb"` in admin -- needs improvement
- Hero background: Uses CSS background-image, no alt text needed -- GOOD

**ARIA attributes (16 total):**
- Navbar: `aria-label` on lock link, language toggle, menu button; `aria-expanded` on menu
- ImageGallery: `aria-label` on zoom, close, prev, next buttons
- Admin calendar: `aria-label` on month navigation
- BrowserCompatibilityCheck: `aria-label` on dismiss
- NotificationPreferences: `aria-label` on preferences
- CustomerStatusTracker: `aria-label` on share button

**Keyboard navigation:**
- VinLookup: `onKeyDown` for Enter to search
- CustomerLogin: `onKeyDown` for Enter on phone and code inputs
- No `tabIndex` attributes found
- No skip-to-content link
- No focus management on modal open/close
- FAQ accordion is only operable via click (no keyboard support on question buttons)

**Color contrast (estimated from theme):**
- Gold (#D4AF37) on black (#000): ~8.35:1 ratio -- PASSES AA
- Gray-400 (#9CA3AF) on black: ~5.5:1 ratio -- PASSES AA
- Gray-500 (#6B7280) on black: ~3.3:1 ratio -- FAILS AA for normal text
- Gray-600 (#4B5563) on black: ~2.1:1 ratio -- FAILS AA
- White on black: ~21:1 ratio -- PASSES AAA
- text-[9px] and text-[10px]: Below WCAG minimum text size recommendations

**Missing accessibility:**
1. Skip-to-content link
2. Focus trap on modals (Inventory detail modal, ImageGallery lightbox)
3. Keyboard-accessible FAQ accordion
4. Focus visible styles (may be suppressed by `focus:outline-none` on inputs)
5. `<main>`, `<nav>`, `<aside>` landmark roles (nav exists, main exists in App.tsx)
6. Page titles (all pages share the same `<title>` from index.html -- no per-page titles)
7. Form label associations (labels exist but may not use `htmlFor`/`id` pairing)

### Additional Findings

**Maintenance Page:**
- Currently does NOT exist. User requested a branded maintenance page.
- Implementation: A static HTML file at `public/maintenance.html` that Vercel can serve when the site is down. Or a React component at a route like `/maintenance` that can be swapped in by changing the catch-all route.
- Should include Triple J logo, "We'll be back shortly" messaging, phone number, professional styling matching the dark/gold aesthetic.

**Offline Detection:**
- Zero offline handling exists. No `navigator.onLine` checks, no event listeners.
- Implementation: A small hook `useOnlineStatus()` that listens for online/offline events, and a banner component that shows "You appear to be offline" when detected.

**Image Optimization:**
- Only 1 image in the entire codebase has `loading="lazy"` (the Google Maps iframe on About page).
- Vehicle images from Supabase storage are loaded eagerly.
- Hero and About page use external Unsplash URLs for background images.
- No WebP conversion or srcset attributes.
- Recommendation: Add `loading="lazy"` to all below-fold images. For the hero background image, consider using a local optimized copy.

**Suspense Fallback:**
- `<Suspense fallback={null}>` means when a user navigates to a lazy-loaded page (all pages except Home, Inventory, Contact), they see NOTHING while the chunk loads. On slow connections this could be several seconds of blank screen.
- Fix: Replace with a branded loading component (use the existing `CrestLoader` or a simpler gold spinner).

**ErrorBoundary Placement:**
- The ErrorBoundary only wraps `<BrowserCompatibilityCheck />`. If any page component throws during render, the entire app crashes with no fallback.
- Fix: Move ErrorBoundary to wrap `<AppContent />` or at minimum the Routes/Suspense block.

## Code Examples

### Console Stripping (Vite Config)
```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  return {
    // ... existing config ...
    build: {
      // ... existing rollupOptions ...
      // Strip console.* and debugger in production
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger'],
        }
      })
    }
  };
});
```

### Offline Detection Hook
```typescript
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Offline Banner Component
```typescript
// components/OfflineBanner.tsx
const OfflineBanner = () => (
  <div className="fixed top-0 left-0 right-0 z-[100000] bg-red-900 text-white text-center py-3 px-4">
    <p className="text-xs uppercase tracking-widest font-bold">
      You appear to be offline. Some features may be unavailable.
    </p>
  </div>
);
```

### Skeleton Loading Pattern
```typescript
// Skeleton card for vehicle grid
const VehicleCardSkeleton = () => (
  <div className="bg-black border border-white/5 animate-pulse">
    <div className="aspect-[4/3] bg-gray-800" />
    <div className="p-6 space-y-4">
      <div className="h-3 bg-gray-800 w-1/3" />
      <div className="h-6 bg-gray-800 w-2/3" />
      <div className="h-4 bg-gray-800 w-full" />
      <div className="h-4 bg-gray-800 w-3/4" />
    </div>
  </div>
);
```

### Suspense Fallback
```typescript
// Replace <Suspense fallback={null}> with:
<Suspense fallback={
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <img src="/GoldTripleJLogo.png" alt="" className="w-16 h-16 mx-auto animate-pulse mb-4" />
      <p className="text-gray-600 text-xs uppercase tracking-widest">Loading...</p>
    </div>
  </div>
}>
```

### Maintenance Page
```html
<!-- public/maintenance.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Triple J Auto Investment - Maintenance</title>
  <style>
    body {
      margin: 0;
      background: #000;
      color: #fff;
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container { max-width: 500px; padding: 2rem; }
    img { width: 80px; height: 80px; margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; letter-spacing: 0.1em; margin-bottom: 1rem; color: #D4AF37; }
    p { color: #9CA3AF; font-size: 0.875rem; line-height: 1.75; }
    a { color: #D4AF37; text-decoration: none; }
    a:hover { color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <img src="/GoldTripleJLogo.png" alt="Triple J Auto Investment" />
    <h1>WE'LL BE BACK SHORTLY</h1>
    <p>We're making some improvements to serve you better.<br>Please check back in a few minutes.</p>
    <p style="margin-top: 2rem;">
      Call us: <a href="tel:+18324009760">(832) 400-9760</a><br>
      <span style="font-size: 0.75rem; color: #4B5563;">Mon-Sat 9AM-6PM</span>
    </p>
  </div>
</body>
</html>
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual console.log removal | Vite `esbuild.drop` at build time | Zero console output guaranteed, zero development impact |
| Custom offline UI | Simple `navigator.onLine` hook | Built into every modern browser |
| Complex a11y libraries | Manual ARIA + semantic HTML | Sufficient for the target success criteria |

## Open Questions

1. **Vercel maintenance mode:** How does the user want to trigger maintenance mode? Vercel has a `vercel.json` redirect approach, or a custom middleware. The maintenance page can be static HTML, but the switching mechanism needs to be defined during planning.

2. **Admin pages scope:** The CONTEXT focuses on customer-facing polish. Admin pages (Dashboard, Inventory, Registrations, Rentals, Plates) have their own mobile and accessibility needs. Are admin pages in scope for this phase or deferred? The success criteria mention "every page" which would include admin.

3. **Image optimization depth:** CONTEXT says Claude's discretion on image optimization aggressiveness. Vehicle images come from Supabase storage. Adding `loading="lazy"` is trivial, but converting to WebP or implementing responsive `srcset` requires changes to how images are stored/served. Recommendation: Just add `loading="lazy"` -- image format optimization is out of scope for this phase.

4. **Bilingual empty states / error messages:** All UI text goes through the translation system (`t.xxx`). New empty states, error messages, offline banners, and the maintenance page need English AND Spanish versions. This adds translation keys to `utils/translations.ts`.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 59 source files (pages, components, services, lib, utils, context)
- Tailwind config analysis for theme/spacing patterns
- Console statement count via grep across entire codebase
- ARIA/accessibility attribute inventory via grep
- Button/card pattern analysis via grep and manual review

### Secondary (MEDIUM confidence)
- Vite esbuild.drop documentation (verified capability from Vite docs)
- WCAG AA contrast ratios (calculated from hex values in tailwind.config.js)

## Metadata

**Confidence breakdown:**
- Console statement inventory: HIGH - grep-verified exact counts
- Mobile layout risks: HIGH - based on reading every page's Tailwind classes
- Accessibility gaps: HIGH - grep-verified ARIA counts, manual review of keyboard handling
- Loading/error state inventory: HIGH - read every page and component
- Spacing consistency: HIGH - automated analysis of all padding classes
- Button pattern inventory: HIGH - grep + manual review
- Image optimization: MEDIUM - verified lazy loading status, estimated impact
- Color contrast: MEDIUM - calculated from hex values, not browser-tested

**Research date:** 2026-02-15
**Valid until:** Indefinitely (research is about current codebase state, not external dependencies)
