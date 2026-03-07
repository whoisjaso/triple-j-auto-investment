---
phase: 04-customer-portal-notifications-login
plan: 04
subsystem: frontend
tags: [phone-otp, customer-login, customer-dashboard, notification-preferences, supabase-auth, react-router]
dependency-graph:
  requires:
    - phase: 04-03
      provides: NotificationPreference type, notificationService.ts, phone.ts utility
    - phase: 04-01
      provides: notification_pref column, phone-auth RLS policy
    - phase: 03-02
      provides: tracking components (ProgressArc, ProgressRoad, StageInfo)
  provides:
    - CustomerLogin page with phone OTP flow
    - CustomerDashboard page with auth-filtered registration list
    - NotificationPreferences reusable component (compact + full modes)
    - Customer routes /customer/login and /customer/dashboard
    - Login link on tracker page for returning customers
  affects: [05-registration-checker]
tech-stack:
  added: []
  patterns: [phone OTP login flow, customer auth session check, compact/full preference toggle, HashRouter-compatible Link navigation]
key-files:
  created:
    - triple-j-auto-investment-main/pages/CustomerLogin.tsx
    - triple-j-auto-investment-main/pages/CustomerDashboard.tsx
    - triple-j-auto-investment-main/components/NotificationPreferences.tsx
  modified:
    - triple-j-auto-investment-main/pages/CustomerStatusTracker.tsx
    - triple-j-auto-investment-main/App.tsx
key-decisions:
  - "Use Link component (not raw <a>) for /customer/login in tracker page - HashRouter requires React Router navigation"
  - "Inline snake_case to camelCase mapping in CustomerDashboard rather than importing unexported transformRegistration"
  - "Session check in CustomerDashboard with redirect to /customer/login, not admin /login"
patterns-established:
  - "Phone OTP login pattern: two-step state machine (phone -> verify) with resend cooldown"
  - "Customer auth guard pattern: useEffect session check + redirect, onAuthStateChange listener"
  - "Compact/full component mode pattern: single component with compact prop for different contexts"
  - "Optimistic preference update pattern: local state change, service call, revert on failure"
metrics:
  duration: ~7min
  completed: 2026-02-10
---

# Phase 4 Plan 04: Customer Login, Dashboard & Notification Preferences Summary

**Phone OTP login via Supabase auth, multi-registration dashboard with RLS-filtered data, and reusable notification preference toggle in compact/full modes.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-11T00:25:37Z
- **Completed:** 2026-02-11T00:32:26Z
- **Tasks:** 3 auto + 1 checkpoint (pending human verification)
- **Files modified:** 5

## Accomplishments
- CustomerLogin page with two-step phone OTP flow (send code, verify) using Supabase signInWithOtp/verifyOtp
- CustomerDashboard showing active registrations prominently, completed in collapsible section, with auth session guard
- NotificationPreferences component supporting compact (gear icon dropdown) and full (toggle button row) modes
- CustomerStatusTracker updated with notification preference toggle and login link for returning customers
- Routes /customer/login and /customer/dashboard registered in App.tsx without conflicting with admin /login

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CustomerLogin page and NotificationPreferences component** - `a82454b` (feat)
2. **Task 2: Create CustomerDashboard page** - `f790807` (feat)
3. **Task 3: Update CustomerStatusTracker and App.tsx routes** - `d5bb223` (feat)

**Plan metadata:** Pending (created with summary)

## Files Created/Modified
- `pages/CustomerLogin.tsx` - Phone OTP login with two-step flow, tracking link input bridge
- `pages/CustomerDashboard.tsx` - Auth-guarded dashboard with active/completed registration sections
- `components/NotificationPreferences.tsx` - Reusable preference toggle (SMS/Email/Both/None) in compact and full modes
- `pages/CustomerStatusTracker.tsx` - Added NotificationPreferences and login link for returning customers
- `App.tsx` - Added /customer/login and /customer/dashboard routes (lazy loaded)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use React Router Link (not raw `<a>`) for customer login link in tracker | App uses HashRouter; raw `<a>` wouldn't work correctly for client-side routing |
| Inline snake_case to camelCase mapping in CustomerDashboard | transformRegistration is not exported from registrationService; mapping only the needed display fields is simpler |
| Session check redirects to /customer/login | Customer auth flow is separate from admin /login; prevents confusion between the two auth paths |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used Link component instead of raw anchor tag for HashRouter compatibility**
- **Found during:** Task 3 (CustomerStatusTracker login link)
- **Issue:** Plan specified `<a href="/customer/login">` but the app uses HashRouter, so raw anchors don't route correctly
- **Fix:** Used React Router `<Link to="/customer/login">` component instead
- **Files modified:** pages/CustomerStatusTracker.tsx
- **Verification:** Build passes, Link component works with HashRouter
- **Committed in:** d5bb223 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correct routing in HashRouter app. No scope creep.

## Issues Encountered
None

## User Setup Required
None for code verification. Full end-to-end testing requires:
- Supabase phone auth enabled with Twilio provider
- Migration 04 applied to Supabase
- See STATE.md TODOs for complete deployment checklist

## Next Phase Readiness
Phase 4 is now complete (all 4 plans executed). Ready for:
1. Human verification checkpoint (Task 4) - visual/functional review
2. Phase 5: Registration Checker
3. Deferred: Phase 3 Plan 03 verification when DB migration is applied

---
*Phase: 04-customer-portal-notifications-login*
*Completed: 2026-02-10*
