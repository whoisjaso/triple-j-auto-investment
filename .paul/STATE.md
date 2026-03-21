# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-21)

**Core value:** Every digital touchpoint engineers the neurological conditions under which buying becomes the only comfortable option -- a FATE-triggered, PCP-sequenced behavioral funnel from stranger to buyer to evangelist.
**Current focus:** Awaiting v0.3 milestone definition

## Current Position

Milestone: Awaiting next milestone
Phase: None active
Plan: None
Status: Milestone v0.2 Dealer Intelligence System complete — ready for next
Last activity: 2026-03-21 — Milestone v0.2 completed

Progress:
- v0.1 Initial Release: [##########] 100% ★
- v0.2 Dealer Intelligence: [##########] 100% ★

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Milestone complete - ready for next]
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
- Server actions in src/lib/actions/ for admin mutations with revalidatePath pattern
- Pipeline dashboard uses server-component-fetch + client-component-interactivity pattern
- CRM pipeline: 7 stages (New → Contacted → Qualified → Appointment → Negotiation → Sold → Lost)
- Pure CSS analytics visualization — no charting libraries, keeps bundle lean
- Puppeteer for PDF generation (pdf-lib couldn't match HTML fidelity)
- Data-driven customer wizard (field groups per document type)
- Signature URL limit 200K chars (canvas at 2x DPR produces large PNGs)

### Deferred Issues
- RLS is permissive for anon (admin auth at middleware level) — needs Supabase Auth
- 363 WebP frames (~40MB) in public/ — consider CDN for production
- No real vehicle images yet (placeholders)
- No pagination on inventory (not needed until inventory grows)
- Email notifications on lead submission
- Photo upload to Supabase Storage
- Automated hourly Gmail pipeline sync (Vercel Cron or pg_cron)
- Vehicle event timeline view in pipeline dashboard
- Migrate real inventory from Google Sheets (user deferred this)
- Date range filtering for analytics
- Spanish translations for wizard UI text (~30-40 new strings)
- Per-step analytics tracking for customer wizard

### Git State
Last commit: a1b6aa7 feat(documents): auto-calc tax, TTL breakdown, vehicle + buyer auto-populate
Branch: main
Tag: v0.2 (created 2026-03-21)

### Blockers/Concerns
- None currently

## Session Continuity

Last session: 2026-03-21
Stopped at: Milestone v0.2 complete
Next action: /paul:discuss-milestone or /paul:milestone
Resume file: .paul/MILESTONES.md
Resume context: v0.2 complete. 52 tests passing. Production deployed. Ready to define v0.3.

---
*STATE.md -- Updated after every significant action*
