# Phase 9: Production Infrastructure - Research

**Researched:** 2026-02-13
**Domain:** Supabase + Vercel + Twilio + Resend deployment, credential rotation, DNS configuration
**Confidence:** HIGH (based on codebase audit + official documentation)

## Summary

This research comprehensively audits the Triple J Auto Investment codebase to answer every question needed to plan a production deployment. The codebase is a Vite + React + TypeScript frontend deployed to Vercel, backed by a Supabase PostgreSQL database with 3 Edge Functions, 4 storage buckets, phone OTP auth via Twilio, and email delivery via Resend.

The single most critical finding is the **severe credential exposure**: the repository (public on GitHub) contains hardcoded Supabase service role keys, database connection strings with passwords, admin passwords, and Retell AI API keys across 30+ files. These credentials appear in committed `.env` files, documentation markdown files, deployment configs, and utility scripts. The dev Supabase project `scgmpliwlfabnpygvbsy` is fully compromised and should be considered untrusted. A fresh production Supabase project is the correct approach (already decided in CONTEXT.md).

The deployment follows a well-defined pattern: create fresh Supabase project -> enable extensions -> run migrations in order -> deploy Edge Functions with secrets -> create storage buckets with RLS -> configure Twilio phone auth -> deploy frontend to Vercel with env vars -> connect custom domain -> rotate all compromised credentials -> verify end-to-end.

**Primary recommendation:** Execute deployment in strict dependency order: Supabase project first, then Edge Functions + storage, then Vercel frontend, then domain DNS, then credential rotation (repo goes private BEFORE rotation), then smoke test.

## Standard Stack

The platform is already built. This phase deploys it -- no new libraries needed.

### Production Infrastructure
| Service | Plan/Tier | Purpose | Status |
|---------|-----------|---------|--------|
| Supabase | Pro Plan | Database, Auth, Edge Functions, Storage | NEW project needed |
| Vercel | Free/Pro | Frontend hosting, CDN, SSL | Account exists, GitHub connected |
| Twilio | Paid account | SMS OTP for customer login + notifications | Paid account ready |
| Resend | Free tier (100/day) | Email notifications from Edge Functions | NOT YET CREATED |
| Namecheap | Domain registrar | Domain ownership, DNS management | Domain owned |
| GitHub | Repository hosting | Source control, CI/CD trigger | Repo exists (public, must go private) |

### Third-Party Service Dependencies (Complete Audit)
| Service | Used In | API Key Type | Key Location | Needs Rotation |
|---------|---------|-------------|--------------|----------------|
| Supabase (dev) | supabase/config.ts | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | .env.local, .env.production, dokploy.json, DEBUG.html, DEPLOYMENT.md, DOKPLOY_ENV_SETUP.md, FORCE_REBUILD.md, scripts/*.js | YES - new project |
| Supabase service role | scripts/run-schema.js, scripts/setup-database.js | Hardcoded JWT | scripts/run-schema.js:10, scripts/setup-database.js:16 | YES - exposed |
| Supabase DB password | scripts/add-columns-direct.js | postgresql:// connection string | scripts/add-columns-direct.js:9 | YES - exposed |
| Retell AI | services/retellService.ts | VITE_RETELL_API_KEY, VITE_RETELL_OUTBOUND_AGENT_ID | .env.local, .env.production, dokploy.json | YES - exposed |
| Google Gemini | services/geminiService.ts | VITE_GEMINI_API_KEY | .env.local (placeholder value) | NO - was placeholder |
| EmailJS | services/emailService.ts | VITE_EMAILJS_SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY | .env.local (placeholder values) | NO - were placeholders |
| Twilio | supabase/functions/_shared/twilio.ts | TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER | Edge Function secrets only (not in code) | N/A - set per-project |
| Resend | supabase/functions/_shared/resend.ts | RESEND_API_KEY | Edge Function secrets only (not in code) | N/A - new account |
| NHTSA | services/nhtsaService.ts | None (free public API) | N/A | N/A |
| Photon/Komoot | services/addressService.ts | None (free public API) | N/A | N/A |
| Google Maps | App.tsx, pages/About.tsx | None (URL-based, no API key) | Embedded map URL in About.tsx | N/A |
| Google Fonts | index.html | None (public CDN) | index.html link tag | N/A |

### Frontend Environment Variables (Complete List)
| Variable | Used In | Required for Production | Source |
|----------|---------|------------------------|--------|
| VITE_SUPABASE_URL | supabase/config.ts | YES | New Supabase project |
| VITE_SUPABASE_ANON_KEY | supabase/config.ts | YES | New Supabase project |
| VITE_ADMIN_EMAIL | (legacy, checked nowhere in runtime) | NO - remove | Was for dev convenience |
| VITE_ADMIN_PASSWORD | (legacy, checked nowhere in runtime) | NO - REMOVE (security risk) | Was for dev convenience |
| VITE_GEMINI_API_KEY | services/geminiService.ts | YES (for AI descriptions) | Google AI Studio |
| VITE_EMAILJS_SERVICE_ID | services/emailService.ts | OPTIONAL (legacy email path) | EmailJS dashboard |
| VITE_EMAILJS_TEMPLATE_ID | services/emailService.ts | OPTIONAL (legacy email path) | EmailJS dashboard |
| VITE_EMAILJS_PUBLIC_KEY | services/emailService.ts | OPTIONAL (legacy email path) | EmailJS dashboard |
| VITE_EMAILJS_REGISTRATION_TEMPLATE_ID | services/emailService.ts | OPTIONAL (legacy email path) | EmailJS dashboard |
| VITE_RETELL_API_KEY | services/retellService.ts | YES (for AI voice calls) | Retell AI dashboard |
| VITE_RETELL_OUTBOUND_AGENT_ID | services/retellService.ts | YES | Retell AI dashboard |
| VITE_RETELL_OUTBOUND_NUMBER | services/retellService.ts | YES | Retell AI dashboard |
| GEMINI_API_KEY | vite.config.ts (process.env.API_KEY) | MAYBE (vite define) | Aliased from VITE_ version |

**CRITICAL NOTE on VITE_ prefix:** All `VITE_` prefixed variables are embedded into the client-side JavaScript bundle at build time. They are NOT secret -- anyone can view them in browser DevTools. This is fine for Supabase anon key (designed to be public) but a security concern for VITE_RETELL_API_KEY (grants API access to make outbound calls). The Retell API key exposure is a pre-existing architecture decision that should be noted but is out of scope for Phase 9.

### Edge Function Secrets (Deno.env.get)
| Secret | Used By | Must Configure |
|--------|---------|---------------|
| SUPABASE_URL | All 3 functions (auto-provided by Supabase) | AUTO |
| SUPABASE_SERVICE_ROLE_KEY | All 3 functions (auto-provided by Supabase) | AUTO |
| TWILIO_ACCOUNT_SID | process-notification-queue, check-plate-alerts (via _shared/twilio.ts) | YES |
| TWILIO_AUTH_TOKEN | process-notification-queue, check-plate-alerts (via _shared/twilio.ts) | YES |
| TWILIO_PHONE_NUMBER | process-notification-queue, check-plate-alerts (via _shared/twilio.ts) | YES |
| RESEND_API_KEY | process-notification-queue, check-plate-alerts (via _shared/resend.ts) | YES |
| ADMIN_PHONE | check-plate-alerts (admin notification) | YES |
| ADMIN_EMAIL | check-plate-alerts (admin notification) | YES |
| PUBLIC_SITE_URL | process-notification-queue, unsubscribe (tracking links) | YES |

## Architecture Patterns

### Migration Order (Strict Sequential Dependency)

The migrations must be applied in this exact order on a fresh Supabase project:

```
1. schema.sql                         -- Base schema: profiles, vehicles, leads, RLS
2. registration_ledger.sql            -- Registration tables: registrations, stages, documents, notifications
3. 02_registration_schema_update.sql  -- 6-stage workflow, audit trail, registration admin role
4. 03_customer_portal_access.sql      -- Token-based access, token expiry trigger
5. 04_notification_system.sql         -- Notification queue, debounce, pg_cron schedule
6. 05_registration_checker.sql        -- Checker columns, invalidation trigger
7. 06_rental_schema.sql               -- btree_gist, rental tables, double-booking constraint
8. 07_plate_tracking.sql              -- Plates, assignments, alerts, plate cron schedule
9. 08_rental_insurance.sql            -- Insurance verification, insurance alerts
```

**Extension prerequisites (enable BEFORE running migrations):**
- `uuid-ossp` -- Used by schema.sql (usually pre-enabled on Supabase)
- `btree_gist` -- Required by 06_rental_schema.sql (EXCLUDE constraint)
- `pg_cron` -- Required by 04_notification_system.sql (cron schedules)
- `pg_net` -- Required by 04_notification_system.sql (HTTP requests from cron)

**Enable extensions via Supabase Dashboard -> Database -> Extensions** before running any SQL.

### pg_cron Configuration Pattern

After migrations, configure database settings for pg_cron to invoke Edge Functions:

```sql
-- Approach A: Custom PostgreSQL settings (simpler)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- OR Approach B: Supabase Vault (more secure, RECOMMENDED for production)
SELECT vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
```

**Recommendation: Use Vault (Approach B) for production.** The service role key is a full-access key. Storing it in app.settings makes it queryable by any SQL user. Vault encrypts it at rest. However, the migrations reference `current_setting('app.settings...')` -- so if using Vault, the cron schedule SQL in migration 04 and 07 must be modified to use `(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')` instead.

### pg_cron Schedules (2 total)

| Schedule Name | Frequency | Edge Function | Migration |
|--------------|-----------|---------------|-----------|
| process-notification-queue | Every 1 minute (`* * * * *`) | process-notification-queue | 04 (auto-created) |
| check-plate-alerts | Every 30 minutes (`*/30 * * * *`) | check-plate-alerts | 07 (COMMENTED OUT -- must be manually activated) |

**IMPORTANT:** Migration 07 has the check-plate-alerts cron schedule **commented out**. It must be manually run after Edge Functions are deployed.

### Storage Buckets (4 required)

| Bucket Name | Used By | Access Pattern |
|-------------|---------|---------------|
| rental-agreements | components/admin/RentalAgreementModal.tsx | Admin upload PDFs, signed URLs for download |
| rental-photos | components/admin/RentalConditionReport.tsx | Admin upload condition photos, public URLs |
| plate-photos | services/plateService.ts | Admin upload plate photos, public URLs |
| insurance-cards | services/insuranceService.ts | Admin upload insurance card images, public URLs |

All buckets need RLS policies allowing authenticated admin users to INSERT, SELECT, UPDATE, DELETE on `storage.objects`.

### Storage Bucket RLS Pattern

```sql
-- Create buckets (via Dashboard or SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('rental-agreements', 'rental-agreements', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('rental-photos', 'rental-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('plate-photos', 'plate-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('insurance-cards', 'insurance-cards', true);

-- RLS: Admin can upload to all buckets
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- RLS: Admin can view all files
CREATE POLICY "Admins can view files"
ON storage.objects FOR SELECT TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- RLS: Public can view files in public buckets
CREATE POLICY "Public can view public bucket files"
ON storage.objects FOR SELECT TO anon
USING (bucket_id IN ('rental-photos', 'plate-photos', 'insurance-cards'));

-- RLS: Admin can delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- RLS: Admin can update (overwrite) files
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
```

### Edge Function Deployment

```bash
# Link local project to Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all 3 Edge Functions
supabase functions deploy process-notification-queue --project-ref YOUR_PROJECT_REF
supabase functions deploy unsubscribe --project-ref YOUR_PROJECT_REF
supabase functions deploy check-plate-alerts --project-ref YOUR_PROJECT_REF

# Set secrets for Edge Functions
supabase secrets set \
  TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  TWILIO_AUTH_TOKEN=your_auth_token \
  TWILIO_PHONE_NUMBER=+1XXXXXXXXXX \
  RESEND_API_KEY=re_XXXXXXXXXXXXX \
  ADMIN_PHONE=+1XXXXXXXXXX \
  ADMIN_EMAIL=jobawems@gmail.com \
  PUBLIC_SITE_URL=https://triplejautoinvestment.com \
  --project-ref YOUR_PROJECT_REF
```

### Admin Bootstrap Pattern

After creating the Supabase project and running migrations:

1. Create admin user via Supabase Auth dashboard (email + password sign-up)
2. Set admin flag in SQL Editor:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'jobawems@gmail.com';
```

### Vercel Deployment Configuration

The repo already has:
- `vercel.json` -- SPA rewrites, security headers, cache control
- `package.json` -- build command (`vite build`), output dir (`dist`)
- GitHub integration to `whoisjaso/triple-j-auto-investment` on `master` branch

Vercel environment variables to set (Dashboard -> Project -> Settings -> Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_RETELL_API_KEY`
- `VITE_RETELL_OUTBOUND_AGENT_ID`
- `VITE_RETELL_OUTBOUND_NUMBER`

**DO NOT set** `VITE_ADMIN_EMAIL` or `VITE_ADMIN_PASSWORD` -- these are legacy and should be removed from codebase.

### DNS Configuration (Namecheap -> Vercel)

Two options:
1. **A Record + CNAME** (recommended -- keeps email/other DNS at Namecheap):
   - A record: `@` -> `76.76.21.21` (Vercel IP)
   - CNAME record: `www` -> `cname.vercel-dns.com`
2. **Transfer nameservers** (simpler but gives Vercel full DNS control):
   - Set Custom DNS in Namecheap to Vercel nameservers

Vercel automatically provisions SSL certificates. Propagation: 5 minutes to 48 hours.

**IMPORTANT for Resend:** If using A record + CNAME approach, you can add Resend SPF/DKIM records alongside without conflict. If transferring nameservers to Vercel, you must add Resend DNS records in Vercel's DNS management.

### Supabase Region Selection

The user base is in Houston, TX. Supabase offers:
- `us-east-1` (N. Virginia) -- ~30ms latency from Houston
- `us-west-1` (N. California) -- ~50ms from Houston
- `us-central-1` (Iowa, if available)

**Recommendation:** `us-east-1` for lowest latency from Houston. This is the most commonly used US region and has the best Supabase feature availability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secret storage | Custom env var injection | Vercel env vars (frontend) + Supabase Edge Function secrets (backend) | Standard pattern for Vite + Vercel + Supabase stack |
| DNS management | Manual cert provisioning | Vercel automatic SSL | Vercel handles Let's Encrypt renewal automatically |
| Database migration tool | Custom migration runner | Run SQL files manually in Supabase SQL Editor | Only 9 files, one-time operation, manual is safer |
| Data export | Custom export scripts | `pg_dump` with `--data-only` for selective table export | Standard Postgres tool, handles all edge cases |
| Credential scanning | Manual file-by-file review | The audit in this RESEARCH.md (see Credential Inventory below) | Already done comprehensively |
| OTP delivery | Custom SMS integration | Supabase Auth + Twilio provider | Built-in, handles rate limiting and verification |
| Email domain verification | Manual DNS record lookup | Resend dashboard verification flow | Provides exact DNS records to add |

## Common Pitfalls

### Pitfall 1: Extension Enable Order
**What goes wrong:** Running migration 04 (notification system) before enabling pg_cron extension causes `ERROR: function cron.schedule does not exist`. Running migration 06 (rental schema) before enabling btree_gist causes `ERROR: type "gist_int8_ops" does not exist`.
**Why it happens:** Extensions must be enabled at the database level before any SQL references them.
**How to avoid:** Enable ALL required extensions (`btree_gist`, `pg_cron`, `pg_net`) via Dashboard BEFORE running any migration SQL. Also verify `uuid-ossp` is enabled (usually default on Supabase).
**Warning signs:** "function does not exist" or "type does not exist" errors when running SQL.

### Pitfall 2: pg_cron Uses app.settings Before They're Set
**What goes wrong:** Migration 04 creates a cron schedule that calls `current_setting('app.settings.supabase_url')` -- but if you haven't run the `ALTER DATABASE` command yet, the cron job will fail silently.
**Why it happens:** The migration creates the schedule immediately, and pg_cron starts trying to execute it within 1 minute.
**How to avoid:** Set `app.settings` (or Vault secrets) BEFORE running migration 04. Or, run migration 04 first, then immediately set the settings. Check `cron.job_run_details` to verify jobs succeed.
**Warning signs:** Check `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;` -- if status is 'failed', the settings are missing.

### Pitfall 3: check-plate-alerts Cron Is Commented Out
**What goes wrong:** After deploying all Edge Functions and running all migrations, the plate alert cron never fires because migration 07 has the schedule SQL commented out.
**Why it happens:** The migration was designed to be activated manually after Edge Function deployment.
**How to avoid:** After deploying the check-plate-alerts Edge Function, manually run the uncommented cron.schedule SQL from migration 07 comments.

### Pitfall 4: Repo Must Go Private BEFORE Credential Rotation
**What goes wrong:** If you rotate credentials while the repo is still public, the new credentials can also be exposed through subsequent commits (if committed accidentally) or the old ones are still in git history.
**Why it happens:** Git history is permanent. Making the repo private stops new visitors from seeing history, but doesn't remove existing clones. Rotating AFTER making private limits the exposure window.
**How to avoid:** Step 1: Make repo private on GitHub. Step 2: Rotate all credentials. Step 3: Clean env files from codebase (use Vercel env vars instead). Step 4: Verify .gitignore covers .env files.
**Warning signs:** Any credential that was in the public repo MUST be considered compromised regardless.

### Pitfall 5: VITE_ADMIN_PASSWORD in Client Bundle
**What goes wrong:** `VITE_ADMIN_PASSWORD=adekunle12` is in `.env.production` and was used as a Vite build arg. This means the admin password was literally embedded in the JavaScript bundle served to every visitor.
**Why it happens:** Legacy architecture from early development when auth was simpler.
**How to avoid:** Remove `VITE_ADMIN_PASSWORD` and `VITE_ADMIN_EMAIL` from all env files and Vercel env vars. These are NOT referenced in any runtime code -- auth uses `supabase.auth.signInWithPassword()` which sends credentials to Supabase server-side. The admin creates their account through Supabase Auth, not through env vars.
**Warning signs:** If these variables appear in Vercel env vars or any `.env` file in production.

### Pitfall 6: Resend Domain vs Resend Account Lead Time
**What goes wrong:** Resend requires domain verification via DNS (SPF + DKIM records). DNS propagation takes up to 48 hours. If you start Resend setup on the same day you expect to go live, email notifications will not work.
**Why it happens:** DNS propagation is inherently slow. Resend cannot verify your domain until the DNS records resolve.
**How to avoid:** Start Resend account creation and domain verification as the FIRST task in this phase. It can happen in parallel with everything else.
**Warning signs:** Resend dashboard shows "Pending" verification status. Until verified, emails will be rejected.

### Pitfall 7: A2P 10DLC Campaign Review Delay
**What goes wrong:** Twilio OTP messages are filtered/blocked by carriers because A2P 10DLC campaign registration is still pending.
**Why it happens:** US carriers require A2P 10DLC registration for any application-to-person SMS. Campaign reviews take 10-15 business days.
**How to avoid:** A2P 10DLC registration has already been submitted per CONTEXT.md. Monitor status in Twilio Console -> Messaging -> Compliance. If still pending at go-live, Twilio trial numbers may work for low-volume testing but will have delivery issues at scale.
**Warning signs:** Twilio API returns success but customer never receives SMS. Check Twilio message logs for carrier filtering.

### Pitfall 8: Storage Bucket RLS Blocks All Uploads by Default
**What goes wrong:** Creating storage buckets without RLS policies means all upload attempts fail with "new row violates row-level security policy."
**Why it happens:** Supabase Storage has RLS enabled by default on `storage.objects`. Without explicit policies, nothing can be inserted.
**How to avoid:** Create RLS policies for storage.objects immediately after creating buckets.
**Warning signs:** File uploads fail in the UI with 403 or RLS policy errors.

### Pitfall 9: Dev Data Migration Conflicts with Fresh Schema
**What goes wrong:** Exporting data from dev Supabase with `pg_dump --data-only` and importing into production fails because column constraints have changed (e.g., old `current_stage` values like 'payment' don't match new CHECK constraint).
**Why it happens:** Migration 02 changed the stage values. Dev data may have old-format stages.
**How to avoid:** Export only `vehicles` table data (the real inventory worth preserving). For registrations, start fresh in production -- dev registrations were test data. Use `--table=vehicles` flag with pg_dump.
**Warning signs:** CHECK constraint violations on import.

## Credential Inventory (Comprehensive)

### Files Containing Hardcoded Credentials (MUST be cleaned)

**Supabase Anon Key (dev project `scgmpliwlfabnpygvbsy`):**
1. `.env.local` (line 2)
2. `.env.production` (line 2)
3. `DEBUG.html` (lines 47, 69)
4. `DEPLOYMENT.md` (line 33)
5. `DOKPLOY_ENV_SETUP.md` (line 11)
6. `FORCE_REBUILD.md` (line 39)
7. `dokploy.json` (line 20)
8. `scripts/fix-rls-policies.js` (line 27)

**Supabase Service Role Key (CRITICAL -- full admin access):**
9. `scripts/run-schema.js` (line 10) -- hardcoded JWT
10. `scripts/setup-database.js` (line 16) -- hardcoded JWT

**Supabase Database Password:**
11. `scripts/add-columns-direct.js` (line 9) -- `postgresql://postgres.scgmpliwlfabnpygvbsy:adekunle12@...`

**Admin Password (`adekunle12`):**
12. `.env.local` (line 4)
13. `.env.production` (line 4)
14. `DEPLOYMENT.md` (line 37)
15. `DOKPLOY_ENV_SETUP.md` (line 13)
16. `FORCE_REBUILD.md` (line 39)
17. `COMPLETE_SUPABASE_FIX.md` (line 121)
18. `SETUP_GUIDE.md` (line 76)
19. `FINAL_SUMMARY.md` (line 70)
20. `dokploy.json` (line 28)
21. `scripts/setup-database.js` (line 19)

**Admin Email (`jobawems@gmail.com`):**
22. `.env.local` (line 3)
23. `.env.production` (line 3)
24. `DEPLOYMENT.md` (line 36)
25. `DOKPLOY_ENV_SETUP.md` (line 12)
26. `index.html` (line 62, in structured data)
27. `dokploy.json` (line 24)
28. `services/emailService.ts` (line 38, hardcoded secondary email)
29. `scripts/fix-database.js` (lines 69, 74, 78, 89, 95)
30. `scripts/setup-database.js` (line 18)
31. `business-plan/README.md` (line 113)

**Retell AI Credentials:**
32. `.env.local` (lines 11-13)
33. `.env.production` (lines 11-13)
34. `dokploy.json` (lines 32, 36, 40)

**Supabase URL (dev project):**
35. `.env.local` (line 1)
36. `.env.production` (line 1)
37. `DEBUG.html` (line 45)
38. `DEPLOYMENT.md` (line 32)
39. `DOKPLOY_ENV_SETUP.md` (line 10)
40. `FORCE_REBUILD.md` (line 39)
41. `dokploy.json` (line 16)
42. `scripts/execute-schema-direct.js` (line 8)
43. `scripts/add-schema-columns.js` (line 8)
44. `scripts/fix-database.js` (line 8)
45. `scripts/fix-rls-policies.js` (line 8)
46. `scripts/run-schema.js` (line 9)
47. `scripts/setup-database.js` (line 15)

**Server Credentials (in .claude/settings.local.json):**
48. `.claude/settings.local.json` (line 30) -- SSH password, server IP, server root password

### Credentials That Need Rotation at Third-Party Services

| Service | Credential | Action Required |
|---------|-----------|-----------------|
| Supabase (dev project) | Anon key, service role key, DB password | Abandon project entirely -- using fresh project |
| Retell AI | API key `key_86a41f8fad555c03e879a71d0398` | Rotate in Retell dashboard, get new key |
| Retell AI | Agent ID `agent_b8c93771b686703566f5cef9a7` | Verify agent still valid, may not need rotation |
| Supabase Auth | Admin password `adekunle12` | New password on new project (fresh start) |
| Server (178.156.146.106) | SSH/root passwords in .claude/settings | Change server passwords if server still in use |

### Credentials NOT Needing Rotation (Safe)

| Service | Why Safe |
|---------|----------|
| Gemini API key | Was `PLACEHOLDER_API_KEY` -- never a real key |
| EmailJS credentials | Were `YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID`, `YOUR_PUBLIC_KEY` -- placeholders |
| NHTSA API | No key needed (free public API) |
| Photon/Komoot geocoding | No key needed (free public API) |
| Google Maps embed | No key needed (URL-based embed) |

## Code Examples

### Verify pg_cron Jobs Are Running

```sql
-- After deployment, check cron job status
SELECT jobname, schedule, active
FROM cron.job
ORDER BY jobname;

-- Check recent execution results
SELECT jobid, jobname, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Manually Activate check-plate-alerts Cron

```sql
-- Run this AFTER deploying the check-plate-alerts Edge Function
-- and AFTER setting app.settings or Vault secrets

SELECT cron.schedule(
  'check-plate-alerts',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-plate-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Data Migration (Vehicles Only)

```bash
# Export vehicle data from dev project
pg_dump \
  --data-only \
  --table=public.vehicles \
  --column-inserts \
  "postgresql://postgres.[OLD_REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  > vehicles_data.sql

# Import to production project
psql \
  "postgresql://postgres.[NEW_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
  < vehicles_data.sql
```

**Note:** Vehicle gallery images are stored as URLs in the `gallery` JSONB column. If these URLs point to external sources (e.g., image hosting), they'll still work. If they point to the old Supabase storage, those files need manual migration too.

### Vercel Environment Variable Setup

```bash
# Using Vercel CLI (alternative to dashboard)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_GEMINI_API_KEY production
vercel env add VITE_RETELL_API_KEY production
vercel env add VITE_RETELL_OUTBOUND_AGENT_ID production
vercel env add VITE_RETELL_OUTBOUND_NUMBER production
```

### Resend Domain Verification DNS Records

After creating Resend account and adding domain `triplejautoinvestment.com`:

```
# Resend will provide exact records, but they follow this pattern:
# SPF: TXT record
Host: @
Type: TXT
Value: v=spf1 include:amazonses.com ~all   (or similar Resend-provided value)

# DKIM: CNAME records (usually 3)
Host: resend._domainkey
Type: CNAME
Value: (provided by Resend dashboard)
```

### Smoke Test Checklist Queries

```sql
-- Verify admin user exists and has admin flag
SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;

-- Verify vehicles table has data (after migration)
SELECT COUNT(*) as vehicle_count FROM public.vehicles;

-- Verify cron jobs are active
SELECT jobname, schedule, active FROM cron.job;

-- Verify storage buckets exist
SELECT id, name, public FROM storage.buckets ORDER BY name;

-- Verify Edge Function secrets are configured (via function invocation)
-- Invoke process-notification-queue manually and check logs
```

## State of the Art

| Old Approach (in codebase) | Current Approach (for production) | Impact |
|---------------------------|----------------------------------|--------|
| .env.production committed to git | Vercel env vars (never in code) | Prevents credential exposure |
| Hardcoded Supabase URLs in scripts | Environment variables only | Scripts become reusable |
| VITE_ADMIN_PASSWORD in bundle | Removed entirely | No password in client code |
| app.settings for cron secrets | Supabase Vault for production | Encrypted at rest |
| EmailJS for lead notifications | Keep EmailJS for now (low priority) | Not worth changing in Phase 9 |
| Dokploy deployment | Vercel deployment | Already decided, Vercel account exists |
| Docker (Dockerfile, nginx.conf) | Vercel static hosting | Simpler, no container management |

**Deprecated/outdated files to clean up:**
- `Dockerfile` -- Not needed for Vercel deployment
- `docker-compose.yml` -- Not needed for Vercel deployment
- `nginx.conf` -- Not needed for Vercel deployment
- `dokploy.json` -- Contains hardcoded credentials, Dokploy no longer used
- `DEBUG.html` -- Contains hardcoded dev credentials
- `DOKPLOY_ENV_SETUP.md` -- Contains hardcoded dev credentials
- `FORCE_REBUILD.md` -- Docker-specific, contains hardcoded credentials
- `COMPLETE_SUPABASE_FIX.md` -- Contains hardcoded admin password
- All files in `scripts/` -- Contain hardcoded dev Supabase URLs and credentials

**Do NOT delete these files in Phase 9 unless cleaning credentials.** They are historical documentation. The priority is removing/rotating secrets, not restructuring the repo.

## Open Questions

1. **Vehicle gallery image URLs -- where do they point?**
   - What we know: Vehicle images are stored as URLs in the `gallery` JSONB field
   - What's unclear: Whether these are external URLs (e.g., Imgur, car listing sites) or Supabase Storage URLs on the dev project
   - Recommendation: Check a few vehicle records in dev Supabase to see URL patterns. If they point to `scgmpliwlfabnpygvbsy.supabase.co/storage`, those files need to be downloaded and re-uploaded to the production storage bucket

2. **Retell AI agent configuration -- still valid?**
   - What we know: Agent ID `agent_b8c93771b686703566f5cef9a7` is configured
   - What's unclear: Whether this agent is still functional and whether the API key needs rotation or just the agent config update
   - Recommendation: User verifies Retell AI dashboard to confirm agent status before rotating the API key

3. **A2P 10DLC approval timeline**
   - What we know: Registration submitted, campaigns take 10-15 business days for review
   - What's unclear: When it was submitted and current status
   - Recommendation: Check Twilio Console -> Messaging -> Compliance for status. Plan for OTP to work in testing mode even if 10DLC not yet approved (Twilio does allow sending to verified numbers during review)

4. **EmailJS -- keep or remove?**
   - What we know: EmailJS handles frontend lead notification emails (Contact form -> admin inbox). Resend handles Edge Function notification emails (registration status -> customer)
   - What's unclear: Whether to keep EmailJS for lead notifications or migrate that to Resend too
   - Recommendation: Keep EmailJS for now -- it's a separate concern from Phase 9 production deployment. The EmailJS credentials were never real (placeholders), so it's either "configure EmailJS properly" or "remove it" -- either way, not blocking production launch

5. **Gemini API key -- has a real key been obtained?**
   - What we know: VITE_GEMINI_API_KEY was a placeholder in .env files
   - What's unclear: Whether the user has a working Gemini API key
   - Recommendation: User provides a real Gemini API key for production, or the AI description feature degrades gracefully (returns "Description unavailable")

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- Direct inspection of all files in the repository
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- Security, performance, operational recommendations
- [Supabase pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron) -- Cron scheduling docs
- [Supabase pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net) -- Async HTTP from SQL
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets) -- Environment variable management
- [Supabase Edge Functions Deploy](https://supabase.com/docs/guides/functions/deploy) -- Deployment commands
- [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) -- OTP configuration
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- Bucket RLS policies
- [Supabase Vault](https://supabase.com/docs/guides/database/vault) -- Encrypted secrets in Postgres
- [Supabase Migration Between Projects](https://supabase.com/docs/guides/platform/migrating-within-supabase) -- pg_dump approach
- [Vercel Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) -- Domain setup
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction) -- DNS records for email

### Secondary (MEDIUM confidence)
- [Namecheap to Vercel DNS setup guide](https://jorgearuv.dev/setting-up-namecheap-domain-in-vercel) -- Community guide, verified with official Vercel docs
- [A2P 10DLC Registration Guide](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc) -- Twilio official docs on US SMS compliance
- [GitHub Secret Exposure Best Practices](https://github.com/orgs/community/discussions/161907) -- Community discussion on credential rotation

### Tertiary (LOW confidence)
- Supabase region latency estimates from Houston -- based on general AWS region geography, not measured

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Direct codebase audit, all dependencies identified
- Architecture (migration order): HIGH -- Migration files explicitly declare dependencies
- Architecture (Edge Functions): HIGH -- All function code read, all env vars identified
- Credential inventory: HIGH -- Comprehensive grep across all file types
- Pitfalls: HIGH -- Based on reading actual migration code + Supabase official docs
- DNS/Domain: MEDIUM -- Based on Vercel + Namecheap docs, not tested
- A2P 10DLC timeline: LOW -- Variable, depends on Twilio review queue
- Data migration: MEDIUM -- Standard pg_dump approach, but gallery image URLs unknown

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days -- stable infrastructure, unlikely to change)
