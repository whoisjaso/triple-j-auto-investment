---
phase: 08-rental-insurance-verification
plan: 03
subsystem: rental-insurance-alerts
tags: [supabase, edge-function, deno, insurance, alerts, notifications, email, sms, cron]
depends_on:
  requires: [08-01, 07-04]
  provides: [insurance alert detection in check-plate-alerts, combined plate+insurance notification]
  affects: []
tech-stack:
  added: []
  patterns: [insurance-alert-detection, combined-batched-notification, insurance-auto-resolve, insurance-24h-cooldown]
key-files:
  created: []
  modified:
    - triple-j-auto-investment-main/supabase/functions/check-plate-alerts/index.ts
    - triple-j-auto-investment-main/supabase/functions/_shared/email-templates/plate-alert.tsx
decisions:
  - id: interface-inside-handler
    description: "DetectedInsuranceAlert interface declared inside Deno.serve handler"
    rationale: "Scoped to the handler function; not needed externally. Keeps insurance types local to detection logic."
  - id: insurance-only-no-plate-prefix
    description: "SMS prefix changed from 'Triple J Plate Alert' to 'Triple J Alert'"
    rationale: "When only insurance alerts exist, 'Plate Alert' is misleading. Generic prefix covers both."
  - id: dual-cta-buttons
    description: "Email shows Plates Dashboard + Rentals Dashboard buttons when both alert types present"
    rationale: "Insurance issues are managed in Rentals page, not Plates page. Both CTAs ensure admin reaches the right page."
  - id: shield-icon-for-insurance
    description: "Use HTML entity &#128737; (shield) as insurance section header icon"
    rationale: "Shield is universally associated with insurance/protection. Distinct from plate alert icons."
metrics:
  duration: "~6 minutes"
  completed: 2026-02-14
---

# Phase 8 Plan 03: Edge Function Extension Summary

Extended check-plate-alerts Edge Function with insurance expiry detection (3 alert types, severity escalation, dedup upsert, auto-resolve) and combined plate+insurance batched admin notification via extended email/SMS templates.

## What Was Built

### Task 1: Edge Function Insurance Detection (check-plate-alerts/index.ts)
- **Insurance detection section** added after plate detection (sections 1-5), before notification (sections 6-8)
  - Fetches active/reserved bookings with joined rental_insurance and rental_customers
  - Detects 3 conditions: missing_insurance, expired, expiring_soon (7-day window)
  - Severity: expired=urgent, expiring_soon <=3 days=urgent, >3 days=warning, missing=warning
  - Zeroed-time date comparison pattern (setHours(0,0,0,0)) matching Phase 7
- **Insurance alert upsert** into insurance_alerts table
  - Deduplication via partial unique index uq_insurance_active_alert (booking_id, alert_type WHERE resolved_at IS NULL)
  - Same ignoreDuplicates upsert pattern as plate_alerts
- **Insurance auto-resolve** for cleared conditions
  - Fetches active insurance alerts, compares to detected Set, resolves missing ones
- **24-hour notification cooldown** for insurance alerts
  - Separate cooldown tracking via insurance_alerts.last_notified_at
- **Combined notification** sending
  - Single SMS + single email containing both plate and insurance alerts
  - Subject line: "Triple J: X Plate Alerts, Y Insurance Alerts"
  - Stats object extended with insuranceDetected, insuranceNotified, insuranceResolved
- File grew from 490 to 768 lines (278 lines added)
- All existing plate detection code COMPLETELY untouched

### Task 2: Email/SMS Template Extension (plate-alert.tsx)
- **InsuranceAlertItem interface** exported with type, severity, description, bookingId, customerName
- **Insurance alert rendering** functions:
  - renderInsuranceAlertRow: booking ID, severity badge, description, customer name
  - groupInsuranceAlerts: missing/expired/expiring groups
  - renderInsuranceSection: same styling pattern as plate sections
- **buildPlateAlertEmail** extended with optional insuranceAlerts parameter
  - Backward compatible: identical output when no insurance alerts passed
  - Combined total count badge (plate + insurance)
  - Divider between plate and insurance sections when both exist
  - Dynamic title/subtitle: "Plate Alert Summary" / "Insurance Alert Summary" / "Plate & Insurance Alert Summary"
  - Dual CTA buttons: Plates Dashboard + Rentals Dashboard
  - Dynamic footer text reflecting alert types
- **buildPlateAlertSms** extended with optional insuranceAlerts parameter
  - Appends insurance counts: "ins. expired", "ins. expiring", "missing ins."
  - Prefix changed to "Triple J Alert:" (generic, covers both types)
- File grew from 297 to 471 lines (174 lines added)
- All existing plate alert rendering COMPLETELY untouched

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| DetectedInsuranceAlert interface inside handler | Local scope; not needed externally |
| SMS prefix "Triple J Alert:" instead of "Plate Alert:" | Generic covers insurance-only notifications |
| Dual CTA buttons (Plates + Rentals) | Insurance managed in Rentals, not Plates |
| Shield icon for insurance section | Universally associated with protection/insurance |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 32f3a80 | feat(08-03): extend check-plate-alerts with insurance expiry detection |
| 17d98b3 | feat(08-03): extend email/SMS templates with insurance alert sections |

## Verification Results

1. Existing plate detection code unchanged (sections 1-5 identical, diff shows only additions)
2. Insurance detection queries rental_bookings with rental_insurance + rental_customers join
3. Three alert types detected: missing_insurance, expired, expiring_soon
4. Severity escalation: expiring_soon <=3 days=urgent, >3 days=warning; expired always urgent
5. Upsert deduplication via partial unique index with ignoreDuplicates
6. Auto-resolve clears conditions no longer detected via Set comparison
7. Insurance alerts included in notification payload with 24h cooldown
8. Email template shows insurance section with severity-colored badges
9. SMS template includes insurance alert counts alongside plate counts
10. Backward compatible: no change in output when no insurance alerts passed

## Next Phase Readiness

Phase 8 is now complete (all 3 plans done):
- Plan 01: Database, Types & Service Layer (rental_insurance + insurance_alerts tables, types, insuranceService.ts)
- Plan 02: Insurance Verification UI (running in parallel -- modifies different files)
- Plan 03: Edge Function Extension (this plan -- extends check-plate-alerts + templates)

### TODOs
- [ ] Deploy updated Edge Function: `supabase functions deploy check-plate-alerts`
- [ ] Uncomment and run pg_cron schedule for check-plate-alerts in Supabase SQL editor (covers both plate + insurance)
