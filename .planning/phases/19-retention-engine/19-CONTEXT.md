# Phase 19: Retention Engine - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Every buyer becomes a node in a referral network. The Owner Portal reinforces their purchase decision, the Family Circle program incentivizes referrals, the review engine builds social proof, and the upgrade prompt re-enters customers into the sales funnel at 12-18 months. This phase covers PORTAL-01 through PORTAL-06.

</domain>

<decisions>
## Implementation Decisions

### Owner Portal Access
- Reuse existing phone OTP login from Phase 4 -- buyer logs in with their phone number and sees owner content
- Portal lives as a new dedicated page (/owner route) with its own layout -- feels premium and distinct from the registration tracker

### Owner Portal Dashboard
- Full dashboard view: vehicle photo, purchase details, digital documents (Bill of Sale, As-Is), service reminder schedule, warranty info, value tracker -- all in one view
- Service reminders use time-based schedule: show reminders at fixed intervals (3 months, 6 months, 12 months) with generic maintenance checklist

### Referral Program Mechanics
- Tiered rewards: escalating structure (1st referral = $50, 3rd = $100, 5th = $200) -- gamifies the program
- Both link + code for sharing: unique referral link for digital sharing, short code for in-person word-of-mouth
- Both personal stats + community counter: personal referral count prominently, plus smaller community counter below
- Referral link lands on a special referral landing page: "Your friend [Name] thinks you'd love Triple J" with warm intro before browsing

### Review Generation
- SMS + email dual channel: SMS for immediate attention + email with more context ("Here's what other families said...")
- Community framing tone: "Help other families find a trustworthy dealer" -- positions reviewing as helping others, not doing Triple J a favor
- One follow-up at 7 days if no review, then stop -- respects boundaries

### Ready to Upgrade?
- Full upgrade section in the Owner Portal: dedicated section showing trade-in estimate, current inventory matches, and a "Talk to us about upgrading" CTA
- Triggers at 12-18 months post-purchase

### Value Tracker
- Reuse existing marketEstimateService.ts from Phase 14 (age+mileage heuristic) -- already built, close enough for $3K-$8K range
- Both investment + cost-per-day framing: show current estimated value AND cost-per-day ("Your vehicle value: $X | Cost per day: $X.XX")
- Monthly recalculation based on age progression -- shows gradual change, feels alive
- Mini chart display: small line chart showing value over time since purchase -- visual reinforcement of ownership journey

### Mobile-First Design
- All Phase 19 components must be mobile-first -- most Triple J customers will access the Owner Portal, referral links, and review prompts on their phones
- Follow Phase 11 established patterns: 44px minimum touch targets, p-6 md:p-8 card padding, py-4 px-8 text-xs tracking-[0.3em] CTA buttons
- Owner Portal dashboard: single-column stacked layout on mobile (vehicle photo, then stats, then documents, then value tracker), wider layout on desktop
- Value tracker mini chart must be legible at 375px viewport -- full width on mobile, not squeezed into a sidebar
- Referral sharing buttons (copy link, share code) need large tap targets -- these are the primary actions owners take on mobile
- Referral landing page must load fast and look good on mobile -- this is where referred friends first encounter Triple J
- Service reminder checklist items need comfortable tap/scroll spacing on mobile

### Claude's Discretion
- Exact portal page layout and component structure
- Chart library choice for value tracker mini chart
- Service reminder intervals and maintenance checklist content
- Referral code format and generation logic
- Review request email HTML template design
- Upgrade section inventory matching logic

</decisions>

<specifics>
## Specific Ideas

- Portal should feel premium and distinct from the registration tracker -- separate /owner route, not a tab
- Referral landing page creates a warm handoff: "[Name] thinks you'd love Triple J" before normal browsing
- Review request framing focuses on community ("help other families") rather than asking for a favor
- Value tracker with mini chart reinforces the ownership journey visually over time
- Cost-per-day framing shrinks the perceived cost as ownership duration increases
- Mobile-first everything -- customers will access portal, referral links, and review prompts primarily from their phones

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 19-retention-engine*
*Context gathered: 2026-03-01*
