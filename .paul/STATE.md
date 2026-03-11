# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-11)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** v0.2 Dealer Intelligence System

## Current Position

Milestone: v0.2 Dealer Intelligence System
Phase: 10 of 12 (CRM) — Not started
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-11 — Phase 9 complete, transitioned to Phase 10

Progress:
- v0.1 Initial Release: [##########] 100% ★
- v0.2 Dealer Intelligence: [#####░░░░░] 25%
  - Phase 9 (Pipeline): ✅ Complete (3/3 plans)
  - Phase 10 (CRM): Not started
  - Phase 11 (BI): Not started
  - Phase 12 (Advanced): Not started

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Phase 9 complete — ready for Phase 10 PLAN]
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
- Vehicle lifecycle: Bidding → Purchased → In_Transit → Arrived → Inspection → Available
- Email sources mapped: support@ove.com (purchases), protected@dealshield.com (guarantees), noreply@manheim.com (docs), do-not-reply@centraldispatch.com (transport)
- Manheim dealer #: 5537922, badge #: 101644294
- Supabase project connected: mhdzezmiwntkzxshznvl (us-east-1)
- Production deployed: thetriplejauto.com via Vercel
- Admin password: adekunle12
- Replace placeholder vehicles with real inventory from Google Sheets
- User wants automated hourly Gmail sync (future enhancement)
- Server actions in src/lib/actions/ for admin mutations with revalidatePath pattern
- Pipeline dashboard uses server-component-fetch + client-component-interactivity pattern

### Deferred Issues
- RLS is permissive for anon (admin auth at middleware level) — needs Supabase Auth in v0.2
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- No real vehicle images yet (placeholders)
- No pagination on inventory (6 vehicles, not needed until inventory grows)
- Email notifications on lead submission (future enhancement)
- Photo upload to Supabase Storage (future)
- stitch MCP needs Google auth, nano-banana-2 needs GEMINI_API_KEY
- Automated hourly Gmail pipeline sync (Vercel Cron or pg_cron)
- Vehicle event timeline view in pipeline dashboard (future enhancement)

### Git State
Last commit: pending (phase 9 transition commit)
Branch: main
Feature branches merged: none

### Blockers/Concerns
- None currently

## Session Continuity

Last session: 2026-03-11
Stopped at: Phase 9 complete, ready to plan Phase 10
Next action: Commit + push Phase 9 to GitHub, then /paul:plan for Phase 10 (or migrate real inventory first)
Resume file: .paul/ROADMAP.md

---
*STATE.md -- Updated after every significant action*
