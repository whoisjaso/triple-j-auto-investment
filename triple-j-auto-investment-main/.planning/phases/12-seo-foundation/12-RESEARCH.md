# Phase 12: SEO Foundation - Research

**Researched:** 2026-02-16
**Domain:** React SPA SEO -- routing migration, per-page metadata, sitemap/robots, schema markup
**Confidence:** HIGH

## Summary

Phase 12 transforms a HashRouter-based React SPA into a search-engine-discoverable site. The codebase currently uses `react-router-dom@7.10.1` with `HashRouter` (URLs like `/#/about`), has zero per-page title/meta management, and relies entirely on static `index.html` meta tags set in Phase 10. The existing `vercel.json` already has the catch-all rewrite rule needed for `BrowserRouter`, making the routing migration straightforward.

The project runs React 19.2.0, which natively supports `<title>` and `<meta>` tag hoisting to `<head>` from any component -- eliminating the need for react-helmet or any third-party library. This is the cleanest solution: no new dependencies, no compatibility issues, and the exact pattern React 19 was designed for.

The sitemap.xml and robots.txt already exist in `public/` with correct clean URLs (not hash URLs), meaning they are future-proofed for the BrowserRouter migration. Schema markup (AutoDealer + FAQPage + BreadcrumbList) already exists in `index.html` from Phase 10 and is largely correct, requiring only minor audit for accuracy against the Google Business Profile.

**Primary recommendation:** Migrate HashRouter to BrowserRouter (one-line change), add React 19 native `<title>` and `<meta>` tags to each page component, and validate existing sitemap/robots/schema.

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | 7.10.1 (installed) | BrowserRouter, Routes, Link | Already in project; BrowserRouter is a drop-in replacement for HashRouter |
| react | 19.2.0 (installed) | Native `<title>` and `<meta>` hoisting | React 19 natively hoists metadata tags to `<head>` -- no library needed |
| react-dom | 19.2.0 (installed) | DOM rendering with metadata support | Paired with React 19 metadata features |

### Supporting (Already Configured -- No Changes Needed)

| Tool | Purpose | Status |
|------|---------|--------|
| Vercel | Hosting with SPA catch-all rewrites | `vercel.json` already has `"source": "/(.*)"` rewrite to `/index.html` |
| Vite | Build tool | Already configured with `react-router-dom` in vendor chunk |

### What We Do NOT Need

| Library | Why Not |
|---------|---------|
| react-helmet | Unmaintained, incompatible with React 19 (peer dep requires React 16-18) |
| react-helmet-async | Also incompatible with React 19 (same peer dep issue) |
| @dr.pogodin/react-helmet | Unnecessary -- React 19 native metadata is sufficient for this use case |
| next.js / remix | Out of scope per prior decisions (SSR migration explicitly excluded) |

**Installation:** None required. Zero new dependencies.

## Architecture Patterns

### Current Routing Structure (HashRouter)

```
App.tsx (line 3):
  import { HashRouter as Router, ... } from 'react-router-dom';

App.tsx (line 617):
  <Router>         // This is HashRouter
    <ScrollToTop />
    <SplashScreen duration={1200}>
      <AppContent />
    </SplashScreen>
  </Router>
```

### Pattern 1: BrowserRouter Migration (Single-Line Change)

**What:** Replace `HashRouter` import alias with `BrowserRouter`
**When to use:** This is the migration pattern
**Confidence:** HIGH -- verified from codebase and React Router v7 docs

```typescript
// BEFORE (App.tsx line 3):
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';

// AFTER:
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
```

That is the ONLY change needed in the router setup. The `as Router` alias means all downstream code (`<Router>`) stays the same. No route definitions change. No Link components change. No useNavigate/useLocation calls change.

**Why this works:** The app already uses path-style routes (`/about`, `/inventory`, etc.) inside the HashRouter. BrowserRouter uses the same path format -- it just puts them in the real URL path instead of after a `#`.

### Pattern 2: React 19 Native Metadata Per Page

**What:** Add `<title>` and `<meta>` JSX tags directly in page components
**When to use:** Every public page component
**Confidence:** HIGH -- verified from React 19 official docs

```typescript
// Example: About page component
const About = () => {
  return (
    <>
      <title>About Triple J Auto Investment | Houston Pre-Owned Dealer</title>
      <meta name="description" content="Family-owned Houston auto dealer at 8774 Almeda Genoa Rd. Pre-owned vehicles $3,000-$8,000. Sales and rentals. Se habla espanol. Dealer License P171632." />
      <meta property="og:title" content="About Triple J Auto Investment | Houston Pre-Owned Dealer" />
      <meta property="og:description" content="Family-owned Houston auto dealer. Pre-owned vehicles $3,000-$8,000. Sales and rentals." />

      <div className="bg-tj-green min-h-screen ...">
        {/* existing page content */}
      </div>
    </>
  );
};
```

**Key rules from React 19 docs:**
- React automatically hoists `<title>` and `<meta>` to `<head>` regardless of component tree position
- Only render ONE `<title>` per page at a time (multiple titles create undefined behavior)
- Title children must be a single string: use `{`Results page ${num}`}` not `Results page {num}`
- `<meta>` with `itemProp` renders inline (not hoisted) -- useful for schema but different behavior

### Pattern 3: SEO Component Wrapper (Optional Helper)

**What:** Reusable component to standardize per-page SEO tags
**When to use:** To avoid repetition across 10+ page components

```typescript
// components/SEO.tsx
interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
}

const SEO = ({ title, description, ogTitle, ogDescription, canonical }: SEOProps) => (
  <>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://triplejautoinvestment.com/GoldTripleJLogo.png" />
    {canonical && <link rel="canonical" href={canonical} />}
  </>
);
```

### Pattern 4: Canonical URLs

**What:** Add `<link rel="canonical">` to prevent duplicate content issues
**When to use:** All public pages, especially important after BrowserRouter migration

```typescript
<link rel="canonical" href="https://triplejautoinvestment.com/about" />
```

### Recommended Project Structure (Changes Only)

```
components/
  SEO.tsx              # NEW - reusable SEO meta component
App.tsx                # MODIFIED - HashRouter -> BrowserRouter (one import change)
pages/
  Home.tsx             # MODIFIED - add <SEO> component
  About.tsx            # MODIFIED - add <SEO> component
  Inventory.tsx        # MODIFIED - add <SEO> component
  Contact.tsx          # MODIFIED - add <SEO> component
  Services.tsx         # MODIFIED - add <SEO> component
  Finance.tsx          # MODIFIED - add <SEO> component
  FAQ.tsx              # MODIFIED - add <SEO> component
  VinLookup.tsx        # MODIFIED - add <SEO> component
  Policies.tsx         # MODIFIED - add <SEO> component
  PaymentOptions.tsx   # MODIFIED - add <SEO> component
  Legal.tsx            # MODIFIED - add <SEO> with dynamic section title
  NotFound.tsx         # MODIFIED - add noindex meta
public/
  sitemap.xml          # AUDIT - verify URLs match routes, update lastmod dates
  robots.txt           # AUDIT - verify paths match routes, add missing pages
index.html             # AUDIT - verify schema accuracy, remove duplicate meta that pages now own
```

### Anti-Patterns to Avoid

- **Setting `document.title` via useEffect:** This is the old pattern. React 19 native `<title>` is declarative and handles cleanup automatically. Do not use `useEffect(() => { document.title = "..." }, [])`.
- **Multiple `<title>` tags rendered simultaneously:** React 19 docs explicitly warn against this. Ensure only ONE page component renders a `<title>` at a time (AnimatePresence `mode="wait"` already handles this by unmounting the old route before mounting the new one).
- **Removing index.html meta tags entirely:** Keep the index.html meta tags as fallbacks for the initial HTML load before React hydrates. Page-level tags will override them once React renders.
- **Using `#` links anywhere:** After migration, ensure no `<a href="/#/about">` patterns exist. All navigation should use `<Link to="/about">`.

## Complete Route Inventory

### Public Customer-Facing Routes (Need SEO Treatment)

| Route | Component | SEO Priority | Notes |
|-------|-----------|-------------|-------|
| `/` | Home | P1 - Highest | Primary landing page, all target keywords |
| `/inventory` | Inventory | P1 - Highest | Main product page, "used cars Houston" |
| `/about` | About | P2 - High | Trust/brand page |
| `/contact` | Contact | P2 - High | Local business critical, NAP consistency |
| `/services` | Services | P2 - High | Service offerings, rental keywords |
| `/finance` | Finance | P2 - High | "buy here pay here Houston" keyword target |
| `/faq` | FAQ | P2 - High | FAQ schema already in index.html |
| `/vin` | VinLookup | P3 - Medium | Utility tool, lower search intent |
| `/vin/free-check` | VinLookup | P3 - Medium | Alias route -- needs canonical to `/vin` |
| `/policies` | Policies | P4 - Low | Legal content, low search value |
| `/terms` | Policies | P4 - Low | Alias -- canonical to `/policies` |
| `/payment-options` | PaymentOptions | P3 - Medium | Payment info, supports financing keywords |
| `/legal/:section` | Legal | P4 - Low | Dynamic legal sections (privacy, terms, etc.) |

### Public But Non-Indexable Routes

| Route | Component | Why noindex |
|-------|-----------|-------------|
| `/login` | Login | Admin authentication |
| `/customer/login` | CustomerLogin | Customer portal auth |
| `/customer/dashboard` | CustomerDashboard | Private customer data |
| `/track/:accessKey` | CustomerStatusTracker | Token-based private access |
| `/track` | RegistrationTracker | Admin lookup tool |
| `/commercial-wholesale` | Contact | Alias -- canonical to `/contact` |

### Admin Routes (Already Blocked)

| Route | Component | Notes |
|-------|-----------|-------|
| `/admin/dashboard` | AdminDashboard | Behind ProtectedRoute, robots.txt already blocks `/admin/` |
| `/admin/inventory` | AdminInventory | Same |
| `/admin/registrations` | AdminRegistrations | Same |
| `/admin/rentals` | AdminRentals | Same |
| `/admin/plates` | AdminPlates | Same |

### Sitemap vs Routes Gap Analysis

**In sitemap.xml but NOT a real concern:**
- All 10 sitemap URLs correspond to real routes -- no gaps

**Routes NOT in sitemap.xml (correct -- should not be):**
- `/login`, `/admin/*`, `/customer/*`, `/track`, `/track/:accessKey` (private)
- `/vin/free-check` (alias, canonicalize to `/vin`)
- `/terms` (alias, canonicalize to `/policies`)
- `/commercial-wholesale` (alias, canonicalize to `/contact`)
- `/legal/:section` (dynamic -- could add specific sections like `/legal/privacy`)

**sitemap.xml Issues Found:**
- `lastmod` dates are all `2025-12-09` -- should be updated
- Missing namespace for `geo:` extension (cosmetic, not harmful)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-page meta tags | Custom `document.title` useEffect logic | React 19 native `<title>` + `<meta>` | Built into React 19, declarative, auto-cleanup |
| Head tag management | Custom DOM manipulation for `<head>` | React 19 native hoisting | React 19 handles this automatically |
| SPA URL rewriting | Custom server middleware | Vercel `vercel.json` rewrites (already done) | Already configured, battle-tested |
| Sitemap generation | Build-time script to scan routes | Static `sitemap.xml` in `public/` | Only ~10 public routes, static file is simpler and already exists |
| Schema validation | Custom JSON-LD validator | Google Rich Results Test / Schema.org validator | Free official tools, no code needed |
| OG image generation | Dynamic image generation service | Single static OG image (logo) | Small dealer site, one brand image is appropriate |

**Key insight:** This is a small business site with ~10 public pages and static content. Complex SEO tooling (dynamic sitemaps, image generation, prerendering) is overkill. Static files + React 19 native features cover everything needed.

## Common Pitfalls

### Pitfall 1: AnimatePresence Causing Duplicate Titles

**What goes wrong:** With `AnimatePresence mode="wait"`, the old page unmounts BEFORE the new page mounts. However, if using `mode="sync"` or if exit animations overlap, two `<title>` tags could briefly coexist.
**Why it happens:** React 19 places ALL rendered `<title>` tags in `<head>`.
**How to avoid:** The app already uses `AnimatePresence mode="wait"` (App.tsx line 565), which ensures sequential mounting. Verify this mode is not changed.
**Warning signs:** Check browser tab title during page transitions -- if it flickers or shows wrong title, overlap is occurring.

### Pitfall 2: HashRouter Artifacts in External Links

**What goes wrong:** After migrating to BrowserRouter, external sites, bookmarks, or Google search results may still have old `/#/about` URLs cached.
**Why it happens:** Hash URLs may have been shared, bookmarked, or indexed (unlikely since hash URLs are generally invisible to Google, but possible via social shares).
**How to avoid:** Add a redirect handler that strips hash prefixes. If `window.location.hash` starts with `#!/` or `#/`, redirect to the clean path.
**Warning signs:** Users reporting broken links, analytics showing hash-prefixed page views.

### Pitfall 3: Vercel Rewrite Interfering with Static Files

**What goes wrong:** The catch-all rewrite `/(.*) -> /index.html` could theoretically intercept requests for `sitemap.xml` or `robots.txt`.
**Why it happens:** Vercel processes rewrites only for paths that don't match static files. Since `sitemap.xml` and `robots.txt` are in `public/` and get copied to `dist/`, they are served as static files BEFORE the rewrite rule applies.
**How to avoid:** Verify after build that `dist/sitemap.xml` and `dist/robots.txt` exist. Vercel serves static files first, rewrites second.
**Warning signs:** Google Search Console reporting inability to fetch sitemap.

### Pitfall 4: index.html Meta Tags Persisting After React Renders Page-Specific Tags

**What goes wrong:** The static `index.html` has a `<title>` and `<meta name="description">` that are correct for the homepage. When React 19 renders page-specific tags, it ADDS new tags but may not REMOVE the static ones from index.html.
**Why it happens:** React 19's metadata hoisting creates new DOM elements but does not manage removal of pre-existing static HTML elements.
**How to avoid:** Two approaches: (1) Remove the static `<title>` and `<meta name="description">` from `index.html` and let React manage all metadata, OR (2) Keep them as fallbacks and ensure React's page-specific tags use the same `name` attribute so browsers use the last-defined value. The recommended approach is (1) for cleanliness, since React renders fast enough that crawlers will see the React-managed tags.
**Warning signs:** View page source showing duplicate title or description tags.

### Pitfall 5: Forgetting to Update vite.config.ts Vendor Chunk

**What goes wrong:** The `vite.config.ts` references `react-router-dom` in `manualChunks`. If the import migration changes the package name, the chunk config may break.
**Why it happens:** Since we're keeping `react-router-dom` as the package (just changing HashRouter to BrowserRouter), this is NOT actually a problem. But it would be if we migrated to importing from `react-router`.
**How to avoid:** Keep importing from `react-router-dom` (it's a re-export in v7 and fully supported). Do NOT change to `react-router` imports -- unnecessary churn with no benefit.
**Warning signs:** Build errors about missing chunks.

### Pitfall 6: Google SPA Rendering Delay

**What goes wrong:** Google's crawler renders JavaScript but with a delay (sometimes days). Client-side-rendered meta tags may not be immediately visible to Google.
**Why it happens:** Google's two-phase indexing: first crawls HTML, then queues for JavaScript rendering.
**How to avoid:** Keep the `index.html` schema markup (JSON-LD) as-is since it's in the static HTML and visible without JavaScript. For per-page meta tags, accept the rendering delay -- Google DOES render SPAs, just not instantly. This is the tradeoff of the "no SSR" decision.
**Warning signs:** Google Search Console "URL Inspection" showing different rendered HTML vs source HTML.

## Code Examples

### Example 1: Complete BrowserRouter Migration (App.tsx)

```typescript
// Source: Codebase analysis + React Router v7 docs
// File: App.tsx, line 3 -- ONLY CHANGE NEEDED

// BEFORE:
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';

// AFTER:
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
```

### Example 2: SEO Helper Component

```typescript
// Source: React 19 official docs (react.dev/reference/react-dom/components/meta)
// File: components/SEO.tsx (NEW)

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
}

const SITE_URL = 'https://triplejautoinvestment.com';
const OG_IMAGE = `${SITE_URL}/GoldTripleJLogo.png`;

export const SEO = ({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  noindex = false,
}: SEOProps) => (
  <>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`${SITE_URL}${path}`} />

    {/* Open Graph */}
    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    <meta property="og:url" content={`${SITE_URL}${path}`} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={OG_IMAGE} />

    {/* Indexing control */}
    {noindex && <meta name="robots" content="noindex, nofollow" />}
  </>
);
```

### Example 3: Page Component with SEO

```typescript
// Source: React 19 docs + codebase pattern
// File: pages/About.tsx (MODIFIED - add SEO at top of return)

import { SEO } from '../components/SEO';

const About = () => {
  const { t } = useLanguage();

  return (
    <>
      <SEO
        title="About Triple J Auto Investment | Houston Used Car Dealer"
        description="Family-owned Houston auto dealer at 8774 Almeda Genoa Rd. Affordable pre-owned vehicles $3,000-$8,000. Sales and rentals. Se habla espanol. License P171632."
        path="/about"
      />
      <div className="bg-tj-green min-h-screen text-white ...">
        {/* existing page content unchanged */}
      </div>
    </>
  );
};
```

### Example 4: Hash-to-Clean URL Redirect (Legacy Support)

```typescript
// Source: Common SPA migration pattern
// File: App.tsx or a new component inside <Router>

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HashRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle legacy hash URLs like /#/about -> /about
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1); // remove '#'
      navigate(path, { replace: true });
    }
  }, [navigate]);

  return null;
};
```

### Example 5: noindex for Private Pages

```typescript
// Source: React 19 docs
// File: pages/Login.tsx, pages/CustomerLogin.tsx, etc.

const Login = () => {
  return (
    <>
      <title>Admin Login | Triple J Auto Investment</title>
      <meta name="robots" content="noindex, nofollow" />
      {/* existing page content */}
    </>
  );
};
```

## Existing Assets Audit

### index.html Schema Markup (Phase 10) -- Current State

**AutoDealer Schema (lines 51-143):** GOOD
- `@type: "AutoDealer"` -- correct
- `priceRange: "$3000-$8000"` -- correct (updated in Phase 10-05)
- `paymentAccepted: "Cash, Cashier's Check, Debit Card, Financing"` -- correct (Debit Card replaced Wire Transfer in Phase 10-05)
- `address` -- correct (8774 Almeda Genoa Road, Houston, TX 77075)
- `telephone: "+18324009760"` -- correct
- `openingHoursSpecification` -- correct (Mon-Sat 9-6, Sun closed)
- `areaServed` -- 6 cities listed (Houston, Pasadena, Pearland, South Houston, Sugar Land, Galveston)

**Issues Found:**
1. Schema `@type` is only `"AutoDealer"` -- should also include `"LocalBusiness"` (use `@type: ["AutoDealer", "LocalBusiness"]` or nested `additionalType`)
2. FAQ schema (lines 146-217) mentions "wire transfer" in payment methods answer -- inconsistent with corrected `paymentAccepted` field. Should say "Debit Card" instead.
3. FAQ schema mentions "personal checks" -- verify if this is still accurate
4. `foundingDate: "2025"` -- verify accuracy with business owner

### OG Tags (index.html lines 18-27) -- Current State

**GOOD:**
- `og:type: "business.business"` -- appropriate
- `og:title` -- accurate, mentions Houston families
- `og:description` -- mentions $3,000-$8,000 range correctly
- `og:image` -- points to logo

**Issue:** These are static in `index.html` and apply to ALL pages. Phase 12 will add per-page OG tags that override these via React 19 hoisting.

### robots.txt (public/robots.txt) -- Current State

**GOOD:**
- Allows all public routes
- Blocks `/admin/` and `/login`
- Points to sitemap

**Issues Found:**
1. Missing `Disallow: /customer/` (customer portal should not be indexed)
2. Missing `Disallow: /track` (private tracking pages)
3. `Allow:` directives are redundant when `Allow: /` is present (cosmetic, not harmful)
4. `Crawl-delay: 1` is ignored by Googlebot (only respected by Bing/Yandex) -- not harmful

### sitemap.xml (public/sitemap.xml) -- Current State

**GOOD:**
- Lists all 10 correct public routes
- Uses clean URLs (not hash URLs) -- already future-proofed
- Correct domain: `triplejautoinvestment.com`

**Issues Found:**
1. All `lastmod` dates are `2025-12-09` -- stale, should be updated
2. `geo:` namespace extension on homepage is non-standard for sitemaps (not harmful, but unnecessary)
3. Missing `/legal/privacy` and `/legal/terms` (low priority, but some crawlers appreciate completeness)
4. Should add `image:` sitemap entries for inventory page if vehicle images are important for Google Images

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-helmet for `<head>` management | React 19 native `<title>` + `<meta>` hoisting | React 19 (Dec 2024) | No external dependency needed |
| `react-router-dom` package for web routing | `react-router` unified package (v7) | React Router v7 (2024) | Can import from either; `react-router-dom` still works as re-export |
| `document.title = "..."` in useEffect | Declarative `<title>` JSX tag | React 19 (Dec 2024) | Cleaner, auto-cleanup, works with Suspense |
| HashRouter for SPAs | BrowserRouter (standard for SEO) | Always was standard; HashRouter was a workaround | Clean URLs visible to search engines |

**Deprecated/outdated:**
- `react-helmet`: Unmaintained since 2020, incompatible with React 19
- `react-helmet-async`: Unmaintained, incompatible with React 19 (peer deps: React 16-18)
- `document.title` in useEffect: Replaced by React 19 native `<title>` component

## Vercel Configuration Assessment

The `vercel.json` is already correctly configured for BrowserRouter:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This catch-all rewrite ensures:
1. Direct URL access (e.g., typing `/about` in browser) serves `index.html`
2. Page refreshes on any route work correctly
3. Static files (`sitemap.xml`, `robots.txt`, assets) are served directly (Vercel prioritizes static files over rewrites)

**No changes needed to vercel.json.**

## Per-Page Meta Tag Recommendations

Based on target keywords from CONTEXT.md:

| Page | Recommended Title | Target Keywords |
|------|-------------------|-----------------|
| `/` | Triple J Auto Investment \| Used Cars Houston \| Sales & Rentals | used cars Houston, car rentals Houston |
| `/inventory` | Used Cars for Sale in Houston \| Triple J Auto Investment | used cars Houston, cheap cars Houston, cars under 8000 |
| `/about` | About Triple J Auto Investment \| Houston Pre-Owned Dealer | Houston auto dealer, pre-owned vehicles |
| `/contact` | Contact Triple J Auto \| Houston Car Dealer \| (832) 400-9760 | Houston car dealer, contact |
| `/services` | Auto Services & Car Rentals Houston \| Triple J Auto Investment | car rentals Houston, auto services |
| `/finance` | Car Financing Houston \| Buy Here Pay Here \| Triple J Auto | buy here pay here Houston, car financing |
| `/faq` | FAQ \| Triple J Auto Investment Houston | common questions, Houston dealer |
| `/vin` | Free VIN Check \| Triple J Auto Investment Houston | VIN lookup, vehicle history |
| `/policies` | Policies \| Triple J Auto Investment | dealer policies |
| `/payment-options` | Payment Options \| Triple J Auto Investment Houston | payment methods, financing |

**Note:** Final title/description copywriting is a planning decision. These are research-informed suggestions optimized for the target keywords.

## Files That Need Modification

| File | Change Type | Scope |
|------|------------|-------|
| `App.tsx` | One import change (HashRouter -> BrowserRouter) | Line 3 only |
| `App.tsx` | Add HashRedirect component | ~15 lines |
| `components/SEO.tsx` | NEW file | ~30 lines |
| `pages/Home.tsx` | Add SEO component | 5-10 lines added |
| `pages/About.tsx` | Add SEO component | 5-10 lines added |
| `pages/Inventory.tsx` | Add SEO component | 5-10 lines added |
| `pages/Contact.tsx` | Add SEO component | 5-10 lines added |
| `pages/Services.tsx` | Add SEO component | 5-10 lines added |
| `pages/Finance.tsx` | Add SEO component | 5-10 lines added |
| `pages/FAQ.tsx` | Add SEO component | 5-10 lines added |
| `pages/VinLookup.tsx` | Add SEO component | 5-10 lines added |
| `pages/Policies.tsx` | Add SEO component | 5-10 lines added |
| `pages/PaymentOptions.tsx` | Add SEO component | 5-10 lines added |
| `pages/Legal.tsx` | Add SEO with dynamic section title | 10-15 lines added |
| `pages/NotFound.tsx` | Add noindex meta | 3-5 lines added |
| `pages/Login.tsx` | Add noindex meta | 3-5 lines added |
| `pages/CustomerLogin.tsx` | Add noindex meta | 3-5 lines added |
| `pages/CustomerDashboard.tsx` | Add noindex meta | 3-5 lines added |
| `index.html` | Remove static `<title>` and `<meta name="description">` (React manages these now) | ~3 lines removed |
| `index.html` | Fix FAQ schema wire transfer reference | 1 line changed |
| `public/robots.txt` | Add missing Disallow rules | 2-3 lines added |
| `public/sitemap.xml` | Update lastmod dates | All dates updated |

**Total scope:** ~17 files modified, 1 new file created. All changes are small and isolated.

## Open Questions

1. **React 19 `<meta>` deduplication behavior**
   - What we know: React 19 hoists `<meta>` to `<head>` automatically. The official docs do not explicitly describe deduplication of `<meta name="description">` when both index.html static and React-rendered versions exist.
   - What's unclear: Whether React removes the static `<meta>` from index.html or simply appends a second one. If duplicate, browsers use the first one encountered.
   - Recommendation: Remove the static `<title>` and general `<meta name="description">` from `index.html` entirely, letting React manage them. Keep schema JSON-LD and geo meta tags in index.html (these are not per-page).

2. **Google Business Profile consistency**
   - What we know: The CONTEXT.md confirms a GBP exists and is active.
   - What's unclear: Exact GBP data to cross-reference with schema markup (hours, categories, photos).
   - Recommendation: Assume current schema is consistent (it was audited in Phase 10). Flag for manual verification post-deployment.

3. **`/legal/:section` pages and SEO value**
   - What we know: Legal pages (`/legal/privacy`, `/legal/terms`, `/legal/dmv`, etc.) use dynamic routing with `useParams`.
   - What's unclear: Whether these pages have enough unique content to warrant individual sitemap entries.
   - Recommendation: Add SEO tags with section-specific titles. Do not add to sitemap (low search value). Do not noindex them either (privacy/terms pages can build trust signals).

## Sources

### Primary (HIGH confidence)
- React 19 official docs: `<meta>` component -- https://react.dev/reference/react-dom/components/meta
- React 19 official docs: `<title>` component -- https://react.dev/reference/react-dom/components/title
- React Router v7 upgrade guide -- https://reactrouter.com/upgrading/v6
- Codebase direct inspection: App.tsx, index.html, vercel.json, sitemap.xml, robots.txt, package.json

### Secondary (MEDIUM confidence)
- React Router v7 HashRouter docs -- https://reactrouter.com/6.30.3/router-components/hash-router
- Vercel SPA rewrite pattern -- confirmed via multiple sources and existing vercel.json
- @dr.pogodin/react-helmet as React 19 alternative -- https://www.npmjs.com/package/@dr.pogodin/react-helmet (researched but NOT recommended)

### Tertiary (LOW confidence)
- Google SPA rendering timeline claims (days delay) -- multiple blog posts, not officially quantified by Google
- `Crawl-delay` Googlebot behavior -- community consensus, not officially documented by Google

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified React 19 native features from official docs, react-router-dom version confirmed from package.json
- Architecture: HIGH -- BrowserRouter migration is a one-line change verified against codebase; React 19 metadata pattern verified from official docs
- Pitfalls: HIGH -- identified from codebase analysis (AnimatePresence mode, existing vercel.json, static vs React-managed meta tags)
- Per-page meta recommendations: MEDIUM -- keyword targets from CONTEXT.md, title construction is subjective

**Research date:** 2026-02-16
**Valid until:** 2026-04-16 (stable domain -- React 19, React Router v7, Vercel are all mature)
