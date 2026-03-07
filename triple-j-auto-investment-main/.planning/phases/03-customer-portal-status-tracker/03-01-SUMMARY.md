---
phase: 03-customer-portal-status-tracker
plan: 01
title: Token Access Infrastructure
completed: 2026-02-05
duration: ~10 minutes

subsystem: registration-tracking
tags: [database, security, tokens, rls]

dependency_graph:
  requires: [02-01, 02-02]
  provides: [token-based-access, tracking-link-generation]
  affects: [03-02, 03-03]

tech_stack:
  added: []
  patterns:
    - Token auto-generation via PostgreSQL gen_random_bytes()
    - Token expiry trigger on status change
    - Belt-and-suspenders validation (RLS + application)

key_files:
  created:
    - supabase/migrations/03_customer_portal_access.sql
  modified:
    - supabase/migrations/README.md
    - services/registrationService.ts
    - types.ts

decisions:
  - id: token-format
    choice: 32-char hex from gen_random_bytes(16)
    rationale: Cryptographically secure, URL-safe, standard length
  - id: expiry-trigger
    choice: Database trigger on sticker_delivered transition
    rationale: Consistent timing regardless of application code path
  - id: double-validation
    choice: RLS policy + application-level expiry check
    rationale: Belt-and-suspenders security

metrics:
  tasks_completed: 2
  tasks_total: 2
  commits: 2
  lines_added: ~240
---

# Phase 03 Plan 01: Token Access Infrastructure Summary

**One-liner:** Secure token-based access for customer registration tracking with 30-day expiry after delivery.

## What Was Built

### 1. Database Migration (03_customer_portal_access.sql)

Added token-based access infrastructure to the registrations table:

| Column | Type | Purpose |
|--------|------|---------|
| access_token | VARCHAR(32) | 32-char hex token, auto-generated |
| token_expires_at | TIMESTAMPTZ | NULL until delivered, then 30 days |
| vehicle_body_type | VARCHAR(50) | For car icon in customer portal |

**Trigger:** `set_token_expiry_on_delivery()` automatically sets expiry to NOW() + 30 days when registration reaches `sticker_delivered` stage.

**RLS Policy:** Updated public SELECT to only allow access when `token_expires_at IS NULL OR token_expires_at > NOW()`.

**Index:** Added `idx_registrations_access_token` for efficient token lookups.

### 2. TypeScript Types (types.ts)

Added to Registration interface:
```typescript
accessToken: string;
tokenExpiresAt?: string;
vehicleBodyType?: string;
```

### 3. Service Functions (registrationService.ts)

| Function | Purpose |
|----------|---------|
| `parseAccessKey(accessKey)` | Parse URL param into orderId + token |
| `getRegistrationByAccessKey(orderId, token)` | Secure token-based lookup |
| `getTrackingLink(registration)` | Generate `/track/{orderId}-{token}` URL |

**URL Format:** `/track/TJ-2026-0001-a1b2c3d4e5f67890a1b2c3d4e5f67890`

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 434189b | feat | Add token access migration for customer portal |
| b1c8fb3 | feat | Add token-based lookup service functions |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] Migration file exists with all 4 components (columns, trigger, RLS, backfill)
- [x] README.md documents migration 03 with breaking change note
- [x] types.ts has 3 new Registration fields
- [x] registrationService.ts exports 3 new functions
- [x] `npm run build` passes

## Breaking Changes

**Public SELECT now requires valid token:**

| Before | After |
|--------|-------|
| Order ID alone returns data | Order ID + token required |
| Links never expire | Links expire 30 days after delivery |

Existing public links will stop working after migration is applied.

## Key Files Changed

```
supabase/migrations/03_customer_portal_access.sql  (new, 110 lines)
supabase/migrations/README.md                      (+86 lines)
types.ts                                           (+7 lines)
services/registrationService.ts                    (+55 lines)
```

## Next Phase Readiness

**Ready for Plan 03-02:** Customer Status Tracker UI can now:
1. Parse access keys from URL
2. Look up registrations by token
3. Display token-protected registration data
4. Show vehicle body type for car icon selection

**Database migration must be applied** to Supabase before customer portal will work.
