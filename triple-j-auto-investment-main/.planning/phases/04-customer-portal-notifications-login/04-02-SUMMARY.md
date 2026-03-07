---
phase: "04"
plan: "02"
subsystem: "notification-delivery"
tags: ["edge-functions", "twilio", "resend", "sms", "email", "notifications", "unsubscribe"]

dependency-graph:
  requires:
    - "04-01 (notification_queue table, registration_notifications table, notification_pref column)"
  provides:
    - "Twilio SMS helper (sendSms)"
    - "Resend email helper (sendEmail)"
    - "Status update email template"
    - "Rejection notice email template"
    - "Queue processor Edge Function"
    - "Unsubscribe Edge Function"
  affects:
    - "04-03 (admin notification controls may invoke queue processor)"
    - "04-04 (customer login may link to notification preferences)"

tech-stack:
  added:
    - "Twilio REST API (v2010-04-01) for SMS delivery"
    - "Resend REST API (v1) for email delivery"
  patterns:
    - "Edge Function shared helpers (_shared/ directory)"
    - "Template literal HTML emails with inline CSS"
    - "Queue processor pattern (fetch ready items, process, mark sent)"
    - "SMS auto-fallback to email on failure"
    - "Token-validated unsubscribe via branded HTML page"

file-tracking:
  key-files:
    created:
      - "triple-j-auto-investment-main/supabase/functions/_shared/twilio.ts"
      - "triple-j-auto-investment-main/supabase/functions/_shared/resend.ts"
      - "triple-j-auto-investment-main/supabase/functions/_shared/email-templates/status-update.tsx"
      - "triple-j-auto-investment-main/supabase/functions/_shared/email-templates/rejection-notice.tsx"
      - "triple-j-auto-investment-main/supabase/functions/process-notification-queue/index.ts"
      - "triple-j-auto-investment-main/supabase/functions/unsubscribe/index.ts"
    modified: []

decisions:
  - decision: "Template literal HTML instead of React Email JSX"
    rationale: "Avoids deno.json JSX config complexity and React Email npm imports in Deno; template literals produce identical rich HTML output"
  - decision: "Mark queue items sent even when all channels fail"
    rationale: "Prevents infinite retry loops; admin can see failures in notification audit trail"
  - decision: "Email auto-fallback when SMS fails"
    rationale: "CONTEXT.md specifies auto-fallback behavior; email attempted regardless of preference if SMS was attempted and failed"

metrics:
  duration: "~5 minutes"
  completed: "2026-02-10"
---

# Phase 4 Plan 02: Notification Delivery Edge Functions Summary

Server-side notification pipeline with Twilio SMS, Resend email, rich HTML templates (branded dark theme with progress visualization), debounced queue processor, and token-validated unsubscribe handler.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create shared SMS and email helpers | cdb8206 | `_shared/twilio.ts`, `_shared/resend.ts` |
| 2 | Create email templates and queue processor | beadbcc | `email-templates/status-update.tsx`, `email-templates/rejection-notice.tsx`, `process-notification-queue/index.ts` |
| 3 | Create unsubscribe Edge Function | baa933c | `unsubscribe/index.ts` |

## What Was Built

### Shared Helpers (Task 1)
- **twilio.ts**: `sendSms(to, body)` using Twilio REST API with Basic auth. Returns `{ success, sid, error }`. Reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` from env.
- **resend.ts**: `sendEmail({ to, subject, html, from? })` using Resend REST API with Bearer auth. Returns `{ success, id, error }`. Reads `RESEND_API_KEY` from env. Default from: `Triple J Auto Investment <notifications@triplejautoinvestment.com>`.

### Email Templates (Task 2)
- **status-update.tsx**: Rich HTML email with branded dark theme (#1a1a1a background, #C9A84C gold accents). Contains: header with dealer name, vehicle info, current stage banner, 6-cell mini progress bar (gold filled/outlined/gray), stage description, gold "View Full Status" CTA button, dealer contact footer, unsubscribe link with compliance note.
- **rejection-notice.tsx**: Distinct template with red "Attention Required" banner (#ff6b6b), DMV notes section (if provided), "What happens next?" explanation, contact call-to-action, same footer/unsubscribe pattern.

### Queue Processor (Task 2)
- **process-notification-queue/index.ts**: Main Edge Function invoked by pg_cron every minute.
  - Queries `notification_queue` where `sent = false AND send_after <= NOW() AND notify_customer = true`
  - Joins with `registrations` table for customer info
  - Checks `notification_pref`: skip if 'none', send SMS if 'sms'/'both', send email if 'email'/'both'
  - Auto-fallback: attempts email if SMS fails even when pref is 'sms' only
  - Rejection detection: uses distinct SMS text and email template when `new_stage === 'rejected'`
  - STOP keyword in every SMS message
  - Logs every attempt to `registration_notifications` with channel, template, provider ID, delivery status, error
  - Marks queue items sent after processing (even on failure to prevent infinite retry)
  - Returns `{ processed, errors }` JSON response

### Unsubscribe Handler (Task 3)
- **unsubscribe/index.ts**: GET endpoint at `/functions/v1/unsubscribe?reg={id}&token={token}`
  - Validates both parameters present
  - Verifies registration exists and access token matches
  - Updates `notification_pref` to 'none'
  - Returns branded HTML page confirming unsubscribe
  - Includes "Return to tracking page" link
  - Notes: "You'll still receive verification codes when logging in"
  - Graceful error handling with 3 distinct error pages

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Template literal HTML over React Email JSX | Avoids deno.json JSX configuration and npm:@react-email imports; identical output with simpler setup |
| Mark queue items sent even on total failure | Prevents infinite retry loops; admin sees failures in audit trail for manual follow-up |
| Email auto-fallback on SMS failure | Per CONTEXT.md auto-fallback specification; maximize delivery probability |
| Hardcoded STAGE_LABELS in queue processor | Avoids importing frontend types into Deno runtime; 7 labels rarely change |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- [x] All 6 files exist under `supabase/functions/`
- [x] Edge Functions use `Deno.env.get()` for all secrets (no hardcoded keys)
- [x] Queue processor handles all `notification_pref` values: sms, email, both, none
- [x] SMS fallback to email on failure (per CONTEXT.md)
- [x] Rejection uses distinct template with extra context
- [x] STOP keyword in every SMS, unsubscribe link in every email
- [x] Notification audit trail logged to `registration_notifications` for every attempt
- [x] `npm run build` still passes (Edge Functions outside Vite build)

## Architecture After This Plan

```
supabase/functions/
  _shared/
    twilio.ts                          sendSms() - Twilio REST API
    resend.ts                          sendEmail() - Resend REST API
    email-templates/
      status-update.tsx                renderStatusUpdateEmail() - branded HTML
      rejection-notice.tsx             renderRejectionEmail() - red alert variant
  process-notification-queue/
    index.ts                           Deno.serve - queue sweep every minute
  unsubscribe/
    index.ts                           Deno.serve - one-click unsubscribe

Flow: pg_cron (1 min) -> process-notification-queue -> check preferences
  -> sendSms (Twilio) + sendEmail (Resend) -> log to registration_notifications
  -> mark queue item sent
```

## Next Phase Readiness

**Blockers:** None. Edge Functions are ready for deployment.

**Dependencies for deployment:**
- Twilio account with phone number and env secrets configured
- Resend account with API key configured as Edge Function secret
- pg_cron job scheduled to invoke process-notification-queue every minute
- Migration 04 applied (notification_queue table, notification_pref column)

**What comes next:**
- 04-03: Admin notification controls (notify checkbox, notification history view)
- 04-04: Customer login via phone OTP and dashboard
