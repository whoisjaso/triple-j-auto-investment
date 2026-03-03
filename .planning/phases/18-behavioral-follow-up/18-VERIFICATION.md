---
phase: 18-behavioral-follow-up
verified: 2026-02-21T12:00:00Z
status: human_needed
score: 4/4 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "Tier 3 abandon dual-channel (SMS + email) deduplication index fixed — uq_pending_follow_up now includes channel as third column"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Verify pg_cron + pg_net connectivity after migration is applied to Supabase"
    expected: "detect_follow_ups job runs hourly; process_follow_up_queue job runs every 5 minutes and reaches the Edge Function"
    why_human: "Cannot verify pg_cron availability or pg_net HTTP reachability from a code scan — requires live Supabase environment with Pro plan or manual extension enable"
  - test: "Send a real SMS to a test lead using the process-follow-up-queue Edge Function"
    expected: "Lead receives an SMS referencing a specific vehicle name and the vehicle URL, dealership phone, and STOP opt-out"
    why_human: "Requires Twilio credentials configured as Edge Function secrets and a real phone number in the test lead"
  - test: "Trigger an AI voice call for a Tier 4 (voice) lead via the queue"
    expected: "Retell outbound call initiates and the dynamic variables (customer_name, vehicle_full, preferred_language) are populated correctly"
    why_human: "Requires RETELL_API_KEY, RETELL_OUTBOUND_AGENT_ID, and RETELL_OUTBOUND_NUMBER configured as Supabase secrets"
  - test: "Browse a vehicle, leave the site, and return 24h+ later"
    expected: "SMS received references the specific vehicle (by year/make/model) that was viewed longest in the session"
    why_human: "End-to-end flow requires real session_events data, pg_cron execution, and live Twilio delivery"
  - test: "Browse a vehicle a second time (returning visitor flow)"
    expected: "VehicleDetail page shows the Welcome back badge near the vehicle headline"
    why_human: "Requires verifying that useRecentlyViewed hook correctly persists vehicle IDs across page navigations in a real browser"
---

# Phase 18: Behavioral Follow-Up Verification Report

**Phase Goal:** Visitors who leave without converting receive timely, behavior-appropriate re-engagement messages that feel like service, not spam
**Verified:** 2026-02-21
**Status:** human_needed — all 4/4 structural must-haves verified; 5 items require live environment testing
**Re-verification:** Yes — after gap closure (commit 3d03dae)

---

## Re-Verification Summary

**Previous status:** gaps_found (3/4 truths verified)
**This status:** human_needed (4/4 truths verified)

**Gap closed:** The deduplication unique index `uq_pending_follow_up` in
`triple-j-auto-investment-main/supabase/phase-18-migration.sql` was changed from
`(lead_id, trigger_type)` to `(lead_id, trigger_type, channel)` in commit `3d03dae`.
This surgical 5-insertion / 3-deletion change permits Tier 3 (abandon) to enqueue
both an SMS row and an email row for the same lead without ON CONFLICT collision.
The `NOT EXISTS` guard in the WHERE clause already included `AND fq.channel = channel_series.channel`
— the index now matches that semantics correctly.

**Regressions:** None. The diff touched only the index definition and its surrounding
comment block. All other tiers, the Edge Function, AdminFollowUpPanel, VehicleDetail badge,
and leads preferred_language mapping are unchanged and confirmed substantive.

---

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A browse-only visitor receives an SMS 24 hours later referencing the specific vehicle they viewed longest | VERIFIED | `enqueue_behavioral_follow_ups()` Tier 1: `DISTINCT ON + ORDER BY (metadata->>'dwell_seconds')::numeric DESC` picks highest-dwell vehicle; `send_after = NOW() + INTERVAL '24 hours'`; Edge Function sends bilingual SMS with vehicle name + URL |
| 2 | A visitor who saved a vehicle receives an SMS within 4 hours with a scarcity signal based on real view data | VERIFIED | Tier 2: `DISTINCT ON + ORDER BY se.created_at DESC` picks most recently saved vehicle; `send_after = NOW() + INTERVAL '4 hours'`; joins `vehicle_view_counts` for `views_7d`; SMS template includes `{views_7d} views this week` |
| 3 | A visitor who abandoned a form mid-completion receives BOTH an SMS and an email within 1 hour | VERIFIED | Tier 3 `CROSS JOIN unnest(ARRAY['sms','email'])` produces two rows. Index on `(lead_id, trigger_type, channel)` gives distinct keys `(lead_id, 'abandon', 'sms')` and `(lead_id, 'abandon', 'email')` — both enqueue without conflict. `send_after = NOW() + INTERVAL '1 hour'`. Email channel guarded by `l.email IS NOT NULL`. |
| 4 | A returning visitor sees their previously viewed vehicles surfaced prominently without needing to search again | VERIFIED | `prevViewedIdsRef` pattern in `VehicleDetail.tsx` (lines 90-92) captures pre-mount `recentIds`, checks `prevViewedIdsRef.current.includes(vehicle.id)`, renders a `RotateCcw` + `t.followUp.welcomeBack` pill badge at lines 499-503 near the vehicle headline |

**Score:** 4/4 truths fully verified

---

## Required Artifacts

### Plan 18-01 Artifacts

| Artifact | Provides | Exists | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|--------|-----------------------|-----------------|--------|
| `triple-j-auto-investment-main/supabase/phase-18-migration.sql` | follow_up_queue table, enqueue function, cancel trigger, pg_cron | YES | 434 lines; all 4 tiers, all required columns, indexes, RLS, trigger, pg_cron | JOINs on session_events via session_id confirmed in all session-dependent tiers | VERIFIED |
| `triple-j-auto-investment-main/supabase/functions/process-follow-up-queue/index.ts` | Edge Function dispatching SMS/email/voice | YES | 574 lines; Deno.serve, sendSms, sendEmail, triggerRetellCall, markSent, bilingual templates | Queries `follow_up_queue` at line 71; imports `sendSms` from `../_shared/twilio.ts` at line 15; imports `sendEmail` from `../_shared/resend.ts` at line 16 | VERIFIED |

### Plan 18-02 Artifacts

| Artifact | Provides | Exists | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|--------|-----------------------|-----------------|--------|
| `triple-j-auto-investment-main/types.ts` | `preferredLanguage?: string` on Lead interface | YES | Field present | Read by `addLead` in `leads.ts` at line 96: `preferred_language: lead.preferredLanguage \|\| 'en'` | VERIFIED |
| `triple-j-auto-investment-main/components/admin/AdminFollowUpPanel.tsx` | Admin panel showing queue stats | YES | 228 lines; parallel count queries, 20-item list, trigger type badges | Imported at line 11 and rendered at line 561 of `pages/admin/Dashboard.tsx` | VERIFIED |
| `triple-j-auto-investment-main/pages/VehicleDetail.tsx` | Welcome back badge for returning visitors | YES | `prevViewedIdsRef` pattern at lines 90-92; badge rendered at lines 499-503 with `RotateCcw` icon | `useRecentlyViewed` imported at line 24; `addViewed` wired; badge conditional on `prevViewedIdsRef.current.includes(vehicle.id)` | VERIFIED |

### Plan 18-03 Artifacts

| Artifact | Provides | Exists | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|--------|-----------------------|-----------------|--------|
| `triple-j-auto-investment-main/supabase/phase-18-migration.sql` | Corrected uq_pending_follow_up index including channel column | YES | Index at lines 68-70 reads `(lead_id, trigger_type, channel)` — three columns; `IF NOT EXISTS` present; `WHERE sent = false AND cancelled = false` partial filter unchanged | Git diff confirms only 8 lines changed (5 added, 3 removed) in commit 3d03dae; all other 426 lines unmodified | VERIFIED |

---

## Key Link Verification

### Plan 18-01 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `phase-18-migration.sql` | `session_events + leads tables` | `enqueue_behavioral_follow_ups() JOIN on session_id` | WIRED | `INNER JOIN public.session_events se ON se.session_id = l.session_id` confirmed in Tier 1, Tier 2, and Tier 3 |
| `process-follow-up-queue/index.ts` | `_shared/twilio.ts` | `sendSms import` | WIRED | Line 15: `import { sendSms } from '../_shared/twilio.ts';` |
| `process-follow-up-queue/index.ts` | `follow_up_queue table` | Supabase client query | WIRED | Line 71: `.from('follow_up_queue')` with filters `sent=false, cancelled=false, send_after <= NOW()` |

### Plan 18-02 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `lib/store/leads.ts` | `leads.preferred_language DB column` | `addLead insert mapping` | WIRED | Line 96: `preferred_language: lead.preferredLanguage \|\| 'en'`; auto-fill from `localStorage.getItem('tj_lang')` at line 69 |
| `AdminFollowUpPanel.tsx` | `follow_up_queue Supabase table` | Supabase client query | WIRED | Multiple `.from('follow_up_queue')` queries for stats |
| `VehicleDetail.tsx` | `hooks/useRecentlyViewed.ts` | hook call | WIRED | `import { useRecentlyViewed }` at line 24; `vehicleIds: recentIds` destructured; `addViewed` called |

### Plan 18-03 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `uq_pending_follow_up index` | `Tier 3 CROSS JOIN unnest insert` | Index key `(lead_id, trigger_type, channel)` permits distinct channel rows | WIRED | Row A key = `(lead_id, 'abandon', 'sms')`; Row B key = `(lead_id, 'abandon', 'email')` — distinct keys, both insert; NOT EXISTS guard at lines 224-231 also includes `fq.channel = channel_series.channel` for correct application-level dedup |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FOLLOW-01 | 18-01 | Tier 1 — SMS 24hr after browse-only with vehicle they viewed longest | SATISFIED | Tier 1 in `enqueue_behavioral_follow_ups()`: detects `dwell` events, excludes save_toggle/form_open sessions, picks max dwell vehicle via `DISTINCT ON + ORDER BY (metadata->>'dwell_seconds')::numeric DESC`, enqueues with `+24 hours`; Edge Function sends SMS with vehicle name |
| FOLLOW-02 | 18-01, 18-02 | Tier 2 — SMS 4hr after save/favorite with scarcity + loss aversion trigger | SATISFIED | Tier 2: detects `save_toggle` events, picks most recent save via `DISTINCT ON + ORDER BY se.created_at DESC`, joins `vehicle_view_counts` for `views_7d`, enqueues with `+4 hours`; SMS template includes views count |
| FOLLOW-03 | 18-01, 18-03 | Tier 3 — SMS/email 1hr after abandoned form ("Your info is saved") | SATISFIED | Tier 3: `CROSS JOIN unnest(ARRAY['sms','email'])` generates two rows; index on `(lead_id, trigger_type, channel)` (fixed in 18-03) allows both to enqueue; `send_after = +1 hour`; email guarded by `l.email IS NOT NULL`; Edge Function dispatches both channels |
| FOLLOW-04 | 18-01 | Tier 4 — AI voice call 2hr after question without scheduling | SATISFIED | Tier 4: detects `ask_question` action_type leads within 4h window with no subsequent `schedule_visit`; enqueues with `+2 hours`; `triggerRetellCall()` uses `Deno.env.get` for server-side credentials with graceful degradation if unconfigured |
| FOLLOW-05 | 18-02 | Return visitor recognition — surface previously viewed vehicles on return | SATISFIED | `prevViewedIdsRef` captures IDs at mount before `addViewed` mutates the list; `prevViewedIdsRef.current.includes(vehicle.id)` renders bilingual "Welcome back" badge on VehicleDetail |

All 5 FOLLOW requirements are satisfied. No orphaned requirements detected — REQUIREMENTS.md Traceability section maps FOLLOW-01 through FOLLOW-05 exclusively to Phase 18 and marks all five Complete.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| *(none)* | — | — | — | All previously-found anti-patterns resolved. The dedup index fix is the only structural gap that existed; commit 3d03dae closes it surgically. |

---

## Human Verification Required

All automated structural checks pass. The following items require a live Supabase environment to confirm end-to-end behavior.

### 1. pg_cron and pg_net connectivity after migration apply

**Test:** Apply `phase-18-migration.sql` to Supabase, enable pg_cron extension, then check cron job logs after one hour
**Expected:** `detect_follow_ups` job runs at `:00` each hour; `process_follow_up_queue` job runs every 5 minutes and logs a successful HTTP response from the Edge Function
**Why human:** Cannot verify pg_cron availability or pg_net HTTP connectivity from static code analysis. Supabase Pro plan required for pg_cron.

### 2. End-to-end SMS delivery for browse-only visitor (FOLLOW-01)

**Test:** Submit a lead with a phone number, manually insert a `dwell` session_events row referencing a vehicle for that session, run `SELECT enqueue_behavioral_follow_ups()` in Supabase SQL Editor, then invoke the Edge Function
**Expected:** Test phone receives an SMS referencing the vehicle by year/make/model, a working vehicle URL, `(832) 400-9760`, and "Reply STOP to opt out"
**Why human:** Requires live Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) configured as Edge Function secrets and a real phone number

### 3. Tier 3 dual-channel abandon delivery (FOLLOW-03)

**Test:** Insert a lead with both phone and email, insert a `form_open` session_events row 90 minutes ago for that lead's session, run `SELECT enqueue_behavioral_follow_ups()`, check `follow_up_queue` for two rows (sms + email), then invoke the Edge Function
**Expected:** Two rows appear in `follow_up_queue` — one with `channel='sms'`, one with `channel='email'`. Both are dispatched. Test phone receives SMS. Test email inbox receives email.
**Why human:** Requires live Twilio and Resend credentials. Also validates the index fix produces the expected two-row queue behavior in a real Postgres environment.

### 4. Retell AI voice call dispatch (FOLLOW-04)

**Test:** Insert a Tier 4 (voice) row into `follow_up_queue` with a test lead phone, then invoke the Edge Function
**Expected:** Retell outbound call initiates; dynamic variables include customer name, vehicle details, preferred language
**Why human:** Requires RETELL_API_KEY, RETELL_OUTBOUND_AGENT_ID, and RETELL_OUTBOUND_NUMBER configured as Edge Function secrets

### 5. Welcome back badge on VehicleDetail in real browser (FOLLOW-05)

**Test:** Browse a vehicle detail page, navigate away to another page, then click back to the same vehicle detail page in the same browser tab session
**Expected:** The "Welcome back" / "Bienvenido de nuevo" pill badge appears near the vehicle headline on the second visit
**Why human:** Requires verifying that `useRecentlyViewed` persists IDs in localStorage across navigation and that the `prevViewedIdsRef` timing captures the pre-addViewed state correctly in a real browser DOM lifecycle

---

## Summary

Phase 18 is structurally complete. The single blocking gap from the initial verification — the deduplication index missing the `channel` column — was resolved in commit `3d03dae` (2026-02-21). The index now reads `(lead_id, trigger_type, channel)`, permitting Tier 3 abandon to enqueue both SMS and email rows for the same lead without silent collision.

All four observable truths are verified against actual codebase content. All five FOLLOW requirements (FOLLOW-01 through FOLLOW-05) are fully satisfied by real implementations with no stubs. All artifacts are substantive and wired. No anti-patterns remain.

The phase goal — "Visitors who leave without converting receive timely, behavior-appropriate re-engagement messages that feel like service, not spam" — is achieved at the code level. Five human-testable items require a live Supabase environment with configured secrets to confirm end-to-end delivery.

---

_Verified: 2026-02-21_
_Re-verified: 2026-02-21 (after 18-03 gap closure)_
_Verifier: Claude (gsd-verifier)_
