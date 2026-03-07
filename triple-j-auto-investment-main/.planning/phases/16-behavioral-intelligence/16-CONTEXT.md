# Phase 16: Behavioral Intelligence - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

The platform tracks visitor behavior (views, clicks, dwell time), surfaces recently viewed vehicles for returning visitors, displays honest urgency badges backed by real inventory data, and captures attribution source on every lead. No AI chat (Phase 17), no automated follow-up messages (Phase 18), no owner portal (Phase 19).

</domain>

<decisions>
## Implementation Decisions

### Session tracking scope
- Track views + dwell time + clicks (CTA clicks, calculator usage, save/unsave, form opens)
- Full interaction signal captured for recommendations, urgency calculation, and attribution

### Claude's Discretion
The user delegated all remaining implementation decisions to Claude. The following areas are open for Claude to determine the best approach during research and planning:

**Session tracking:**
- Anonymous vs identified visitor threshold (when to start tracking, how to link sessions to leads)
- Data retention window (balance BHPH sales cycle length vs database size on free tier)
- Single-browser vs cross-device session linking strategy

**Recently viewed:**
- Placement across site (which pages show recently viewed, and whether to include recommendations)
- Number of vehicles displayed in the row
- Handling of sold/removed vehicles in recently viewed lists

**Urgency badges:**
- Which badge types to implement (Just Arrived, Popular, Offer Received, or subset)
- Data thresholds that trigger each badge (view counts, listing age, lead activity)
- Badge placement (inventory cards, detail page, or both)
- Badge visual treatment (bilingual text vs icons vs hybrid)
- Honesty enforcement approach (strictly data-backed vs admin-curated)

**Attribution & admin visibility:**
- What source data to capture per lead (page, vehicle, device, referrer, UTM -- Claude picks what's practical)
- Admin view level (per-lead detail, aggregate dashboard, or both)
- Export capability (CSV or view-only)
- Real-time vs historical visibility (considering Supabase free tier constraints)

</decisions>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. The user trusts Claude to make practical decisions appropriate for a single-location BHPH dealership on Supabase free tier.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 16-behavioral-intelligence*
*Context gathered: 2026-02-19*
