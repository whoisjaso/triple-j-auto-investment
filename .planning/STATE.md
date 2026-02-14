# Project State: Triple J Auto Investment

**Last Updated:** 2026-02-14
**Session:** Phase 8 IN PROGRESS -- Plans 01, 03 complete (DB + Edge Function). Plan 02 remaining.

---

## Project Reference

**Core Value:** Customers can track their registration status in real-time, and paperwork goes through DMV the first time.

**Current Focus:** Phase 8 (Rental Insurance Verification) IN PROGRESS -- Plans 01+03 complete (DB, types, service, Edge Function). Plan 02 remaining. Phase 3 code-complete (verification deferred).

**Key Files:**
- `.planning/PROJECT.md` - Project definition
- `.planning/REQUIREMENTS.md` - 26 v1 requirements
- `.planning/ROADMAP.md` - 9 phases with success criteria
- `.planning/research/SUMMARY.md` - Technical research

**Git Remote:**
- Repository: https://github.com/whoisjaso/triple-j-auto-investment
- Branch: master
- Username: whoisjaso
- Email: jobawems@gmail.com

---

## Current Position

**Milestone:** v1 Feature Development
**Phase:** 8 of 9 (Rental Insurance Verification) -- IN PROGRESS
**Plan:** 2/3 complete (01 + 03; 02 pending)
**Status:** In progress
**Last activity:** 2026-02-14 -- Completed 08-03-PLAN.md (Edge Function Extension)

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
Phase 4:    [====================] 100% (4/4 plans complete) - COMPLETE
  Plan 01:  [X] Notification Database Infrastructure (queue, debounce, preferences, RLS, pg_cron)
  Plan 02:  [X] Edge Functions (Twilio SMS, Resend email, queue processor, unsubscribe)
  Plan 03:  [X] TypeScript Types, Services & Admin UI (notificationPref, notifyCustomer, history modal)
  Plan 04:  [X] Customer Login, Dashboard & Preferences (phone OTP, multi-reg dashboard, pref toggle)
Phase 5:    [====================] 100% (2/2 plans complete) - COMPLETE
  Plan 01:  [X] DB Migration, VIN Validator, Types & Service Layer
  Plan 02:  [X] Checker UI Component & Admin Integration (751-line RegistrationChecker.tsx)
Phase 6:    [====================] 100% (6/6 plans complete) - COMPLETE
  Plan 01:  [X] Rental Database Schema (btree_gist, EXCLUDE constraint, 4 tables, RLS)
  Plan 02:  [X] TypeScript Types & Service Layer (rentalService.ts, store module, 23 functions)
  Plan 03:  [X] Rental Admin Page & Calendar (Rentals.tsx, RentalCalendar.tsx, 3-tab layout)
  Plan 04:  [X] Booking Modal & Condition Report (RentalBookingModal.tsx, RentalConditionReport.tsx)
  Plan 05:  [X] Rental Agreement System (SignatureCapture, RentalAgreementModal, PDF generator)
  Plan 06:  [X] Payment Tracking & Dashboard (BookingDetail, payments, late fees, modal wiring)
Phase 7:    [====================] 100% (4/4 plans complete) - COMPLETE
  Plan 01:  [X] Database, Types & Service Layer (07_plate_tracking.sql, plateService.ts, types.ts)
  Plan 02:  [X] Plates Admin Page (Plates.tsx 1099 lines, PlateAssignmentHistory.tsx, route/nav integration)
  Plan 03:  [X] Rental Integration (plate selection in booking, return confirmation, Plates tab)
  Plan 04:  [X] Alert Edge Function & pg_cron (check-plate-alerts Edge Function, plate-alert.tsx email template)
Phase 8:    [=============           ] 67% (2/3 plans complete) - IN PROGRESS
  Plan 01:  [X] Database, Types & Service Layer (08_rental_insurance.sql, insuranceService.ts, types.ts)
  Plan 02:  [ ] Insurance Verification UI
  Plan 03:  [X] Edge Function Extension (check-plate-alerts + plate-alert.tsx extended with insurance detection)
Phase 9:    [ ] Blocked (LoJack GPS Integration - needs Spireon API)

Overall:    [█████████████████████████] 97% (29/30 plans complete)
```

**Requirements Coverage:**
- Total v1: 26
- Mapped: 26 (100%)
- Completed: 21 (STAB-01 through STAB-03, PORT-05, PORT-06, REGC-01 through REGC-06, RENT-01 through RENT-04, RENT-06, PLAT-01 through PLAT-05)
- Remaining: 4 (PORT-01 through PORT-04, PORT-07, RINS-01 through RINS-04) + 1 blocked (RENT-05)

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Phases Planned | 9 | 1 blocked (Phase 9), Phase 8 in progress |
| Phases Complete | 7 | Phase 1 + Phase 2 + Phase 4 + Phase 5 + Phase 6 + Phase 7 (Phase 3 code-complete, verification deferred) |
| Requirements | 26 | 100% mapped |
| Plans Executed | 29 | 01-01 through 01-06, 02-01 through 02-03, 03-01, 03-02, 04-01 through 04-04, 05-01, 05-02, 06-01 through 06-06, 07-01 through 07-04, 08-01, 08-03 |
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
| BookingDetail inline expansion (not modal) | Same pattern as RegistrationChecker; keeps context visible without blocking | 2026-02-12 | 06-06 |
| Accordion single-expand behavior | One booking expanded at a time prevents overwhelming the page | 2026-02-12 | 06-06 |
| Late fee reset via direct Supabase query | updateBooking Partial cannot distinguish undefined from null; direct query sets null cleanly | 2026-02-12 | 06-06 |
| Pre-fill payment amount with remaining balance | Most common case is paying remaining; saves admin calculation step | 2026-02-12 | 06-06 |
| Customer total only shown when >1 booking | Single-booking info already visible in booking detail; avoids redundancy | 2026-02-12 | 06-06 |
| Calendar booking click navigates to Active Rentals | Connects calendar visualization to management detail view seamlessly | 2026-02-12 | 06-06 |
| UNIQUE constraint via DO block for plates | plate_number uniqueness enforced through information_schema guard (idempotent) | 2026-02-13 | 07-01 |
| Dedicated update_plates_updated_at function | Generic update_updated_at_column() may not exist; self-contained is safer | 2026-02-13 | 07-01 |
| No DELETE policy on immutable tables | plate_assignments and plate_alerts are audit trails; resolve, don't delete | 2026-02-13 | 07-01 |
| Client-side active assignment filter | PostgREST cannot filter nested joins; transformPlate filters array for returned_at IS NULL | 2026-02-13 | 07-01 |
| Two-step plate swap (close + create) | Partial unique index prevents double-active; if second step fails, plate is safely available | 2026-02-13 | 07-01 |
| Zeroed time components in expiry calculation | calculateTagExpiry sets hours to 0 on both dates to avoid timezone off-by-one | 2026-02-13 | 07-01 |
| Split-view 3/5 + 2/5 for plates dashboard | Plates-out is urgent/actionable (60% width); inventory is reference (40%) | 2026-02-13 | 07-02 |
| Inline plate forms (not modals) | Small forms (4-5 fields); modal overhead unnecessary | 2026-02-13 | 07-02 |
| Accordion single-expand for plate history | Same expandedHistoryId state across both panels; follows BookingDetail pattern | 2026-02-13 | 07-02 |
| CreditCard icon for Plates nav | Distinct from LayoutDashboard, Car, ClipboardCheck, Key icons | 2026-02-13 | 07-02 |
| Abbreviated type badges in inventory | DLR/Tag/PMT instead of full labels to save horizontal space | 2026-02-13 | 07-02 |
| Plate selection inline in vehicle section | Per plan guidance: do NOT change SectionKey type or SECTIONS array | 2026-02-13 | 07-03 |
| Plate required for new bookings only | Plates assigned at creation time; editing should not re-assign | 2026-02-13 | 07-03 |
| Graceful degradation on plate assignment | Booking succeeds even if plate assignment fails; admin warned | 2026-02-13 | 07-03 |
| platesOut prop from parent | Fetched once by Rentals component, avoids duplicate fetches per BookingDetail | 2026-02-13 | 07-03 |
| Plate return default checked | Per CONTEXT.md: admin unchecks only if plate wasn't physically returned | 2026-02-13 | 07-03 |
| Batched not per-plate notification | Admin gets ONE SMS + email summary per cron run, not per-plate spam | 2026-02-13 | 07-04 |
| Severity escalation for overdue rentals | 1-2 days = warning, 3+ days = urgent; short delays are common | 2026-02-13 | 07-04 |
| Inventory assignment excluded from unaccounted | assignment_type='inventory' is intentional; not a missing plate | 2026-02-13 | 07-04 |
| Upsert with ignoreDuplicates for alerts | Existing active alerts preserved; only new conditions create rows | 2026-02-13 | 07-04 |
| pg_cron commented out for plate alerts | Same Phase 4 approach; requires manual config before activation | 2026-02-13 | 07-04 |
| INTEGER for insurance coverage amounts | Whole dollar values; avoids DECIMAL string coercion from Supabase | 2026-02-14 | 08-01 |
| Separate insurance_alerts table | Keeps plate and insurance concerns separate; simpler migration | 2026-02-14 | 08-01 |
| Dedicated update_insurance_updated_at function | Generic may not exist; same pattern as Phase 7 update_plates_updated_at | 2026-02-14 | 08-01 |
| parseFloat for dealer DECIMAL columns only | Coverage INTEGER columns use direct assignment; only dealer rates are DECIMAL | 2026-02-14 | 08-01 |
| Pure validateInsuranceCoverage function | No DB calls enables reuse in service + UI layer without side effects | 2026-02-14 | 08-01 |
| UNIQUE constraint on rental_insurance(booking_id) | Enforces 1:1 at DB level; idempotent DO block guard | 2026-02-14 | 08-01 |
| DetectedInsuranceAlert interface inside handler | Scoped to handler function; not needed externally | 2026-02-14 | 08-03 |
| SMS prefix "Triple J Alert:" (generic) | Covers both plate-only and insurance-only notifications | 2026-02-14 | 08-03 |
| Dual CTA buttons in combined email | Plates Dashboard + Rentals Dashboard when both alert types present | 2026-02-14 | 08-03 |
| Shield icon for insurance section | Universally associated with protection/insurance; distinct from plate icons | 2026-02-14 | 08-03 |

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
- **Booking detail expansion pattern:** BookingDetail component renders inline below row in Active Rentals, not as modal
- **Payment recording inline pattern:** Amount (pre-filled), method toggle buttons, notes input below payment table
- **Late fee override pattern:** Override/Waive/Reset buttons with inline form; null = auto, 0 = waived, >0 = override
- **Customer running total pattern:** Aggregate across all bookings by customer_id; only show when >1 booking
- **Accordion expansion pattern:** expandedBookingId state; clicking another row collapses previous
- **Plate entity model pattern:** First-class plates table independent of vehicles/registrations, linked via plate_assignments
- **Plate assignment history pattern:** Immutable log table with returned_at NULL = active; no DELETE RLS policy
- **Plate status trigger pattern:** SECURITY DEFINER AFTER INSERT/UPDATE trigger auto-syncs plates.status with active assignments
- **Plate service transformer pattern:** transformPlate filters nested plate_assignments array client-side for active assignment
- **Tag expiry calculation pattern:** calculateTagExpiry zeroes time components, returns severity tier (ok/warning/urgent/expired)
- **Two-step swap pattern:** Close active assignment, then create new one; partial unique index prevents double-active
- **Split-view dashboard pattern:** lg:grid-cols-5 with 3/5 urgent panel and 2/5 reference panel; stacks on mobile
- **Plate CRUD inline form pattern:** PlateForm component for both add/edit, rendered inside inventory panel
- **Cross-page nav update pattern:** Add navItem entry + icon import to each admin page's AdminHeader independently
- **Plate selection in booking pattern:** Inline subsection in vehicle section, auto-fetch on vehicle select, auto-select if single plate
- **Plate return confirmation pattern:** Default-checked checkbox in return flow, graceful degradation if plate return fails
- **Plates-out summary tab pattern:** Fourth tab in Rentals page with overdue-first sorting and link to dedicated page
- **Plate alert Edge Function pattern:** Cron-triggered detection of 3 alert types, dedup via plate_alerts upsert, 24h cooldown
- **Alert auto-resolve pattern:** Compare active alerts against detected conditions via Set, resolve cleared ones
- **Batched admin notification pattern:** Collect all alerts, send ONE SMS + ONE email with summary
- **Insurance service transformer pattern:** transformInsurance uses parseFloat for DECIMAL (dealer rates), direct for INTEGER (coverage amounts)
- **Dual verification flags pattern:** InsuranceVerificationFlags with 5 booleans computed by pure function, admin makes final call
- **Customer insurance cache pattern:** last_insurance_company/policy_number/expiry on rental_customers for pre-fill, re-verified per booking
- **Insurance card upload pattern:** insurance-cards bucket, path insurance/{bookingId}/{timestamp}.{ext}, updates card_image_url on success
- **1:1 table relationship pattern:** UNIQUE constraint on FK column (booking_id) via DO block idempotent guard
- **Insurance alert detection pattern:** Cron-triggered detection of 3 insurance alert types, dedup via insurance_alerts upsert, 24h cooldown
- **Combined batched notification pattern:** Single SMS + email covers both plate and insurance alerts; subject/title adapts to which types present
- **Backward-compatible template extension pattern:** Optional parameter added to template functions; undefined/empty produces identical output

### Architecture Summary (Current)

```
lib/store/ Module Structure (~800 lines total):
  index.ts      - Barrel export (8 lines)
  types.ts      - VehicleState, VehicleSetters, RentalState, RentalSetters (32 lines)
  vehicles.ts   - Vehicle CRUD operations (426 lines)
  sheets.ts     - Google Sheets sync (229 lines)
  leads.ts      - Lead management (68 lines)
  rentals.ts    - Rental booking loading (24 lines)

Store.tsx (~295 lines):
  - Thin facade that imports from lib/store/*
  - React state management, Supabase subscriptions
  - Auth integration, useStore() interface extended with bookings + refreshBookings

types.ts Rental Types:
  - ListingType: 'sale_only' | 'rental_only' | 'both'
  - RentalBookingStatus: 'reserved' | 'active' | 'returned' | 'cancelled' | 'overdue'
  - PaymentMethod: 'cash' | 'card' | 'zelle' | 'cashapp'
  - FuelLevel, ConditionRating type aliases
  - RentalCustomer, RentalBooking, RentalPayment, RentalConditionReport interfaces
  - ConditionChecklistItem interface + CONDITION_CHECKLIST_TEMPLATE (27 items)
  - PAYMENT_METHOD_LABELS constant
  - Vehicle interface extended with listingType, dailyRate, weeklyRate, minRentalDays, maxRentalDays

types.ts Registration Types:
  - RegistrationStageKey: 7 values (6 stages + rejected)
  - Registration interface: 32 fields (added mileage, checkerResults, checkerCompletedAt, checkerOverride, checkerOverrideAt)
  - CheckerResult interface: docComplete, vinFormatValid, vinConfirmedOnDocs, mileageConfirmedOnDocs, surrenderedFront, surrenderedBack
  - RegistrationNotification: 16 fields (added 5 extended fields)
  - NotificationPreference type: 'sms' | 'email' | 'both' | 'none'
  - VALID_TRANSITIONS: Forward-only state machine
  - RegistrationAudit interface: Audit trail records
  - REGISTRATION_STAGES: UI configuration for 7 stages

services/registrationService.ts:
  - transformRegistration: Maps 32 DB columns to TS fields
  - parseAccessKey, getRegistrationByAccessKey, getTrackingLink
  - updateRegistrationStatus, updateDocumentChecklist
  - saveCheckerResults, saveCheckerOverride, updateRegistrationMileage
  - getRegistrationAudit, logNotification
  - archiveRegistration/restoreRegistration
  - Query helpers: getRegistrationsByStage, getRejectedRegistrations, etc.

services/rentalService.ts:
  - transformBooking, transformCustomer, transformPayment, transformConditionReport
  - Booking CRUD: getAllBookings, getBookingById, getBookingsForMonth, getActiveBookings,
    createBooking, updateBooking, cancelBooking, returnBooking
  - Customer CRUD: getAllCustomers, getCustomerById, createCustomer, updateCustomer, searchCustomers
  - Payment functions: getPaymentsForBooking, createPayment, deletePayment
  - Condition reports: getConditionReports, createConditionReport
  - Availability: getAvailableVehicles, updateVehicleListingType, updateVehicleRentalRates
  - Pure utilities: calculateLateFee, calculateBookingTotal

utils/vinValidator.ts:
  - validateVinFormat: 17 chars, alphanumeric, no I/O/Q
  - validateVinCheckDigit: ISO 3779 check digit algorithm

services/notificationService.ts:
  - transformNotification, getNotificationHistory, updateNotificationPreference, getNotificationPreference

utils/phone.ts:
  - normalizePhone: E.164 format, formatPhone: display format

components/tracking/:
  index.ts, ProgressArc.tsx, ProgressRoad.tsx, VehicleIcon.tsx, StageInfo.tsx, LoadingCrest.tsx, ErrorState.tsx

components/NotificationPreferences.tsx:
  - Compact + full mode, optimistic updates, feedback toast

pages/CustomerLogin.tsx:
  - Two-step phone OTP flow, normalizePhone, resend cooldown

pages/CustomerDashboard.tsx:
  - Auth session check, RLS-filtered fetch, active/completed sections

components/admin/RegistrationChecker.tsx:
  - 751-line pre-submission checker, 7 sections, VIN + mileage validation

pages/admin/Registrations.tsx:
  - ~1157 lines, 6-stage workflow, step buttons, audit/notification history modals

pages/CustomerStatusTracker.tsx:
  - Token-based status page, progress arc + road, notification preferences

components/admin/RentalCalendar.tsx:
  - 299-line custom monthly calendar grid, status-colored bars, O(1) lookup

pages/admin/Rentals.tsx (UPDATED in 06-06):
  - 1885-line rental management hub with 3 tabs (Calendar/Active/Fleet)
  - BookingDetail inline expansion: payments, late fees, condition reports, return flow
  - Payment recording with Cash/Card/Zelle/CashApp toggle and running balance
  - Late fee auto-calculation with override/waive/reset
  - Customer running total across all bookings
  - All modals wired: RentalBookingModal, RentalAgreementModal, RentalConditionReport
  - Calendar booking click -> Active Rentals detail expansion
  - Overdue badge with red pulse animation in stats bar

components/admin/RentalBookingModal.tsx:
  - 1120-line booking modal: customer search, vehicle availability, agreement terms, review
  - 4-section tabbed navigation, double-booking error handling

components/admin/RentalConditionReport.tsx:
  - 683-line condition report: 27-item checklist, photo upload, read-only view mode

components/admin/SignatureCapture.tsx:
  - Reusable digital signature pad, responsive canvas, base64 PNG output

components/admin/RentalAgreementModal.tsx:
  - 697-line agreement modal: two-panel layout, signature capture, live PDF preview

services/pdfService.ts:
  - generateRentalAgreementPDF: multi-page branded agreement with 14 legal clauses
  - RentalAgreementData interface, formatCurrencyNum, drawPageFooter

pages/admin/Plates.tsx (NEW in 07-02):
  - 1099-line plate management page with split-view dashboard
  - Left panel (3/5): plates currently out, overdue-first sorting, mark-returned action
  - Right panel (2/5): full inventory with type/status filters, CRUD forms
  - Stats bar: total, out now, available, active alerts, expiring soon
  - Buyer's tag 4-tier severity countdown (ok/warning/urgent/expired)
  - AdminHeader with 5 navItems including Plates

components/admin/PlateAssignmentHistory.tsx (NEW in 07-02):
  - 202-line vertical timeline component for plate assignment history
  - Fetches getPlateHistory on expand, assignment type badges, return status

App.tsx:
  - /admin/plates -> AdminPlates (lazy loaded, ProtectedRoute)
  - /admin/rentals -> AdminRentals (lazy loaded, ProtectedRoute)
  - /customer/login -> CustomerLogin, /customer/dashboard -> CustomerDashboard
  - Navbar: Rentals link with Key icon

types.ts Plate Tracking Types (Phase 07):
  - PlateType: 'dealer' | 'buyer_tag' | 'permanent'
  - PlateStatus: 'available' | 'assigned' | 'expired' | 'lost'
  - PlateAssignmentType: 'rental' | 'sale' | 'inventory'
  - PlateAlertType, PlateAlertSeverity type aliases
  - Plate, PlateAssignment, PlateAlert interfaces
  - PLATE_TYPE_LABELS, PLATE_STATUS_LABELS constants

types.ts Rental Insurance Types (Phase 08):
  - InsuranceType: 'customer_provided' | 'dealer_coverage'
  - InsuranceVerificationStatus: 'pending' | 'verified' | 'failed' | 'overridden'
  - InsuranceAlertType, InsuranceAlertSeverity type aliases
  - RentalInsurance interface (22 fields)
  - InsuranceVerificationFlags interface (5 boolean flags)
  - InsuranceAlert interface (9 fields)
  - TEXAS_MINIMUM_COVERAGE constant (30000/60000/25000)
  - TEXAS_MINIMUM_LABEL, INSURANCE_STATUS_LABELS constants
  - RentalBooking.insurance optional field

services/plateService.ts (679 lines):
  - transformPlate, transformAssignment, transformAlert, transformVehicleMinimal
  - CRUD: getAllPlates, getPlateById, createPlate, updatePlate, deletePlate
  - Queries: getPlatesOut, getAvailableDealerPlates
  - Assignments: assignPlateToBooking, assignPlateToSale, returnPlateAssignment, swapPlateAssignment
  - History: getPlateHistory
  - Alerts: getActiveAlerts, resolveAlert
  - Photo: uploadPlatePhoto
  - Pure: calculateTagExpiry

pages/admin/Rentals.tsx (UPDATED in 07-03):
  - Extended with Plates summary tab (4 tabs: Calendar/Active/Fleet/Plates)
  - BookingDetail plate return confirmation checkbox
  - platesOut state management in parent component

components/admin/RentalBookingModal.tsx (UPDATED in 07-03):
  - Plate selection grid in vehicle section
  - Auto-fetch available plates on vehicle select
  - assignPlateToBooking call with graceful degradation

services/insuranceService.ts (13 functions):
  - transformInsurance, transformInsuranceAlert
  - CRUD: getInsuranceForBooking, createInsurance, updateInsurance
  - Verification: verifyInsurance, failInsurance, overrideInsurance
  - Upload: uploadInsuranceCard (insurance-cards bucket)
  - Pure: validateInsuranceCoverage (Texas 30/60/25, zeroed-time dates)
  - Alerts: getActiveInsuranceAlerts
  - Customer cache: updateCustomerInsuranceCache, getCustomerLastInsurance

supabase/migrations/:
  02_registration_schema_update.sql (483 lines)
  03_customer_portal_access.sql (110 lines)
  04_notification_system.sql (244 lines)
  05_registration_checker.sql - 5 columns + invalidation trigger
  06_rental_schema.sql (568 lines) - btree_gist, 4 tables, EXCLUDE constraint, RLS
  07_plate_tracking.sql (442 lines) - 3 tables, partial unique indexes, status trigger, RLS, pg_cron
  08_rental_insurance.sql (323 lines) - 2 tables, UNIQUE constraint, partial unique index, RLS, customer pre-fill columns

supabase/functions/:
  _shared/ (twilio.ts, resend.ts, email-templates/)
  _shared/email-templates/plate-alert.tsx (471 lines) - batched plate + insurance alert email/SMS templates
  process-notification-queue/index.ts
  check-plate-alerts/index.ts (768 lines) - cron-triggered plate + insurance alert detection + combined notification
  unsubscribe/index.ts
```

### Known Issues

| Issue | Impact | Phase to Address |
|-------|--------|------------------|
| pages/RegistrationTracker.tsx type errors | Uses old stage values | Phase 3 Plan 03 (will be replaced by CustomerStatusTracker) |
| RLS silent failures | Data loss without warning | Ongoing monitoring |
| No Spireon API access | Can't build GPS feature | Phase 9 blocked |
| TypeScript strict mode | ErrorBoundary class issues | Low priority (build works) |
| Migrations 03-08 not applied | Token + notification + phone auth + checker + rental + plate + insurance features won't work until applied | Deploy to Supabase |

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
- [ ] Deploy Edge Functions: `supabase functions deploy process-notification-queue`, `supabase functions deploy unsubscribe`, and `supabase functions deploy check-plate-alerts`
- [ ] Add Edge Function secrets for check-plate-alerts: ADMIN_PHONE, ADMIN_EMAIL
- [ ] Uncomment and run pg_cron schedule for check-plate-alerts in Supabase SQL editor
- [ ] Deploy to Vercel (connect GitHub repo, set root dir to triple-j-auto-investment-main)
- [ ] Create Supabase Storage bucket 'rental-agreements' for agreement PDF uploads
- [ ] Create Supabase Storage bucket 'rental-photos' for condition report photos
- [ ] Check Supabase plan limits for document storage
- [ ] Apply migration 07_plate_tracking.sql to Supabase
- [ ] Create Supabase Storage bucket 'plate-photos' for plate photo uploads
- [ ] Apply migration 08_rental_insurance.sql to Supabase
- [ ] Create Supabase Storage bucket 'insurance-cards' for insurance card image uploads

---

## Session Continuity

### What Was Accomplished This Session
- Phase 8 (Rental Insurance Verification) -- Plans 01 and 03 complete
- Executed 08-01: Database, Types & Service Layer
- Executed 08-03: Edge Function Extension
- Extended check-plate-alerts/index.ts (490 -> 768 lines) with insurance detection: 3 alert types, dedup upsert, auto-resolve, 24h cooldown
- Extended plate-alert.tsx (297 -> 471 lines) with InsuranceAlertItem, insurance email sections, combined SMS counts
- Combined plate + insurance in single batched notification (1 SMS + 1 email)

### Phase 8 Status (IN PROGRESS)
| Plan | Focus | Commits | Status |
|------|-------|---------|--------|
| 08-01 | Database, Types & Service Layer | b6350e5, 2f3edba | COMPLETE |
| 08-02 | Insurance Verification UI | -- | NOT STARTED |
| 08-03 | Edge Function Extension | 32f3a80, 17d98b3 | COMPLETE |

### Phase 3 Deferred Items (Still Pending)
- [ ] Apply migration 03_customer_portal_access.sql to Supabase
- [ ] Run Plan 03-03 human verification checkpoint (Task 3)
- [ ] Write 03-03-SUMMARY.md after verification passes

### What Comes Next
1. Phase 8 Plan 02: Insurance Verification UI (InsuranceVerification.tsx, booking modal integration, badges)
2. Circle back to Phase 3 verification when DB migration is applied
3. Wire up all credentials after feature code is complete
4. Phase 9 blocked (Spireon API access needed)

### If Context Is Lost
Read these files in order:
1. `.planning/STATE.md` (this file) - current position
2. `.planning/ROADMAP.md` - phase structure and success criteria
3. `.planning/phases/08-rental-insurance-verification/08-03-SUMMARY.md` - latest plan summary
4. `.planning/REQUIREMENTS.md` - requirement traceability
5. Original code from: https://github.com/whoisjaso/triple-j-auto-investment

---

*State updated: 2026-02-14 (Phase 8 Plan 03 complete)*
