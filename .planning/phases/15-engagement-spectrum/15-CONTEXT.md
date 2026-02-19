# Phase 15: Engagement Spectrum - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Micro-commitment ladder on vehicle pages -- from anonymous saves to vehicle reservations -- where every action feeds the CRM pipeline in Supabase. Four commitment levels: Level 0 (save/favorite, payment calculator -- zero info), Level 1 (price alert, similar vehicles, vehicle report -- phone only), Level 2 (schedule visit, ask question -- name + phone + vehicle context), Level 3 (reserve vehicle -- interest hold). The existing Contact/Finance forms are also rewired to deliver leads to Supabase instead of setTimeout mocks.

</domain>

<decisions>
## Implementation Decisions

### Vehicle reservation model
- Reservation is an **interest hold with no money** -- visitor declares serious intent, dealership informally holds the vehicle while they arrange a visit
- No online deposit or payment processing involved
- Reservation is the highest commitment level (Level 3) in the spectrum

### Claude's Discretion
The user delegated all remaining implementation decisions to Claude. The following areas are flexible during planning:

**Save/Favorite behavior:**
- Persistence mechanism (localStorage, sync-on-login, etc.)
- Heart icon placement (cards, detail page, or both)
- How saved vehicles are accessed (tab, dedicated page, etc.)
- Save feedback pattern (animation only, toast, etc.)

**CTA layout on vehicle pages:**
- How new commitment levels integrate with existing Express Interest / Book Now CTAs from Phase 14
- Payment calculator placement (inline, expandable, modal)
- Level 1 action presentation (individual buttons vs grouped section)
- Which commitment actions appear on inventory cards vs detail page only

**Lead capture forms:**
- Capture pattern for phone-only actions (inline expansion, modal, drawer)
- Post-submission confirmation experience
- Whether vehicle-specific forms live on the detail page or navigate to Contact page
- Data model (new leads table vs extending existing tables)
- Phone number validation level
- Admin dashboard visibility for new leads (now vs Phase 16)
- "Ask a Question" format (free-text vs topic chips + text)
- Pipeline structure (unified vs separate tracking for vehicle page vs contact page leads)

</decisions>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. The user trusts Claude's judgment across all implementation details for this phase, with one firm decision: reservations are interest holds (no money changes hands online).

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 15-engagement-spectrum*
*Context gathered: 2026-02-19*
