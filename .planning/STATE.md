# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-10
**Session:** Phase 4 Plan 02 complete (Notification Delivery Edge Functions)

---

## Project Reference

**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

**Current Focus:** Phase 4 (Customer Portal - Notifications & Login) - Plan 02 complete, Plan 03 next (Customer Login & Dashboard).

**Key Files:**
- `.planning/PROJECT.md` - Project definition
- `.planning/REQUIREMENTS.md` - 26 v1 requirements
- `.planning/ROADMAP.md` - 9 phases with success criteria
- `.planning/research/SUMMARY.md` - Technical research

---

## Current Position

**Milestone:** v1 Feature Development
**Phase:** 4 of 9 (Customer Portal - Notifications & Login)
**Plan:** 2 of 4 complete
**Status:** In progress - Plan 04-02 complete, Plan 04-03 next
**Last activity:** 2026-02-10 - Completed 04-02-PLAN.md

**Progress:**
```
Roadmap:    [X] Created
Phase 1:    [====================] 100% (6/6 plans complete) - COMPLETE
  Plan 01:  [X] Error Handling Infrastructure (ErrorModal, useRetry, AppError)
  Plan 02:  [X] STAB-01 Loop Bug Fix (hasLoaded, loading states)
  Plan 03:  [X] Vehicle CRUD Extraction (lib/store/vehicles.ts - 426 lines)
  Plan 04:  [X] Sheets & Leads Extraction (lib/store/sheets.ts, leads.ts)
  Plan 05:  [X] Store.tsx Integration (facade pattern - 281 lines)
  Plan 06:  [X] STAB-03 Verification (build passes, interface unchanged)
Phase 2:    [====================] 100% (3/3 plans complete) - COMPLETE
  Plan 01:  [X] Schema Migration (6-stage workflow, audit trail, RLS)
  Plan 02:  [X] TypeScript Types & Service Updates (types.ts, registrationService.ts)
  Plan 03:  [X] Admin Registrations UI (6-stage workflow, step buttons, audit history)
Phase 3:    [=============       ] 67% (2/3 plans complete) - CODE COMPLETE (verification deferred)
  Plan 01:  [X] Token Access Infrastructure (access_token, expiry trigger, service functions)
  Plan 02:  [X] Tracking Visualization Components (ProgressArc, ProgressRoad, VehicleIcon, etc.)
  Plan 03:  [ ] Route Integration & Polish (code complete, verification deferred)
Phase 4:    [==========          ] 50% (2/4 plans complete) - IN PROGRESS
  Plan 01:  [X] Notification Database Infrastructure (queue, debounce, preferences, RLS, pg_cron)
  Plan 02:  [X] Edge Functions (Twilio SMS, Resend email, queue processor, unsubscribe)
  Plan 03:  [ ] Customer Login & Dashboard (phone OTP, multi-registration view)
  Plan 04:  [ ] Admin Notification UI & Preferences (notify checkbox, history, preference toggle)
Phase 5:    [ ] Not started (Registration Checker)
Phase 6:    [ ] Not started (Rental Management Core)
Phase 7:    [ ] Not started (Plate Tracking)
Phase 8:    [ ] Not started (Rental Insurance Verification)
Phase 9:    [ ] Blocked (LoJack GPS Integration - needs Spireon API)

Overall:    [█████████████░░░░░░░] 65% (13/20 plans complete)
```

**Requirements Coverage:**
- Total v1: 26
- Mapped: 26 (100%)
- Completed: 0 (feature work visible to users begins Phase 3 Plan 03)
- Remaining: 26

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Phases Planned | 9 | 1 blocked (Phase 9) |
| Phases Complete | 2 | Phase 1 + Phase 2 |
| Requirements | 26 | 100% mapped |
| Plans Executed | 13 | 01-01 through 01-06, 02-01 through 02-03, 03-01, 03-02, 04-01, 04-02 complete |
| Blockers | 1 | Spireon API access |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Date | Source |
|----------|-----------|------|--------|
| 9 phases (comprehensive) | Requirements cluster into 9 natural delivery boundaries | 2026-01-29 | Roadmap |
| Stability first | RLS and Store.tsx issues will compound with new features | 2026-01-29 | Roadmap |
| Isolate LoJack in Phase 9 | Blocked by external API - don't let it delay other rental features | 2026-01-29 | Roadmap |
| Split Portal into 3 phases | Database, UI, Notifications are distinct deliverables | 2026-01-29 | Roadmap |
| Error codes grouped by category (RLS, NET, DB) | Easy identification of error source for debugging | 2026-02-01 | 01-01 |
| Retryable flag on AppError type | Allows UI to decide whether to show retry button | 2026-02-01 | 01-01 |
| useRetry returns abort function | Component can cancel pending retries on unmount | 2026-02-01 | 01-01 |
| hasLoaded flag (not enum) | Minimal change, TypeScript infers correctly | 2026-02-01 | 01-02 |
| Progress bar always, spinner first-load only | Real-time updates shouldn't show jarring spinner | 2026-02-01 | 01-02 |
| Remove safety timer | Proper state management eliminates need for timeout | 2026-02-01 | 01-02 |
| Setter injection pattern for extracted functions | VehicleSetters interface allows state updates from non-component code | 2026-02-04 | 01-03 |
| Use export type for interface re-exports | TypeScript isolatedModules requires type-only exports | 2026-02-04 | 01-03 |
| vehiclesRef pattern for closures | useRef tracks current vehicles to avoid stale state in callbacks | 2026-02-04 | 01-05 |
| Keep updateRegistration inline | Only ~20 lines, not worth extracting to separate module | 2026-02-04 | 01-05 |
| TypeScript strict errors acceptable | Pre-existing ErrorBoundary issues unrelated to decomposition | 2026-02-04 | 01-06 |
| Custom audit trigger over supa_audit | supa_audit doesn't support change notes/reasons | 2026-02-04 | 02-01 |
| Explicit field comparison in audit trigger | Clearer than dynamic information_schema loop | 2026-02-04 | 02-01 |
| ON DELETE SET NULL for audit FK | Preserves compliance history if registration deleted | 2026-02-04 | 02-01 |
| DB-level status transitions | Enforces valid transitions even from direct SQL | 2026-02-04 | 02-01 |
| Simplified RegistrationStageStatus | in_progress/complete only - stages handle workflow, blocked removed | 2026-02-04 | 02-02 |
| Removed customer ownership | Dealer handles all stages per Texas dealer workflow | 2026-02-04 | 02-02 |
| Client-side isValidTransition | Mirrors DB constraint for early UX feedback | 2026-02-04 | 02-02 |
| Step buttons over dropdown | Each valid transition gets its own button for clearer workflow | 2026-02-05 | 02-03 |
| Confirmation required for all status changes | Modal with notes input prevents accidental changes | 2026-02-05 | 02-03 |
| Rejection requires notes | Button disabled without text for compliance tracking | 2026-02-05 | 02-03 |
| Token format: 32-char hex | gen_random_bytes(16) - cryptographically secure, URL-safe | 2026-02-05 | 03-01 |
| Token expiry via DB trigger | set_token_expiry_on_delivery() for consistent timing | 2026-02-05 | 03-01 |
| Belt-and-suspenders validation | RLS policy + application-level expiry check | 2026-02-05 | 03-01 |
| hasAnimated ref for animation replay | Prevents arc/car animation replay on resize per CONTEXT.md | 2026-02-06 | 03-02 |
| 3 vehicle icon types | sedan, suv, truck with body class mapping | 2026-02-06 | 03-02 |
| Responsive road orientation | Horizontal on desktop, vertical on mobile via Tailwind | 2026-02-06 | 03-02 |
| Partial unique index for debounce | PostgreSQL WHERE not supported on inline UNIQUE; CREATE UNIQUE INDEX instead | 2026-02-10 | 04-01 |
| ON CONFLICT column+WHERE syntax | Partial unique indexes require column expression, not constraint name reference | 2026-02-10 | 04-01 |
| SECURITY DEFINER on queue trigger | Trigger must INSERT into notification_queue regardless of caller's RLS | 2026-02-10 | 04-01 |
| app.settings default for pg_cron | Simpler dev setup; Vault approach documented for production | 2026-02-10 | 04-01 |
| Template literal HTML over React Email JSX | Avoids deno.json JSX config and React Email npm imports; identical output | 2026-02-10 | 04-02 |
| Mark queue items sent even on total failure | Prevents infinite retry loops; admin sees failures in audit trail | 2026-02-10 | 04-02 |
| Email auto-fallback on SMS failure | Per CONTEXT.md auto-fallback spec; maximize delivery probability | 2026-02-10 | 04-02 |

### Patterns Established

- **Error handling pattern:** AppError type with code, message, details, timestamp, retryable
- **Retry pattern:** useRetry hook with countdown state and AbortController
- **Modal pattern:** ErrorModal following BillOfSaleModal animation patterns
- **Loading state pattern:** hasLoaded flag to distinguish first-load from reload
- **Module extraction pattern:** Extract logic to lib/store/*.ts, keep Store.tsx as facade
- **Setter injection pattern:** Pass React state setters via VehicleSetters interface
- **Facade pattern:** Store.tsx orchestrates modules, exposes unchanged useStore() interface
- **Audit trigger pattern:** pending_change_reason captured and cleared by trigger
- **Granular RLS pattern:** registration_admin can INSERT/UPDATE, only is_admin can DELETE
- **Milestone auto-population:** Trigger sets dates when status advances
- **Service transformer pattern:** snake_case DB to camelCase TS mapping in transform functions
- **Soft delete pattern:** is_archived flag, filter archived by default
- **Step button pattern:** openConfirmDialog captures target stage, modal confirms with notes
- **Document checklist pattern:** Boolean toggle buttons with immediate service call
- **Token auto-generation:** PostgreSQL gen_random_bytes() at INSERT, no app code needed
- **Token expiry trigger:** DB trigger on status change to sticker_delivered
- **Animation replay prevention:** useRef(false) + set() vs start() in useEffect
- **Component barrel export:** index.ts re-exports all components from directory
- **Debounce queue pattern:** Partial unique index + ON CONFLICT upsert resets 5-min window
- **Pending flag capture pattern:** BEFORE trigger reads NEW.pending_notify_customer, clears after capture
- **Phone-auth RLS pattern:** auth.jwt()->>'phone' matches customer_phone for authenticated SELECT
- **Edge Function shared helper pattern:** _shared/ directory for cross-function utilities (twilio.ts, resend.ts)
- **Template literal email pattern:** HTML string with inline CSS for email client compatibility
- **Queue processor pattern:** Fetch ready items, process per-item with try/catch, mark sent regardless
- **SMS auto-fallback pattern:** Attempt email delivery when SMS fails, regardless of preference
- **Token-validated unsubscribe:** Branded HTML response page, validates access_token before updating pref

### Architecture Summary (Current)

```
lib/store/ Module Structure (750 lines total):
  index.ts      - Barrel export (7 lines)
  types.ts      - VehicleState, VehicleSetters interfaces (20 lines)
  vehicles.ts   - Vehicle CRUD operations (426 lines)
  sheets.ts     - Google Sheets sync (229 lines)
  leads.ts      - Lead management (68 lines)

Store.tsx (281 lines - 68% reduction from 893):
  - Thin facade that imports from lib/store/*
  - React state management, Supabase subscriptions
  - Auth integration, useStore() interface UNCHANGED

types.ts Registration Types (UPDATED in 03-01):
  - RegistrationStageKey: 7 values (6 stages + rejected)
  - Registration interface: 26 fields (now includes accessToken, tokenExpiresAt, vehicleBodyType)
  - VALID_TRANSITIONS: Forward-only state machine
  - RegistrationAudit interface: Audit trail records
  - REGISTRATION_STAGES: UI configuration for 7 stages

services/registrationService.ts (UPDATED in 03-01):
  - transformRegistration: Maps 26 DB columns to TS fields
  - parseAccessKey: Parse /track/{orderId}-{token} URLs
  - getRegistrationByAccessKey: Token-based secure lookup
  - getTrackingLink: Generate customer tracking URLs
  - updateRegistrationStatus: With pending_change_reason audit support
  - updateDocumentChecklist: Boolean doc flags with audit
  - getRegistrationAudit: Fetch audit trail
  - archiveRegistration/restoreRegistration: Soft delete
  - Query helpers: getRegistrationsByStage, getRejectedRegistrations, etc.

components/tracking/ (NEW in 03-02):
  index.ts          - Barrel export (6 components)
  ProgressArc.tsx   - Circular arc with logo center, stage markers (128 lines)
  ProgressRoad.tsx  - Horizontal/vertical road with animated car (167 lines)
  VehicleIcon.tsx   - SVG icons for sedan, suv, truck (127 lines)
  StageInfo.tsx     - Stage description with milestone dates (102 lines)
  LoadingCrest.tsx  - Pulsing logo loading animation (27 lines)
  ErrorState.tsx    - Expired/invalid/not-found error display (74 lines)

pages/admin/Registrations.tsx (UPDATED in 02-03):
  - 1039 lines with 6-stage workflow visualization
  - Step buttons for status advancement with confirmation dialogs
  - Document checklist (5 toggles)
  - Audit history modal
  - Stats bar: Total/In Progress/Rejected/Complete

supabase/migrations/:
  02_registration_schema_update.sql (483 lines)
    - 6-stage workflow: sale_complete -> documents_collected ->
      submitted_to_dmv -> dmv_processing -> sticker_ready ->
      sticker_delivered (+ rejected branch)
    - registration_audit table with change tracking
    - validate_status_transition() trigger
    - auto_set_milestone_dates() trigger
    - is_registration_admin RLS policies
  03_customer_portal_access.sql (110 lines)
    - access_token column (32-char hex, auto-generated)
    - token_expires_at column (30 days after delivery)
    - vehicle_body_type column (for car icon)
    - set_token_expiry_on_delivery() trigger
    - Updated RLS: public SELECT requires valid token
  04_notification_system.sql (244 lines) [NEW in 04-01]
    - notification_queue table with partial unique index for debounce
    - 5 new columns on registration_notifications (audit enrichment)
    - notification_pref column on registrations (sms/email/both/none)
    - pending_notify_customer flag on registrations (admin opt-out)
    - queue_status_notification() BEFORE UPDATE trigger with upsert debounce
    - Phone-authenticated customer RLS policy (auth.jwt()->>'phone')
    - pg_cron schedule: process-notification-queue every minute via pg_net
  README.md
    - Migration order, breaking changes, rollback for all migrations

supabase/functions/ (NEW in 04-02):
  _shared/
    twilio.ts              - sendSms() via Twilio REST API (Basic auth)
    resend.ts              - sendEmail() via Resend REST API (Bearer auth)
    email-templates/
      status-update.tsx    - renderStatusUpdateEmail() - branded HTML with progress bar
      rejection-notice.tsx - renderRejectionEmail() - red alert variant
  process-notification-queue/
    index.ts               - Deno.serve queue sweep: fetch ready, send SMS/email, log, mark sent
  unsubscribe/
    index.ts               - Deno.serve one-click unsubscribe with branded HTML response
```

### Known Issues

| Issue | Impact | Phase to Address |
|-------|--------|------------------|
| pages/RegistrationTracker.tsx type errors | Uses old stage values | Phase 3 Plan 03 (will be replaced by CustomerStatusTracker) |
| RLS silent failures | Data loss without warning | Ongoing monitoring |
| No Spireon API access | Can't build GPS feature | Phase 9 blocked |
| TypeScript strict mode | ErrorBoundary class issues | Low priority (build works) |
| Migrations 03-04 not applied | Token + notification features won't work until applied | Deploy to Supabase |

### TODOs (Cross-Phase)

- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Apply migration 04_notification_system.sql to Supabase
- [ ] Enable pg_cron and pg_net extensions in Supabase Dashboard
- [ ] Configure app.settings.supabase_url and app.settings.service_role_key (or Vault secrets)
- [ ] Contact Spireon for LoJack API credentials (unblocks Phase 9)
- [ ] Configure Twilio secrets as Edge Function env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- [ ] Configure Resend API key as Edge Function secret (RESEND_API_KEY)
- [ ] Deploy Edge Functions: `supabase functions deploy process-notification-queue` and `supabase functions deploy unsubscribe`
- [ ] Check Supabase plan limits for document storage (Phase 5, 8)

---

## Session Continuity

### What Was Accomplished This Session
- Executed Phase 4 Plan 02: Notification Delivery Edge Functions
- Created 6 files under supabase/functions/ for SMS, email, queue processing, and unsubscribe
- 3 tasks, 3 commits, 0 deviations

### Phase 4 Plan 02 Status
| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Create shared SMS and email helpers | cdb8206 | COMPLETE |
| 2 | Create email templates and queue processor | beadbcc | COMPLETE |
| 3 | Create unsubscribe Edge Function | baa933c | COMPLETE |

### Phase 3 Deferred Items (Still Pending)
- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Run Plan 03-03 human verification checkpoint (Task 3)
- [ ] Write 03-03-SUMMARY.md after verification passes

### What Comes Next
1. Execute Phase 4 Plan 03: Customer Login & Dashboard (phone OTP, multi-registration view)
2. Execute Phase 4 Plan 04: Admin Notification UI & Preferences (notify checkbox, history)
3. Circle back to Phase 3 verification when DB migration is applied

### If Context Is Lost
Read these files in order:
1. `.planning/STATE.md` (this file) - current position
2. `.planning/ROADMAP.md` - phase structure and success criteria
3. `.planning/phases/04-customer-portal-notifications-login/04-CONTEXT.md` - phase context
4. `.planning/phases/04-customer-portal-notifications-login/04-02-SUMMARY.md` - just completed
5. Original code from: https://github.com/whoisjaso/triple-j-auto-investment

---

*State updated: 2026-02-10*
