# Technology Stack: v1.1 Production Deployment & Polish

**Project:** Triple J Auto Investment
**Milestone:** v1.1 -- Production Launch & Polish
**Researched:** 2026-02-13
**Mode:** Ecosystem (deployment stack dimension)

## Executive Summary

This is NOT a feature-building milestone. The code is complete. This research covers the tooling, configuration, and workflow needed to:

1. Create a fresh Supabase production project and configure it fully
2. Deploy the Vite/React SPA to Vercel with a custom domain
3. Polish the UI for real customer use

The existing application stack (React 19, Supabase JS 2.87, Vite 6.2, Tailwind 3.4) does not change. This document covers only the deployment and operations tooling layer.

---

## Part 1: Vercel Frontend Deployment

### Deployment Method: GitHub Integration (not CLI)

**Recommendation: Use Vercel's native GitHub integration.**

| Approach | Recommendation | Why |
|----------|---------------|-----|
| GitHub Integration | **USE THIS** | Zero-config, auto-deploys on push, preview deployments on PRs |
| Vercel CLI | Skip | More manual, no auto-deploy, requires CLI install on every machine |
| GitHub Actions + CLI | Overkill | Only needed for custom CI/CD pipelines, test suites, multi-step builds |

**Rationale:** This is a single-developer dealership app, not a team with CI/CD needs. GitHub integration provides:
- Automatic deployment on push to `master`
- Preview deployments for any branch/PR
- Zero configuration beyond initial connect
- Vercel auto-detects Vite framework and configures build settings
- Custom domain management in the Vercel dashboard

**Setup steps:**
1. Go to vercel.com, sign in with GitHub
2. Import the `whoisjaso/triple-j-auto-investment` repository
3. Set root directory to `triple-j-auto-investment-main` (the app is in a subdirectory)
4. Vercel auto-detects Vite, sets build command to `npm run build`, output to `dist`
5. Add environment variables before first deploy (see Environment Variables section)
6. Deploy

**Confidence:** HIGH -- Verified via [Vercel Vite docs](https://vercel.com/docs/frameworks/frontend/vite) and [Vercel GitHub integration docs](https://vercel.com/docs/git/vercel-for-github)

### Existing vercel.json: Already Correct

The project already has a well-configured `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]}
  ]
}
```

**Assessment:** This is production-ready. The SPA rewrite rule handles client-side routing, Vite asset hashing enables immutable caching, and security headers are present. No changes needed.

### Custom Domain Configuration

**Current state:** The dealership has an existing custom domain (`triplejautoinvestment.com` based on Resend `from` address and Edge Function URL patterns).

**Process:**
1. Add domain in Vercel Dashboard > Project > Settings > Domains
2. Choose DNS method based on domain registrar:
   - **If using Vercel DNS:** Change nameservers at registrar to Vercel's
   - **If keeping existing DNS:** Add A record (76.76.21.21) for apex, CNAME for www
3. Vercel auto-provisions SSL via Let's Encrypt
4. Lower TTL to 60s 24 hours before cutover to minimize downtime

**Important:** The existing site is live on this domain. DNS cutover replaces it with the new Vercel deployment. Plan for a maintenance window or verify the new deployment works on Vercel's `.vercel.app` domain first.

**Confidence:** HIGH -- Standard Vercel domain setup per [official docs](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

---

## Part 2: Vercel Environment Variables

### Critical: Build-Time Injection

Vite environment variables are baked into the JavaScript bundle at build time, NOT available at runtime. This means:
- All `VITE_*` variables must be set in Vercel BEFORE deploying
- Changing an env var requires a redeploy to take effect
- Missing variables at build time = `undefined` in production (silent failure)

**Source:** [Vite env docs](https://vite.dev/guide/env-and-mode), [Vercel Vite docs](https://vercel.com/docs/frameworks/frontend/vite)

### Complete Environment Variable Inventory

Based on codebase grep of all `import.meta.env.VITE_*` references:

| Variable | Used In | Required | Security | Notes |
|----------|---------|----------|----------|-------|
| `VITE_SUPABASE_URL` | `supabase/config.ts` | YES | Public (anon) | New production project URL |
| `VITE_SUPABASE_ANON_KEY` | `supabase/config.ts` | YES | Public (anon) | New production project anon key |
| `VITE_EMAILJS_SERVICE_ID` | `services/emailService.ts` | YES | Public | EmailJS dashboard |
| `VITE_EMAILJS_TEMPLATE_ID` | `services/emailService.ts` | YES | Public | Lead notification template |
| `VITE_EMAILJS_REGISTRATION_TEMPLATE_ID` | `services/emailService.ts` | Optional | Public | Registration notification template (falls back to TEMPLATE_ID) |
| `VITE_EMAILJS_PUBLIC_KEY` | `services/emailService.ts` | YES | Public | EmailJS public key |
| `VITE_RETELL_API_KEY` | `services/retellService.ts` | YES | **SENSITIVE** | Retell API key -- exposed in client bundle |
| `VITE_RETELL_OUTBOUND_AGENT_ID` | `services/retellService.ts` | YES | Semi-sensitive | Retell agent ID |
| `VITE_RETELL_OUTBOUND_NUMBER` | `services/retellService.ts` | YES | Public | Outbound phone number |
| `VITE_GEMINI_API_KEY` | `services/geminiService.ts` | Optional | **SENSITIVE** | Gemini AI key -- exposed in client bundle |

**Security Warning (carry forward from v1):**
`VITE_RETELL_API_KEY` and `VITE_GEMINI_API_KEY` are API keys exposed in the client-side bundle. This is a known v1 tech debt item (STAB-05 in backlog). For v1.1, this is acceptable because:
- Retell has per-call billing with rate limits
- Gemini has per-request quotas
- Moving to Edge Functions is a v2 item

These should NOT block deployment, but should be noted as accepted risk.

**Variables NOT needed in Vercel (Edge Function only):**

| Variable | Used In | Where Configured |
|----------|---------|-----------------|
| `TWILIO_ACCOUNT_SID` | Edge Functions only | Supabase secrets |
| `TWILIO_AUTH_TOKEN` | Edge Functions only | Supabase secrets |
| `TWILIO_PHONE_NUMBER` | Edge Functions only | Supabase secrets |
| `RESEND_API_KEY` | Edge Functions only | Supabase secrets |
| `ADMIN_PHONE` | Edge Functions only | Supabase secrets |
| `ADMIN_EMAIL` | Edge Functions only | Supabase secrets |
| `PUBLIC_SITE_URL` | Edge Functions only | Supabase secrets |

**Variables to REMOVE from Vercel (not used in frontend):**

| Variable | Issue |
|----------|-------|
| `VITE_ADMIN_EMAIL` | Referenced in `vite-env.d.ts` types but NOT used in any code -- leftover from pre-Supabase auth |
| `VITE_ADMIN_PASSWORD` | Same -- a security liability, never commit, never deploy |

**Confidence:** HIGH -- Verified by grepping all `import.meta.env.VITE_` references in the codebase

---

## Part 3: Supabase Production Project Setup

### Setup Method: Supabase MCP + CLI Hybrid

**Recommendation: Use MCP for project creation and schema work, CLI for Edge Functions and secrets.**

| Task | Tool | Why |
|------|------|-----|
| Create production project | **MCP** | Programmatic, can be done from Claude Code |
| Apply migrations (02-08) | **MCP** | `apply_migration` tool tracks DDL changes |
| Enable extensions (btree_gist, pg_cron, pg_net) | **MCP** | SQL execution via `execute_sql` |
| Create storage buckets | **MCP** | SQL against `storage.buckets` or dashboard |
| Storage RLS policies | **MCP** | SQL execution |
| Deploy Edge Functions | **CLI** | `supabase functions deploy` -- MCP cannot deploy function code |
| Set Edge Function secrets | **CLI** | `supabase secrets set --env-file .env.production.secrets` |
| Enable phone auth / Twilio provider | **Dashboard** | Auth provider configuration requires dashboard UI |
| Configure pg_cron schedules | **MCP** | SQL via `cron.schedule()` |
| Vault secrets for cron | **MCP** | SQL via `vault.create_secret()` |
| Create admin user | **MCP or Dashboard** | `supabase.auth.admin.createUser()` or dashboard invite |

**Rationale for hybrid approach:**
- MCP excels at SQL operations (migrations, schema, policies, vault, cron) and can be done within Claude Code sessions
- CLI is the only way to deploy Edge Function code to production (`supabase functions deploy`)
- Dashboard is required for auth provider configuration (Twilio phone auth toggle)

**Source:** [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp), [Supabase CLI reference](https://supabase.com/docs/reference/cli/introduction), [Edge Function deploy docs](https://supabase.com/docs/guides/functions/deploy)

**Confidence:** HIGH for MCP migrations/SQL, HIGH for CLI functions/secrets, MEDIUM for MCP project creation (depends on MCP version capabilities)

### CLI Commands Reference

```bash
# 1. Login and link to new production project
supabase login
supabase link --project-ref <NEW_PROJECT_ID>

# 2. Deploy all Edge Functions at once
supabase functions deploy

# 3. Set Edge Function secrets from env file
supabase secrets set --env-file .env.production.secrets

# 4. Or set individual secrets
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxxx
supabase secrets set TWILIO_PHONE_NUMBER=+18325551234
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set ADMIN_PHONE=+1xxxxxxxxxx
supabase secrets set ADMIN_EMAIL=jobawems@gmail.com
supabase secrets set PUBLIC_SITE_URL=https://triplejautoinvestment.com

# 5. Verify secrets are set
supabase secrets list
```

**Note:** Secrets take effect immediately -- no function redeploy needed after setting them.

**Source:** [Edge Function secrets docs](https://supabase.com/docs/guides/functions/secrets)

### Migration Application Order

Migrations must be applied in strict order. Some have prerequisites:

| Migration | File | Prerequisites | What It Does |
|-----------|------|--------------|--------------|
| 01 | `registration_ledger.sql` (base schema) | None | Base registration tables |
| 02 | `02_registration_schema_update.sql` | Migration 01 | 6-stage workflow, audit trail |
| 03 | `03_customer_portal_access.sql` | Migration 02 | Token-based customer access |
| 04 | `04_notification_system.sql` | Migration 03, **pg_cron**, **pg_net** | Notification queue, debounce, cron |
| 05 | `05_registration_checker.sql` | Migration 02 | Document validation schema |
| 06 | `06_rental_schema.sql` | **btree_gist** extension | Rental bookings with EXCLUDE constraint |
| 07 | `07_plate_tracking.sql` | Migration 06 | Plate tracking, assignments, alerts |
| 08 | `08_rental_insurance.sql` | Migration 07 | Insurance verification, alerts |

**Extension enable order (before migrations):**
1. `btree_gist` -- required before migration 06
2. `pg_cron` -- required before migration 04
3. `pg_net` -- required before migration 04

```sql
-- Enable extensions (run via MCP execute_sql)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Storage Buckets

Four buckets needed, all private (RLS-controlled):

| Bucket | Purpose | Max File Size | Allowed Types |
|--------|---------|--------------|---------------|
| `rental-agreements` | Signed rental agreement PDFs | 10 MB | `application/pdf` |
| `rental-photos` | Vehicle condition photos (check-in/out) | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| `plate-photos` | Photos of plates for verification | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| `insurance-cards` | Customer insurance card uploads | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

```sql
-- Create buckets (run via MCP execute_sql)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('rental-agreements', 'rental-agreements', false, 10485760),
  ('rental-photos', 'rental-photos', false, 5242880),
  ('plate-photos', 'plate-photos', false, 5242880),
  ('insurance-cards', 'insurance-cards', false, 5242880)
ON CONFLICT (id) DO NOTHING;
```

RLS policies should allow authenticated admin users full access, and authenticated customers read-only access to their own files.

### Phone Auth with Twilio

**Setup steps (Dashboard only):**
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Phone provider
3. Select SMS provider: Twilio
4. Enter Twilio credentials:
   - **Account SID** -- from Twilio console
   - **Auth Token** -- from Twilio console
   - **Message Service SID** or phone number -- the Twilio number for sending OTPs
5. Configure OTP settings:
   - OTP expiry: 300 seconds (5 min, more secure than default 3600)
   - OTP length: 6 digits (default)

**Production requirement:** Must have a paid Twilio account with a purchased phone number. Trial accounts cannot send OTPs to unverified numbers.

**Source:** [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio)

**Confidence:** HIGH -- Official Supabase docs, standard setup

### pg_cron Schedule Configuration

The app has two cron jobs that need scheduling:

```sql
-- 1. Process notification queue (every minute)
SELECT cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/process-notification-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- 2. Check plate & insurance alerts (every 30 minutes)
SELECT cron.schedule(
  'check-plate-alerts',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/check-plate-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
```

**Prerequisite:** Vault secrets must be created first:
```sql
SELECT vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
```

**Source:** [Supabase cron scheduling docs](https://supabase.com/docs/guides/functions/schedule-functions), [Supabase cron module](https://supabase.com/docs/guides/cron)

**Confidence:** HIGH -- Matches the pattern already used in migration 04

---

## Part 4: Edge Function Secrets Inventory

Complete list of secrets needed by the three Edge Functions:

| Secret | Used By | How To Obtain |
|--------|---------|---------------|
| `TWILIO_ACCOUNT_SID` | `_shared/twilio.ts` | Twilio Console > Account SID |
| `TWILIO_AUTH_TOKEN` | `_shared/twilio.ts` | Twilio Console > Auth Token |
| `TWILIO_PHONE_NUMBER` | `_shared/twilio.ts` | Twilio Console > Phone Numbers (E.164) |
| `RESEND_API_KEY` | `_shared/resend.ts` | Resend dashboard > API Keys |
| `ADMIN_PHONE` | `check-plate-alerts/index.ts` | Dealer's phone for alert SMS |
| `ADMIN_EMAIL` | `check-plate-alerts/index.ts` | Dealer's email for alert emails |
| `PUBLIC_SITE_URL` | `process-notification-queue/index.ts` | `https://triplejautoinvestment.com` |

**Auto-available secrets (no configuration needed):**
- `SUPABASE_URL` -- automatically injected by Supabase
- `SUPABASE_ANON_KEY` -- automatically injected
- `SUPABASE_SERVICE_ROLE_KEY` -- automatically injected
- `SUPABASE_DB_URL` -- automatically injected

**Recommended:** Create a `.env.production.secrets` file (git-ignored) for batch setting:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+18325551234
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PHONE=+1xxxxxxxxxx
ADMIN_EMAIL=jobawems@gmail.com
PUBLIC_SITE_URL=https://triplejautoinvestment.com
```

Then deploy:
```bash
supabase secrets set --env-file .env.production.secrets
```

**Confidence:** HIGH -- Verified by reading all `Deno.env.get()` calls in Edge Function source code

---

## Part 5: What NOT to Add

This is a deployment milestone. Resist the urge to add new tools.

### Do NOT Add: Error Tracking (Sentry, LogRocket, etc.)

**Why not:** Premature for a single-dealer operation with one admin user. The dealership has maybe 50-100 customers at any time. Supabase Edge Function logs and Vercel deployment logs are sufficient for v1.1. If error volume becomes a problem post-launch, add Sentry in v2.

### Do NOT Add: Analytics (PostHog, Plausible, GA4)

**Why not:** The dealership's primary metric is "did the customer call?" which is tracked by Retell and phone records. Web analytics can wait until the site is live and there's actual traffic to analyze. Add in v2 if wanted.

### Do NOT Add: Performance Monitoring (Web Vitals, Lighthouse CI)

**Why not:** One-time Lighthouse audits during polish are sufficient. Continuous monitoring is overkill for a dealership site with low traffic.

### Do NOT Add: Testing Framework (Vitest, Playwright)

**Why not:** This is a deployment milestone, not a quality milestone. Testing was explicitly deferred to v2 backlog (STAB-04). Adding it now delays production launch.

### Do NOT Add: vite-plugin-vercel

**Why not:** Only needed for SSR, Vercel Functions, or ISR. This is a pure SPA with no server-side rendering. The existing `vercel.json` rewrite rule handles everything needed.

### Do NOT Add: Docker/Dockerfile for Vercel

**Why not:** The existing Dockerfile was for Dokploy (previous deployment target). Vercel handles builds natively for Vite projects. The Dockerfile is not needed and would add unnecessary complexity.

### Do NOT Add: Supabase config.toml

**Why not:** No `config.toml` exists currently. This file is for local development with `supabase start` (Docker-based local Supabase). Since this is a deployment milestone targeting a hosted Supabase project (not local dev), it adds no value.

---

## Part 6: Resend Domain Verification

The Edge Functions send emails from `notifications@triplejautoinvestment.com`. For production email delivery:

1. **Resend Dashboard:** Add and verify `triplejautoinvestment.com` domain
2. **DNS Records:** Add the DKIM, SPF, and DMARC records Resend provides
3. **Wait:** Domain verification can take up to 72 hours

Without domain verification, Resend emails send from a shared domain and have higher spam rates.

**Confidence:** MEDIUM -- Standard Resend setup, not verified against specific project config

---

## Part 7: Supabase Production Checklist

Per [Supabase's official production checklist](https://supabase.com/docs/guides/deployment/going-into-prod):

### Security (Required)

| Item | Status | Action |
|------|--------|--------|
| RLS enabled on all tables | Done in migrations | Verify after applying |
| SSL enforcement | Off by default | Enable in Dashboard > Settings > Database |
| Email confirmation | Disabled (admin-only email auth) | Keep disabled -- admin creates own account |
| MFA on Supabase account | Unknown | Enable on the owner's Supabase account |
| Supabase Pro plan | Required | Free tier pauses after 7 days inactivity |

### Performance

| Item | Status | Action |
|------|--------|--------|
| Database indices | Created in migrations | Verify key query patterns post-deploy |
| Connection pooling | Default enabled | No action needed |
| Compute size | Default (free) | Evaluate after launch; upgrade if needed |

### Reliability

| Item | Status | Action |
|------|--------|--------|
| Pro plan (no pause) | Required | Upgrade from free tier |
| Point-in-Time Recovery | Optional | Enable if database exceeds 4GB |
| Backup strategy | Pro plan includes daily | Sufficient for v1.1 |

**Critical:** The Supabase free tier pauses projects after 7 days of inactivity. A production dealership platform MUST be on Pro plan ($25/month) to prevent this.

**Confidence:** HIGH -- [Official production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)

---

## Complete Tool Summary

### Tools to USE

| Tool | Version | Purpose | When |
|------|---------|---------|------|
| Vercel (GitHub integration) | N/A (SaaS) | Frontend hosting, custom domain, SSL | Phase: Deploy frontend |
| Supabase MCP | Latest | Create project, apply migrations, SQL operations | Phase: Supabase setup |
| Supabase CLI | Latest | Deploy Edge Functions, set secrets | Phase: Edge Functions |
| Supabase Dashboard | N/A | Phone auth config, monitoring | Phase: Auth config |

### Tools to SKIP

| Tool | Why Skip |
|------|----------|
| Vercel CLI | GitHub integration is simpler for this project |
| Docker/Dockerfile | Not needed for Vercel deployment |
| Sentry/LogRocket | Premature for single-dealer, low-traffic site |
| Analytics (GA4/PostHog) | Defer to post-launch |
| Vitest/Playwright | Testing is a v2 backlog item |
| vite-plugin-vercel | Not needed for SPA (no SSR) |
| supabase config.toml | Not doing local development |
| CI/CD pipeline (GitHub Actions) | Vercel GitHub integration handles deployment |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Vercel deployment | HIGH | Official docs verified, existing vercel.json already correct |
| Vercel env vars | HIGH | Codebase grep verified all VITE_ references |
| Supabase CLI for Edge Functions | HIGH | Official docs verified, CLI commands are standard |
| Supabase MCP for migrations | HIGH | MCP `apply_migration` and `execute_sql` are documented capabilities |
| Phone auth + Twilio | HIGH | Official Supabase docs for Twilio provider |
| pg_cron scheduling | HIGH | Pattern matches existing migration 04 design |
| Storage bucket setup | HIGH | Standard Supabase SQL operations |
| Edge Function secrets | HIGH | Verified all `Deno.env.get()` calls in source code |
| Resend domain verification | MEDIUM | Standard setup, not verified against project's specific DNS |
| Custom domain cutover | MEDIUM | Standard process, but timing depends on existing site setup |

---

## Sources

### Vercel
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) -- Framework configuration, env vars
- [Deploying GitHub Projects with Vercel](https://vercel.com/docs/git/vercel-for-github) -- GitHub integration setup
- [Adding a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) -- Domain configuration
- [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode) -- Build-time injection behavior

### Supabase
- [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- Official pre-production checklist
- [Edge Function Deployment](https://supabase.com/docs/guides/functions/deploy) -- CLI deploy commands
- [Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets) -- Environment variable management
- [Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) -- Twilio provider setup
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) -- pg_cron + pg_net pattern
- [Supabase Cron](https://supabase.com/docs/guides/cron) -- Cron module documentation
- [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- Bucket configuration
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS for storage
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) -- MCP server capabilities
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction) -- CLI command reference

---

## Open Questions

1. **Supabase plan:** Is the dealer ready to commit to Pro plan ($25/month)? Free tier will pause the production database.

2. **Twilio account status:** Is the existing Twilio account paid/production-ready, or still a trial? Trial accounts cannot send OTPs to unverified phone numbers.

3. **Domain registrar:** Where is `triplejautoinvestment.com` registered? This affects DNS cutover approach (A record vs nameserver transfer).

4. **EmailJS configuration:** The current EmailJS service/template IDs are placeholders (`YOUR_SERVICE_ID`). Are these configured in EmailJS dashboard?

5. **Resend domain:** Is `triplejautoinvestment.com` already verified in Resend, or does this need to be set up?

6. **Existing Supabase project:** The `.env.production` references `scgmpliwlfabnpygvbsy.supabase.co`. Is this a dev/staging project to be replaced, or does it contain production data that needs migration?

---

*Research completed: 2026-02-13*
