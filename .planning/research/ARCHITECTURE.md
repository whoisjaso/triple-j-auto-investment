# Production Deployment Architecture

**Domain:** React/Vite SPA on Vercel + Supabase backend (fresh production project)
**Researched:** 2026-02-13
**Confidence:** HIGH (based on codebase analysis, official Supabase/Vercel documentation)

## Executive Summary

Deploying this dealership platform to production requires orchestrating two independent services (Supabase and Vercel) with a strict ordering: Supabase must be fully configured before Vercel can build, because the frontend embeds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time. The deployment is further complicated by three Edge Functions that depend on Supabase secrets, two pg_cron schedules that invoke those functions, four storage buckets with RLS policies, and a domain cutover from an existing live site.

The recommended approach is a five-stage deployment pipeline where each stage completes and is verified before the next begins. Attempting to parallelize stages (e.g., deploying Edge Functions before migrations are applied) will cause failures because the functions reference tables that do not yet exist.

## Deployment Pipeline Overview

```
Stage 1: Supabase Project Creation + Extensions
    |
Stage 2: Database Schema (migrations in order)
    |
Stage 3: Supabase Configuration (auth, storage, secrets, Edge Functions, cron)
    |
Stage 4: Vercel Deployment (connect repo, env vars, build)
    |
Stage 5: Domain Cutover + Verification
```

---

## Stage 1: Supabase Project Creation and Extensions

**Goal:** A running Supabase project with all required PostgreSQL extensions enabled.

### 1.1 Create Production Project

Via Supabase MCP or Dashboard:
- Organization: (owner's org)
- Project name: `triple-j-auto-production`
- Region: `us-east-1` (closest to Houston, TX user base)
- Database password: Generate strong password, store securely

**Output needed for later stages:**
- Project reference ID (e.g., `abcdefghijklmnop`)
- Project URL: `https://<ref>.supabase.co`
- Anon key (public, safe for frontend)
- Service role key (secret, never in frontend)

### 1.2 Enable Required Extensions

Three PostgreSQL extensions must be enabled BEFORE migrations run. Migration 04 requires pg_cron and pg_net. Migration 06 requires btree_gist.

**Order matters:** Enable all three before any migrations.

```sql
-- Enable via SQL Editor or MCP apply_migration
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- pg_cron and pg_net must be enabled via Dashboard:
--   Database > Extensions > Search "pg_cron" > Enable
--   Database > Extensions > Search "pg_net" > Enable
```

**Confidence:** HIGH -- btree_gist can be enabled via SQL. pg_cron and pg_net require Dashboard enablement on hosted Supabase (they run in a special schema managed by the platform).

### 1.3 Verification Gate

Before proceeding to Stage 2, verify:
- [ ] Project URL resolves (curl returns 200)
- [ ] Anon key works (test with supabase-js client)
- [ ] All three extensions show as enabled in Dashboard > Database > Extensions

---

## Stage 2: Database Schema (Migrations)

**Goal:** All 9 SQL files applied in strict order, creating the complete database schema.

### 2.1 Migration Order and Dependencies

```
schema.sql                          -- Base tables: profiles, vehicles, leads + RLS + triggers
  |
registration_ledger.sql             -- Registrations, stages, documents, notifications tables
  |
02_registration_schema_update.sql   -- 6-stage workflow, audit trail, status validation
  |
03_customer_portal_access.sql       -- Token-based customer access, expiry trigger
  |
04_notification_system.sql          -- Notification queue, debounce, pg_cron schedule
  |                                    REQUIRES: pg_cron, pg_net already enabled
05_registration_checker.sql         -- Mileage, checker state, invalidation trigger
  |
06_rental_schema.sql                -- Rental tables, btree_gist exclusion constraint
  |                                    REQUIRES: btree_gist already enabled
07_plate_tracking.sql               -- Plates, assignments, alerts, auto-status triggers
  |
08_rental_insurance.sql             -- Insurance verification, insurance alerts
```

### 2.2 Critical Ordering Constraints

| Migration | Hard Dependency | Fails Without |
|-----------|----------------|---------------|
| `04_notification_system.sql` | pg_cron, pg_net extensions | `cron.schedule()` call fails |
| `06_rental_schema.sql` | btree_gist extension | `EXCLUDE USING gist` constraint fails |
| `07_plate_tracking.sql` | `06_rental_schema.sql` | References `rental_bookings` table |
| `08_rental_insurance.sql` | `06_rental_schema.sql` | References `rental_bookings` table |

### 2.3 Post-Migration Configuration

After all migrations are applied, two pieces of configuration must be set for pg_cron to invoke Edge Functions:

```sql
-- Option A: App settings (simpler, used in migration 04 and 07)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<PROJECT_REF>.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = '<SERVICE_ROLE_KEY>';

-- Option B: Vault (more secure, recommended by Supabase docs)
SELECT vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
```

**Recommendation:** Use Option A for initial deployment because the cron SQL in migrations 04 and 07 already uses `current_setting('app.settings...')`. Migrating to Vault later requires updating the cron schedule SQL -- a separate task, not a deployment blocker.

### 2.4 Cron Schedule for check-plate-alerts

Migration 07 has the cron schedule commented out (it was a TODO). After Edge Functions are deployed in Stage 3, this schedule must be created:

```sql
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

### 2.5 Admin User Setup

After migrations, create the admin user:

1. Create user in Supabase Auth (Dashboard > Authentication > Users > Add User)
   - Email: (owner's email)
   - Password: (strong password)
2. Promote to admin:
   ```sql
   UPDATE public.profiles SET is_admin = true WHERE email = '<admin_email>';
   ```

### 2.6 Verification Gate

- [ ] All 9 migrations applied without errors
- [ ] `app.settings.supabase_url` and `app.settings.service_role_key` configured
- [ ] Admin user created and promoted
- [ ] Cron schedule `process-notification-queue` visible in `cron.job` table
- [ ] Tables exist: `vehicles`, `profiles`, `registrations`, `rental_bookings`, `plates`, etc.

---

## Stage 3: Supabase Configuration (Auth, Storage, Secrets, Edge Functions)

**Goal:** All backend services configured and Edge Functions deployed.

### 3.1 Auth Configuration

#### 3.1.1 Site URL and Redirect URLs

In Dashboard > Authentication > URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://triplejautoinvestment.com` (production domain) |
| Redirect URLs | `https://triplejautoinvestment.com/**` |

**Why this matters:** Password reset emails and email confirmations use the Site URL. If left as `localhost:3000`, users clicking email links will be redirected to a dead URL.

#### 3.1.2 Email Auth Settings

In Dashboard > Authentication > Settings:

| Setting | Value | Rationale |
|---------|-------|-----------|
| Enable email confirmations | ON | Supabase production checklist requires this |
| OTP expiry | 3600 seconds | Supabase recommendation |
| Enable email signup | ON | For admin account creation |

#### 3.1.3 Phone Auth (Twilio)

In Dashboard > Authentication > Providers > Phone:

| Setting | Value |
|---------|-------|
| Enable Phone provider | ON |
| SMS Provider | Twilio |
| Twilio Account SID | (from Twilio console) |
| Twilio Auth Token | (from Twilio console) |
| Twilio Message Service SID or Phone Number | (the Twilio number, E.164 format) |

**Why phone auth is needed:** Migration 04 creates an RLS policy `"Customers can view own registrations by phone"` that matches `auth.jwt()->>'phone'`. Customer portal login uses phone OTP.

#### 3.1.4 Auth Security Hardening

| Setting | Value | Rationale |
|---------|-------|-----------|
| CAPTCHA protection | Consider enabling | Prevent signup abuse |
| Rate limit OTP requests | Default 60s | Prevent SMS bombing |
| JWT expiry | 3600s (default) | Reasonable for SPA |

### 3.2 Storage Buckets

Four storage buckets are needed. All should be **private** (admin-only access via RLS).

| Bucket ID | Purpose | Public? | Used By |
|-----------|---------|---------|---------|
| `rental-agreements` | Signed rental agreement PDFs | No | Admin uploads |
| `rental-photos` | Vehicle condition report photos | No | Admin uploads |
| `plate-photos` | Plate inventory photos | No | Admin uploads |
| `insurance-cards` | Customer insurance card images | No | Admin uploads |

#### 3.2.1 Create Buckets

Via SQL (can be included in a post-migration script):

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('rental-agreements', 'rental-agreements', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('rental-photos', 'rental-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('plate-photos', 'plate-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('insurance-cards', 'insurance-cards', false);
```

#### 3.2.2 Storage RLS Policies

All buckets follow the same pattern: authenticated admins can CRUD, no public access.

```sql
-- Allow admin users to upload to any bucket
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Allow admin users to view files from any bucket
CREATE POLICY "Admins can view files"
ON storage.objects FOR SELECT TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Allow admin users to update files
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Allow admin users to delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
```

**Important:** Without these RLS policies, all storage operations will silently fail (Supabase Storage enforces RLS by default on private buckets).

### 3.3 Edge Function Secrets

Edge Functions need secrets set **before** deployment (or at least before first invocation). These are set at the project level, shared across all functions.

#### 3.3.1 Required Secrets

| Secret Name | Source | Used By |
|-------------|--------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Console | `process-notification-queue`, `check-plate-alerts` |
| `TWILIO_AUTH_TOKEN` | Twilio Console | `process-notification-queue`, `check-plate-alerts` |
| `TWILIO_PHONE_NUMBER` | Twilio Console (E.164) | `process-notification-queue`, `check-plate-alerts` |
| `RESEND_API_KEY` | Resend Dashboard | `process-notification-queue`, `check-plate-alerts` |
| `ADMIN_PHONE` | Business owner (E.164) | `check-plate-alerts` |
| `ADMIN_EMAIL` | Business owner | `check-plate-alerts` |

#### 3.3.2 Automatic Secrets (Provided by Supabase)

These are automatically available in every Edge Function -- do NOT set them manually:

| Secret | Auto-provided |
|--------|---------------|
| `SUPABASE_URL` | Yes |
| `SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |

#### 3.3.3 Optional Secret

| Secret Name | Used By | Purpose |
|-------------|---------|---------|
| `PUBLIC_SITE_URL` | `process-notification-queue`, `unsubscribe` | Override default site URL in notification links |

**Recommendation:** Set `PUBLIC_SITE_URL=https://triplejautoinvestment.com` so tracking links and unsubscribe links point to the correct domain.

#### 3.3.4 Setting Secrets

Via Supabase MCP or CLI:

```bash
supabase secrets set \
  TWILIO_ACCOUNT_SID=<value> \
  TWILIO_AUTH_TOKEN=<value> \
  TWILIO_PHONE_NUMBER=<value> \
  RESEND_API_KEY=<value> \
  ADMIN_PHONE=<value> \
  ADMIN_EMAIL=<value> \
  PUBLIC_SITE_URL=https://triplejautoinvestment.com
```

Or via Dashboard: Edge Functions > Manage Secrets.

### 3.4 Edge Function Deployment

Three Edge Functions to deploy. All use Deno runtime and import from `_shared/`.

| Function | Trigger | JWT Verification | Notes |
|----------|---------|-----------------|-------|
| `process-notification-queue` | pg_cron (every 1 min) | Service role key in header | Called by pg_net, not by users |
| `unsubscribe` | User clicks email link | None needed (public endpoint) | Must set `--no-verify-jwt` |
| `check-plate-alerts` | pg_cron (every 30 min) | Service role key in header | Called by pg_net, not by users |

#### 3.4.1 Deployment Order

Functions can be deployed in any order, but all must be deployed before cron schedules can invoke them successfully.

```bash
# Deploy all three (via Supabase CLI or MCP deploy_edge_function)
supabase functions deploy process-notification-queue
supabase functions deploy unsubscribe --no-verify-jwt
supabase functions deploy check-plate-alerts
```

**Critical:** The `unsubscribe` function MUST be deployed with `--no-verify-jwt` because it is accessed directly by customers clicking an email link (no auth token available). The other two functions are invoked by pg_cron with the service role key, so they can keep JWT verification enabled.

#### 3.4.2 Shared Code Structure

The Edge Functions share code via `_shared/`:

```
supabase/functions/
  _shared/
    twilio.ts           -- SMS sending via Twilio REST API
    resend.ts           -- Email sending via Resend REST API
    email-templates/
      status-update.tsx -- Registration status update email
      rejection-notice.tsx -- DMV rejection email
      plate-alert.tsx   -- Admin plate/insurance alert email
  process-notification-queue/
    index.ts
  unsubscribe/
    index.ts
  check-plate-alerts/
    index.ts
```

The `_shared/` directory is automatically bundled with each function at deploy time by the Supabase CLI.

#### 3.4.3 Post-Deployment: Activate check-plate-alerts Cron

After deploying the Edge Functions, create the cron schedule that was commented out in migration 07:

```sql
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

### 3.5 Verification Gate

- [ ] Phone auth test: Can send OTP to a test number
- [ ] Storage test: Admin can upload a file to `rental-photos` bucket
- [ ] Edge Function `unsubscribe` responds to GET request (returns HTML error page for missing params = working)
- [ ] `process-notification-queue` responds to POST with service role key (returns `{"processed":0,"errors":0}`)
- [ ] `check-plate-alerts` responds to POST with service role key
- [ ] Cron jobs visible: `SELECT * FROM cron.job;` shows both schedules

---

## Stage 4: Vercel Deployment

**Goal:** Frontend SPA built and deployed, accessible at a preview URL before domain cutover.

### 4.1 Environment Variable Inventory

Vercel needs all `VITE_` prefixed variables set as **build-time** environment variables. These are embedded into the JavaScript bundle at build time by Vite and are therefore **visible to end users in the browser**.

#### 4.1.1 Required Variables (from new Supabase project)

| Variable | Value Source | Sensitive? |
|----------|-------------|------------|
| `VITE_SUPABASE_URL` | New Supabase project URL | No (public) |
| `VITE_SUPABASE_ANON_KEY` | New Supabase project anon key | No (public, RLS protects data) |

#### 4.1.2 Required Variables (existing values)

| Variable | Current Value | Sensitive? |
|----------|--------------|------------|
| `VITE_ADMIN_EMAIL` | Admin email | Low (used for admin login form) |
| `VITE_ADMIN_PASSWORD` | Admin password | **YES - SECURITY ISSUE** |
| `VITE_GEMINI_API_KEY` | Gemini API key | **YES - EXPOSED IN BUNDLE** |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID | Low |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template ID | Low |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key | No (designed to be public) |
| `VITE_RETELL_API_KEY` | Retell API key | **YES - EXPOSED IN BUNDLE** |
| `VITE_RETELL_OUTBOUND_AGENT_ID` | Retell agent ID | Low |
| `VITE_RETELL_OUTBOUND_NUMBER` | Business phone number | No |

#### 4.1.3 Security Warnings

**CRITICAL:** Three variables are secrets that should NOT be in the frontend bundle:

1. **`VITE_ADMIN_PASSWORD`** -- Hardcoded admin password is a severe security risk. This appears to be used to pre-fill a login form or for client-side auth checking. This must be removed from the codebase before production. Admin should log in with credentials known only to them, not embedded in the bundle.

2. **`VITE_GEMINI_API_KEY`** -- Exposed in the bundle via `vite.config.ts` `define` block. Anyone can extract this key from the browser and use it. Should be moved to a Supabase Edge Function.

3. **`VITE_RETELL_API_KEY`** -- Exposed in the bundle. Depending on Retell's security model, this may be acceptable (some APIs have client-safe keys) or may need to move server-side.

**Recommendation for v1.1 deployment:** Deploy with these keys as-is to get to production quickly, but create a follow-up milestone to move them server-side. Document the risk.

### 4.2 Vercel Project Setup

#### 4.2.1 Connect Repository

1. Import the Git repository to Vercel
2. Set root directory to `triple-j-auto-investment-main/` (the app lives in a subdirectory)
3. Vercel auto-detects Vite framework

#### 4.2.2 Build Configuration

The existing `vercel.json` is correct and sufficient:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**The rewrite rule is critical:** Without it, direct navigation to any route other than `/` returns a 404 because Vercel serves static files and the SPA uses client-side routing (HashRouter mitigates this, but the rewrite is a safety net).

#### 4.2.3 Environment Variables in Vercel

Set in Vercel Dashboard > Project > Settings > Environment Variables:

- Scope: Production (and optionally Preview)
- All `VITE_` prefixed variables from Section 4.1

**Key insight:** Vercel builds happen on Vercel's servers. The `VITE_` environment variables must be set in Vercel's dashboard BEFORE the first build, otherwise the Supabase client will initialize with the placeholder URL from the code.

### 4.3 Build and Preview

1. Trigger a deployment (push to branch or manual deploy)
2. Vercel produces a preview URL (e.g., `triple-j-auto-*.vercel.app`)
3. Test at the preview URL before domain cutover

### 4.4 Verification Gate

- [ ] Preview URL loads the SPA
- [ ] Admin can log in (email/password auth works against new Supabase project)
- [ ] Public vehicle listing loads (anon SELECT works)
- [ ] No console errors about missing Supabase URL
- [ ] Contact form submits a lead successfully
- [ ] SPA routing works (navigate to `/about`, refresh page, still loads)

---

## Stage 5: Domain Cutover

**Goal:** `triplejautoinvestment.com` points to the new Vercel deployment with zero (or minimal) downtime.

### 5.1 Context

The project description states "Already has a live site on custom domain from previous IDE session." This means DNS records currently point somewhere else (likely DokPloy/Docker based on the Dockerfile and docker-compose.yml in the codebase).

### 5.2 Pre-Cutover Checklist

- [ ] New deployment verified at Vercel preview URL (Stage 4)
- [ ] Supabase project fully configured and verified (Stage 3)
- [ ] SSL certificate pre-provisioned on Vercel for the domain

### 5.3 Zero-Downtime DNS Migration

Per Vercel's official documentation:

#### 5.3.1 Add Domain to Vercel Project

In Vercel Dashboard > Project > Domains:
- Add `triplejautoinvestment.com`
- Add `www.triplejautoinvestment.com` (redirect to apex or vice versa)
- Vercel provides the required DNS records (A record for apex, CNAME for www)

#### 5.3.2 Pre-generate SSL Certificate

Before changing DNS, Vercel can pre-generate the SSL certificate if you add a TXT verification record. This prevents the 30-second to 5-minute window where HTTPS would fail after DNS switch.

1. Vercel provides a TXT record to add at your DNS provider
2. Add the TXT record (does not affect current site)
3. Vercel issues SSL certificate for the domain
4. Verify certificate with: `curl --resolve triplejautoinvestment.com:443:76.76.21.21 https://triplejautoinvestment.com` (using Vercel's IP)

#### 5.3.3 DNS Record Change

At your DNS provider:

1. Delete existing A/CNAME records for `triplejautoinvestment.com`
2. Immediately add:
   - **Apex domain:** A record pointing to `76.76.21.21` (Vercel's anycast IP)
   - **www subdomain:** CNAME record pointing to `cname.vercel-dns.com`
3. Ensure any Cloudflare/proxy is disabled (DNS only, no proxy)

**Propagation:** TTL is typically 5 minutes on most providers. Full propagation can take up to 48 hours in edge cases, but most users see the change within minutes.

### 5.4 Post-Cutover: Update Supabase Settings

After DNS propagation, update Supabase to recognize the production domain:

1. **Auth Site URL:** Verify `https://triplejautoinvestment.com` is set (done in Stage 3)
2. **Auth Redirect URLs:** Verify `https://triplejautoinvestment.com/**` is in the list
3. **Edge Function `PUBLIC_SITE_URL`:** Verify secret is set to `https://triplejautoinvestment.com`
4. **Resend domain verification:** If using custom domain for email (`notifications@triplejautoinvestment.com`), verify the domain in Resend Dashboard with DNS records

### 5.5 Verification Gate

- [ ] `https://triplejautoinvestment.com` loads the new site
- [ ] HTTPS certificate is valid (no browser warnings)
- [ ] Admin login works at production URL
- [ ] Phone OTP sends and verifies
- [ ] Registration tracking links work (`/track/TJ-2026-XXXX-<token>`)
- [ ] Unsubscribe links work (point to Supabase Edge Function URL)
- [ ] Email notifications contain correct production URLs (not localhost or placeholder)

---

## Environment Variable Flow Diagram

```
+------------------+     +------------------+     +------------------+
|   Twilio Console |     |  Resend Dashboard|     | Supabase Dashboard|
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         v                         v                        v
+--------+---------+     +--------+---------+     +--------+---------+
| Edge Fn Secrets  |     | Edge Fn Secrets  |     | Auto-provided    |
| TWILIO_ACCOUNT_  |     | RESEND_API_KEY   |     | SUPABASE_URL     |
| SID, AUTH_TOKEN, |     |                  |     | SUPABASE_ANON_KEY|
| PHONE_NUMBER     |     |                  |     | SUPABASE_SERVICE_|
|                  |     |                  |     | ROLE_KEY         |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         +-------------------------+------------------------+
                                   |
                                   v
                    +-----------------------------+
                    |    Supabase Edge Functions   |
                    |  process-notification-queue  |
                    |  unsubscribe                 |
                    |  check-plate-alerts          |
                    +-----------------------------+

+------------------+     +------------------+
| Supabase Project |     | Business Owner   |
| URL + Anon Key   |     | Email, Phone     |
+--------+---------+     +--------+---------+
         |                         |
         v                         v
+--------+---------+     +--------+---------+
| Vercel Env Vars  |     | Edge Fn Secrets  |
| VITE_SUPABASE_   |     | ADMIN_EMAIL      |
| URL, ANON_KEY    |     | ADMIN_PHONE      |
+--------+---------+     | PUBLIC_SITE_URL  |
         |               +---------+--------+
         v                         |
+--------+---------+               |
| Vite Build       |               |
| (embedded in JS) |               |
+--------+---------+               |
         |                         |
         v                         v
+--------+---------+     +---------+--------+
| Browser (Client) |     | pg_cron -> pg_net|
| supabase.co URL  |     | invokes Edge Fns |
| anon key in JWT  |     | with service key |
+------------------+     +------------------+
```

---

## Component Boundaries

| Component | Responsibility | Depends On |
|-----------|---------------|------------|
| Vercel | Hosts static SPA, serves `index.html`, handles rewrites | DNS records |
| Supabase Auth | Email/password login, Phone OTP | Twilio (for SMS) |
| Supabase Database | All application data, RLS enforcement | Extensions (btree_gist, pg_cron, pg_net) |
| Supabase Storage | File uploads (photos, agreements, insurance cards) | Storage RLS policies |
| Edge Function: process-notification-queue | Sends SMS + email for registration status changes | Twilio, Resend, notification_queue table |
| Edge Function: check-plate-alerts | Detects plate/insurance issues, alerts admin | Twilio, Resend, plates/insurance tables |
| Edge Function: unsubscribe | Handles customer opt-out | registrations table |
| pg_cron + pg_net | Schedules periodic Edge Function invocations | app.settings or Vault for URL/key |
| Twilio | SMS delivery (OTP + notifications) | Account SID, Auth Token, Phone Number |
| Resend | Email delivery (notifications) | API key, domain verification |
| EmailJS | Contact form emails (client-side) | Public key (in browser) |
| Retell AI | Outbound voice calls | API key (currently in browser) |

---

## Anti-Patterns to Avoid

### 1. Running Migrations Out of Order

**What goes wrong:** Foreign key constraints fail, triggers reference nonexistent tables, extensions not available for constraint types.

**Prevention:** Apply migrations strictly in numbered order. Never skip a migration even if you think a table is not yet needed.

### 2. Setting VITE_ Variables After Build

**What goes wrong:** Vite replaces `import.meta.env.VITE_*` at build time. If variables are not set in Vercel before the build runs, the Supabase client initializes with the placeholder URL `https://placeholder.supabase.co`.

**Prevention:** Set all `VITE_` environment variables in Vercel BEFORE triggering the first build. If you need to change them later, you must redeploy (rebuild).

### 3. Deploying Edge Functions Before Migrations

**What goes wrong:** Functions query tables like `notification_queue`, `registrations`, `plate_alerts` that do not exist yet. First invocation by pg_cron will fail silently.

**Prevention:** Stage 2 (migrations) must complete before Stage 3 (Edge Functions).

### 4. Forgetting Storage RLS Policies

**What goes wrong:** Supabase Storage blocks all operations on private buckets without RLS policies. Uploads fail silently (no error in the Supabase client response, just empty result).

**Prevention:** Always create storage RLS policies immediately after creating buckets.

### 5. Using Service Role Key in Frontend

**What goes wrong:** The service role key bypasses all RLS. If exposed in the frontend bundle, any user can read/write/delete all data.

**Prevention:** Only use the anon key in the frontend. Service role key goes in Edge Function secrets and `app.settings` for pg_cron only.

### 6. Hardcoding Admin Credentials in Frontend

**What goes wrong:** The current `.env.production` contains `VITE_ADMIN_PASSWORD`. This is embedded in the JavaScript bundle and visible to anyone who opens DevTools.

**Prevention:** Remove `VITE_ADMIN_PASSWORD` from the codebase. Admin should authenticate with credentials stored only in their password manager, validated server-side by Supabase Auth.

---

## Scalability Considerations

| Concern | At Launch | At 100 Vehicles | At 1000 Rentals/Year |
|---------|-----------|-----------------|----------------------|
| Vercel bandwidth | Free tier sufficient | Free tier sufficient | Pro tier may be needed |
| Supabase database | Free tier (500MB) | Pro tier (8GB) | Pro tier sufficient |
| Edge Function invocations | ~43K/month (1/min + 48/day) | Same | Same |
| Storage | < 1GB | 2-5GB | 10-50GB |
| Twilio SMS costs | < $5/month | $10-30/month | $50-100/month |
| Resend email volume | < 100/month | 200-500/month | Free tier (3K/month) |

**Recommendation:** Start on Supabase Pro plan ($25/month) for production. The Free tier pauses after 1 week of inactivity, which is unacceptable for a business application.

---

## Deployment Checklist (Ordered)

This is the complete, ordered checklist for a deployment operator:

### Stage 1: Supabase Project
- [ ] 1.1 Create Supabase project (region: us-east-1)
- [ ] 1.2 Record: Project URL, Anon Key, Service Role Key
- [ ] 1.3 Enable extension: btree_gist (via SQL)
- [ ] 1.4 Enable extension: pg_cron (via Dashboard)
- [ ] 1.5 Enable extension: pg_net (via Dashboard)

### Stage 2: Database
- [ ] 2.1 Apply `schema.sql`
- [ ] 2.2 Apply `registration_ledger.sql`
- [ ] 2.3 Apply `02_registration_schema_update.sql`
- [ ] 2.4 Apply `03_customer_portal_access.sql`
- [ ] 2.5 Apply `04_notification_system.sql`
- [ ] 2.6 Apply `05_registration_checker.sql`
- [ ] 2.7 Apply `06_rental_schema.sql`
- [ ] 2.8 Apply `07_plate_tracking.sql`
- [ ] 2.9 Apply `08_rental_insurance.sql`
- [ ] 2.10 Set `app.settings.supabase_url` and `app.settings.service_role_key`
- [ ] 2.11 Create admin user in Auth, promote to admin in profiles table

### Stage 3: Supabase Services
- [ ] 3.1 Set Auth Site URL to production domain
- [ ] 3.2 Add production domain to Auth Redirect URLs
- [ ] 3.3 Configure Twilio phone auth provider
- [ ] 3.4 Create storage buckets (4 buckets)
- [ ] 3.5 Apply storage RLS policies
- [ ] 3.6 Set Edge Function secrets (7 secrets)
- [ ] 3.7 Deploy `process-notification-queue` Edge Function
- [ ] 3.8 Deploy `unsubscribe` Edge Function (--no-verify-jwt)
- [ ] 3.9 Deploy `check-plate-alerts` Edge Function
- [ ] 3.10 Create `check-plate-alerts` cron schedule (commented out in migration 07)
- [ ] 3.11 Verify: both cron jobs visible in `cron.job`

### Stage 4: Vercel
- [ ] 4.1 Import repo to Vercel, set root directory to `triple-j-auto-investment-main/`
- [ ] 4.2 Set all VITE_ environment variables (10 variables)
- [ ] 4.3 Trigger build
- [ ] 4.4 Verify at preview URL: login, vehicle list, routing

### Stage 5: Domain
- [ ] 5.1 Add domain to Vercel project
- [ ] 5.2 Pre-generate SSL certificate (TXT record)
- [ ] 5.3 Update DNS records (A record to Vercel IP, CNAME for www)
- [ ] 5.4 Verify HTTPS works at production domain
- [ ] 5.5 Full smoke test at production domain

---

## Sources

- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- HIGH confidence
- [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) -- HIGH confidence
- [Supabase Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) -- HIGH confidence
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- HIGH confidence
- [Supabase Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- HIGH confidence
- [Supabase Edge Functions Environment Variables](https://supabase.com/docs/guides/functions/secrets) -- HIGH confidence
- [Supabase Edge Functions Deploy](https://supabase.com/docs/guides/functions/deploy) -- HIGH confidence
- [Vercel Vite Framework Documentation](https://vercel.com/docs/frameworks/frontend/vite) -- HIGH confidence
- [Vercel Zero-Downtime DNS Migration](https://vercel.com/kb/guide/zero-downtime-migration) -- HIGH confidence
- [Vercel Zero-Downtime DNS Migration (detailed)](https://vercel.com/kb/guide/zero-downtime-migration-for-dns) -- HIGH confidence
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode) -- HIGH confidence
- [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) -- HIGH confidence
- [Supabase MCP Server](https://github.com/supabase-community/supabase-mcp) -- HIGH confidence

---

*Deployment architecture research: 2026-02-13*
