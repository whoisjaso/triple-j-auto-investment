# Phase 18: Behavioral Follow-Up - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated re-engagement messages triggered by visitor behavior. Visitors who leave without converting receive timely, behavior-appropriate messages that feel like service, not spam. 4-tier system using SMS, email, and AI voice calls. Messages reference specific vehicles the visitor interacted with.

This phase delivers the follow-up automation engine. It does NOT add new visitor-facing UI components (those exist from Phases 15-17) or new tracking capabilities (Phase 16 handles that).

</domain>

<decisions>
## Implementation Decisions

### Trigger rules & timing
- One message per trigger type per visitor (browse gets one message, save gets one message, abandon gets one message — never repeated for the same trigger)
- If a visitor triggers multiple behaviors in one session, Claude determines priority logic (likely: highest commitment wins — form abandon > save > browse)
- Messages can send anytime (no business-hours restriction)
- Claude determines optimal delay timing per tier based on industry patterns (roadmap suggests: browse=24h, save=4h, abandon=1h)

### Message tone & content
- Claude determines the right tone for each message tier (likely professional-warm, adapted per urgency)
- Messages are always vehicle-specific — reference the year/make/model the visitor interacted with (e.g., "The 2018 Honda Accord you viewed...")
- Every message includes both a direct link to the vehicle page AND the dealership phone number (832) 400-9760 as CTAs
- Claude determines bilingual approach (likely: match the language the visitor was browsing in via session data from Phase 16)

### Channel strategy
- Full 3-channel stack: SMS (Twilio) + Email (Resend) + Retell AI voice calls
- Claude determines which tiers map to which channels and whether to use escalation ladder (SMS first → email → voice) or tier-matched channels
- Claude determines voice call trigger threshold (roadmap Tier 4 = highest-value leads)
- Claude determines whether a daily/weekly SMS budget cap is needed for cost control
- Claude determines admin visibility level for the follow-up queue (likely: admin panel section showing queued/sent/responded messages)

### Consent & opt-out
- Claude determines eligibility scope (likely: only leads who provided phone numbers through forms — anonymous browsers don't get messaged)
- Claude implements appropriate opt-out for each channel (STOP keyword for SMS via Twilio, unsubscribe link for email via existing Phase 9 Edge Function)
- Claude determines consent approach (likely: small-print implied consent on form submission — proportionate for a small Texas dealer)
- Claude determines conversion-stop logic (likely: auto-cancel pending follow-ups when a lead is marked as contacted/converted)

### Claude's Discretion
- Exact delay timings per tier
- Priority logic when multiple triggers fire for same visitor
- Tone calibration per tier (casual vs professional gradient)
- Bilingual detection method
- Channel routing strategy (escalation vs tier-matched)
- Voice call trigger threshold
- SMS budget cap (if any)
- Admin queue visibility level
- Eligibility boundary for messaging
- Opt-out implementation per channel
- Consent language/placement on forms
- Conversion auto-stop logic

</decisions>

<specifics>
## Specific Ideas

- Roadmap specifies 4 tiers: browse-only (24h), saved vehicle (4h), form abandonment (1h), returning visitor (prominent vehicle surfacing)
- The "returning visitor" tier (Tier 4 in roadmap) is about surfacing previously viewed vehicles — this may overlap with Phase 16's recently-viewed feature rather than requiring a new message
- Existing infrastructure: Twilio SMS (Phase 9 Edge Functions), Resend email (Phase 9 Edge Functions), Retell AI voice (Phase 17), session tracking (Phase 16), lead pipeline (Phase 15)
- Phase 16's session_events table has vehicle_view data with dwell time — use this to identify "vehicle viewed longest" for browse-only messages
- Phase 16's vehicle_view_counts table has 7d view data — use for real scarcity signals in save-tier messages

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-behavioral-follow-up*
*Context gathered: 2026-02-21*
