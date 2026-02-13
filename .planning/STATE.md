# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-12
**Session:** Phase 6 in progress — 06-05 (rental agreement system) complete

---

## Project Reference

**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

**Current Focus:** Phase 6 (Rental Management Core) — Plan 05 complete, 1 plan remaining. Phase 3 code-complete (verification deferred).

**Key Files:**
- `.planning/PROJECT.md` - Project definition
- `.planning/REQUIREMENTS.md` - 26 v1 requirements
- `.planning/ROADMAP.md` - 9 phases with success criteria
- `.planning/research/SUMMARY.md` - Technical research

---

## Current Position

**Milestone:** v1 Feature Development
**Phase:** 6 of 9 (Rental Management Core)
**Plan:** 5/6 complete
**Status:** In progress
**Last activity:** 2026-02-12 — Completed 06-05-PLAN.md (Rental agreement system)

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
Phase 5:    [====================] 100% (2/2 plans complete) - COMPLETE ✓
  Plan 01:  [X] DB Migration, VIN Validator, Types & Service Layer
  Plan 02:  [X] Checker UI Component & Admin Integration (751-line RegistrationChecker.tsx)
Phase 6:    [================    ] 83% (5/6 plans complete) - IN PROGRESS
  Plan 01:  [X] Rental Database Schema (btree_gist, EXCLUDE constraint, 4 tables, RLS)
  Plan 02:  [X] TypeScript Types & Service Layer (rentalService.ts, store module, 23 functions)
  Plan 03:  [X] Rental Admin Page & Calendar (Rentals.tsx, RentalCalendar.tsx, 3-tab layout)
  Plan 04:  [X] Booking Modal & Condition Report (RentalBookingModal.tsx, RentalConditionReport.tsx)
  Plan 05:  [X] Rental Agreement System (SignatureCapture, RentalAgreementModal, PDF generator)
  Plan 06:  [ ] Payment Tracking & Dashboard (not started)
Phase 7:    [ ] Not started (Plate Tracking)
Phase 8:    [ ] Not started (Rental Insurance Verification)
Phase 9:    [ ] Blocked (LoJack GPS Integration - needs Spireon API)

Overall:    [██████████████████░░] 92% (22/24 plans complete)
```

**Requirements Coverage:**
- Total v1: 26
- Mapped: 26 (100%)
- Completed: 11 (STAB-01, STAB-02, STAB-03, PORT-05, PORT-06, REGC-01 through REGC-06)
- Remaining: 14 (+ 1 blocked)

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Phases Planned | 9 | 1 blocked (Phase 9), Phases 7-9 not yet detailed |
| Phases Complete | 5 | Phase 1 + Phase 2 + Phase 4 + Phase 5 (Phase 3 code-complete, verification deferred) |
| Requirements | 26 | 100% mapped |
| Plans Executed | 22 | 01-01 through 01-06, 02-01 through 02-03, 03-01, 03-02, 04-01 through 04-04, 05-01, 05-02, 06-01 through 06-05 |
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
| EXCLUDE USING gist for double-booking | Database-level constraint eliminates race conditions; app-level checks insufficient | 2026-02-13 | 06-01 |
| DATE type for rental dates (not TIMESTAMPTZ) | Single-timezone Houston TX business; avoids off-by-one timezone bugs | 2026-02-13 | 06-01 |
| Separate listing_type column (not modify status) | Rental classification orthogonal to sale status; prevents breaking existing filters | 2026-02-13 | 06-01 |
| TJ-R-YYYY-NNNN booking ID format | Human-readable IDs for agreements and customer communication; auto-generated by trigger | 2026-02-13 | 06-01 |
| Separate CHECK constraint via DO block | ADD COLUMN IF NOT EXISTS cannot include inline CHECK idempotently; information_schema guard | 2026-02-13 | 06-01 |
| parseFloat for DECIMAL columns | Supabase returns DECIMAL(10,2) as strings; parseFloat in transformers ensures numeric types | 2026-02-13 | 06-02 |
| Two-query availability check | Fetch rental vehicles + conflicting bookings separately, filter client-side (simpler than complex SQL join) | 2026-02-13 | 06-02 |
| Weekly+daily rate calculation | Full weeks at weeklyRate, remainder at dailyRate, only when >= 7 days and weeklyRate provided | 2026-02-13 | 06-02 |
| Late fee override semantics: null/0/>0 | null = auto-calculate, 0 = waived, > 0 = admin override (mirrors DB column design) | 2026-02-13 | 06-02 |
| Custom calendar grid (no library) | Avoids bundle size and styling conflicts; grid-cols-7 with Tailwind sufficient | 2026-02-13 | 06-03 |
| AdminHeader duplication per admin page | Per research pitfall #7; each page owns its navigation state | 2026-02-13 | 06-03 |
| FleetVehicleRow as separate component | Local rate state for blur-save pattern; prevents full fleet list re-renders | 2026-02-13 | 06-03 |
| Overdue-first sort on active rentals | Most urgent items at top for immediate admin attention | 2026-02-13 | 06-03 |
| Responsive canvas width via container ref | react-signature-canvas needs explicit pixel width; container ref ensures it fills parent | 2026-02-12 | 06-05 |
| Dual signing flow (digital + manual) | Per CONTEXT.md, not all customers can sign on a screen; print-and-confirm fallback | 2026-02-12 | 06-05 |
| Graceful storage failure handling | Save signature_data to booking even if Supabase Storage upload fails; signature is critical artifact | 2026-02-12 | 06-05 |
| Page overflow clause handling | Estimate clause height before rendering; auto-add page if exceeds footer limit | 2026-02-12 | 06-05 |
| Per-page footer with numbering | drawPageFooter with page X of Y after full document generation; multi-page agreement needs reference | 2026-02-12 | 06-05 |

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
- **EXCLUDE gist constraint pattern:** btree_gist extension + EXCLUDE USING gist with daterange for overlap prevention
- **Booking ID auto-generation pattern:** DB function + BEFORE INSERT trigger generates TJ-R-YYYY-NNNN sequential IDs
- **Idempotent CHECK constraint pattern:** DO block with information_schema.check_constraints guard for re-runnable migrations
- **Dual inventory pattern:** listing_type column (sale_only/rental_only/both) on existing vehicles table, separate from status
- **Rental transformer pattern:** transformBooking handles nested joins (rental_customers, rental_payments) and JSONB array parsing
- **Two-query availability pattern:** Fetch eligible vehicles, fetch conflicting bookings, client-side Set exclusion
- **JSONB array safe parsing pattern:** Array.isArray() check before mapping JSONB arrays (authorized_drivers, permitted_states, etc.)
- **Weekly/daily rate calculation pattern:** calculateBookingTotal uses floor division for weekly chunks with daily remainder
- **Tab navigation pattern:** Segmented control with border-b-2 active indicator for multi-view pages
- **Calendar grid pattern:** grid-cols-7 with useMemo date-keyed Map for O(1) booking lookup per cell
- **Fleet vehicle row pattern:** Separate component with local state for blur-save rate inputs
- **Inline rate editing pattern:** Input fields save on blur via service call, local state for edit-in-progress
- **Signature capture pattern:** react-signature-canvas with responsive container ref, white canvas, base64 PNG output
- **Dual signing flow pattern:** Digital (canvas capture) or manual (print + checkbox confirm) with terms gate
- **Rental agreement PDF pattern:** Multi-page branded document with 14 legal clauses, auto page-break handling
- **Page overflow handling pattern:** Estimate clause height, call doc.addPage() if exceeds FOOTER_LIMIT constant
- **Per-page footer pattern:** drawPageFooter called after all pages rendered, uses doc.setPage(i) loop for page X of Y

### Architecture Summary (Current)

```
lib/store/ Module Structure (~800 lines total):
  index.ts      - Barrel export (8 lines)
  types.ts      - VehicleState, VehicleSetters, RentalState, RentalSetters (32 lines)
  vehicles.ts   - Vehicle CRUD operations (426 lines)
  sheets.ts     - Google Sheets sync (229 lines)
  leads.ts      - Lead management (68 lines)
  rentals.ts    - Rental booking loading (24 lines) [NEW in 06-02]

Store.tsx (~295 lines - extended in 06-02):
  - Thin facade that imports from lib/store/*
  - React state management, Supabase subscriptions
  - Auth integration, useStore() interface extended with bookings + refreshBookings

types.ts Rental Types (NEW in 06-02):
  - ListingType: 'sale_only' | 'rental_only' | 'both'
  - RentalBookingStatus: 'reserved' | 'active' | 'returned' | 'cancelled' | 'overdue'
  - PaymentMethod: 'cash' | 'card' | 'zelle' | 'cashapp'
  - FuelLevel, ConditionRating type aliases
  - RentalCustomer, RentalBooking, RentalPayment, RentalConditionReport interfaces
  - ConditionChecklistItem interface + CONDITION_CHECKLIST_TEMPLATE (27 items)
  - PAYMENT_METHOD_LABELS constant
  - Vehicle interface extended with listingType, dailyRate, weeklyRate, minRentalDays, maxRentalDays

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

services/rentalService.ts (NEW in 06-02):
  - transformBooking, transformCustomer, transformPayment, transformConditionReport: snake_case -> camelCase
  - Booking CRUD: getAllBookings, getBookingById, getBookingsForMonth, getActiveBookings,
    createBooking, updateBooking, cancelBooking, returnBooking
  - Customer CRUD: getAllCustomers, getCustomerById, createCustomer, updateCustomer, searchCustomers
  - Payment functions: getPaymentsForBooking, createPayment, deletePayment
  - Condition reports: getConditionReports, createConditionReport
  - Availability: getAvailableVehicles (two-query + client-side filter), updateVehicleListingType, updateVehicleRentalRates
  - Pure utilities: calculateLateFee (override-aware), calculateBookingTotal (weekly+daily)

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

components/admin/RentalCalendar.tsx (NEW in 06-03):
  - 299-line custom monthly calendar grid (no third-party libraries)
  - grid-cols-7 layout, month navigation (prev/next/today)
  - Status-colored booking bars (reserved=blue, active=green, overdue=red+pulse, returned=gray)
  - useMemo date-keyed Map for O(1) booking lookup per cell
  - Max 4 bars per cell with +N more overflow indicator
  - Click handlers for dates and booking bars

pages/admin/Rentals.tsx (NEW in 06-03):
  - 1028-line rental management page with 3 tabs
  - Calendar tab: RentalCalendar + inline booking detail + quick actions
  - Active Rentals tab: overdue-first sorted list, late fee display, return/cancel actions
  - Fleet tab: listing type dropdown, daily/weekly rate inputs, rental fleet filter
  - Stats bar: total bookings, active, overdue, fleet size
  - Return vehicle dialog with mileage-in input
  - AdminHeader with Rentals nav item
  - Placeholder hooks for booking/agreement modals (Plans 04-05)

components/admin/SignatureCapture.tsx (NEW in 06-05):
  - Reusable digital signature pad (react-signature-canvas)
  - Responsive canvas width via container ref
  - Accept/Clear/Re-sign flows, base64 PNG output
  - Disabled mode shows static image, mobile touch-action:none

components/admin/RentalAgreementModal.tsx (NEW in 06-05):
  - 697-line agreement review, signature, and PDF preview modal
  - Left panel: auto-populated summary + SignatureCapture + manual signing flow
  - Right panel: live PDF preview in iframe, print/download
  - Uploads PDF to Supabase Storage, updates booking record
  - Graceful fallback if storage fails (saves signature_data anyway)

services/pdfService.ts (UPDATED in 06-05):
  - Added RentalAgreementData interface (22 fields)
  - Added generateRentalAgreementPDF: multi-page branded agreement
  - 14 numbered legal clauses with auto page-break handling
  - Signature image embedding via doc.addImage
  - drawPageFooter helper with page X of Y numbering
  - Reuses existing drawHeader, drawSection, drawDataBox, drawSecurityBackground

App.tsx (UPDATED in 06-03):
  - /admin/rentals -> AdminRentals (lazy loaded, ProtectedRoute)
  - /customer/login -> CustomerLogin (lazy loaded)
  - /customer/dashboard -> CustomerDashboard (lazy loaded)
  - /login -> Login (admin, unchanged)
  - Navbar: desktop + mobile Rentals link with Key icon for logged-in admins

supabase/migrations/:
  02_registration_schema_update.sql (483 lines)
  03_customer_portal_access.sql (110 lines)
  04_notification_system.sql (244 lines) [NEW in 04-01]
  05_registration_checker.sql [NEW in 05-01] - 5 columns + invalidation trigger
  06_rental_schema.sql (568 lines) [NEW in 06-01] - btree_gist, 4 tables, EXCLUDE constraint, RLS
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
| Migrations 03-06 not applied | Token + notification + phone auth + checker + rental features won't work until applied | Deploy to Supabase |

### TODOs (Cross-Phase)

- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Apply migration 04_notification_system.sql to Supabase
- [ ] Apply migration 05_registration_checker.sql to Supabase
- [ ] Apply migration 06_rental_schema.sql to Supabase (enable btree_gist extension first)
- [ ] Enable pg_cron and pg_net extensions in Supabase Dashboard
- [ ] Configure app.settings.supabase_url and app.settings.service_role_key (or Vault secrets)
- [ ] Enable Supabase phone auth with Twilio provider (for customer OTP login)
- [ ] Contact Spireon for LoJack API credentials (unblocks Phase 9)
- [ ] Configure Twilio secrets as Edge Function env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- [ ] Configure Resend API key as Edge Function secret (RESEND_API_KEY)
- [ ] Deploy Edge Functions: `supabase functions deploy process-notification-queue` and `supabase functions deploy unsubscribe`
- [ ] Deploy to Vercel (connect GitHub repo, set root dir to triple-j-auto-investment-main)
- [ ] Create Supabase Storage bucket 'rental-agreements' for agreement PDF uploads (Phase 6)
- [ ] Check Supabase plan limits for document storage (Phase 5, 6, 8)

---

## Session Continuity

### What Was Accomplished This Session
- Executed 06-05: Rental agreement system (signature capture, agreement modal, PDF generator)
- Installed react-signature-canvas and @types/react-signature-canvas
- Created SignatureCapture.tsx: reusable digital signature pad with responsive canvas
- Created RentalAgreementModal.tsx (697 lines): two-panel agreement review with live PDF preview
- Added generateRentalAgreementPDF to pdfService.ts: multi-page branded agreement with 14 legal clauses
- Added RentalAgreementData interface, formatCurrencyNum helper, drawPageFooter helper

### Phase 6 Status (IN PROGRESS)
| Plan | Focus | Commits | Status |
|------|-------|---------|--------|
| 06-01 | Rental Database Schema | e648fcd | COMPLETE |
| 06-02 | TypeScript Types & Service Layer | ffdfc7a, 2b76ddd | COMPLETE |
| 06-03 | Rental Admin Page & Calendar | e4de9dd, edf7950 | COMPLETE |
| 06-04 | Booking Modal & Condition Report | 9c883ff, 38c613d | COMPLETE |
| 06-05 | Rental Agreement System | 6021df7, ea0d61a | COMPLETE |
| 06-06 | Payment Tracking & Dashboard | - | NOT STARTED |

### Phase 3 Deferred Items (Still Pending)
- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Run Plan 03-03 human verification checkpoint (Task 3)
- [ ] Write 03-03-SUMMARY.md after verification passes

### What Comes Next
1. Phase 6 Plan 06: Payment tracking and rental dashboard (final plan in phase)
2. Phase 7: Plate Tracking
3. Circle back to Phase 3 verification when DB migration is applied
4. Wire up all credentials after feature code is complete

### If Context Is Lost
Read these files in order:
1. `.planning/STATE.md` (this file) - current position
2. `.planning/ROADMAP.md` - phase structure and success criteria
3. `.planning/phases/06-rental-management-core/06-05-SUMMARY.md` - latest plan summary
4. `.planning/REQUIREMENTS.md` - requirement traceability
5. Original code from: https://github.com/whoisjaso/triple-j-auto-investment

---

*State updated: 2026-02-12 (06-05 complete)*
