# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-14)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** v0.2 Dealer Intelligence System

## Current Position

Milestone: v0.2 Dealer Intelligence System
Phase: 11 of 12 (Business Intelligence) — Planning
Plan: 11-01 (BI Analytics Dashboard) — APPLY complete, ready for UNIFY
Status: APPLY complete, verified with Playwright
Last activity: 2026-03-14 — Applied and verified plan 11-01

Progress:
- v0.1 Initial Release: [##########] 100% ★
- v0.2 Dealer Intelligence: [#######░░░] 50%
  - Phase 9 (Pipeline): ✅ Complete (3/3 plans)
  - Phase 10 (CRM): ✅ Complete (2/2 plans)
  - Phase 11 (BI): Planning (1 plan created)
  - Phase 12 (Advanced): Not started

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [Plan 11-01 applied, verified, ready for UNIFY]
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
- CRM pipeline: 7 stages (New → Contacted → Qualified → Appointment → Negotiation → Sold → Lost)
- Lead detail page with notes, tasks, and status pipeline stepper
- Mobile: static images for scroll sections (no GPU frame animation) with radial gradient mask
- Buyer info (name, phone) captured on lead "Sold" status + editable on vehicle edit form
- No drag-and-drop on kanban board — status changes on lead detail page
- Kanban board + dashboard pipeline stats complete (Phase 10)
- Future document generation: bill of sale, 130-U, rental agreements, as-is guides, vehicle registration

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
- Migrate real inventory from Google Sheets (user deferred this)

### Git State
Last commit: 9a1e324 docs(10-crm): phase 10 complete — CRM pipeline & kanban board
Branch: main
Feature branches merged: none

### Blockers/Concerns
- None currently

## Session Continuity

Last session: 2026-03-14
Stopped at: Plan 11-01 applied and verified
Next action: Run /paul:unify to close loop, then deploy
Resume file: .paul/phases/11-bi/11-01-PLAN.md

---
*STATE.md -- Updated after every significant action*
