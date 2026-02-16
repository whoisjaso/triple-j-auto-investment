# Phase 12: SEO Foundation - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Make every public page discoverable, crawlable, and accurately represented in search engines. Migrate from HashRouter to BrowserRouter for clean URLs, add per-page meta tags and titles, generate sitemap.xml, configure robots.txt, and ensure schema markup reflects the real business. Individual vehicle detail pages are Phase 14 scope -- this phase handles the routing infrastructure and meta for existing pages.

</domain>

<decisions>
## Implementation Decisions

### URL design
- Claude's discretion on slug style for public pages (short & clean preferred: /about, /inventory, etc.)
- Claude's discretion on vehicle page URL format (descriptive slug vs ID-based) -- note: vehicle detail pages are Phase 14, but URL pattern decision can be established now
- Claude's discretion on bilingual URL strategy (single URL with toggle vs language-prefix paths)
- Claude's discretion on customer portal URL path

### Search appearance
- Claude's discretion on homepage title tag construction (balance location, value proposition, and brand)
- Claude's discretion on bilingual mentions in meta descriptions (e.g., "Se Habla Espanol" in English meta)
- Claude's discretion on OG image strategy (site-wide vs per-page)
- Target keywords confirmed by user:
  - "used cars Houston" (high-volume local)
  - "cheap cars Houston" / "cars under 8000" (price-focused)
  - "buy here pay here Houston" (financing-focused)
  - Car rentals Houston (rental service keywords)
  - General: affordable pre-owned vehicles, Houston area

### Indexing strategy
- Claude's discretion on legal/policy page indexing
- Claude's discretion on form page indexing (Finance, Contact)
- Claude's discretion on VIN Lookup page indexing
- Claude's discretion on customer login page indexing
- Admin pages: noindex (established in Phase 11 -- admin excluded from customer-facing work)

### Rich results & schema
- Google Business Profile exists and is active -- schema should be consistent with GBP data
- Claude's discretion on FAQ schema markup
- Claude's discretion on individual vehicle Product/Vehicle schema (may defer to Phase 14 when vehicle detail pages exist)
- Claude's discretion on review/aggregate rating schema (may defer to Phase 19 when review generation is active)
- LocalBusiness + AutoDealer schema required per success criteria (already partially in place from Phase 10)

### Claude's Discretion
User granted broad discretion across all four areas. Key constraints to honor:
- Target keywords must be reflected in meta tags (used cars Houston, cheap cars Houston, cars under 8000, buy here pay here Houston, car rentals Houston)
- Schema must be consistent with existing Google Business Profile
- All decisions should serve a $3K-$8K pre-owned dealer + rental business in Houston targeting families and the Hispanic community

</decisions>

<specifics>
## Specific Ideas

- User specifically wants to rank for rental-related keywords in addition to sales keywords
- Google Business Profile is already set up -- schema markup should match that listing
- "Buy here pay here" is a target keyword -- implies financing is a key differentiator to highlight in meta
- User confirmed all 4 keyword categories plus rentals, suggesting broad SEO ambition across sales, financing, and rental verticals

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 12-seo-foundation*
*Context gathered: 2026-02-16*
