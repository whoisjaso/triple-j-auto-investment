---
phase: 18-behavioral-follow-up
plan: 02
subsystem: frontend
tags: [lead-capture, language-detection, consent, admin-panel, return-visitor, supabase, translations]

# Dependency graph
requires:
  - phase: 18-behavioral-follow-up
    plan: 01
    provides: follow_up_queue table, preferred_language column on leads, process-follow-up-queue Edge Function
  - phase: 16-intelligence
    provides: useRecentlyViewed hook, addLead with attribution auto-fill, addViewed tracking
  - phase: 15-engagement-spectrum
    provides: createVehicleLead, vehicleLeadService.ts, lead form paths (Contact, Finance, engagement forms)
  - phase: 13-identity-first-experience
    provides: LanguageContext (tj_lang localStorage key for en/es persistence)
provides:
  - preferredLanguage field on Lead interface (types.ts)
  - preferred_language written to Supabase on every lead submission path
  - Consent text on Contact and Finance forms (legal compliance)
  - AdminFollowUpPanel showing follow_up_queue stats + recent items
  - VehicleDetail "Welcome back" badge for returning visitors (FOLLOW-05)
  - followUp translation block in both en and es
affects:
  - 18-01 (follow-up queue now receives preferred_language from lead submissions)
  - Admin Dashboard (Follow-Up Queue section now visible)
  - VehicleDetail (welcome badge for return visitors)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - prevViewedIdsRef pattern: capture localStorage state at mount before addViewed mutates it for returning visitor detection
    - Parallel count queries: Promise.all([count(queued), count(sent), count(cancelled), count(errored)]) for queue stats
    - Collapsible admin panel: same showState + ChevronDown/Right toggle as AdminBehaviorPanel (default collapsed)

key-files:
  created:
    - triple-j-auto-investment-main/components/admin/AdminFollowUpPanel.tsx
  modified:
    - triple-j-auto-investment-main/types.ts
    - triple-j-auto-investment-main/lib/store/leads.ts
    - triple-j-auto-investment-main/services/vehicleLeadService.ts
    - triple-j-auto-investment-main/pages/Contact.tsx
    - triple-j-auto-investment-main/pages/Finance.tsx
    - triple-j-auto-investment-main/utils/translations.ts
    - triple-j-auto-investment-main/pages/admin/Dashboard.tsx
    - triple-j-auto-investment-main/pages/VehicleDetail.tsx

key-decisions:
  - "localStorage key for language is tj_lang (set by LanguageContext.tsx) -- read directly, no circular import"
  - "prevViewedIdsRef captures recentIds at mount before addViewed runs -- detects returning visitor without extra state"
  - "Admin panel uses English strings directly (admin is always English per project convention)"
  - "Welcome badge uses t.followUp.welcomeBack for bilingual support (customer-facing text)"
  - "AdminFollowUpPanel fetches once on mount (no auto-refresh per Phase 16 decision for admin panels)"
  - "Consent text uses text-gray-500 per 11-05 decision (placeholders are hints, not content)"

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 18 Plan 02: Behavioral Follow-Up Frontend Summary

**Frontend wiring for behavioral follow-up: preferred_language on all lead paths, bilingual consent text on forms, AdminFollowUpPanel showing queue stats, and FOLLOW-05 return visitor "Welcome back" badge on VehicleDetail**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T02:07:15Z
- **Completed:** 2026-02-22T02:13:05Z
- **Tasks:** 2
- **Files modified:** 8 (7 modified + 1 created)

## Accomplishments

- Extended Lead interface with `preferredLanguage?: string` (Phase 18 section in types.ts)
- Wired `preferred_language` auto-fill in `addLead` via `localStorage.getItem('tj_lang') || 'en'` -- runs after attribution auto-fill block, no circular import needed
- Added `preferred_language: lead.preferredLanguage || 'en'` to Supabase insert in addLead and mapped `preferred_language -> preferredLanguage` in loadLeads transform
- Added `preferredLanguage: localStorage.getItem('tj_lang') || 'en'` to `createVehicleLead` in vehicleLeadService.ts -- covers all vehicle engagement form paths (PhoneCaptureForm, ScheduleVisitForm, AskQuestionForm, ReserveVehicleSection)
- Added `followUp` translation block to both `en` and `es` with: consent text, welcomeBack, queueTitle, queued/sent/cancelled/errored labels, sendsIn/sentAt/noItems strings
- Added `{t.followUp.consent}` small-print paragraph below submit button on Contact.tsx and Finance.tsx
- Created AdminFollowUpPanel.tsx (209 lines): 4 parallel Supabase count queries for stats row, 20-item recent queue list with trigger type badge (browse=blue, save=amber, abandon=red, voice=purple), channel icon, vehicle name resolution, lead info, and status computation (queued sends-in/sent-at/cancelled/errored)
- Added "Follow-Up Queue" collapsible section to Dashboard.tsx below Behavior Intelligence using identical collapse pattern (default collapsed, ChevronDown/Right toggle)
- Added FOLLOW-05 return visitor "Welcome back" badge to VehicleDetail.tsx Section 3 using `prevViewedIdsRef` pattern to capture pre-mount IDs before `addViewed` runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Preferred language capture + consent text on lead forms** - `1332f80` (feat)
2. **Task 2: Admin follow-up panel + FOLLOW-05 return visitor badge** - `7a76f65` (feat)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `triple-j-auto-investment-main/types.ts` - Added `preferredLanguage?: string` to Lead interface under Phase 18 section
- `triple-j-auto-investment-main/lib/store/leads.ts` - Auto-fill preferredLanguage in addLead, insert preferred_language to DB, map in loadLeads transform
- `triple-j-auto-investment-main/services/vehicleLeadService.ts` - Added preferredLanguage to createVehicleLead return object
- `triple-j-auto-investment-main/pages/Contact.tsx` - Added consent small-print below submit button
- `triple-j-auto-investment-main/pages/Finance.tsx` - Added consent small-print below submit button
- `triple-j-auto-investment-main/utils/translations.ts` - Added followUp block to en and es (10 keys each)
- `triple-j-auto-investment-main/components/admin/AdminFollowUpPanel.tsx` - NEW: queue stats + recent items admin panel
- `triple-j-auto-investment-main/pages/admin/Dashboard.tsx` - Added AdminFollowUpPanel import, showFollowUp state, collapsible Follow-Up Queue section
- `triple-j-auto-investment-main/pages/VehicleDetail.tsx` - Added RotateCcw import, prevViewedIdsRef, welcome back badge in Section 3

## Decisions Made

- localStorage key `tj_lang` used (set by LanguageContext.tsx) -- read directly in addLead and createVehicleLead to avoid circular dependency with LanguageContext
- `prevViewedIdsRef` pattern captures `recentIds` from useRecentlyViewed at component mount time (before `addViewed` mutates the list) for accurate returning visitor detection
- Admin panel fetches once on mount with no auto-refresh (consistent with Phase 16 decision for AdminBehaviorPanel)
- Consent text styled `text-gray-500` per 11-05 decision (placeholders are hints, not primary content)
- Welcome badge uses bilingual `t.followUp.welcomeBack` (customer-facing) while admin panel strings are English-only (admin is always English per convention)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None. All pre-existing TypeScript errors (SEO.tsx hreflang, framer-motion Variants type, Deno references in Edge Functions) were present before this plan and not caused by these changes.

## Self-Check: PASSED

All 9 modified/created files verified present. Both task commits (1332f80, 7a76f65) verified. Key content checks:
- preferredLanguage in types.ts: PASS
- tj_lang key in leads.ts: PASS
- preferred_language DB insert in leads.ts: PASS
- followUp translation block in translations.ts: PASS
- consent text in Contact.tsx: PASS
- consent text in Finance.tsx: PASS
- AdminFollowUpPanel imported in Dashboard.tsx: PASS
- follow_up_queue query in AdminFollowUpPanel.tsx: PASS
- welcomeBack badge in VehicleDetail.tsx: PASS

## Requirements Completed

- FOLLOW-05: Return visitor recognition via "Welcome back" badge on VehicleDetail when previously viewed vehicle is revisited

---
*Phase: 18-behavioral-follow-up*
*Completed: 2026-02-22*
