---
phase: 16-behavioral-intelligence
plan: 02
subsystem: analytics
tags: [attribution, utm, leads, session-tracking, conversion-tracking]
completed: 2026-02-19
duration: ~6min

dependency-graph:
  requires: [15-01]
  provides: [attribution-service, lead-attribution-pipeline]
  affects: [16-03, 16-04, 16-05]

tech-stack:
  added: []
  patterns: [dynamic-import-for-lazy-loading, sessionStorage-utm-persistence, auto-fill-pattern]

key-files:
  created:
    - triple-j-auto-investment-main/services/attributionService.ts
  modified:
    - triple-j-auto-investment-main/types.ts
    - triple-j-auto-investment-main/services/vehicleLeadService.ts
    - triple-j-auto-investment-main/lib/store/leads.ts

decisions:
  - id: 16-02-01
    decision: "Auto-fill attribution in addLead via dynamic import if caller doesn't provide sessionId"
    rationale: "Contact.tsx and Finance.tsx construct Lead objects manually and bypass createVehicleLead, so addLead auto-fills to cover all paths"
  - id: 16-02-02
    decision: "sessionStorage for UTM persistence (not localStorage)"
    rationale: "UTM params are campaign-specific and should not persist across sessions"
  - id: 16-02-03
    decision: "getDeviceType in attributionService (not shared from trackingService)"
    rationale: "Tiny utility function; duplicating avoids cross-service dependency"

metrics:
  tasks-completed: 2
  tasks-total: 2
  commits: 2
---

# Phase 16 Plan 02: Conversion Attribution Summary

**One-liner:** UTM capture + device/session/referrer attribution auto-injected into every lead via addLead auto-fill pattern

## What Was Done

### Task 1: Attribution service (7b55e65)

Created `attributionService.ts` with three functions:
- **captureInitialUtm():** Reads `utm_source`, `utm_medium`, `utm_campaign` from `window.location.search` and persists to `sessionStorage` under key `tj_utm`. Called once on app initialization.
- **getDeviceType():** Returns `'mobile'` | `'tablet'` | `'desktop'` based on `window.innerWidth` thresholds (768, 1024).
- **captureAttribution():** Assembles a full Attribution object with session_id (from localStorage `tj_session_id`), page_path, referrer, UTM params (from sessionStorage), and device_type.

Added to `types.ts`:
- `Attribution` interface (session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type)
- 7 optional attribution fields on `Lead` interface (sessionId, pagePath, referrer, utmSource, utmMedium, utmCampaign, deviceType)

### Task 2: Wire attribution into lead creation pipeline (d35cd25)

Updated `vehicleLeadService.ts`:
- Imported `captureAttribution` and mapped all 7 fields onto the returned Lead object in `createVehicleLead()`.

Updated `lib/store/leads.ts`:
- **addLead auto-fill:** If `lead.sessionId` is missing, dynamically imports `captureAttribution` and fills all 7 attribution fields. This covers Contact.tsx and Finance.tsx which construct Lead objects directly without using `createVehicleLead`.
- **Insert block:** Added 7 snake_case attribution columns to the Supabase insert (session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type).
- **loadLeads transform:** Added 7 snake_case-to-camelCase mappings for attribution columns.

## Key Design Decision

Attribution is injected at two layers for complete coverage:
1. **createVehicleLead** (used by PhoneCaptureForm, ScheduleVisitForm, AskQuestionForm, ReserveVehicleSection) -- attribution added at object creation time
2. **addLead auto-fill** (used by Contact.tsx, Finance.tsx, and any future direct callers) -- attribution added just before Supabase insert if not already present

Result: **Zero changes to any form component.** All 6+ lead creation paths automatically include attribution data.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. attributionService.ts exports captureInitialUtm and captureAttribution -- PASS
2. captureInitialUtm reads UTM params from URL and saves to sessionStorage -- PASS
3. captureAttribution assembles session_id, page_path, referrer, utm_*, device_type -- PASS
4. vehicleLeadService.ts createVehicleLead includes attribution fields -- PASS
5. leads.ts addLead inserts 7 attribution columns and auto-fills if missing -- PASS
6. leads.ts loadLeads maps attribution columns from snake_case to camelCase -- PASS
7. Lead interface in types.ts has 7 optional attribution fields -- PASS
8. npx tsc --noEmit passes (no new errors) -- PASS

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 7b55e65 | feat | Attribution service and types |
| d35cd25 | feat | Wire attribution into lead creation pipeline |

## Next Phase Readiness

- Attribution service is ready for Plan 03+ to use session_id for correlating tracking events with leads
- captureInitialUtm() needs to be called in App.tsx or StoreProvider on app initialization (Plan 03 or later can wire this)
- Database columns for attribution must exist on the leads table before deployment (handled by Plan 01 DB migration)
