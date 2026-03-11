# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-10)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** v0.2 Dealer Intelligence System

## Current Position

Milestone: v0.2 Dealer Intelligence System
Phase: 9 of 12 (Automated Inventory Pipeline) — In Progress
Plan: 09-01 complete, ready for next plan
Status: Loop closed — schema, parsers, pipeline queries shipped
Last activity: 2026-03-11 — Plan 09-01 unified

Progress:
- v0.1 Initial Release: [##########] 100% ★
- v0.2 Dealer Intelligence: [##░░░░░░░░] 10%
  - Phase 9 (Pipeline): Plan 09-01 complete (schema + parsers + queries). Next: 09-02
  - Phase 10 (CRM): Not started
  - Phase 11 (BI): Not started
  - Phase 12 (Advanced): Not started

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — ready for next PLAN]
```

## Accumulated Context

### Decisions
- Next.js rebuild from scratch (not continuing React/Vite codebase)
- Bottom-up approach: simplest foundations first, psychological layers last
- SOVEREIGN framework is internal reference only
- v0.1 scoped to 8 phases: Foundation > Database > Cinematic Homepage > Inventory > Leads > Admin > i18n > Launch
- v0.2 strategic pivot: Dealer Intelligence System (pipeline, CRM, BI) replaces original v0.2 plan (rentals, SOVEREIGN)
- AI email parsing over Manheim API (enterprise-gated, expensive vs free email data)
- Gmail MCP already connected — infrastructure ready for email parsing
- NHTSA VIN decoder already built — auto-fills specs from parsed VIN
- Vehicle lifecycle: BIDDING → PURCHASED → IN_TRANSIT → ARRIVED → INSPECTION → LISTED → PENDING → SOLD
- Email sources mapped: support@ove.com (purchases), protected@dealshield.com (guarantees), noreply@manheim.com (docs), do-not-reply@centraldispatch.com (transport)
- Manheim dealer #: 5537922, badge #: 101644294
- Supabase project connected: mhdzezmiwntkzxshznvl (us-east-1)
- Production deployed: thetriplejauto.com via Vercel
- Admin password: adekunle12

### Deferred Issues
- RLS is permissive for anon (admin auth at middleware level) — needs Supabase Auth in v0.2
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- No real vehicle images yet (placeholders)
- No pagination on inventory (6 vehicles, not needed until inventory grows)
- Email notifications on lead submission (future enhancement)
- Photo upload to Supabase Storage (future)
- stitch MCP needs Google auth, nano-banana-2 needs GEMINI_API_KEY

### Blockers/Concerns
- None currently

## Session Continuity

Last session: 2026-03-11
Stopped at: Plan 09-01 loop closed (PLAN ✓ APPLY ✓ UNIFY ✓)
Next action: /paul:plan for Plan 09-02 (Gmail Integration & Sync Engine)
Resume file: .paul/phases/09-inventory-pipeline/09-01-SUMMARY.md

---
*STATE.md -- Updated after every significant action*
