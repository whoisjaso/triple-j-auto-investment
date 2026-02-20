---
phase: 16-behavioral-intelligence
verified: 2026-02-20T12:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/4
  gaps_closed:
    - "Urgency badges appear only when backed by real inventory data"
    - "Session behavior is tracked and visible to the admin"
  gaps_remaining: []
  regressions: []
---

# Phase 16: Behavioral Intelligence Verification Report

**Phase Goal:** The platform knows what visitors are doing, recommends the right vehicles, shows honest urgency signals, and tracks where conversions come from
**Verified:** 2026-02-20
**Status:** passed
**Re-verification:** Yes -- after gap closure plan 16-06
## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Session behavior tracked in DB and visible to admin | VERIFIED | trackingService.ts buffers events and flushes to session_events. useSessionTracking tracks page_view on route changes (App.tsx:571). VehicleDetail tracks vehicle_view (line 179), dwell (lines 186-198), form_open (lines 204-214, wrappers on lines 607/636/649), calculator_use (lines 545-552). AdminBehaviorPanel.tsx (309 lines) wired in Dashboard.tsx (line 526). |
| 2 | Returning visitors see recently viewed vehicles | VERIFIED | useRecentlyViewed.ts (63 lines) with localStorage persistence, cross-tab sync, max 8 entries. RecentlyViewedRow.tsx (93 lines) renders horizontal scroll with bilingual labels and sold handling. Wired in Inventory.tsx (line 702) and VehicleDetail.tsx (line 84, addViewed on line 176). |
| 3 | Urgency badges backed by real data | VERIFIED | urgencyService.ts computes badges from dateAdded, view counts, and offer data -- no hardcoded badges. useUrgencyBadges.ts queries vehicle_view_counts and leads tables with 5-min refresh. Inventory.tsx VehicleCard calls const badges = getBadges(vehicle) (line 70) then renders UrgencyBadge (line 106). VehicleDetail.tsx Section 4 (lines 514-525) computes badges via IIFE and renders UrgencyBadge alongside VehicleVerifiedBadge. |
| 4 | Lead capture records attribution source | VERIFIED | attributionService.ts (85 lines) captures UTM, session_id, page_path, referrer, device_type. captureInitialUtm called in App.tsx (line 575). vehicleLeadService.ts calls captureAttribution on every lead (line 40). leads.ts addLead auto-fills attribution if missing (lines 48-61). leads.ts inserts all 7 attribution columns (lines 78-84). loadLeads maps all 7 attribution fields back (lines 29-35). |

**Score:** 4/4 truths verified
### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| supabase/phase-16-migration.sql | DB schema | VERIFIED | Exists. session_events, vehicle_view_counts, attribution columns, RLS, indexes, pg_cron. |
| services/trackingService.ts | Event buffering + flush | VERIFIED | 157 lines. getSessionId, trackEvent, flush, flushOnUnload. Substantive with retry logic. |
| hooks/useSessionTracking.ts | Page view tracking | VERIFIED | 40 lines. Tracks page_view on pathname change. Wired in App.tsx line 571. |
| services/attributionService.ts | UTM + attribution capture | VERIFIED | 85 lines. captureInitialUtm and captureAttribution. Wired in App.tsx, vehicleLeadService, leads.ts. |
| hooks/useRecentlyViewed.ts | Recently viewed hook | VERIFIED | 63 lines. localStorage, cross-tab sync, max 8. Used in VehicleDetail and Inventory. |
| components/RecentlyViewedRow.tsx | Recently viewed UI | VERIFIED | 93 lines. Horizontal scroll, sold overlay, bilingual heading. Used in Inventory line 703. |
| services/recommendationService.ts | Similarity scoring | VERIFIED | 82 lines. scoreSimilarity + getRecommendations. Used in VehicleDetail line 222. |
| services/urgencyService.ts | Badge computation | VERIFIED | 67 lines. computeBadges with data-driven thresholds. No hardcoded badges. |
| hooks/useUrgencyBadges.ts | Badge data fetch | VERIFIED | 97 lines. Parallel Supabase queries, 5-min refresh. Used in Inventory line 242 and VehicleDetail line 85. |
| components/UrgencyBadge.tsx | Badge rendering | VERIFIED | 39 lines. Color-coded by type, bilingual, returns null on empty. |
| components/admin/AdminBehaviorPanel.tsx | Admin dashboard | VERIFIED | 309 lines. Three sections. Wired in Dashboard.tsx line 526. |
| services/vehicleLeadService.ts | Lead creation with attribution | VERIFIED | 86 lines. Calls captureAttribution on every lead. |
| lib/store/leads.ts | Lead persistence with attribution | VERIFIED | 113 lines. Inserts and loads all 7 attribution columns. |
### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| trackingService.ts | session_events | supabase.from insert | WIRED | Line 93 |
| useSessionTracking | trackingService | import trackEvent | WIRED | Line 9 |
| App.tsx | useSessionTracking | useSessionTracking() | WIRED | Line 571 |
| App.tsx | captureInitialUtm | useEffect call | WIRED | Lines 574-576 |
| vehicleLeadService | attributionService | import captureAttribution | WIRED | Line 2, called line 40 |
| leads.ts addLead | attributionService | dynamic import | WIRED | Lines 48-61 auto-fill fallback |
| leads.ts addLead | Supabase leads | 7 attribution columns | WIRED | Lines 78-84 |
| leads.ts loadLeads | Lead attribution fields | snake to camelCase | WIRED | Lines 29-35 |
| VehicleDetail | useRecentlyViewed | addViewed(vehicle.id) | WIRED | Line 176 |
| VehicleDetail | trackEvent | vehicle_view | WIRED | Lines 179-183 |
| VehicleDetail | dwell tracking | useEffect cleanup | WIRED | Lines 188-198 |
| VehicleDetail | getRecommendations | useMemo | WIRED | Lines 217-223 |
| Inventory | RecentlyViewedRow | vehicleIds prop | WIRED | Line 703 |
| Inventory | useUrgencyBadges | getBadges to VehicleCard | WIRED | Lines 242, 809 |
| VehicleCard | getBadges(vehicle) | const badges declaration | WIRED | Line 70 -- GAP FIXED |
| VehicleCard | UrgencyBadge | badges.length check | WIRED | Lines 105-107 -- previously crashed |
| VehicleDetail | useUrgencyBadges | getBadges in Section 4 | WIRED | Lines 85, 515 -- GAP FIXED |
| VehicleDetail | UrgencyBadge | render in Section 4 | WIRED | Line 521 -- GAP FIXED |
| VehicleDetail | form_open | onClickCapture wrappers | WIRED | Lines 607, 636, 649 -- GAP FIXED |
| VehicleDetail | calculator_use | onFirstInteraction prop | WIRED | Lines 545-552 -- GAP FIXED |
| Dashboard | AdminBehaviorPanel | collapsible section | WIRED | Line 526 |
### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| INTEL-01: Session behavior tracking | SATISFIED | trackingService + useSessionTracking + vehicle_view + dwell + form_open + calculator_use |
| INTEL-02: Smart vehicle recommendations | SATISFIED | recommendationService + VehicleDetail You Might Also Like section |
| INTEL-03: Urgency calibration (real data only) | SATISFIED | urgencyService computes from dateAdded/views/offers. No hardcoded badges. |
| INTEL-04: Conversion attribution | SATISFIED | attributionService + leads.ts 7-column attribution on every lead |
| INTEL-05: Customer profile adaptive experience | SATISFIED | useRecentlyViewed + RecentlyViewedRow + recommendations based on browsing patterns |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -- | -- | -- | All previous blockers resolved |

### Human Verification Required

#### 1. Session Event Persistence
**Test:** Open site, browse 3-4 vehicles, wait 30s, check Supabase session_events table.
**Expected:** page_view, vehicle_view, and dwell events present with correct session_id.
**Why human:** Requires live Supabase connection.

#### 2. Recently Viewed Accuracy
**Test:** View 3 vehicles, close browser, reopen, go to inventory page.
**Expected:** You Recently Viewed section shows the 3 vehicles in reverse chronological order.
**Why human:** Requires localStorage persistence across browser sessions.

#### 3. Urgency Badges Render Correctly
**Test:** Add a vehicle with dateAdded within last 7 days, visit inventory and vehicle detail pages.
**Expected:** Just Arrived badge appears on both pages. No crashes, no empty badges.
**Why human:** Requires real vehicle data with recent dateAdded.

#### 4. Admin Panel Data Display
**Test:** Login as admin, expand Behavior Intelligence section on Dashboard.
**Expected:** Top Viewed, Recent Sessions, Attribution Breakdown sections render with data.
**Why human:** Requires admin auth and populated session_events data.

#### 5. Attribution on Leads
**Test:** Navigate with UTM params (e.g. ?utm_source=google&utm_medium=cpc), submit a lead form, check leads table.
**Expected:** Lead row has all 7 attribution fields populated (session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type).
**Why human:** Requires live Supabase and form submission.

#### 6. Form Open + Calculator Use Events
**Test:** On a vehicle detail page, click on a Level 1 form, then click on the Payment Calculator.
**Expected:** session_events shows one form_open event (form_type: level_1) and one calculator_use event. Clicking the same form again does NOT create duplicate events.
**Why human:** Requires checking session_events table in Supabase.
### Gap Closure Summary

Both gaps from the initial verification have been resolved by plan 16-06:

**Gap 1 (was BLOCKER): Inventory urgency badges crash at runtime** -- FIXED. const badges = getBadges(vehicle) is now declared on line 70 of Inventory.tsx VehicleCard, before badges.length > 0 is referenced on line 105. VehicleDetail.tsx Section 4 (lines 514-525) now imports useUrgencyBadges, calls getBadges(vehicle), and renders UrgencyBadge alongside VehicleVerifiedBadge.

**Gap 2 (was WARNING): form_open and calculator_use tracking not wired** -- FIXED. VehicleDetail.tsx now has a fire-once trackFormOpen callback (lines 204-214) using a useRef Set. Three onClickCapture wrappers track form_open for Level 1 (line 607), Level 2 (line 636), and Level 3 (line 649) engagement forms. PaymentCalculator receives onFirstInteraction (line 545) which fires a calculator_use event.

**No regressions detected.** All previously-passing truths (recently viewed, attribution) remain fully wired and substantive.

---

_Verified: 2026-02-20_
_Verifier: Claude (gsd-verifier)_