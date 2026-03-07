---
phase: 07-plate-tracking
plan: 04
subsystem: plate-tracking
tags: [supabase, edge-function, deno, twilio, resend, pg_cron, alerts, notifications]
dependency-graph:
  requires: [07-01, 07-02, 07-03, 04-02]
  provides: [plate-alert-edge-function, plate-alert-email-template, plate-cron-schedule]
  affects: []
tech-stack:
  added: []
  patterns: [plate-alert-edge-function, batched-admin-notification, alert-deduplication-24h-cooldown, auto-resolve-cleared-conditions]
key-files:
  created:
    - triple-j-auto-investment-main/supabase/functions/check-plate-alerts/index.ts
    - triple-j-auto-investment-main/supabase/functions/_shared/email-templates/plate-alert.tsx
  modified:
    - triple-j-auto-investment-main/supabase/migrations/07_plate_tracking.sql
decisions:
  - id: batched-not-per-plate-notification
    description: "Admin receives ONE batched SMS + email summary per cron run, not individual per-plate alerts"
    rationale: "Prevents notification spam per pitfall #5 in 07-RESEARCH.md; summary is more actionable"
  - id: severity-escalation-overdue-rentals
    description: "Overdue rentals are 'warning' at 1-2 days, 'urgent' at 3+ days"
    rationale: "1-2 day overdue may be logistical delay; 3+ days requires immediate follow-up"
  - id: inventory-assignment-type-excluded-from-unaccounted
    description: "Plates with assignment_type='inventory' and no booking/registration are NOT flagged unaccounted"
    rationale: "Inventory assignments are intentional parking-lot use, not a missing plate condition"
  - id: upsert-with-ignoreDuplicates
    description: "plate_alerts upsert uses ignoreDuplicates:true to handle partial unique index constraint"
    rationale: "Existing active alerts should not be overwritten; only new conditions create rows"
  - id: pg-cron-commented-out
    description: "pg_cron schedule is commented out in migration SQL, same as Phase 4 approach"
    rationale: "Requires pg_cron/pg_net extensions and app.settings to be configured first"
metrics:
  duration: "3m 29s"
  completed: "2026-02-13"
---

# Phase 7 Plan 04: Plate Alert Edge Function & pg_cron Schedule Summary

**One-liner:** Cron-triggered Deno Edge Function detecting 3 alert types (overdue rentals, expiring buyer's tags, unaccounted plates) with deduplication upsert, 24h notification cooldown, auto-resolve, and batched SMS+email admin notification via existing Twilio/Resend infrastructure.

## What Was Done

### Task 1: Alert Edge Function and Email Template

**A. plate-alert.tsx (297 lines):**

Created branded HTML email template following the template literal pattern from status-update.tsx.

- `PlateAlertItem` interface: plateNumber, alertType, severity, customerName, customerPhone, vehicleInfo, daysOverdue, daysUntilExpiry
- `buildPlateAlertEmail(alerts)`: Full HTML email with:
  - Triple J branding header (gold on dark, matching status-update.tsx)
  - "Plate Alert Summary" subtitle
  - Alert count badge with urgent/warning color coding
  - Three grouped sections: Overdue Rentals, Expiring Buyer's Tags, Unaccounted Plates
  - Each alert: plate number, severity badge, type label, detail text, customer info, vehicle info
  - "View Plates Dashboard" CTA linking to /#/admin/plates
  - Branded footer with dealer info
- `buildPlateAlertSms(alerts)`: Concise SMS summary under 160 chars, e.g. "Triple J Plate Alert: 2 overdue rentals, 1 expiring tag. Check dashboard."

**B. check-plate-alerts/index.ts (490 lines):**

Deno Edge Function following the process-notification-queue pattern exactly.

**Detection logic (3 alert types):**

1. **Overdue rentals:** Queries plate_assignments WHERE returned_at IS NULL AND assignment_type = 'rental' AND expected_return_date < today. Joins plates for plate_number and vehicles for year/make/model. Severity: warning (1-2 days overdue), urgent (3+ days).

2. **Expiring buyer's tags:** Queries plates WHERE plate_type = 'buyer_tag' AND status != 'expired' AND expiration_date within 14 days. For each, fetches active assignment for customer info. Severity: warning (8-14 days), urgent (7 days or less).

3. **Unaccounted plates:** Queries plates WHERE status = 'assigned'. Checks each for valid active assignment. Flagged as unaccounted if:
   - No active assignment exists at all (status/assignment mismatch)
   - Active assignment references a returned/cancelled booking
   - Assignment has no booking_id and no registration_id (except inventory type)

**Deduplication:**
- Upserts into plate_alerts ON CONFLICT (plate_id, alert_type) with ignoreDuplicates
- Only inserts new rows for newly detected conditions
- Existing active alerts are preserved (not overwritten)

**Auto-resolve:**
- Fetches all active (unresolved) alerts from plate_alerts
- Compares against currently detected conditions using Set lookup
- If a tracked alert is no longer detected, sets resolved_at = NOW()

**Notification (24h cooldown):**
- Queries plate_alerts WHERE resolved_at IS NULL AND (last_notified_at IS NULL OR last_notified_at < NOW() - 24h)
- Matches pending alerts to detected data for rich notification content
- Sends ONE SMS via sendSms (from _shared/twilio.ts) to ADMIN_PHONE
- Sends ONE email via sendEmail (from _shared/resend.ts) to ADMIN_EMAIL
- Updates last_notified_at for all notified alerts
- Each channel failure is logged but doesn't block the other

**Error handling:**
- Each detection query wrapped in try/catch (one failing doesn't prevent others)
- Supabase client creation failure returns 500
- All operations logged with [plate-alerts] prefix
- Returns JSON: { detected: N, notified: M, resolved: R }

### Task 2: pg_cron Schedule for Alert Checker

Appended section 12 to the existing 07_plate_tracking.sql migration (now 442 lines).

- Schedule: `*/30 * * * *` (every 30 minutes)
- Uses pg_net.http_post to invoke the Edge Function
- Uses app.settings pattern (same as 04_notification_system.sql)
- Entirely commented out (safe to apply migration without pg_cron)
- Prerequisites documented: pg_cron extension, pg_net extension, app.settings configuration, Edge Function deployment, ADMIN_PHONE/ADMIN_EMAIL secrets
- Rollback instruction: `SELECT cron.unschedule('check-plate-alerts')`

## Verification Results

| Check | Result |
|-------|--------|
| check-plate-alerts/index.ts exists and is valid Deno Edge Function | PASS -- 490 lines, Deno.serve pattern |
| Email template produces branded HTML with alert sections | PASS -- 3 grouped sections, gold branding |
| SMS template produces concise summary under 160 chars | PASS -- "Triple J Plate Alert: N overdue, M expiring. Check dashboard." |
| Alert deduplication prevents re-sending within 24 hours | PASS -- last_notified_at check with 24h threshold |
| Auto-resolve clears conditions that are no longer true | PASS -- Set-based comparison, resolved_at update |
| pg_cron schedule is commented and documented in migration | PASS -- Section 12, prerequisites listed |
| All 3 alert types handled | PASS -- overdue_rental, expiring_buyer_tag, unaccounted |
| Imports from _shared/twilio.ts and _shared/resend.ts | PASS -- sendSms and sendEmail imported |
| Batched notification: 1 SMS + 1 email per run | PASS -- single call each |
| Edge Function file meets min_lines (100) | PASS -- 490 lines |
| Email template file meets min_lines (30) | PASS -- 297 lines |

## Decisions Made

1. **Batched not per-plate notification** -- Admin receives ONE SMS + ONE email per cron run with all active alerts summarized. Prevents notification spam.
2. **Severity escalation for overdue rentals** -- 1-2 days overdue = warning, 3+ days = urgent. Short delays are common; 3+ days needs immediate action.
3. **Inventory assignment type excluded from unaccounted** -- Plates with assignment_type='inventory' and no booking/registration are NOT flagged. Inventory parking is intentional.
4. **Upsert with ignoreDuplicates** -- plate_alerts upsert skips existing active alerts rather than overwriting. Preserves first_detected_at timestamp.
5. **pg_cron commented out** -- Same approach as Phase 4. Requires manual configuration before activation.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ec39a02 | feat(07-04): plate alert Edge Function and email template |
| 2 | 7cdbd51 | feat(07-04): pg_cron schedule for plate alert checker |

## Next Phase Readiness

**Phase 7 is now COMPLETE.** All 4 plans executed:

| Plan | Focus | Status |
|------|-------|--------|
| 07-01 | Database, Types & Service Layer | COMPLETE |
| 07-02 | Plates Admin Page | COMPLETE |
| 07-03 | Rental Integration | COMPLETE |
| 07-04 | Alert Edge Function & pg_cron | COMPLETE |

**Phase 8 (Rental Insurance Verification)** can proceed. It has no dependency on Phase 7.

**TODOs for deployment:**
- [ ] Deploy Edge Function: `supabase functions deploy check-plate-alerts`
- [ ] Add Edge Function secrets: ADMIN_PHONE, ADMIN_EMAIL
- [ ] Enable pg_cron and pg_net extensions in Supabase Dashboard (if not already)
- [ ] Configure app.settings (if not already done from Phase 4)
- [ ] Uncomment and run the cron schedule SQL in Supabase SQL editor

---

*Plan: 07-04 | Phase: 07-plate-tracking | Completed: 2026-02-13*
