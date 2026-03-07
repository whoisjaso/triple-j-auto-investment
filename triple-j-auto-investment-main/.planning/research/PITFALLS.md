# Domain Pitfalls: Production Deployment

**Domain:** Deploying React/Vite/Supabase SPA to production for a customer-facing dealership platform
**Researched:** 2026-02-13
**Focus:** First production deployment, DNS cutover, Supabase project setup, security for customer PII
**Confidence:** HIGH (verified against official Supabase docs, codebase analysis, Vercel docs)

---

## Critical Pitfalls

Mistakes that cause security breaches, data loss, or complete deployment failure.

### Pitfall 1: Credentials and API Keys Committed to Git Repository

**What goes wrong:** The repository contains real API keys, admin credentials, and Supabase anon keys committed in plaintext across multiple files. These are baked into the production build and visible to anyone who inspects the JavaScript bundle.

**Evidence found in this codebase:**
- `.env.production` contains real Supabase URL, anon key, admin email (`jobawems@gmail.com`), admin password (`adekunle12`), and Retell API key
- `.env.local` contains identical credentials
- `docker-compose.yml` contains the same credentials in plaintext
- `DEPLOYMENT.md`, `DOKPLOY_ENV_SETUP.md`, `SETUP_GUIDE.md`, `FINAL_SUMMARY.md` all contain real credentials
- `FORCE_REBUILD.md` contains a full Docker build command with every secret as a build argument
- `dokploy.json` references the same keys
- `VITE_ADMIN_PASSWORD` and `VITE_RETELL_API_KEY` are prefixed with `VITE_` meaning Vite bundles them into the client-side JavaScript -- they are visible to anyone who opens browser DevTools

**Why this is critical:**
- `VITE_RETELL_API_KEY` is a paid API service key -- anyone can extract it from the JS bundle and make API calls on your account
- `VITE_ADMIN_PASSWORD` being in the bundle means anyone can read the admin password from the source
- The Supabase anon key for the OLD dev project is committed -- if reused, attackers have direct database access
- Git history preserves these secrets forever, even if files are later deleted

**Consequences:**
- Unauthorized access to admin panel
- Unauthorized Retell AI API usage (billing fraud)
- Supabase project compromise if dev project keys are reused
- Fails any security audit

**Prevention:**
1. **Rotate ALL committed credentials immediately** before deploying to production -- every key in the repo is compromised
2. Create a **fresh Supabase project** with new keys (already planned -- good)
3. Set environment variables in **Vercel dashboard only** -- never commit `.env` files
4. Remove `VITE_ADMIN_PASSWORD` and `VITE_ADMIN_EMAIL` entirely -- admin auth should go through Supabase Auth, not client-side env vars
5. Move `VITE_RETELL_API_KEY` to a Supabase Edge Function proxy -- secret API keys must never have the `VITE_` prefix
6. Add `.env*` to `.gitignore` (verify it is there and working)
7. Consider using `git filter-repo` or BFG Repo Cleaner to remove credentials from git history before making the repo accessible

**Detection (warning signs):**
- `VITE_` prefixed variables containing secret keys (anything other than Supabase anon key and public-facing config)
- `.env` files tracked by git
- Build args in Dockerfiles containing secrets
- Documentation files containing real API keys

**Phase to address:** Pre-deployment (Phase 1 of v1.1) -- must be resolved before ANY production deployment

**Confidence:** HIGH -- verified by direct codebase grep showing 30+ files containing real credentials

---

### Pitfall 2: RLS Policies Return Empty Results Instead of Errors on New Supabase Project

**What goes wrong:** After running all 8 migrations on a fresh Supabase project, the application appears to work but returns empty data for all queries. Admin actions appear to succeed but nothing is actually persisted. The v1 codebase had this exact issue and it was "fixed" -- but deploying to a NEW project resets everything.

**Why it happens:**
- RLS is enabled on all tables (correct) but policies depend on `profiles.is_admin = true`
- On a fresh project, the admin user does not exist yet in `profiles`
- The `handle_new_user()` trigger creates a profile with `is_admin = false` by default
- You must manually run `UPDATE public.profiles SET is_admin = true WHERE email = 'admin@email.com'` AFTER creating the admin user
- **If you forget this step**, every admin query silently returns empty results -- Supabase returns HTTP 200 with `data: []`
- The SQL Editor in the Supabase dashboard bypasses RLS, so testing there gives false confidence

**Specific tables affected:** vehicles, leads, profiles, registrations, registration_audit, notification_queue, rental_customers, rental_bookings, rental_payments, rental_condition_reports, plates, plate_assignments, plate_alerts, insurance_alerts

**Consequences:**
- Application appears functional but all admin operations fail silently
- Vehicles added via admin panel are not saved
- Registration workflow is completely non-functional
- This exact issue already occurred during v1 development (known bug pattern)

**Prevention:**
1. Create a **documented bootstrap checklist** that includes admin profile setup
2. Add the admin user creation + `is_admin = true` update to a post-migration SQL script
3. Build a **smoke test script** that verifies: (a) admin can read vehicles, (b) admin can insert a vehicle, (c) public can see available vehicles, (d) customer can view registration by phone
4. Test with the Supabase client SDK using the anon key (not the SQL Editor or service_role)
5. Verify RLS works by testing with both authenticated and unauthenticated requests

**Detection:**
- Application loads but shows no data
- No error messages in the console
- Data visible in Supabase Dashboard SQL Editor but not in the app
- Operations appear to succeed but changes are not reflected

**Phase to address:** Database setup phase -- create bootstrap + smoke test before declaring migration complete

**Confidence:** HIGH -- Supabase official troubleshooting docs confirm this behavior; codebase has documented history of this exact issue

---

### Pitfall 3: Migration Execution Order and Extension Dependencies

**What goes wrong:** The 8 SQL migrations must be run in exact order, but some depend on Postgres extensions (`btree_gist`, `pg_cron`, `pg_net`) that must be enabled via the Supabase Dashboard BEFORE running the migration that references them. Running migrations without enabling extensions first causes hard failures.

**Specific dependency chain:**
```
Dashboard: Enable uuid-ossp (usually pre-enabled)
  schema.sql (01) -- base tables, uuid-ossp
    02_registration_schema_update.sql -- depends on registrations table from registration_ledger.sql
      03_customer_portal_access.sql -- depends on registrations
        04_notification_system.sql -- depends on registrations, REQUIRES pg_cron + pg_net enabled
          05_registration_checker.sql -- depends on registrations
Dashboard: Enable btree_gist extension
            06_rental_schema.sql -- REQUIRES btree_gist for EXCLUDE constraint
              07_plate_tracking.sql -- depends on vehicles, rental_bookings; cron schedule commented out
                08_rental_insurance.sql -- depends on rental_bookings
```

**Critical dependencies that cause failures:**
1. `registration_ledger.sql` must run before `02_registration_schema_update.sql` (creates the `registrations` table)
2. `pg_cron` and `pg_net` extensions must be enabled in Dashboard BEFORE running migration 04 (the `cron.schedule()` call at line 194 will fail otherwise)
3. `btree_gist` extension must be enabled before migration 06 (the `CREATE EXTENSION IF NOT EXISTS btree_gist` might fail on managed Supabase if not pre-enabled)
4. Known pg_cron issue: extension created via migration may appear active in dashboard but not work properly -- must disable and re-enable in dashboard after

**Additional complication:** Migration 04 contains a `cron.schedule()` call that creates a cron job pointing to `current_setting('app.settings.supabase_url')` and `current_setting('app.settings.service_role_key')` -- but these settings do not exist yet on a fresh project. You must run:
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```
BEFORE running migration 04, or the cron job will silently fail every minute.

**Consequences:**
- Migration 04 fails at `cron.schedule()` if pg_cron not enabled
- Migration 06 fails at `EXCLUDE USING gist` if btree_gist not enabled
- Cron jobs silently fail every minute if `app.settings` not configured
- Partial migration state is hard to recover from

**Prevention:**
1. Create an **explicit pre-migration checklist** (enable extensions, set app.settings, create admin user)
2. Run migrations one at a time, not as a batch, verifying each succeeds
3. After enabling pg_cron via migration, verify in Dashboard by disabling and re-enabling the extension
4. Store the service_role_key in Supabase Vault instead of `app.settings` for production security
5. Document the full execution order including Dashboard steps between migrations

**Detection:**
- Migration script errors mentioning `cron.schedule`, `btree_gist`, or `pg_net`
- Cron jobs showing 0 runs in Supabase Dashboard > Cron Jobs
- Edge Functions never being invoked despite cron being "configured"

**Phase to address:** Database setup phase -- pre-migration checklist is a hard prerequisite

**Confidence:** HIGH -- verified from migration source code analysis + Supabase GitHub issue #1591 on pg_cron migration behavior

---

### Pitfall 4: Storage Buckets Not Created = Silent Upload Failures

**What goes wrong:** The application code references 4 Supabase Storage buckets that must be manually created in the new project. None of the SQL migrations create these buckets. If missing, file uploads silently fail.

**Buckets required (from codebase analysis):**
| Bucket Name | Used By | Purpose | Access |
|-------------|---------|---------|--------|
| `rental-agreements` | `RentalAgreementModal.tsx` | Signed PDF rental agreements | Admin only (private) |
| `rental-photos` | `RentalConditionReport.tsx` | Checkout/return vehicle photos | Admin only (private) |
| `plate-photos` | `plateService.ts` | Plate identification photos | Admin only (private) |
| `insurance-cards` | `insuranceService.ts` | Customer insurance card images | Admin only (private) |

**Why it happens:**
- Storage buckets are infrastructure, not schema -- they are not part of SQL migrations
- No bucket creation scripts exist in the codebase
- Uploads fail silently (Supabase returns error but code may not surface it clearly)

**Additional requirement:** Each bucket needs RLS policies on `storage.objects` to allow authenticated admin uploads. By default, Storage does not allow ANY uploads without RLS policies.

**Consequences:**
- Insurance card uploads fail -- customers cannot complete rental insurance flow
- Rental agreement signing appears to work but PDF is not stored
- Condition report photos are not saved -- no proof of vehicle state
- Plate photos are not recorded -- audit trail is broken

**Prevention:**
1. Add bucket creation to the **deployment checklist** (Dashboard > Storage > New Bucket for each)
2. Create RLS policies on `storage.objects` for each bucket allowing admin INSERT, SELECT, UPDATE
3. Create a **storage setup SQL script** that can be run after migrations:
   ```sql
   -- These must be run as service_role or via Dashboard
   INSERT INTO storage.buckets (id, name, public) VALUES
     ('rental-agreements', 'rental-agreements', false),
     ('rental-photos', 'rental-photos', false),
     ('plate-photos', 'plate-photos', false),
     ('insurance-cards', 'insurance-cards', false);
   ```
4. Test upload + download flow for each bucket before declaring deployment complete

**Detection:**
- Upload operations returning errors (check browser Network tab)
- Missing images in condition reports or insurance records
- `storage.objects` table has no RLS policies

**Phase to address:** Database/infrastructure setup phase -- same session as migrations

**Confidence:** HIGH -- verified by codebase grep; Supabase docs confirm buckets must be manually created and RLS-configured

---

### Pitfall 5: Supabase Auth Site URL and Redirect Configuration

**What goes wrong:** Supabase Auth hardcodes redirect URLs for email confirmations, password resets, and OTP flows. On a new project, these default to `localhost:3000`. Phone OTP login and password resets break in production because callbacks redirect to the wrong origin.

**Specific issues in this codebase:**
1. `auth.ts` line 138: `redirectTo: ${window.location.origin}/#/reset-password` -- this is fine for password reset but depends on hash routing
2. Phone OTP via Twilio requires Supabase Auth > Phone provider to be enabled with Twilio credentials
3. Twilio must be in production mode (not trial) -- trial accounts only send to verified numbers
4. Supabase Auth > URL Configuration > Site URL must be set to production domain
5. Supabase Auth > URL Configuration > Redirect URLs must include production domain

**Twilio-specific production requirements:**
- Twilio trial accounts can only send SMS to pre-verified phone numbers (will fail for real customers)
- Must upgrade to a paid Twilio account and purchase a phone number
- Need to register for A2P 10DLC (Application-to-Person messaging) to avoid carrier blocking
- OTP rate limit: default 360/hour across all users, adjustable in Supabase Dashboard

**Consequences:**
- Customer phone OTP login completely broken if Twilio not configured in production mode
- Password reset emails redirect to localhost
- Auth callbacks fail with "invalid redirect URL" errors
- Customers cannot access registration tracking portal

**Prevention:**
1. Configure Supabase Auth settings in Dashboard:
   - Site URL: `https://triplejautoinvestment.com`
   - Redirect URLs: `https://triplejautoinvestment.com/**`
   - Phone provider: Enable with production Twilio credentials
2. Upgrade Twilio to paid account and register for A2P 10DLC before launch
3. Test phone OTP end-to-end with a real (non-verified) phone number
4. Test password reset email flow with real email addresses
5. Set OTP expiry in Supabase Dashboard (recommended: 300 seconds for OTP, not the default 3600)

**Detection:**
- Phone login says "message sent" but no SMS received
- Password reset links redirect to wrong URL
- Auth error logs in Supabase Dashboard > Authentication > Logs
- Twilio Console showing "unverified number" errors

**Phase to address:** Auth configuration phase -- after database setup, before DNS cutover

**Confidence:** HIGH -- verified from Supabase Auth docs and Twilio production requirements

---

### Pitfall 6: DNS Cutover Causing Downtime

**What goes wrong:** Changing DNS records from the existing live site to Vercel causes downtime due to SSL certificate provisioning delay, DNS propagation lag, or incorrect record configuration.

**Current situation:**
- Existing live site on custom domain (triplejautoinvestment.com)
- Switching to Vercel deployment
- DNS propagation can take 24-48 hours
- SSL certificates must be provisioned before traffic arrives

**Specific risks:**
1. Vercel cannot provision SSL certificate until DNS points to it -- but visitors get SSL errors during the gap
2. If the existing site uses a different hosting provider, their SSL cert becomes invalid once DNS changes
3. Email delivery (MX records) can break if only A/CNAME records are changed without preserving MX
4. Supabase Edge Function URLs change with the new project -- old URLs stop working

**Consequences:**
- Customers see "Your connection is not private" SSL errors
- Existing site goes down before new site is reachable
- Email stops working if MX records are disrupted
- Business phone calls about "website is down"

**Prevention:**
1. **Pre-provision SSL on Vercel:** Add domain to Vercel project first, use DNS verification (TXT record) to provision cert before changing A/CNAME records
2. **Lower TTL 24 hours before cutover:** Set DNS TTL to 60 seconds so propagation is fast when you switch
3. **Preserve MX records:** When changing DNS, only modify A/CNAME records -- do not touch MX records for email
4. **Schedule cutover for low-traffic hours:** Saturday evening or early Sunday morning (dealership closed)
5. **Keep old hosting active for 48 hours:** Don't cancel old hosting until DNS fully propagates
6. Verify with `dig` or `nslookup` that DNS has propagated before declaring cutover complete
7. Test the new deployment on Vercel's temporary URL (*.vercel.app) thoroughly before DNS cutover

**Detection:**
- SSL errors when visiting the domain
- Mixed responses from different DNS resolvers
- Email bouncing back

**Phase to address:** Final deployment phase -- after all testing on Vercel temporary URL is complete

**Confidence:** HIGH -- Vercel zero-downtime migration guide documents this exact process

---

## Moderate Pitfalls

Mistakes that cause functionality gaps, degraded experience, or delayed deployment.

### Pitfall 7: Edge Function Environment Variables Not Set

**What goes wrong:** The 3 Edge Functions (`process-notification-queue`, `unsubscribe`, `check-plate-alerts`) deploy successfully but fail at runtime because their environment variables (secrets) are not configured in the new Supabase project.

**Required Edge Function secrets:**
| Secret | Used By | Purpose |
|--------|---------|---------|
| `TWILIO_ACCOUNT_SID` | notification-queue, plate-alerts | SMS sending |
| `TWILIO_AUTH_TOKEN` | notification-queue, plate-alerts | SMS auth |
| `TWILIO_PHONE_NUMBER` | notification-queue, plate-alerts | SMS "from" number |
| `RESEND_API_KEY` | notification-queue, plate-alerts | Email sending |
| `ADMIN_PHONE` | plate-alerts | Admin SMS alerts |
| `ADMIN_EMAIL` | plate-alerts | Admin email alerts |
| `PUBLIC_SITE_URL` | notification-queue, unsubscribe | Tracking page links |
| `SUPABASE_URL` | All (auto-set) | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | All (auto-set) | Auto-provided by Supabase |

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase for Edge Functions, but they are NOT available to pg_cron/pg_net calls, which is why `app.settings` must be configured separately (see Pitfall 3).

**Consequences:**
- Notification queue processes every minute but sends no SMS or email (just logs errors)
- Plate/insurance alerts detected but never delivered to admin
- Unsubscribe page shows tracking URLs pointing to wrong domain
- Errors logged but not visible unless checking Supabase Dashboard > Edge Functions > Logs

**Prevention:**
1. Set all Edge Function secrets via Supabase Dashboard > Edge Functions > Secrets
2. Or use CLI: `supabase secrets set TWILIO_ACCOUNT_SID=xxx TWILIO_AUTH_TOKEN=xxx ...`
3. Set `PUBLIC_SITE_URL` to the production domain (https://triplejautoinvestment.com)
4. Verify Edge Function execution after deployment by manually invoking each function
5. Check Edge Function logs in Dashboard for the first few hours after deployment

**Phase to address:** Edge Function deployment phase -- immediately after deploying functions

**Confidence:** HIGH -- verified from Edge Function source code analysis

---

### Pitfall 8: Resend Email Domain Not Verified

**What goes wrong:** The Resend email integration sends FROM `notifications@triplejautoinvestment.com` (hardcoded in `resend.ts` line 17). If the domain is not verified in Resend, all emails are rejected or land in spam.

**Why it happens:**
- Resend requires domain verification via DNS records (SPF + DKIM TXT records)
- Domain verification takes up to 24 hours for DNS propagation
- Without verification, Resend either rejects the email or sends from a sandbox domain
- This is a different DNS configuration than the Vercel/hosting DNS -- it adds TXT records without affecting A/CNAME

**Consequences:**
- Customer notification emails not delivered
- Registration status update emails rejected by Resend API
- Plate/insurance alert emails to admin not delivered
- Customers think they are not being notified

**Prevention:**
1. Create Resend account and add domain `triplejautoinvestment.com` (or a subdomain like `updates.triplejautoinvestment.com`)
2. Add the SPF and DKIM DNS records Resend generates
3. Wait for verification (check Resend dashboard -- green "Verified" status)
4. Do this **at least 48 hours before launch** to allow DNS propagation
5. Test by sending a real email through the Edge Function before go-live
6. Consider using a subdomain (e.g., `notifications.triplejautoinvestment.com`) to isolate sending reputation

**Detection:**
- Edge Function logs showing Resend API errors
- Resend dashboard showing "unverified" domain status
- Customers not receiving emails

**Phase to address:** Pre-deployment infrastructure -- DNS records should be added alongside Vercel DNS setup

**Confidence:** HIGH -- Resend documentation explicitly requires domain verification

---

### Pitfall 9: Vercel Environment Variables Not Matching New Supabase Project

**What goes wrong:** The Vercel deployment builds successfully but connects to the wrong (old/dev) Supabase project, or fails to connect at all, because environment variables were not updated for the new production Supabase project.

**Why it happens:**
- `.env` files are not deployed to Vercel -- variables must be set in Vercel Dashboard
- The old Supabase project URL/key are in the committed `.env.production` -- if Vercel reads the committed file, it connects to the dev database
- Vite inlines `VITE_*` variables at BUILD TIME, not runtime -- changing env vars requires a rebuild
- Vercel's "Environment Variables" UI has separate fields for Production, Preview, and Development -- easy to set one but not the other

**Consequences:**
- Application connects to dev Supabase (wrong database, no production data)
- Or application has no connection at all (supabase client falls back to placeholder URL)
- All functionality broken -- vehicle listing, auth, registrations all fail
- Difficult to debug because the app loads fine visually (static assets serve correctly)

**Prevention:**
1. Set ALL required environment variables in Vercel Dashboard > Project > Settings > Environment Variables
2. Required variables for production:
   - `VITE_SUPABASE_URL` = new production Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = new production anon key
   - `VITE_GEMINI_API_KEY` = Gemini API key (or placeholder if not using)
   - `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_RETELL_API_KEY`, `VITE_RETELL_OUTBOUND_AGENT_ID`, `VITE_RETELL_OUTBOUND_NUMBER`
3. **Do NOT set** `VITE_ADMIN_EMAIL` or `VITE_ADMIN_PASSWORD` in Vercel (remove from codebase entirely)
4. Remove or empty the committed `.env.production` file to prevent Vite from reading stale values
5. After setting env vars, trigger a redeploy (Vercel > Deployments > Redeploy) -- existing builds have stale values
6. Verify by checking browser DevTools > Network > any Supabase request to confirm the URL matches the new project

**Detection:**
- Supabase requests going to wrong project URL (check Network tab)
- Application loads but shows no vehicles/data
- Console errors about missing Supabase configuration

**Phase to address:** Vercel deployment phase -- before first production build

**Confidence:** HIGH -- Vercel docs confirm env vars must be set in dashboard; Vite docs confirm build-time inlining

---

### Pitfall 10: CSP Header Blocking Supabase or External Services

**What goes wrong:** The Content-Security-Policy (CSP) header in `vercel.json` and `nginx.conf` is restrictive and may block requests to the new Supabase project URL, Twilio, Resend, or other services.

**Current CSP in nginx.conf (line 12):**
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://docs.google.com https://api.retellai.com https://photon.komoot.io
```

**Issues:**
- The `*.supabase.co` wildcard covers any Supabase project (good)
- BUT if you add any new external service, it will be blocked
- `https://api.resend.com` is NOT in the CSP -- Edge Functions call Resend server-side so this is OK, but verify
- `https://api.twilio.com` is NOT in the CSP -- also server-side via Edge Functions so OK
- If any client-side code calls a service not in this list, it will fail silently

**Note:** The `vercel.json` does NOT have a CSP header -- only security headers like X-Frame-Options. The CSP is only in `nginx.conf` (Docker deployment). For Vercel deployment, there is no CSP restriction currently. Consider adding one to `vercel.json` for defense-in-depth.

**Prevention:**
1. For Vercel deployment: Add CSP to `vercel.json` headers matching the nginx.conf version
2. Test all external API calls (Gemini, NHTSA, Retell, EmailJS) work through the CSP
3. Use browser console to check for CSP violation reports
4. If moving from Docker/nginx to Vercel, the CSP in nginx.conf is irrelevant -- only `vercel.json` matters

**Phase to address:** Deployment verification phase -- post-deploy testing checklist

**Confidence:** MEDIUM -- CSP interaction depends on deployment target (Vercel vs Docker)

---

### Pitfall 11: Supabase Email Rate Limits Breaking Auth

**What goes wrong:** Supabase's built-in email service has a hard limit of 2-4 emails per hour. If multiple customers try to sign up, reset passwords, or confirm emails, the quota is exhausted and subsequent auth operations fail with no clear error.

**Why this matters for this project:**
- Customer portal uses phone OTP (not email) for primary auth -- so this is less critical
- BUT admin password resets use email
- Any email confirmations enabled in Supabase Auth will hit this limit
- Supabase's built-in email uses a shared SMTP relay with low deliverability

**Consequences:**
- Admin locked out after password reset if quota exhausted
- If email confirmation is enabled, customers cannot complete signup
- No clear error message -- emails just silently don't arrive

**Prevention:**
1. Configure a custom SMTP provider in Supabase Dashboard > Authentication > SMTP Settings
2. Options: Resend (already being used for notifications), SendGrid, Mailgun, Amazon SES
3. Since Resend is already part of the stack, use it for both notification emails AND auth emails
4. Disable email confirmations if not needed (customers auth via phone OTP)
5. Set OTP rate limits appropriately in Dashboard > Authentication > Rate Limits

**Phase to address:** Auth configuration phase

**Confidence:** HIGH -- Supabase production checklist explicitly warns about this limit

---

### Pitfall 12: pg_cron Jobs Silently Failing for Weeks

**What goes wrong:** The two cron jobs (`process-notification-queue` every minute, `check-plate-alerts` every 30 minutes) are scheduled but silently fail because: (a) Edge Functions are not deployed yet, (b) `app.settings` are not configured, or (c) pg_net extension is not properly enabled.

**Why it is silent:**
- pg_cron logs to `cron.job_run_details` table but this is not visible in the app
- Failed HTTP requests via `pg_net` are logged but not alerted
- The application continues to function normally (admin can still manually check things)
- Notification queue items accumulate but are never processed

**Specific failure modes:**
1. `current_setting('app.settings.supabase_url')` returns NULL -- `net.http_post()` fails
2. Edge Function not deployed -- HTTP 404 returned to pg_net
3. Edge Function deployed but secrets not set -- function runs but Twilio/Resend calls fail
4. pg_net extension disabled or not working -- `net.http_post()` call itself errors

**Consequences:**
- Customer notifications never sent (registration status changes go unnotified)
- Admin plate/insurance alerts never triggered
- Notification queue grows indefinitely
- Issue may not be discovered for weeks until someone asks "why didn't I get an SMS?"

**Prevention:**
1. After deployment, verify cron jobs in Supabase Dashboard > Cron Jobs
2. Check `cron.job_run_details` for execution history and errors:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
   ```
3. Manually invoke each Edge Function via `curl` to verify it works:
   ```bash
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/process-notification-queue' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```
4. Create a test registration status change and verify SMS/email arrives
5. Set up monitoring: check `cron.job_run_details` weekly for failures
6. Consider adding a "last notification sent" indicator in the admin dashboard

**Detection:**
- `cron.job_run_details` showing all failures
- `notification_queue` table has unsent items with `sent = false` past their `send_after` time
- Edge Function logs show no invocations in Dashboard > Edge Functions > Logs

**Phase to address:** Post-deployment verification -- must be checked within first day of deployment

**Confidence:** HIGH -- verified from migration source code; pg_cron failure mode documented in Supabase troubleshooting guide

---

## Minor Pitfalls

Mistakes that cause inconvenience but are quickly recoverable.

### Pitfall 13: PDF Generation Broken Due to Missing Static Assets

**What goes wrong:** The PDF generation service (`pdfService.ts`) fetches `/GoldTripleJLogo.png` and `/TX-130-U-2025.pdf` from the server root at runtime. If these static assets are not included in the Vercel build output, PDFs generate without the logo or the Form 130-U fails entirely.

**Evidence:** `pdfService.ts` lines 23 and 671:
```typescript
const response = await fetch('/GoldTripleJLogo.png');
const response = await fetch('/TX-130-U-2025.pdf');
```

**Prevention:**
1. Verify these files exist in the `public/` directory (Vite copies `public/` to `dist/` root)
2. Test PDF generation on the Vercel preview URL before DNS cutover
3. If files are large, verify Vercel's 50MB deployment size limit is not exceeded

**Phase to address:** Build verification -- check Vercel deployment includes all public assets

**Confidence:** HIGH -- verified from source code

---

### Pitfall 14: Supabase Auth Redirect URL Uses Hash Routing

**What goes wrong:** The password reset redirect is configured as `${window.location.origin}/#/reset-password` (hash routing). If the app uses browser history routing, this URL format will not work. Additionally, Supabase Auth callback URLs must be in the allowed redirect URLs list.

**Prevention:**
1. Confirm the app uses hash routing (`HashRouter` in React Router) -- if so, `/#/` prefix is correct
2. If the app uses `BrowserRouter`, change the redirect to `${window.location.origin}/reset-password`
3. Add the full redirect URL pattern to Supabase Dashboard > Auth > URL Configuration > Redirect URLs

**Phase to address:** Auth configuration phase

**Confidence:** MEDIUM -- depends on which router the app uses

---

### Pitfall 15: Vercel Build Using Wrong Root Directory

**What goes wrong:** The repository has a nested directory structure (`triple-j-auto-investment-main/` inside the repo root). If Vercel is pointed at the repo root, it won't find `package.json` and the build fails. If pointed at the subdirectory, `vercel.json` might not be found.

**Evidence:** The git status shows all app code is under `triple-j-auto-investment-main/` subdirectory, while `.planning/` is at the repo root.

**Prevention:**
1. In Vercel Project Settings, set "Root Directory" to `triple-j-auto-investment-main`
2. Ensure `vercel.json` is inside that directory (it is -- verified)
3. Or restructure the repo so app code is at the root

**Phase to address:** Vercel project setup -- first deployment configuration

**Confidence:** HIGH -- verified from repo structure

---

### Pitfall 16: Supabase Storage Backups Not Included in Database Backups

**What goes wrong:** Supabase database backups do NOT include Storage bucket files. If the database is restored, the `storage.objects` table references files that no longer exist. File uploads (insurance cards, rental photos, plate photos) are permanently lost.

**Prevention:**
1. Implement a separate backup strategy for Storage files (e.g., periodic sync to S3 or Google Cloud Storage)
2. At minimum, document that Storage is NOT backed up and accept the risk for v1.1
3. For critical documents (signed rental agreements), consider also storing a reference/copy outside Supabase

**Phase to address:** Post-launch operational phase -- not blocking for initial deployment

**Confidence:** HIGH -- Supabase documentation explicitly states this limitation

---

## Phase-Specific Deployment Warnings

| Phase/Step | Likely Pitfall | Mitigation | Priority |
|------------|---------------|------------|----------|
| Pre-deployment | Credentials in git | Rotate ALL keys, remove from repo | CRITICAL |
| Supabase project creation | Extensions not enabled | Enable pg_cron, pg_net, btree_gist, uuid-ossp via Dashboard FIRST | CRITICAL |
| Migration execution | Wrong order / missing prerequisites | Run one-by-one with verification, set app.settings before migration 04 | CRITICAL |
| Admin bootstrap | is_admin not set | Run UPDATE profiles SET is_admin=true after first login | CRITICAL |
| Storage setup | Buckets not created | Create 4 buckets + RLS policies | HIGH |
| Auth configuration | Wrong site URL, phone provider not enabled | Configure all settings in Supabase Auth Dashboard | HIGH |
| Edge Function deployment | Secrets not set | Set all 6+ secrets via Dashboard or CLI | HIGH |
| Resend domain | DNS not verified | Add SPF/DKIM records 48+ hours before launch | HIGH |
| Vercel deployment | Env vars not set or stale | Set in Vercel Dashboard, trigger redeploy | HIGH |
| Vercel build | Wrong root directory | Set to triple-j-auto-investment-main | MEDIUM |
| DNS cutover | SSL gap, propagation delay | Pre-provision cert, lower TTL, schedule off-hours | HIGH |
| Post-deployment | Cron jobs silently failing | Verify cron.job_run_details, manually invoke Edge Functions | HIGH |
| Post-deployment | Static assets missing | Test PDF generation on preview URL | MEDIUM |
| Post-deployment | Email rate limits | Configure custom SMTP in Supabase Auth | MEDIUM |

---

## Pre-Deployment Checklist (Summary)

This ordered checklist prevents all critical pitfalls:

```
[ ] 1. Rotate ALL credentials (Supabase, Twilio, Retell, Resend, admin password)
[ ] 2. Remove/empty .env.production and .env.local from repo
[ ] 3. Create fresh Supabase project
[ ] 4. Enable extensions in Dashboard: uuid-ossp, pg_cron, pg_net, btree_gist
[ ] 5. Set app.settings (supabase_url, service_role_key)
[ ] 6. Run schema.sql (01)
[ ] 7. Run registration_ledger.sql
[ ] 8. Run migrations 02-08 one at a time, verifying each
[ ] 9. Disable + re-enable pg_cron in Dashboard (workaround for migration bug)
[ ] 10. Create 4 storage buckets + RLS policies
[ ] 11. Create admin user in Supabase Auth
[ ] 12. UPDATE profiles SET is_admin = true
[ ] 13. Configure Supabase Auth: Site URL, Redirect URLs, Phone (Twilio) provider
[ ] 14. Configure custom SMTP in Supabase Auth (use Resend)
[ ] 15. Deploy Edge Functions + set all secrets
[ ] 16. Add Resend domain DNS records (SPF + DKIM)
[ ] 17. Set Vercel environment variables
[ ] 18. Deploy to Vercel, test on preview URL
[ ] 19. Run smoke tests (admin login, vehicle CRUD, customer portal, PDF generation)
[ ] 20. Manually invoke each Edge Function to verify
[ ] 21. Check cron.job_run_details for successful execution
[ ] 22. Lower DNS TTL to 60s
[ ] 23. Wait 24 hours for TTL propagation
[ ] 24. Pre-provision SSL on Vercel (TXT verification)
[ ] 25. Update DNS A/CNAME records to Vercel
[ ] 26. Verify SSL and site accessibility
[ ] 27. Test full flow on production domain
[ ] 28. Restore DNS TTL to normal (3600s)
```

---

## Sources

**Supabase Official:**
- [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- comprehensive pre-launch guide
- [RLS Troubleshooting: Empty Results](https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx)
- [Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [pg_cron Debugging Guide](https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz)
- [pg_cron Extension Migration Bug](https://github.com/supabase/cli/issues/1591) -- extension may not work properly when enabled via migration

**Vercel Official:**
- [Zero Downtime DNS Migration](https://vercel.com/guides/zero-downtime-migration-for-dns)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

**Resend:**
- [Domain Verification](https://resend.com/docs/dashboard/domains/introduction)

**Security Research:**
- [170+ Supabase Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) -- January 2025 disclosure
- [Understanding Supabase API Keys](https://supabase.com/docs/guides/api/api-keys) -- what is safe to expose vs. not

**Codebase Analysis:**
- Direct grep of repository confirming 30+ files containing real credentials
- Migration source code analysis confirming extension dependencies
- Service source code analysis confirming 4 storage buckets required
- Edge Function source code analysis confirming 6+ required secrets
