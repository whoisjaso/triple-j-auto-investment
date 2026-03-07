# Phase 14: Expectancy Building - Research

**Researched:** 2026-02-17
**Domain:** Vehicle detail pages, price anchoring, AI-generated content, SEO structured data
**Confidence:** HIGH

## Summary

Phase 14 transforms the existing inventory grid + modal experience into an emotional, story-driven vehicle browsing journey. The core deliverable is a standalone vehicle detail page at `/vehicles/:slug` with identity-first headlines, price transparency architecture, a Triple J Verified badge, and honest vehicle story sections. The existing modal on the inventory page stays intact with minimal card-level updates.

The project already has all the infrastructure needed: react-router-dom v7 with `useParams` for parameterized routes, a Gemini AI service (`@google/genai` v1.30+) for text generation, a `SEO` component using React 19 native metadata, Framer Motion for animations, and Supabase with a `vehicles` table. The main work is (1) adding new database columns for AI-generated content, (2) creating a new `VehicleDetail` page component, (3) extending the Gemini service for headline/story generation, (4) building a price transparency block with market estimate logic, and (5) minimal inventory card updates.

**Primary recommendation:** Build the vehicle detail page as a new standalone page component (`pages/VehicleDetail.tsx`) using the existing `ImageGallery` component for the hero gallery, extend the Gemini service for headline/story generation (stored in Supabase, generated at listing time via admin panel), and use a simple algorithmic market estimate (no external API needed for $3K-$8K vehicles).

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | ^7.9.6 | Dynamic routes with `useParams` | Already in project, supports `/vehicles/:slug` |
| @google/genai | ^1.30.0 | Gemini AI for headline/story generation | Already in project via `geminiService.ts` |
| @supabase/supabase-js | ^2.87.1 | Database for new vehicle fields | Already in project, vehicles table exists |
| framer-motion | ^12.23.26 | Page transitions, section reveals | Already in project, used throughout |
| lucide-react | ^0.554.0 | Icons (Shield, DollarSign, etc.) | Already in project |
| react (React 19) | ^19.2.0 | Native document metadata for SEO | Already in project, SEO.tsx uses it |

### Supporting (No New Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^3.4.19 | Styling with existing design tokens | All UI work |
| Recharts | ^3.4.1 | Could be used for price comparison visual | Optional for price block |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Algorithmic market estimate | KBB/Edmunds API | APIs cost money and are overkill for $3K-$8K range; algorithmic is "close enough" per user decision |
| Gemini for headlines | Manual entry | AI generation at listing time saves admin effort; editable after generation |
| New gallery component | Existing ImageGallery | Existing component already has swipe, zoom, thumbnails -- reuse it |

**Installation:** No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
pages/
  VehicleDetail.tsx        # NEW - standalone vehicle detail page
  Inventory.tsx            # MODIFIED - minimal card updates
components/
  VehicleVerifiedBadge.tsx  # NEW - Triple J Verified badge component
  VehiclePriceBlock.tsx     # NEW - price transparency architecture
  VehicleStorySection.tsx   # NEW - vehicle story/condition section
  VehicleJsonLd.tsx         # NEW - structured data for SEO
  ImageGallery.tsx          # EXISTING - reuse for detail page hero
  SovereignCrest.tsx        # EXISTING - used in verified badge
  SEO.tsx                   # EXISTING - per-page meta tags
services/
  geminiService.ts          # MODIFIED - add headline + story generators
  marketEstimateService.ts  # NEW - algorithmic price estimate
utils/
  vehicleSlug.ts            # NEW - slug generation/parsing
  translations.ts           # MODIFIED - add vehicle detail page strings
types.ts                    # MODIFIED - add new Vehicle fields
```

### Pattern 1: Dynamic Route with Data Fetching
**What:** Vehicle detail page at `/vehicles/:slug` that fetches vehicle by slug from Supabase
**When to use:** The standalone detail page
**Example:**
```typescript
// App.tsx - Add route
<Route path="/vehicles/:slug" element={<VehicleDetail />} />

// pages/VehicleDetail.tsx
import { useParams } from 'react-router-dom';

const VehicleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  // Parse slug: "2018-honda-accord" -> year=2018, make=Honda, model=Accord
  // OR lookup by slug column in database
  // Fetch vehicle from Supabase
};
```

### Pattern 2: Database-First AI Content
**What:** AI-generated content stored in database columns, generated once at listing time, editable by admin
**When to use:** Identity headlines, vehicle stories
**Example:**
```typescript
// New columns on vehicles table:
// identity_headline TEXT       -- "Family-Ready Sedan | Reliable. Clean. Ready for Your Next Chapter."
// identity_headline_es TEXT    -- Spanish translation
// vehicle_story TEXT           -- origin story, honest condition narrative
// vehicle_story_es TEXT        -- Spanish translation
// is_verified BOOLEAN          -- Triple J Verified status
// market_estimate DECIMAL      -- approximate market value
// slug TEXT UNIQUE             -- URL-friendly identifier

// Admin panel generates these at listing time:
const headline = await generateIdentityHeadline(make, model, year, bodyType, diagnostics);
const story = await generateVehicleStory(make, model, year, mileage, diagnostics, description);
```

### Pattern 3: SEO with JSON-LD Structured Data
**What:** Schema.org/Car structured data for vehicle detail pages
**When to use:** Every vehicle detail page
**Example:**
```typescript
// components/VehicleJsonLd.tsx
const VehicleJsonLd = ({ vehicle }: { vehicle: Vehicle }) => {
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    "brand": { "@type": "Brand", "name": vehicle.make },
    "model": vehicle.model,
    "vehicleModelDate": vehicle.year.toString(),
    "itemCondition": "https://schema.org/UsedCondition",
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": vehicle.mileage.toString(),
      "unitCode": "SMI"
    },
    "vehicleIdentificationNumber": vehicle.vin,
    "offers": {
      "@type": "Offer",
      "availability": vehicle.status === 'Available'
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      "price": vehicle.price.toString(),
      "priceCurrency": "USD",
      "seller": {
        "@type": "AutoDealer",
        "name": "Triple J Auto Investment",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "8774 Almeda Genoa Rd",
          "addressLocality": "Houston",
          "addressRegion": "TX",
          "postalCode": "77075"
        }
      }
    },
    "image": vehicle.imageUrl
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
```

### Pattern 4: URL Slug Generation
**What:** Generate SEO-friendly slugs from vehicle data
**When to use:** Creating vehicle detail page URLs
**Example:**
```typescript
// utils/vehicleSlug.ts
export function generateVehicleSlug(year: number, make: string, model: string, id: string): string {
  const base = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  // Append short ID suffix for uniqueness (e.g., "2018-honda-accord-a1b2c3")
  const shortId = id.slice(0, 6);
  return `${base}-${shortId}`;
}

export function parseVehicleSlug(slug: string): { shortId: string } {
  // Extract the last segment as the ID suffix
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  return { shortId };
}
```

### Pattern 5: Market Estimate Algorithm (No External API)
**What:** Simple markup-based market estimate for BHPH vehicles in $3K-$8K range
**When to use:** Price block on detail page
**Example:**
```typescript
// services/marketEstimateService.ts
export function estimateMarketValue(price: number): number {
  // For BHPH dealers in the $3K-$8K range, vehicles are typically
  // priced 15-25% below what equivalent vehicles list for at
  // larger dealerships. Apply a ~20% markup to represent "market average."
  const markup = 1.20; // 20% above Triple J's price
  return Math.round(price * markup / 100) * 100; // Round to nearest $100
}

export function estimateMonthlyPayment(
  price: number,
  downPayment: number = 500,
  termMonths: number = 24,
  annualRate: number = 0 // BHPH often structures as flat add-on, not APR
): number {
  // Simple BHPH in-house calculation
  // Many BHPH dealers use a flat weekly/biweekly structure
  const principal = price - downPayment;
  const monthlyPayment = principal / termMonths;
  return Math.round(monthlyPayment);
}
```

### Anti-Patterns to Avoid
- **Don't create a separate data fetching layer:** Use Supabase directly in the component (consistent with existing patterns in `context/Store.tsx`)
- **Don't regenerate AI content on every page view:** Generate once at listing time, store in database (this is a user decision)
- **Don't redesign the inventory grid:** Only minimal changes (link, badge, headline) per user decision
- **Don't build a custom image gallery:** Reuse existing `ImageGallery.tsx` which already has swipe, zoom, thumbnails, keyboard nav, and accessibility
- **Don't use an external market value API:** The user explicitly said "close enough" for the $3K-$8K range; an algorithmic estimate suffices

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image gallery with swipe, zoom, thumbnails | New gallery component | Existing `ImageGallery.tsx` | Already has swipe, zoom, keyboard nav, accessibility, scroll lock |
| SEO meta tags | Custom head manipulation | Existing `SEO.tsx` component | Already uses React 19 native metadata pattern |
| Vehicle crest/logo for badge | New SVG icon | Existing `SovereignCrest.tsx` | Already handles fallback SVG, gold gradient, TJ monogram |
| Page scroll management | Custom scroll handler | Existing `useScrollLock` hook + `ScrollToTop` component | Already handles scroll lock and restoration |
| AI text generation | Custom AI service | Existing `geminiService.ts` with `@google/genai` | Just extend with new prompt functions |
| Bilingual support | Custom i18n | Existing `translations.ts` + `LanguageContext` | Just add new translation keys |
| Page transitions | Custom animation | Existing Framer Motion `AnimatePresence` pattern in App.tsx | Already wraps Routes |

**Key insight:** This phase is predominantly about composing NEW UI components from EXISTING infrastructure. The project already has every technical capability needed -- gallery, SEO, AI, database, routing, animations, i18n. The work is assembling these into a new page layout with new visual components (price block, verified badge, story section).

## Common Pitfalls

### Pitfall 1: Slug Collision
**What goes wrong:** Two vehicles with the same year/make/model (e.g., two "2018 Honda Accord" entries) generate identical slugs, causing route conflicts.
**Why it happens:** Slug is derived only from vehicle metadata, not unique ID.
**How to avoid:** Always append a short unique identifier (first 6 chars of UUID) to the slug. Store slug in the database for reliable lookup.
**Warning signs:** Vehicle detail page shows wrong vehicle data, or 404s on valid URLs.

### Pitfall 2: AI Content Missing on Old Vehicles
**What goes wrong:** Existing vehicles in the database don't have identity headlines or stories because they were added before the feature existed.
**Why it happens:** New columns are nullable, old vehicles haven't been processed.
**How to avoid:** Provide graceful fallbacks (use existing `description` field, generate basic headline from year/make/model). Include a "Generate All Missing" admin button.
**Warning signs:** Detail pages show blank headline/story sections for older inventory.

### Pitfall 3: Vercel SPA Routing for New Routes
**What goes wrong:** Direct navigation to `/vehicles/2018-honda-accord-abc123` returns 404 on Vercel.
**Why it happens:** Vercel needs to serve `index.html` for all routes in an SPA.
**How to avoid:** The project's `vercel.json` already has `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]` -- this handles it. No action needed.
**Warning signs:** Direct URL access works locally but 404s in production.

### Pitfall 4: SEO Limitations of Client-Side Rendering
**What goes wrong:** Expecting full SEO indexing for vehicle pages rendered client-side.
**Why it happens:** Google can render JavaScript SPAs, but other search engines and social media crawlers may not.
**How to avoid:** Use JSON-LD structured data (Google reads this from client-rendered pages). Use React 19 native metadata for title/description. Accept that OG image previews for social sharing may not work without SSR. This is an inherent SPA limitation.
**Warning signs:** Social media shares show generic site image instead of vehicle image.

### Pitfall 5: Market Estimate Credibility
**What goes wrong:** Showing a "Market Average" that is obviously wrong or feels arbitrary to visitors.
**Why it happens:** Simple percentage markup doesn't account for vehicle age, mileage, or condition.
**How to avoid:** Use a slightly more nuanced formula that factors in year depreciation and mileage. Label it as "Estimated Market Value" with a small disclaimer. The user explicitly said "close enough" -- don't over-engineer, but don't make it obviously wrong either.
**Warning signs:** A 2008 vehicle with 180K miles shows a market value of $7,200 when it's listed at $6,000.

### Pitfall 6: Database Migration Timing
**What goes wrong:** Frontend code expects new columns (slug, identity_headline, etc.) but they haven't been added to Supabase yet.
**Why it happens:** Database schema changes and frontend code deployed out of sync.
**How to avoid:** Plan database migration as the first task in the phase. Add columns as nullable with defaults so existing data isn't broken.
**Warning signs:** Console errors about undefined properties when accessing new vehicle fields.

### Pitfall 7: Modal vs. Detail Page Content Duplication
**What goes wrong:** Having to maintain the same vehicle information display in both the modal and the detail page, leading to divergence.
**Why it happens:** The modal has its own complete rendering of vehicle info inline in `Inventory.tsx`.
**How to avoid:** Share sub-components between modal and detail page where possible. But per user decision, modal stays AS-IS with minimal changes, so some duplication is acceptable.
**Warning signs:** Price shows differently in modal vs. detail page.

## Code Examples

Verified patterns from the existing codebase:

### Dynamic Route Registration (App.tsx pattern)
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\App.tsx
// Line 592 pattern - add alongside existing routes
<Route path="/inventory" element={<Inventory />} />
<Route path="/vehicles/:slug" element={<VehicleDetail />} />
```

### useParams Pattern (from CustomerStatusTracker.tsx)
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\pages\CustomerStatusTracker.tsx
const { accessKey } = useParams<{ accessKey: string }>();
// Apply same pattern:
const { slug } = useParams<{ slug: string }>();
```

### SEO Component Usage (existing pattern)
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\components\SEO.tsx
<SEO
  title={`${vehicle.year} ${vehicle.make} ${vehicle.model} | Triple J Auto Investment`}
  description={vehicle.identityHeadline || `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.mileage.toLocaleString()} miles. $${vehicle.price.toLocaleString()}. Houston, TX.`}
  path={`/vehicles/${vehicle.slug}`}
/>
```

### Gemini Service Extension Pattern
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\services\geminiService.ts
// Same pattern as generateVehicleDescription, add:
export const generateIdentityHeadline = async (
  make: string, model: string, year: number,
  bodyType?: string, diagnostics: string[] = []
): Promise<{ en: string; es: string }> => {
  const ai = getClient();
  if (!ai) return { en: `${year} ${make} ${model}`, es: `${year} ${make} ${model}` };

  const prompt = `
    Task: Write an identity-first headline for a ${year} ${make} ${model} (${bodyType || 'vehicle'}).

    FORMAT: "[Identity Label] | [2-3 descriptive words]."
    EXAMPLES:
    - "Family-Ready Sedan | Reliable. Clean. Ready for Your Next Chapter."
    - "Weekend Warrior | Tough. Capable. Built for Adventure."
    - "Daily Driver | Efficient. Dependable. Your Everyday Companion."
    - "First Car Ready | Safe. Simple. Perfect for New Drivers."

    RULES:
    1. Lead with WHO this car is for, not what it is.
    2. Use 2-3 punchy descriptive words after the pipe.
    3. Maximum 15 words total.
    4. Warm, aspirational but honest tone.
    ${diagnostics.length > 0 ? `5. Note: Vehicle has these conditions: ${diagnostics.join(', ')}` : ''}

    Return JSON: {"en": "English headline", "es": "Spanish headline"}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 1024 } }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    return { en: `${year} ${make} ${model}`, es: `${year} ${make} ${model}` };
  }
};
```

### Vehicle Card Badge Pattern (existing card structure)
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\pages\Inventory.tsx
// Line 74-83 - Badge row on vehicle card. Add verified badge alongside existing badges:
<div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
  {/* Existing status badge */}
  <div className={`px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.2em] ...`}>
    {vehicle.status}
  </div>
  {/* NEW: Verified badge */}
  {vehicle.isVerified && (
    <div className="flex items-center gap-1 px-2 py-1 bg-black/80 border border-tj-gold/60 backdrop-blur-md">
      <SovereignCrest className="w-3 h-3" />
      <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-tj-gold">Verified</span>
    </div>
  )}
</div>
```

### Supabase Direct Query Pattern (for detail page)
```typescript
// Source: D:\triple-j-auto-investment-main-use-update\triple-j-auto-investment-main\lib\store\vehicles.ts
// Line 115 pattern - query with filters
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('slug', slug)
  .single();
```

### Price Transparency Block Design
```typescript
// Follows existing design tokens from tailwind.config.js and Inventory.tsx patterns
// bg-black, border-white/[0.06], text-tj-gold, font-display, text-[9px] tracking-[0.2em]
<div className="p-6 md:p-8 bg-black border border-white/[0.06]">
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center p-4 border border-tj-gold/20 bg-tj-gold/[0.03]">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-2">Triple J Price</p>
      <p className="font-display text-2xl text-tj-gold">${price.toLocaleString()}</p>
    </div>
    <div className="text-center p-4 border border-white/[0.06]">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-2">Market Average</p>
      <p className="font-display text-2xl text-gray-400 line-through">${marketAvg.toLocaleString()}</p>
    </div>
  </div>
  <div className="mt-4 flex justify-between items-center border-t border-white/[0.04] pt-4">
    <div>
      <p className="text-[9px] uppercase tracking-[0.2em] text-green-400">You Save</p>
      <p className="font-display text-lg text-green-400">${savings.toLocaleString()}</p>
    </div>
    <div className="text-right">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Est. Monthly</p>
      <p className="font-display text-lg text-white">${monthly}/mo</p>
    </div>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-helmet for SEO | React 19 native `<title>` and `<meta>` in components | React 19 (2024) | Already adopted in `SEO.tsx` |
| react-router-dom v6 | react-router-dom v7.9.6 (backwards compatible) | 2024-2025 | `useParams` pattern identical, already in use |
| Gemini 1.5 | Gemini 2.5 Flash via `@google/genai` | 2025 | Already using `gemini-2.5-flash` in `geminiService.ts` |

**Deprecated/outdated:**
- react-helmet: Not needed, React 19 native metadata handles this. Project already uses native approach.
- Manual slug generation without DB storage: Store slugs in database for reliable lookup rather than parsing on every request.

## Database Schema Changes Required

### New Columns on `vehicles` Table
```sql
-- Phase 14: Expectancy Building
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS identity_headline TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS identity_headline_es TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_story TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_story_es TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS market_estimate DECIMAL(10, 2);

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_slug ON public.vehicles(slug);
```

### Vehicle Type Extension
```typescript
// Add to Vehicle interface in types.ts
export interface Vehicle {
  // ... existing fields ...

  // Phase 14: Expectancy Building
  slug?: string;                    // URL-friendly identifier
  identityHeadline?: string;        // AI-generated identity-first headline (English)
  identityHeadlineEs?: string;      // Spanish translation
  vehicleStory?: string;            // AI-generated vehicle story (English)
  vehicleStoryEs?: string;          // Spanish translation
  isVerified?: boolean;             // Triple J Verified badge flag
  marketEstimate?: number;          // Approximate market value
}
```

### Data Transform Extension
```typescript
// Add to loadVehicles transform in lib/store/vehicles.ts
slug: v.slug || undefined,
identityHeadline: v.identity_headline || undefined,
identityHeadlineEs: v.identity_headline_es || undefined,
vehicleStory: v.vehicle_story || undefined,
vehicleStoryEs: v.vehicle_story_es || undefined,
isVerified: v.is_verified || false,
marketEstimate: v.market_estimate ? parseFloat(v.market_estimate) : undefined,
```

## BHPH Monthly Payment Formula

For in-house Buy Here Pay Here financing in the $3K-$8K range:

**Recommended formula:**
```typescript
// Simple principal division -- no interest rate display
// BHPH dealers typically structure as flat payments
function estimateMonthly(price: number): number {
  const downPayment = 500;  // Typical BHPH minimum down
  const termMonths = 24;    // Common BHPH term
  const principal = price - downPayment;
  return Math.round(principal / termMonths);
}
// Example: $5,500 car -> ($5,500 - $500) / 24 = $208/mo
```

**Display disclaimer:** "Est. $X/mo with $500 down. 24 months. Subject to approval. See dealer for details."

**Why no APR display:** BHPH dealers in Texas often structure financing differently from traditional loans. Showing an APR could create legal or regulatory implications. A simple "estimated monthly" with disclaimers is safer and more common practice.

## Market Estimate Formula

**Recommended approach:** Since KBB/Edmunds APIs are not free and the user said "close enough":

```typescript
function estimateMarketValue(price: number, year: number, mileage: number): number {
  // Base: 20% markup over Triple J's price (BHPH dealers typically price below market)
  let estimate = price * 1.20;

  // Adjust down for age (older = less markup gap)
  const age = new Date().getFullYear() - year;
  if (age > 10) estimate = price * 1.12;
  else if (age > 7) estimate = price * 1.15;

  // Adjust down for high mileage
  if (mileage > 150000) estimate = price * 1.10;
  else if (mileage > 120000) estimate *= 0.95;

  // Round to nearest $100
  return Math.round(estimate / 100) * 100;
}
```

**Admin override:** Store `market_estimate` in database so admin can manually set it if the algorithm produces an unreasonable number.

## Detail Page Section Ordering (Psychological Flow)

Based on the SOVEREIGN framework mentioned in the context and consumer psychology research:

**Recommended order (top to bottom):**

1. **Hero Image Gallery** -- Aspirational first impression (LIST-01)
2. **Identity Headline + Year/Make/Model** -- Who you become, then what it is (LIST-02)
3. **Triple J Verified Badge** -- Immediate trust signal (LIST-03)
4. **Price Transparency Block** -- Triple J Price, Market Average, You Save, Est. Monthly (LIST-04)
5. **Vehicle Story** -- Origin, inspection summary, honest condition (LIST-05)
6. **Vehicle Specs** -- Detailed specifications table
7. **Social Proof Micro-Layer** -- "Listed X days ago" (from dateAdded, real data only) (LIST-06)
8. **CTAs** -- Schedule Visit, Call Us, Apply for Financing

**Rationale:** Lead with aspiration (gallery + headline), build trust (badge + price transparency), create connection (story), validate with data (specs + social proof), then convert (CTAs).

## Open Questions

Things that couldn't be fully resolved:

1. **Social proof "X families viewing" data source**
   - What we know: LIST-06 requires "X families viewing this vehicle" with real data only
   - What's unclear: The project has no analytics tracking for page views per vehicle
   - Recommendation: For now, implement only "Listed X days ago" (calculable from `dateAdded`). "Families viewing" requires analytics infrastructure that doesn't exist. Flag this as a future enhancement or drop it.

2. **Bilingual AI generation quality**
   - What we know: Gemini can generate Spanish text, and translations are stored separately
   - What's unclear: Whether Gemini 2.5 Flash produces natural-sounding Spanish for identity headlines
   - Recommendation: Generate both languages in one Gemini call with JSON output. Admin can edit Spanish text after generation if quality is poor.

3. **Existing vehicles backfill**
   - What we know: Current vehicles in database have no slug, headline, or story
   - What's unclear: How many vehicles currently exist and whether backfill should be automated
   - Recommendation: Build a one-time admin migration button. Generate slugs deterministically from existing data. Generate headlines/stories via Gemini in batch.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `types.ts`, `Inventory.tsx`, `geminiService.ts`, `SEO.tsx`, `App.tsx`, `vehicles.ts`, `SovereignCrest.tsx`, `ImageGallery.tsx`, `tailwind.config.js`, `vercel.json`, `schema.sql`, `package.json`
- react-router-dom v7 `useParams` API - https://reactrouter.com/api/hooks/useParams
- Schema.org Car type - https://schema.org/Car
- React 19 Document Metadata - native `<title>` and `<meta>` support

### Secondary (MEDIUM confidence)
- JSON-LD vehicle listing patterns - https://omisido.com/vehicle-listing-car-structured-data/
- BHPH payment structures - industry standard practices for $3K-$8K vehicles
- Market estimate approach validated by user decision ("close enough for the price range")

### Tertiary (LOW confidence)
- KBB API alternatives research - https://vehicledatabases.com/api/kelley-blue-book-kbb (not needed per user decision, but documented for reference)
- Social proof patterns for vehicle listings (WebSearch only, needs validation against project requirements)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use in the project
- Architecture: HIGH - Follows existing patterns in the codebase (useParams, SEO component, Gemini service, Supabase queries)
- Pitfalls: HIGH - Identified from direct codebase analysis (slug collision, missing columns, SPA SEO limitations)
- Market estimate formula: MEDIUM - Algorithm is reasonable for the price range but is approximate by design
- BHPH payment formula: MEDIUM - Based on industry norms, but actual dealer terms vary
- Social proof data source: LOW - "X families viewing" not feasible without analytics infrastructure

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable - all dependencies are already locked in project)
