---
phase: 09-production-infrastructure
plan: 03
status: partially-completed
completed: 2026-02-14
---

# Plan 09-03 Summary: Edge Functions, Storage & Cron

## What Was Done

### Edge Functions Deployed (3/3)

All 3 Edge Functions deployed to Supabase project `scgmpliwlfabnpygvbsy` via MCP:

| Function | Version | Status | JWT | Purpose |
|----------|---------|--------|-----|---------|
| `process-notification-queue` | v1 | ACTIVE | true | SMS/email notifications on registration status change |
| `unsubscribe` | v1 | ACTIVE | false | One-click email unsubscribe for customers |
| `check-plate-alerts` | v1 | ACTIVE | true | Plate + insurance alert detection and admin notifications |

Each function includes its shared dependencies (`_shared/twilio.ts`, `_shared/resend.ts`, email templates) bundled via the MCP deploy tool.

### Storage Buckets Created (4/4)

| Bucket | Public | Size Limit | MIME Types |
|--------|--------|------------|------------|
| `rental-agreements` | No (private) | 10MB | PDF only |
| `rental-photos` | Yes | 5MB | JPEG, PNG, WebP |
| `plate-photos` | Yes | 5MB | JPEG, PNG, WebP |
| `insurance-cards` | Yes | 5MB | JPEG, PNG, WebP |

### Storage RLS Policies (5 policies)
- Admins can upload, view, update, delete files (all buckets)
- Public/anon can view files in public buckets only

### Security Fixes Applied
- `vehicles_backup` table: RLS enabled + admin-only policy (was flagged as ERROR)
- `registration_notifications` table: Added admin + customer policies (was flagged as INFO)

## What Was NOT Done (Blocked)

### pg_cron + pg_net (Blocked on Free Plan)
- Cannot create cron schedules without `pg_cron` extension
- Cannot use `pg_net` for HTTP calls from cron
- `app.settings` (supabase_url, service_role_key) not configured
- **Impact:** Notification queue and plate alert cron will not run automatically
- **Workaround:** Edge Functions can be invoked manually or via external cron (e.g., Vercel cron, GitHub Actions)

### Edge Function Secrets (Manual)
Secrets must be set via Supabase CLI or Dashboard. Required:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `RESEND_API_KEY`
- `ADMIN_PHONE`, `ADMIN_EMAIL`
- `PUBLIC_SITE_URL`

## Decisions
- Deployed Edge Functions to existing dev project (not fresh production) per current plan
- Set `verify_jwt=false` on unsubscribe (customer-facing, no auth)
- Set `verify_jwt=true` on notification queue and plate alerts (invoked with service_role_key)
- Added file size limits and MIME type restrictions to storage buckets for security

## Remaining Security Advisors (Non-Blocking)
- 13 functions with mutable search_path (WARN) -- low risk for internal functions
- 2 permissive RLS policies on leads and registration_documents INSERT (WARN) -- intentional for customer-facing forms
- btree_gist in public schema (WARN) -- cosmetic
- Leaked password protection disabled (WARN) -- enable in Auth settings
