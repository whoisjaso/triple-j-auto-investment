---
phase: 04-customer-portal-notifications-login
plan: 01
subsystem: database
tags: [notification-queue, debounce, pg_cron, rls, phone-auth, postgresql]
dependency-graph:
  requires: [02-01, 03-01]
  provides: [notification_queue table, notification preferences, debounce trigger, phone-auth RLS, pg_cron schedule]
  affects: [04-02, 04-03, 04-04]
tech-stack:
  added: [pg_cron, pg_net]
  patterns: [debounce queue with partial unique index, phone-auth RLS via JWT phone claim, pg_cron + pg_net Edge Function invocation]
key-files:
  created:
    - triple-j-auto-investment-main/supabase/migrations/04_notification_system.sql
  modified:
    - triple-j-auto-investment-main/supabase/migrations/README.md
decisions:
  - id: partial-unique-index-debounce
    decision: "Use CREATE UNIQUE INDEX with WHERE clause for debounce (not inline CONSTRAINT)"
    rationale: "PostgreSQL does not support WHERE on inline UNIQUE constraints; partial unique index achieves same result"
  - id: on-conflict-column-syntax
    decision: "Use ON CONFLICT (registration_id) WHERE (sent = false) in trigger upsert"
    rationale: "Partial unique indexes cannot be referenced by name in ON CONFLICT ON CONSTRAINT; must specify columns and WHERE"
  - id: security-definer-trigger
    decision: "queue_status_notification() uses SECURITY DEFINER"
    rationale: "Trigger needs to INSERT into notification_queue regardless of the calling user's RLS permissions"
  - id: app-settings-for-cron
    decision: "Default to app.settings approach for pg_cron config, document Vault alternative"
    rationale: "Simpler setup for development; Vault recommended for production but requires additional configuration"
metrics:
  duration: 3 minutes
  completed: 2026-02-10
---

# Phase 4 Plan 01: Notification Database Infrastructure Summary

**Notification queue table with debounce trigger, preferences column, phone-auth RLS policy, and pg_cron schedule for automated Edge Function invocation.**

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create notification system migration SQL | 66f8b3d | 04_notification_system.sql |
| 2 | Update migrations README | 37ec5d2 | README.md |

## What Was Built

### Migration 04: Notification System (244 lines)

Seven sections covering the complete database infrastructure for notification delivery:

1. **notification_queue table** - Holds pending notifications with registration_id, old/new stage, send_after timestamp, sent flag, and admin notify control. Partial unique index `uq_pending_notification` on `(registration_id) WHERE (sent = false)` enables the debounce pattern.

2. **registration_notifications extensions** - Five new columns on the existing audit table: `old_stage`, `new_stage`, `subject`, `template_used`, `provider_message_id` (Twilio SID or Resend ID).

3. **notification_pref column** - Added to registrations with default `'both'` and CHECK constraint for `sms`, `email`, `both`, `none`. Per CONTEXT.md opt-out model.

4. **pending_notify_customer column** - BOOLEAN flag on registrations that admin sets before status change. Captured by trigger, then cleared to NULL.

5. **queue_status_notification() trigger** - BEFORE UPDATE trigger that fires when `current_stage` changes. Performs INSERT ... ON CONFLICT upsert into notification_queue, resetting the 5-minute debounce window on each change. Clears `pending_notify_customer` after capture. Uses SECURITY DEFINER to bypass RLS.

6. **RLS policies** - Phone-authenticated customer SELECT policy using `auth.jwt()->>'phone'` matching. Admin full access policy on notification_queue.

7. **pg_cron schedule** - Every-minute invocation of `process-notification-queue` Edge Function via `pg_net.http_post()`. Documented both `app.settings` and Vault approaches for credential access.

### README Documentation

Updated migration order (now 4 entries) and added comprehensive Migration 04 section covering purpose, prerequisites, schema changes, trigger behavior, debounce mechanism explanation, configuration instructions, and complete rollback SQL.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Partial unique index (not inline CONSTRAINT) | PostgreSQL limitation: WHERE not supported on inline UNIQUE |
| ON CONFLICT with column+WHERE syntax | Partial unique indexes require column expression, not constraint name |
| SECURITY DEFINER on trigger function | Trigger must INSERT into notification_queue regardless of caller's RLS |
| app.settings default, Vault documented | Simpler dev setup; production guidance included |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] Migration SQL file is syntactically valid (balanced parens, proper semicolons, correct ON CONFLICT syntax)
- [x] Partial unique index uses CREATE UNIQUE INDEX with WHERE clause (not inline CONSTRAINT)
- [x] Debounce trigger is BEFORE UPDATE (not AFTER) so it can modify NEW.pending_notify_customer
- [x] RLS policy for phone auth uses auth.jwt()->>'phone' for JWT-based matching
- [x] pg_cron schedule correctly calls Edge Function via pg_net
- [x] README documents all changes and rollback steps

## Success Criteria Status

1. [x] `04_notification_system.sql` exists with all 7 sections
2. [x] notification_queue table has partial unique index for debounce
3. [x] queue_status_notification trigger captures stage changes and upserts queue
4. [x] notification_pref column defaults to 'both' with CHECK constraint
5. [x] Phone-authenticated RLS policy enables customer login feature
6. [x] pg_cron schedule configured for every-minute queue processing
7. [x] README.md updated with migration 04 documentation

## Next Plan Readiness

Plan 04-02 (Edge Functions for SMS/email delivery) can proceed. It will implement:
- `process-notification-queue` Edge Function (the target of the pg_cron schedule created here)
- `send-notification` Edge Function for manual admin triggers
- Twilio SMS and Resend email helpers

**Prerequisites for deployment:**
- pg_cron and pg_net extensions must be enabled in Supabase Dashboard
- Supabase URL and service_role_key must be configured (app.settings or Vault)
- Migration 04 must be applied after migrations 02 and 03
