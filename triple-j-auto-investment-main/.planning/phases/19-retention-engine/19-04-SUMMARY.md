---
phase: 19-retention-engine
plan: 04
subsystem: edge-functions
tags: [supabase, deno, twilio, resend, sms, email, review-generation, edge-function]
dependency_graph:
  requires:
    - review_requests table (phase-19-migration.sql from 19-01)
    - enqueue_review_requests() function (19-01)
    - enqueue_followup_review_requests() function (19-01)
    - _shared/twilio.ts (sendSms helper)
    - _shared/resend.ts (sendEmail helper)
    - registrations table (customer_name, customer_phone, customer_email, vehicle fields)
  provides:
    - process-review-requests Edge Function (supabase/functions/process-review-requests/index.ts)
    - SMS dispatch: community-framed review requests at day 3 and day 7
    - Email dispatch: inline-HTML dark-theme review request emails at day 3 and day 7
    - GOOGLE_REVIEW_LINK TODO placeholder for business data
  affects:
    - Owner Portal review flow (markReviewCompleted suppresses day-7 followup via review_completed flag)
tech-stack:
  added: []
  patterns:
    - Per-item try/catch with markSent-on-error (Phase 18 pattern, prevents infinite retry loops)
    - JOIN to registrations via Supabase select() nested relation
    - Twilio 21610 opt-out detection by error string match
    - CORS headers for manual testing (OPTIONS preflight handling)
    - buildSmsBody + buildReviewEmailHtml pure functions outside Deno.serve handler
key-files:
  created:
    - triple-j-auto-investment-main/supabase/functions/process-review-requests/index.ts
  modified: []
key-decisions:
  - "review_requests table has no error column -- error details logged to console only (markSent updates sent=true + sent_at only)"
  - "CORS headers added for manual testing via HTTP even though pg_cron invokes internally (matches plan spec)"
  - "SMS followup uses gentler tone (no exclamation, no 'Houston families' mention) to reduce pressure 7 days out"
  - "Email subjects are distinct: initial='How is your {year} {make}?' vs followup='Your experience could help a family'"
requirements-completed:
  - PORTAL-05
duration: 8min
completed: "2026-03-02"
---

# Phase 19 Plan 04: Review Generation Edge Function Summary

**review_requests Edge Function with community-framed SMS (day 3 initial + day 7 gentler followup) and inline-HTML dark-theme email dispatch via Twilio and Resend, matching Phase 18 queue-processing pattern.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T06:37:52Z
- **Completed:** 2026-03-02T06:45:00Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify -- awaiting user verification)
- **Files created:** 1

## Accomplishments

- Created `process-review-requests/index.ts` (395 lines) following exact Phase 18 Edge Function pattern
- SMS channel: initial (day 3) uses community framing "help other Houston families find a trustworthy dealer"; followup (day 7) uses gentler "could help another family make a confident decision"
- Email channel: `buildReviewEmailHtml` returns dark-theme (#0a0a0a bg, #d4d4d4 text, #d4af37 gold) inline HTML with "Leave a Google Review" (initial) / "Share Your Experience" (followup) CTA buttons
- `GOOGLE_REVIEW_LINK` constant with clear `TODO(business-data)` placeholder comment
- Twilio error 21610 (opted out) detected and logged distinctly; no retry
- `markSent` sets `sent=true` on both success and error (prevents infinite retry loops)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create process-review-requests Edge Function** - `045e24a` (feat)

**Plan metadata:** (pending -- will commit after checkpoint verification)

## Files Created/Modified

- `triple-j-auto-investment-main/supabase/functions/process-review-requests/index.ts` - Deno Edge Function that processes review_requests queue: fetches unsent items (sent=false, send_after<=NOW), dispatches SMS via Twilio or HTML email via Resend, marks sent=true on both success and error

## Decisions Made

- `review_requests` table has no `error` column (migration only added id/registration_id/channel/request_type/send_after/sent/sent_at/created_at) -- error details logged to console only; markSent only updates `sent` and `sent_at`
- CORS headers added for manual testing even though pg_cron invokes internally (plan spec explicitly requested this)
- SMS followup (day 7) uses softer tone without exclamation point and without "Houston families" repetition to reduce pressure after initial already used that framing
- Email subjects differentiated by request_type: initial="How is your {year} {make}?" vs followup="Your experience could help a family"

## Deviations from Plan

None -- plan executed exactly as written.

Minor implementation note: The plan spec said "if channel === 'sms' AND customer_phone exists" and "if channel === 'email' AND customer_email exists". The implementation uses nested checks (check channel first, then check contact field inside) rather than a combined `&&` in one `if`. Functionally identical -- produces the same branching behavior per item. Skip handling uses `await markSent(...) + continue` pattern consistent with Phase 18.

## Issues Encountered

None -- implementation was straightforward following the Phase 18 process-follow-up-queue pattern.

## User Setup Required

Before this Edge Function can send live review requests, the following is required:

1. **Deploy Edge Function** to Supabase:
   ```bash
   cd triple-j-auto-investment-main
   supabase functions deploy process-review-requests
   ```

2. **Set Edge Function secrets** (same secrets as process-follow-up-queue):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `RESEND_API_KEY`
   - `SUPABASE_URL` (auto-provided by Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-provided by Supabase)

3. **Replace GOOGLE_REVIEW_LINK placeholder** in `index.ts` with actual Triple J Google Business review link. Find it in Google Business Profile -> Get more reviews -> Share review form.

4. **Enable pg_cron** (requires Supabase Pro plan) to trigger daily schedule:
   ```sql
   SELECT cron.schedule(
     'process-review-requests',
     '0 10 * * *',
     $$SELECT net.http_post(...)$$
   );
   ```

## Next Phase Readiness

- Phase 19 Retention Engine is functionally complete pending Task 2 checkpoint verification
- All 6 Owner Portal sections render (Plans 01-03)
- Review Edge Function ready for deployment (Plan 04)
- Remaining manual items: Edge Function deployment + secrets, GOOGLE_REVIEW_LINK replacement, pg_cron (Pro plan), Supabase auth Phone OTP config, Vercel deployment

---
*Phase: 19-retention-engine*
*Completed: 2026-03-02*

## Self-Check: PASSED

Files created:
- FOUND: triple-j-auto-investment-main/supabase/functions/process-review-requests/index.ts (395 lines)

Commits verified:
- FOUND: 045e24a (Task 1 - process-review-requests Edge Function)
