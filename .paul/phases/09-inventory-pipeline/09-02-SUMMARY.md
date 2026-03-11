---
phase: 09-inventory-pipeline
plan: 02
subsystem: api, integration
tags: [gmail, oauth2, rest-api, pipeline-sync, idempotent]

requires:
  - phase: 09-inventory-pipeline
    provides: email parsers, pipeline queries, vehicle_events table
provides:
  - Gmail REST API client with OAuth2 token refresh
  - Pipeline sync endpoint (POST /api/pipeline/sync)
  - OAuth2 token helper script
affects: [09-03 admin pipeline UI, 10-crm]

tech-stack:
  added: []
  patterns: [raw fetch Gmail REST API, admin-authenticated API routes, idempotent sync via source_email_id]

key-files:
  created:
    - src/lib/gmail.ts
    - src/app/api/pipeline/sync/route.ts
    - scripts/get-gmail-token.ts
  modified:
    - .env.local (Gmail credentials added)

key-decisions:
  - "Raw fetch over googleapis npm — zero dependencies, works in serverless"
  - "Admin auth replicated in API route — middleware excludes /api paths"
  - "Idempotent sync via source_email_id check in vehicle_events"
  - "Read-only Gmail scope — never modify user's inbox"

patterns-established:
  - "API routes needing admin auth must verify HMAC cookie directly"
  - "Gmail credentials are env vars, not database — simpler, secure"

duration: ~15min
started: 2026-03-11T00:00:00Z
completed: 2026-03-11T00:00:00Z
---

# Phase 9 Plan 02: Gmail Integration & Pipeline Sync Engine Summary

**Connected Gmail API to pipeline parsers via zero-dependency REST client, with admin-authenticated sync endpoint that fetches, classifies, parses, and creates/updates vehicles idempotently — 201 pipeline emails discovered in triplejautoinvestment@gmail.com.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 4 completed (3 auto + 1 checkpoint) |
| Files created | 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Gmail API Client | Pass | Token refresh, searchEmails, getEmailContent with base64url decoding all working |
| AC-2: Pipeline Sync Endpoint | Pass | Admin-authenticated, idempotent via source_email_id, returns JSON summary |
| AC-3: OAuth2 Token Helper | Pass | Script created, credentials obtained live — 201 emails found in inbox |

## Accomplishments

- Gmail REST API client built with zero npm dependencies — raw fetch with auto token refresh
- Pipeline sync endpoint wires Gmail → parsers → Supabase in a single POST call
- OAuth2 credentials obtained and verified live — 201 Manheim/DealShield/Central Dispatch emails in inbox
- Credentials added to both .env.local and Vercel for production use

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/gmail.ts` | Created | Gmail REST API client — searchEmails, getEmailContent, OAuth2 token refresh |
| `src/app/api/pipeline/sync/route.ts` | Created | POST endpoint — admin-auth, fetch Gmail, parse, create/update vehicles, idempotent |
| `scripts/get-gmail-token.ts` | Created | One-time OAuth2 helper — guides through consent flow, outputs refresh token |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Raw fetch over googleapis | Zero dependencies, works in serverless, Gmail REST API is simple | No bundle bloat |
| Replicate HMAC auth in API route | Middleware matcher excludes /api paths | Secure admin-only access |
| Read-only Gmail scope | Pipeline only reads emails, never modifies | User trust, minimal permissions |

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

**Ready:**
- Sync endpoint functional — can process 201 pipeline emails on demand
- All env vars configured in both local and Vercel

**Concerns:**
- Refresh token expires after 7 days for test users (Google OAuth "Testing" mode) — publish the app in Google Cloud Console to get persistent tokens
- Parser regex patterns tested against known formats but not yet against all 201 live emails — may need tuning

**Blockers:**
- None

---
*Phase: 09-inventory-pipeline, Plan: 02*
*Completed: 2026-03-11*
