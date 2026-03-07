---
phase: 18-behavioral-follow-up
plan: 01
subsystem: database
tags: [supabase, postgres, edge-function, twilio, resend, retell, pg-cron, sms, email, voice]

# Dependency graph
requires:
  - phase: 16-intelligence
    provides: session_events table with dwell/save_toggle/form_open events, vehicle_view_counts table, leads.session_id attribution column
  - phase: 15-engagement-spectrum
    provides: leads table with phone, action_type, commitment_level fields
  - phase: 09-production-infrastructure
    provides: Twilio SMS helper (_shared/twilio.ts), Resend email helper (_shared/resend.ts), Edge Function pattern (process-notification-queue)
  - phase: 17-divine-response
    provides: Retell AI voice call pattern, preferred_language approach, retellService.ts API structure
provides:
  - follow_up_queue table with 14 columns for pending re-engagement messages
  - enqueue_behavioral_follow_ups() Postgres function detecting 4 behavioral tiers
  - cancel_follow_ups_on_conversion() trigger auto-cancelling on lead conversion
  - process-follow-up-queue Edge Function dispatching SMS/email/voice
  - preferred_language column on leads table for bilingual detection
  - pg_cron schedules: hourly detection + every-5-min queue processing
affects:
  - 18-02 (frontend forms need to write preferred_language on lead submission)
  - 09-03 (Edge Function secrets: RETELL_API_KEY, RETELL_OUTBOUND_AGENT_ID, RETELL_OUTBOUND_NUMBER must be set)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Partial unique index for queue deduplication (WHERE sent=false AND cancelled=false)
    - SECURITY DEFINER pg function called by pg_cron for privileged background work
    - DISTINCT ON pattern for "pick best vehicle per lead" (highest dwell, most recent save)
    - DO $$ BEGIN ... EXCEPTION WHEN OTHERS THEN ... END $$; wrapper for optional pg_cron
    - Per-item try/catch in Edge Function with markSent-on-error to prevent infinite retry

key-files:
  created:
    - triple-j-auto-investment-main/supabase/phase-18-migration.sql
    - triple-j-auto-investment-main/supabase/functions/process-follow-up-queue/index.ts
  modified: []

key-decisions:
  - "Tier priority order: voice > abandon > save > browse -- partial unique index + ON CONFLICT DO NOTHING enforces one entry per tier per lead"
  - "Abandon tier enqueues two rows (sms + email) via CROSS JOIN unnest(['sms','email']) for dual-channel coverage"
  - "Browse tier detects highest-dwell vehicle via DISTINCT ON + ORDER BY (metadata->>'dwell_seconds')::numeric DESC"
  - "Save tier uses DISTINCT ON + ORDER BY se.created_at DESC to pick the most recently saved vehicle"
  - "Voice tier checks leads.action_type = 'ask_question' within 4h window rather than scanning session_events (faster join)"
  - "markSent sets sent=true even on delivery failure to prevent infinite retry loops -- matches process-notification-queue pattern"
  - "Retell credentials use Deno.env.get (not VITE_ prefix) -- server-side Edge Function secrets only"
  - "Twilio error 21610 (opted out) detected by string match and marked as twilio_21610_opted_out -- no retry"
  - "Email channel skipped silently if lead.email is null (not an error -- SMS is primary channel)"
  - "pg_cron schedules wrapped in DO block with EXCEPTION WHEN OTHERS THEN RAISE NOTICE for graceful degradation on Free plan"

patterns-established:
  - "Queue deduplication via partial unique index: CREATE UNIQUE INDEX ... WHERE sent=false AND cancelled=false"
  - "CROSS JOIN unnest pattern: generates multiple channel rows per qualifying lead in single INSERT"
  - "Voice follow-up via Retell: Deno.env.get server-side credentials, retell_llm_dynamic_variables, graceful degradation if unconfigured"
  - "Bilingual SMS/email templates: buildSmsBody(item, lang) / buildEmailHtml(item, lang, lead) with 'en'/'es' switch"

requirements-completed: [FOLLOW-01, FOLLOW-02, FOLLOW-03, FOLLOW-04]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 18 Plan 01: Behavioral Follow-Up Backend Summary

**Postgres follow_up_queue with 4-tier behavioral detection function + Supabase Edge Function dispatching bilingual SMS (Twilio), email (Resend), and AI voice calls (Retell) from the queue**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T01:59:33Z
- **Completed:** 2026-02-22T02:02:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created follow_up_queue table with partial unique index preventing duplicate pending messages per lead per trigger type
- Built enqueue_behavioral_follow_ups() SECURITY DEFINER function detecting 4 behavioral tiers from session_events: voice (2h, ask_question leads), abandon (1h, dual SMS+email via CROSS JOIN unnest), save (4h, most recently saved vehicle via DISTINCT ON), browse (24h, highest-dwell vehicle)
- Built cancel_follow_ups_on_conversion() trigger that auto-cancels pending messages when lead.status changes to Contacted or Closed
- Created process-follow-up-queue Edge Function following exact process-notification-queue pattern with per-item try/catch, markSent-on-error, bilingual SMS templates (en/es), inline HTML email for abandon tier, and Retell voice call dispatch with server-side credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration -- follow_up_queue table, trigger detection function, cancel trigger, pg_cron** - `ba6ef41` (feat)
2. **Task 2: process-follow-up-queue Edge Function -- SMS/email/voice dispatch with bilingual templates** - `b2cebad` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified
- `triple-j-auto-investment-main/supabase/phase-18-migration.sql` - follow_up_queue table, deduplication index, preferred_language column on leads, 4-tier enqueue function, cancel trigger, pg_cron schedules
- `triple-j-auto-investment-main/supabase/functions/process-follow-up-queue/index.ts` - Edge Function dispatching SMS/email/voice from queue with bilingual templates

## Decisions Made
- Tier priority order: voice > abandon > save > browse enforced via ON CONFLICT DO NOTHING on partial unique index
- Abandon tier uses CROSS JOIN unnest to insert both SMS and email rows in a single query
- Browse tier uses DISTINCT ON with ORDER BY (metadata->>'dwell_seconds')::numeric DESC to pick highest-dwell vehicle per lead
- Voice tier checks leads.action_type directly (faster than scanning session_events for ask_question action type)
- markSent called on both success and failure (no infinite retry) -- matches notification_queue pattern
- Retell uses Deno.env.get server-side secrets, not VITE_ prefix; graceful degradation if unconfigured
- Twilio error 21610 detected by error string match, marked as opted_out and not retried
- pg_cron schedules wrapped in DO/EXCEPTION block so migration runs cleanly on Free plan without pg_cron

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before the follow-up system goes live:**

**Supabase Dashboard:**
1. Enable pg_cron extension: Dashboard -> Database -> Extensions -> search pg_cron -> Enable
2. Apply migration: SQL Editor -> paste phase-18-migration.sql -> Run

**Edge Function Secrets (Supabase Dashboard -> Settings -> Edge Functions -> Secrets):**
- `RETELL_API_KEY` - from Retell Dashboard -> Settings -> API Keys
- `RETELL_OUTBOUND_AGENT_ID` - from Retell Dashboard -> Agents -> select outbound agent -> copy ID
- `RETELL_OUTBOUND_NUMBER` - from Retell Dashboard -> Phone Numbers -> select outbound number

**Twilio and Resend secrets** (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, RESEND_API_KEY) are already needed for existing Edge Functions and should already be set.

## Next Phase Readiness
- Phase 18-02 (frontend forms) needs to write `preferred_language` on lead submission (new column exists, defaults to 'en')
- process-follow-up-queue Edge Function will work immediately once Retell secrets are configured
- Queue will remain empty until enqueue_behavioral_follow_ups() runs (requires pg_cron enable + migration apply)
- pg_net (for pg_cron -> Edge Function HTTP calls) requires Supabase Pro plan or manual setup

---
*Phase: 18-behavioral-follow-up*
*Completed: 2026-02-22*
