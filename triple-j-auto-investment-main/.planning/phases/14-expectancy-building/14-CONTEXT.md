# Phase 14: Expectancy Building - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Vehicle listings transform from a transactional grid into an emotional experience. Each vehicle gets its own standalone detail page with a unique URL, identity-first headline, price anchoring, verified badge, and honest vehicle story. The existing inventory modal stays for quick browsing. Inventory grid cards get minimal updates (link to detail page, verified badge, identity headline).

</domain>

<decisions>
## Implementation Decisions

### Vehicle detail page structure
- Both modal AND standalone page coexist — modal stays for quick browsing on inventory page, standalone page at /vehicles/{slug} for sharing and SEO
- Hero section: large photo gallery/carousel takes up most of the top
- Sections below gallery: Price block, Vehicle specs, Vehicle story/condition, CTAs (Schedule Visit, Call, Finance)
- Section ordering: Claude's discretion — arrange for maximum psychological impact per the SOVEREIGN framework flow

### Price presentation
- Market comparison: KBB-style estimate (free/approximate, doesn't need to be exact — just close enough for the $3K-$8K range)
- Monthly estimate calculation: Claude's discretion — pick a reasonable approach for BHPH in-house financing model
- Savings display format (dollar amount vs percentage vs both): Claude's discretion for the price range
- Triple J Verified badge placement: Claude's discretion — position where it has the most psychological impact

### Headlines and vehicle stories
- Identity-first headlines (e.g., "Family-Ready Sedan | Reliable. Clean.") are AI-generated from vehicle data (year, make, model, condition)
- Vehicle stories/descriptions are AI-generated from vehicle data
- Both are generated once when the vehicle is listed, stored in the database — not regenerated per page view
- Admin can edit after generation
- Imperfection disclosure approach: Claude's discretion — pick a practical method for a small dealer operation

### Inventory grid card changes (MINIMAL)
- Add link/click-through to the new standalone detail page (/vehicles/{slug})
- Add "Triple J Verified" badge on cards for inspected vehicles — badge uses the crest logo, opulent feel, small size
- Show AI-generated identity headline on cards (replace or supplement year/make/model)
- No layout redesign, no new filtering/sorting — keep the grid as-is otherwise

### Claude's Discretion
- Section ordering on detail page (psychological flow)
- Monthly estimate formula for BHPH
- Savings display format
- Verified badge placement on detail page
- Imperfection disclosure method (free-text vs checklist vs hybrid)
- Photo gallery interaction pattern (carousel, lightbox, thumbnails, etc.)
- URL slug format for vehicle pages

</decisions>

<specifics>
## Specific Ideas

- Verified badge should use the Triple J crest logo — make it opulent, not a generic checkmark
- User explicitly wants minimal frontend churn — keep inventory grid changes conservative
- AI generation happens at listing time and is stored, not on every page view (controls API costs)
- KBB market comparison just needs to be "close enough" — not a precise API integration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-expectancy-building*
*Context gathered: 2026-02-17*
