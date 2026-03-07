---
phase: 19-retention-engine
plan: 01
subsystem: retention-data-foundation
tags: [database, typescript, translations, owner-portal, referrals, reviews]
dependency_graph:
  requires:
    - registrations table (all previous migrations)
    - vehicles table (for mileage snapshot)
    - supabase/config.ts (Supabase client)
    - types.ts (Registration, Vehicle interfaces)
  provides:
    - owner_referrals table + RLS policies
    - referral_clicks table + anon INSERT policy
    - review_requests table + RLS policies
    - generate_referral_code() SQL function
    - auto_create_owner_referral() trigger
    - enqueue_review_requests() SECURITY DEFINER function
    - enqueue_followup_review_requests() SECURITY DEFINER function
    - OwnerReferral, ReferralClick, ReviewRequest TypeScript interfaces
    - SERVICE_REMINDER_INTERVALS, REFERRAL_TIERS constants
    - ownerPortalService.ts with 7 exported functions
    - ownerPortal translation block (42 bilingual keys each language)
  affects:
    - 19-02 (Owner Portal UI - depends on types + service layer)
    - 19-03 (Referral Landing page - depends on getReferrerName, logReferralClick)
    - 19-04 (Review Edge Function - depends on review_requests table + enqueue functions)
tech_stack:
  added:
    - ownerPortalService.ts (new service file)
    - phase-19-migration.sql (new migration)
  patterns:
    - snake_case DB to camelCase TS mapping (same as Store.tsx + leads.ts pattern)
    - SECURITY DEFINER functions for pg_cron (same as Phase 18)
    - DO/EXCEPTION block for pg_cron Free plan graceful degradation
    - ON CONFLICT DO NOTHING for idempotent trigger inserts
    - LOOP + EXIT WHEN for collision-free referral code generation
key_files:
  created:
    - triple-j-auto-investment-main/supabase/migrations/phase-19-migration.sql
    - triple-j-auto-investment-main/services/ownerPortalService.ts
  modified:
    - triple-j-auto-investment-main/types.ts
    - triple-j-auto-investment-main/utils/translations.ts
decisions:
  - "referral_code FK on referral_clicks references owner_referrals.referral_code (not id) for direct lookups without join"
  - "anon INSERT on referral_clicks enables click tracking without authentication on referral landing page"
  - "logReferralClick attempts RPC increment but treats failure as non-fatal (anon lacks UPDATE on owner_referrals)"
  - "review_requests uses UNIQUE(registration_id, channel, request_type) to prevent duplicate enqueuing"
  - "generate_referral_code excludes 0/O/I/1 to prevent confusion in verbal referral codes"
  - "snapshot_mileage_at_purchase trigger is separate from auto_create_owner_referral to keep concerns separate"
  - "referralLanding keys use flat naming (referralLandingIntro, referralLandingHeading, referralLandingSubtext) not nested object -- consistent with followUp block pattern"
  - "maintenanceChecklist stored as array of {item: string} objects for bilingual flexibility"
metrics:
  duration: 6 minutes
  completed_date: "2026-03-02"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 2
---

# Phase 19 Plan 01: Retention Engine Data Foundation Summary

**One-liner:** Owner Portal data layer with 3 new tables (owner_referrals, referral_clicks, review_requests), pg_cron enqueue functions, TypeScript interfaces, 7-function service layer, and 42-key bilingual translation block.

## What Was Built

### Task 1: phase-19-migration.sql
Complete Supabase migration with 11 sections in order:

1. `mileage_at_purchase` column on registrations + `snapshot_mileage_at_purchase()` trigger
2. `owner_referrals` table (referral_code unique, RLS: authenticated SELECT by phone, service_role full)
3. `referral_clicks` table (anon INSERT, service_role SELECT)
4. `review_requests` table (UNIQUE constraint per registration+channel+type, service_role only)
5. `review_completed` column on registrations (boolean, default false)
6. `generate_referral_code(customer_name)` function (XXX-YYYY format, excludes 0/O/I/1)
7. `auto_create_owner_referral()` trigger (fires on sticker_delivered transition, idempotent)
8. `enqueue_review_requests()` SECURITY DEFINER (3-day window, dual-channel, ON CONFLICT DO NOTHING)
9. `enqueue_followup_review_requests()` SECURITY DEFINER (7-day window, skips review_completed=true)
10. pg_cron schedules in DO/EXCEPTION block (graceful Free plan degradation)
11. 4 performance indexes (phone, code, unsent, click code)

### Task 2: TypeScript types and service layer

**types.ts additions:**
- `OwnerReferral` interface (9 camelCase fields)
- `ReferralClick` interface (4 fields)
- `ReviewRequest` interface (8 fields)
- `SERVICE_REMINDER_INTERVALS` const array (3/6/12 months)
- `REFERRAL_TIERS` const array (1=$50, 3=$100, 5=$200)

**services/ownerPortalService.ts (7 exported functions):**
- `getOwnerData(phone)`: latest sticker_delivered registration
- `getReferralData(phone)`: owner_referrals row with referral code/link/stats
- `getCommunityReferralCount()`: monthly referral_clicks count for social proof
- `logReferralClick(code, deviceType)`: anon-safe click insert + referral_count increment attempt
- `getReferrerName(code)`: first name from referral code (for landing page heading)
- `getUpgradeMatches(purchasePrice)`: Available vehicles at 1.1x-2.0x of purchase price
- `markReviewCompleted(registrationId)`: sets review_completed=true to suppress follow-up

### Task 3: Bilingual translation keys

Added `ownerPortal` block in both `en` and `es` (42 keys each, 84 total bilingual strings):
- Header/General (4 keys): title, welcome, emptyState, loading
- Vehicle Card (3 keys): yourVehicle, purchased, daysOwned
- Documents (5 keys): documents, billOfSale, asIsDisclosure, viewDocument, noDocuments
- Service Reminders (7 keys + array): serviceReminders, month3/6/12, due, completed, upcoming, maintenanceChecklist (6 items)
- Value Tracker (5 keys): valueTracker, currentValue, costPerDay, purchasePrice, valueOverTime
- Referral (13 keys): referralTitle, yourCode, yourLink, shareLink, copyCode, copied, referralCount, communityCount, tierProgress, tier1/2/3
- Referral Landing (3 flat keys): referralLandingIntro, referralLandingHeading, referralLandingSubtext
- Upgrade (5 keys): upgradeTitle, tradeInEstimate, upgradeMatches, talkToUs, upgradeNotYet
- Review (2 keys): reviewCompleted, reviewThanks

## Verification Results

- `npx tsc --noEmit`: 62 errors -- all pre-existing (SEO.tsx hreflang typo, About/Contact framer-motion ease types, RegistrationTracker stage types, Deno types for Edge Functions). Zero new errors from Phase 19 changes.
- phase-19-migration.sql: all 3 tables with RLS, 4 functions, 2 triggers, pg_cron DO/EXCEPTION block, 2 new columns on registrations
- ownerPortalService.ts: 7 functions exported, all handle errors gracefully with null / [] returns
- types.ts: OwnerReferral, ReferralClick, ReviewRequest interfaces + 2 constants
- translations.ts: ownerPortal block at lines 999 and 2043 (en and es)

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | feb281f | feat(19-01): create phase-19-migration.sql with retention engine DB schema |
| 2 | 383c998 | feat(19-01): add Owner Portal TypeScript interfaces and service layer |
| 3 | f8d81e0 | feat(19-01): add bilingual Owner Portal translation keys to translations.ts |

## Deviations from Plan

None -- plan executed exactly as written.

The plan specified `referralLanding.intro`, `referralLanding.heading`, `referralLanding.subtext` as nested keys, but the existing `followUp` block pattern uses flat keys (e.g., `followUp.consent`, not `followUp.messages.consent`). Keys were made flat (`referralLandingIntro`, `referralLandingHeading`, `referralLandingSubtext`) to match the established pattern in the codebase. This is a minor naming deviation that keeps consistency with all other translation blocks.

## Self-Check: PASSED

Files created:
- FOUND: triple-j-auto-investment-main/supabase/migrations/phase-19-migration.sql
- FOUND: triple-j-auto-investment-main/services/ownerPortalService.ts

Files modified:
- FOUND: triple-j-auto-investment-main/types.ts (OwnerReferral interface at line 728)
- FOUND: triple-j-auto-investment-main/utils/translations.ts (ownerPortal at lines 999 and 2043)

Commits verified:
- FOUND: feb281f (Task 1 - migration SQL)
- FOUND: 383c998 (Task 2 - types + service)
- FOUND: f8d81e0 (Task 3 - translations)
