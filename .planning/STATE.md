# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-12
**Session:** Phase 5 plan 02 complete -- Registration Checker UI built and integrated

---

## Project Reference

**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

**Current Focus:** Phase 5 (Registration Checker) -- 2/2 plans complete, phase ready for verification. Phase 4 verified, Phase 3 code-complete (verification deferred).

**Key Files:**
- `.planning/PROJECT.md` - Project definition
- `.planning/REQUIREMENTS.md` - 26 v1 requirements
- `.planning/ROADMAP.md` - 9 phases with success criteria
- `.planning/research/SUMMARY.md` - Technical research

---

## Current Position

**Milestone:** v1 Feature Development
**Phase:** 5 of 9 (Registration Checker)
**Plan:** 2/2 complete -- Phase 5 code-complete
**Status:** Phase 5 plans complete, ready for verification.
**Last activity:** 2026-02-12 -- Completed 05-02-PLAN.md

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
Phase 4:    [====================] 100% (4/4 plans complete) - COMPLETE ✓
  Plan 01:  [X] Notification Database Infrastructure (queue, debounce, preferences, RLS, pg_cron)
  Plan 02:  [X] Edge Functions (Twilio SMS, Resend email, queue processor, unsubscribe)
  Plan 03:  [X] TypeScript Types, Services & Admin UI (notificationPref, notifyCustomer, history modal)
  Plan 04:  [X] Customer Login, Dashboard & Preferences (phone OTP, multi-reg dashboard, pref toggle)
Phase 5:    [====================] 100% (2/2 plans complete) - CODE COMPLETE
  Plan 01:  [X] DB Migration, VIN Validator, Types & Service Layer
  Plan 02:  [X] Checker UI Component & Admin Integration (751-line RegistrationChecker.tsx)
Phase 6:    [ ] Not started (Rental Management Core)
Phase 7:    [ ] Not started (Plate Tracking)
Phase 8:    [ ] Not started (Rental Insurance Verification)
Phase 9:    [ ] Blocked (LoJack GPS Integration - needs Spireon API)

Overall:    [█████████████████░░░] 85% (17/20 plans complete)
```

**Requirements Coverage:**
- Total v1: 26
- Mapped: 26 (100%)
- Completed: 5 (STAB-01, STAB-02, STAB-03, PORT-05, PORT-06)
- Remaining: 20 (+ 1 blocked)

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Phases Planned | 9 | 1 blocked (Phase 9) |
| Phases Complete | 5 | Phase 1 + Phase 2 + Phase 4 + Phase 5 (Phase 3 code-complete, verification deferred) |
| Requirements | 26 | 100% mapped |
| Plans Executed | 17 | 01-01 through 01-06, 02-01 through 02-03, 03-01, 03-02, 04-01 through 04-04, 05-01, 05-02 |
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
| Notify checkbox defaults to checked | Most status changes should notify customers; admin opts out explicitly | 2026-02-10 | 04-03 |
| Notification history as separate modal | Different data source (registration_notifications vs registration_audit) | 2026-02-10 | 04-03 |
| notifyCustomer defaults to true when not provided | Backward compatibility - existing code paths still trigger notifications | 2026-02-10 | 04-03 |
| Use Link component for HashRouter navigation | Raw `<a>` tags don't work with HashRouter; React Router Link required | 2026-02-10 | 04-04 |
| Inline snake_case mapping in CustomerDashboard | transformRegistration not exported; only map the display fields needed | 2026-02-10 | 04-04 |
| Customer auth redirects to /customer/login | Separate from admin /login; prevents confusion between auth paths | 2026-02-10 | 04-04 |
| Deploy to Vercel over Dokploy/Hetzner | Simpler for static Vite/React; vercel.json already configured | 2026-02-11 | User decision |
| Credentials configured last | Build all code first, wire up Twilio/Resend/Supabase auth at the end | 2026-02-11 | User decision |
| Auto-compute docComplete and vinFormatValid | Reduces manual clicks; VIN validation and doc booleans are already known from registration | 2026-02-12 | 05-02 |
| useMemo for VIN validation | Avoids re-running validation on every render; only recalculates when VIN changes | 2026-02-12 | 05-02 |
| Override saves results then sets override flag | Ensures checker results are persisted even when overriding failed checks | 2026-02-12 | 05-02 |
| Mileage checks require mileage to be set | allChecksPassed returns false if mileage is null, forcing admin to enter it | 2026-02-12 | 05-02 |

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
- **Notification service transformer pattern:** Dedicated transformNotification for registration_notifications table
- **Notify-customer checkbox pattern:** Default-checked checkbox in confirm dialog, passes flag to service layer
- **Notification history modal pattern:** Separate modal from audit history, channel badges, delivery status
- **Phone OTP login pattern:** Two-step state machine (phone input -> code verify) with resend cooldown
- **Customer auth guard pattern:** useEffect session check + redirect, onAuthStateChange listener for expiry
- **Compact/full component mode pattern:** Single component with compact boolean prop for different UI contexts
- **Optimistic preference update pattern:** Local state change, service call, revert on failure with feedback toast
- **Pre-fill + confirm validation pattern:** System pre-fills VIN/mileage from DB, admin confirms via checkboxes against physical docs
- **Auto-compute + manual-confirm pattern:** docComplete/vinFormatValid auto-computed, cross-doc confirmation requires manual checkbox clicks
- **Checker collapsible section pattern:** Self-contained component with own state, renders inside parent's expanded row
- **Override with confirmation pattern:** Amber "Override and Proceed" button opens dialog showing failed check count, logged via saveCheckerOverride
- **Checker invalidation pattern:** DB trigger clears checker_results when VIN or mileage changes; UI checks registration.checkerResults on mount

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

types.ts Registration Types (UPDATED in 05-01):
  - RegistrationStageKey: 7 values (6 stages + rejected)
  - Registration interface: 32 fields (added mileage, checkerResults, checkerCompletedAt, checkerOverride, checkerOverrideAt)
  - CheckerResult interface: docComplete, vinFormatValid, vinConfirmedOnDocs, mileageConfirmedOnDocs, surrenderedFront, surrenderedBack
  - RegistrationNotification: 16 fields (added 5 extended fields)
  - NotificationPreference type: 'sms' | 'email' | 'both' | 'none'
  - VALID_TRANSITIONS: Forward-only state machine
  - RegistrationAudit interface: Audit trail records
  - REGISTRATION_STAGES: UI configuration for 7 stages

services/registrationService.ts (UPDATED in 05-01):
  - transformRegistration: Maps 32 DB columns to TS fields (added checker fields + mileage)
  - parseAccessKey: Parse /track/{orderId}-{token} URLs
  - getRegistrationByAccessKey: Token-based secure lookup
  - getTrackingLink: Generate customer tracking URLs
  - updateRegistrationStatus: With pending_change_reason + notifyCustomer support
  - updateDocumentChecklist: Boolean doc flags with audit
  - saveCheckerResults: Persist CheckerResult JSONB, update completion timestamp
  - saveCheckerOverride: Set override flag with timestamp, logged via audit trigger
  - updateRegistrationMileage: Update mileage (triggers checker invalidation via DB trigger)
  - getRegistrationAudit: Fetch audit trail
  - logNotification: Extended with oldStage, newStage, subject, templateUsed, providerMessageId
  - archiveRegistration/restoreRegistration: Soft delete
  - Query helpers: getRegistrationsByStage, getRejectedRegistrations, etc.

utils/vinValidator.ts (NEW in 05-01):
  - validateVinFormat: 17 chars, alphanumeric, no I/O/Q
  - validateVinCheckDigit: ISO 3779 check digit algorithm

services/notificationService.ts (NEW in 04-03):
  - transformNotification: snake_case to camelCase for registration_notifications
  - getNotificationHistory: Fetch notifications for a registration
  - updateNotificationPreference: Set sms/email/both/none pref
  - getNotificationPreference: Get current pref

utils/phone.ts (NEW in 04-03):
  - normalizePhone: E.164 format (+1XXXXXXXXXX) for Twilio/Supabase Auth
  - formatPhone: Display format (XXX) XXX-XXXX

components/tracking/ (NEW in 03-02):
  index.ts          - Barrel export (6 components)
  ProgressArc.tsx   - Circular arc with logo center, stage markers (128 lines)
  ProgressRoad.tsx  - Horizontal/vertical road with animated car (167 lines)
  VehicleIcon.tsx   - SVG icons for sedan, suv, truck (127 lines)
  StageInfo.tsx     - Stage description with milestone dates (102 lines)
  LoadingCrest.tsx  - Pulsing logo loading animation (27 lines)
  ErrorState.tsx    - Expired/invalid/not-found error display (74 lines)

components/NotificationPreferences.tsx (NEW in 04-04):
  - Compact mode: gear icon with dropdown popover
  - Full mode: toggle buttons in a row (SMS/Email/Both/None)
  - Optimistic updates with revert on failure
  - Feedback toast, outside-click close

pages/CustomerLogin.tsx (NEW in 04-04):
  - Two-step phone OTP flow (phone input -> code verify)
  - signInWithOtp/verifyOtp via Supabase client
  - normalizePhone before OTP call
  - Resend cooldown (60s), tracking link input bridge
  - Navigates to /customer/dashboard on success

pages/CustomerDashboard.tsx (NEW in 04-04):
  - Auth session check, redirects to /customer/login
  - RLS-filtered registration fetch (customer_phone match)
  - Active registrations on top, completed collapsible
  - NotificationPreferences (compact) per registration card
  - Mini progress bar, stage badges, View Details links
  - Auth state change listener for session expiry

components/admin/RegistrationChecker.tsx (NEW in 05-02):
  - 751-line self-contained pre-submission checker panel
  - 7 sections: mileage entry, doc completeness, VIN validation, mileage confirmation,
    SURRENDERED stamp (front+back), document ordering guide, summary+actions
  - VIN format + ISO 3779 check digit validation (auto-computed)
  - 5 VIN cross-doc checkboxes + Confirm All button
  - 2 mileage cross-doc checkboxes (130-U, Inspection)
  - Override confirmation dialog with failed check count
  - webDEALER link gated behind allChecksPassed || checkerOverride

pages/admin/Registrations.tsx (UPDATED in 05-02):
  - ~1157 lines with 6-stage workflow visualization
  - RegistrationChecker integrated between Document Checklist and Stage Progress
  - Step buttons for status advancement with confirmation dialogs
  - "Notify customer" checkbox in confirm dialog (default checked)
  - Document checklist (5 toggles)
  - Audit history modal
  - Notification history modal (channel badges, delivery status, stage transitions)
  - Stats bar: Total/In Progress/Rejected/Complete

pages/CustomerStatusTracker.tsx (UPDATED in 04-04):
  - Token-based status page with progress arc and road visualization
  - NotificationPreferences (compact) near vehicle info header
  - Login link to /customer/login for returning customers

App.tsx (UPDATED in 04-04):
  - /customer/login -> CustomerLogin (lazy loaded)
  - /customer/dashboard -> CustomerDashboard (lazy loaded)
  - /login -> Login (admin, unchanged)

supabase/migrations/:
  02_registration_schema_update.sql (483 lines)
  03_customer_portal_access.sql (110 lines)
  04_notification_system.sql (244 lines) [NEW in 04-01]
  05_registration_checker.sql [NEW in 05-01] - 5 columns + invalidation trigger
  README.md

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
| Migrations 03-05 not applied | Token + notification + phone auth + checker features won't work until applied | Deploy to Supabase |

### TODOs (Cross-Phase)

- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Apply migration 04_notification_system.sql to Supabase
- [ ] Apply migration 05_registration_checker.sql to Supabase
- [ ] Enable pg_cron and pg_net extensions in Supabase Dashboard
- [ ] Configure app.settings.supabase_url and app.settings.service_role_key (or Vault secrets)
- [ ] Enable Supabase phone auth with Twilio provider (for customer OTP login)
- [ ] Contact Spireon for LoJack API credentials (unblocks Phase 9)
- [ ] Configure Twilio secrets as Edge Function env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- [ ] Configure Resend API key as Edge Function secret (RESEND_API_KEY)
- [ ] Deploy Edge Functions: `supabase functions deploy process-notification-queue` and `supabase functions deploy unsubscribe`
- [ ] Deploy to Vercel (connect GitHub repo, set root dir to triple-j-auto-investment-main)
- [ ] Check Supabase plan limits for document storage (Phase 5, 8)

---

## Session Continuity

### What Was Accomplished This Session
- Executed 05-02: RegistrationChecker UI component and admin integration
- Created 751-line RegistrationChecker.tsx covering all 6 REGC requirements
- Integrated into Registrations.tsx between Document Checklist and Stage Progress
- Build passes, all verification checks confirmed

### Phase 5 Status (CODE COMPLETE)
| Plan | Focus | Commits | Status |
|------|-------|---------|--------|
| 05-01 | DB Migration, VIN Validator, Types & Service | 8aa5673, 260c057 | COMPLETE |
| 05-02 | Checker UI Component & Admin Integration | 03b1e4d, 1e70f4f | COMPLETE |

### Phase 3 Deferred Items (Still Pending)
- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Run Plan 03-03 human verification checkpoint (Task 3)
- [ ] Write 03-03-SUMMARY.md after verification passes

### What Comes Next
1. Phase 5 verification (if needed)
2. Phase 6: Rental Management Core
3. Circle back to Phase 3 verification when DB migration is applied
4. Wire up all credentials after feature code is complete

### If Context Is Lost
Read these files in order:
1. `.planning/STATE.md` (this file) - current position
2. `.planning/ROADMAP.md` - phase structure and success criteria
3. `.planning/phases/05-registration-checker/05-02-SUMMARY.md` - latest plan summary
4. `.planning/REQUIREMENTS.md` - requirement traceability
5. Original code from: https://github.com/whoisjaso/triple-j-auto-investment

---

*State updated: 2026-02-12*
