# Phase 4: Customer Portal - Notifications & Login - Research

**Researched:** 2026-02-08
**Domain:** SMS/Email notifications, phone OTP authentication, notification debounce, preference management
**Confidence:** HIGH

## Summary

This research investigated how to implement SMS/email notifications triggered by registration status changes, phone OTP customer authentication, notification debounce (5-minute window), preference management, and the notification audit trail. The codebase already has significant infrastructure in place: a `registration_notifications` table exists in the initial migration (registration_ledger.sql), the `logNotification()` function exists in registrationService.ts, the `RegistrationNotification` TypeScript interface exists in types.ts, and `customer_email`/`customer_phone` columns already exist on the registrations table.

The primary architecture decision is that notification sending must happen server-side (Supabase Edge Functions) because SMS providers require secret API keys that cannot be exposed in a client-side SPA. The existing EmailJS integration is client-side only and will be kept for lead notifications, but Phase 4 notifications use server-side Resend (email) and Twilio (SMS) via Edge Functions. Database webhooks trigger Edge Functions on registration status changes, with a debounce queue table preventing rapid-fire notifications.

**Primary recommendation:** Use Twilio for SMS (including Supabase phone OTP auth), Resend for rich HTML email (free tier: 3,000/month), and Supabase Edge Functions triggered by database webhooks on registration updates. Implement debounce via a `notification_queue` table with a `send_after` timestamp, processed by a pg_cron job every minute.

---

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Twilio REST API | v2010-04-01 | SMS delivery | Supabase natively supports Twilio for phone auth; same account serves notifications; best docs; $0.0083/SMS |
| Resend API | v1 | Rich HTML email | Official Supabase recommendation; simple REST API; free tier 3,000/month; no SMTP config needed |
| @react-email/components | ^1.0.0 | Email template components | React-based email templates; works in Supabase Edge Functions (Deno); official integration with Resend |

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.87.1 | Auth (phone OTP), database | Already configured; phone OTP is built-in method |
| framer-motion | ^12.23.26 | UI animations | Already used for page transitions |
| lucide-react | ^0.554.0 | Icons | Bell, Phone, Mail, Settings icons |

### Infrastructure (Supabase Platform)

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Supabase Edge Functions | Server-side SMS/email sending | All notification delivery |
| Supabase Database Webhooks | Trigger Edge Functions on DB changes | Status change detection |
| Supabase Auth (Phone OTP) | Customer phone login | PORT-05 requirement |
| pg_cron Extension | Process debounce queue | Every-minute queue sweep |
| pg_net Extension | HTTP calls from PostgreSQL | Webhook delivery mechanism |
| Supabase Vault | Secret storage | API keys for Twilio/Resend |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Twilio | Vonage | Cheaper per SMS but Supabase has native Twilio integration for phone auth; using one provider for both auth + notifications is simpler |
| Resend | EmailJS (existing) | EmailJS is client-side only; notifications must be server-side to protect secrets and ensure delivery regardless of user's browser state |
| React Email | Raw HTML strings | React Email gives type-safe, component-based email design; renders to static HTML |
| Edge Functions | Client-side fetch to Twilio | Exposes API keys in browser; not viable for production |

### No New npm Dependencies for Frontend

All SMS/email logic runs server-side in Edge Functions. The frontend only needs the existing `@supabase/supabase-js` for:
- `supabase.auth.signInWithOtp({ phone })` - Initiate phone login
- `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` - Verify OTP
- `supabase.functions.invoke('send-notification', { body })` - Manual notification trigger (admin)

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/
  migrations/
    04_notification_system.sql          # Queue table, preferences, debounce trigger
  functions/
    send-notification/index.ts          # Edge Function: send SMS/email
    process-notification-queue/index.ts # Edge Function: sweep debounce queue
    _shared/
      twilio.ts                         # Twilio SMS helper
      resend.ts                         # Resend email helper
      email-templates/
        status-update.tsx               # React Email template
        rejection-notice.tsx            # Rejection-specific template

triple-j-auto-investment-main/
  services/
    registrationService.ts              # Update: add notification preference functions
    notificationService.ts              # NEW: client-side notification preference management
  pages/
    CustomerLogin.tsx                   # NEW: Phone OTP login page
    CustomerDashboard.tsx               # NEW: Logged-in multi-registration view
    CustomerStatusTracker.tsx           # UPDATE: Add preference toggle, login link
  pages/admin/
    Registrations.tsx                   # UPDATE: Add "Notify customer" checkbox + notification history
  components/
    NotificationPreferences.tsx         # NEW: SMS/Email/Both/None toggle
  types.ts                             # UPDATE: Add notification preference types
```

### Pattern 1: Database Webhook -> Edge Function -> SMS/Email

**What:** Status changes trigger notifications automatically via server-side pipeline
**When to use:** Every registration status change (6 transitions)

```
Admin changes status -> DB UPDATE registrations
                            |
                     DB Webhook fires (AFTER UPDATE on registrations)
                            |
                     Edge Function: send-notification
                            |
                     Check: Did current_stage change?
                            |
                     Check: Notification preferences
                            |
                     Check: Admin "notify" flag
                            |
                     Insert into notification_queue with send_after = NOW() + 5 min
                            |
                     pg_cron (every minute) picks up ready items
                            |
                     Edge Function: process-notification-queue
                            |
                     Send SMS via Twilio + Email via Resend
                            |
                     Log to registration_notifications (audit)
```

### Pattern 2: Debounce via Queue Table

**What:** Prevent rapid-fire notifications using a database queue with delayed send
**When to use:** All automatic notifications (admin-triggered debounce per CONTEXT.md: 5 minutes)

```sql
-- When webhook fires, insert/update queue entry:
INSERT INTO notification_queue (registration_id, new_stage, send_after)
VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
ON CONFLICT (registration_id)
DO UPDATE SET
  new_stage = EXCLUDED.new_stage,
  send_after = NOW() + INTERVAL '5 minutes',
  updated_at = NOW();

-- pg_cron every minute:
-- SELECT * FROM notification_queue WHERE send_after <= NOW() AND sent = false;
-- Process each, mark sent = true
```

This approach means if admin changes status 3 times in 2 minutes, only the final state is notified after the 5-minute window passes since the last change.

### Pattern 3: Phone OTP Customer Login via Supabase Auth

**What:** Customer signs in with phone number, receives SMS OTP, verifies
**When to use:** Returning customers wanting to see all their registrations

```typescript
// Step 1: Request OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555',
});

// Step 2: Verify OTP (user enters 6-digit code)
const { data: { session }, error } = await supabase.auth.verifyOtp({
  phone: '+13334445555',
  token: '123456',
  type: 'sms',
});

// Step 3: Fetch registrations for this phone number
// RLS policy: SELECT WHERE customer_phone = auth.jwt()->>'phone'
```

**Key design decision:** Supabase phone auth uses the same Twilio account configured in the Supabase dashboard. This means one Twilio account handles both:
1. Authentication OTPs (managed by Supabase internally)
2. Status change notifications (managed by our Edge Functions)

### Pattern 4: Token Link + Login Coexistence

**What:** Both anonymous token access (Phase 3) and authenticated login work
**When to use:** Customer can access via either path

```
Token link (/track/TJ-2026-0001-abc123...)
  -> CustomerStatusTracker (existing, shows single registration)
  -> "Have multiple registrations? Log in" link

Phone login (/login)
  -> CustomerLogin (new page, phone OTP flow)
  -> CustomerDashboard (shows all registrations for phone number)
  -> Each registration links to /track/:accessKey for detail

Session: Token access = no session (anonymous)
         Phone login = Supabase auth session (7 days, configurable)
```

**Recommendation for session duration:** 7 days (Supabase default). Customers check registration status infrequently. Short sessions would annoy returning visitors without meaningful security benefit (no sensitive actions available).

### Pattern 5: Admin "Notify Customer" Checkbox

**What:** Admin controls whether a status change triggers notification
**When to use:** In the existing confirmation dialog for status changes

```typescript
// Extend confirmDialog state:
const [notifyCustomer, setNotifyCustomer] = useState(true); // default: checked

// In handleConfirmedStatusChange, pass to updateRegistrationStatus:
await updateRegistrationStatus(registrationId, targetStage, {
  changeReason: notes,
  notifyCustomer: notifyCustomer, // stored in pending_notify_customer column
});

// The DB webhook Edge Function reads this flag to decide whether to queue notification
```

### Anti-Patterns to Avoid

- **Don't send notifications from the frontend:** API keys would be exposed in the browser; notifications wouldn't send if user closes browser before request completes
- **Don't use EmailJS for transactional notifications:** EmailJS is client-side; transactional notifications need server-side delivery for reliability
- **Don't use a simple setTimeout for debounce:** Server restarts would lose in-flight timers; database queue is durable
- **Don't create a separate user table for customers:** Use Supabase Auth users table; match by phone number to registrations
- **Don't hardcode notification templates in Edge Functions:** Use separate template files for maintainability

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS delivery | Raw HTTP to carrier APIs | Twilio REST API | Carrier negotiation, delivery receipts, phone number management, rate limiting |
| Phone OTP auth | Custom OTP generation + verification | Supabase Auth phone login | Rate limiting, brute-force protection, session management, token refresh |
| HTML email rendering | String concatenation of HTML | React Email components | Cross-client compatibility, responsive design, type-safe templates |
| Email delivery | SMTP configuration | Resend REST API | Deliverability, SPF/DKIM, bounce handling, analytics |
| Notification scheduling | setTimeout/setInterval | pg_cron + queue table | Survives restarts, atomic operations, queryable state |
| Debounce logic | Application-level timers | Database ON CONFLICT UPDATE | Atomic, survives server restarts, handles concurrent updates |
| Unsubscribe handling | Custom URL tokens | Database preference column + one-click update | Simple, no additional token management |

**Key insight:** This phase requires server-side infrastructure (Edge Functions) because SMS API keys must be kept secret. The existing client-side architecture (SPA + EmailJS) cannot safely send SMS. The Edge Function approach also ensures notifications send even if the admin closes their browser immediately after changing status.

---

## Common Pitfalls

### Pitfall 1: Twilio Trial Account Limitations

**What goes wrong:** SMS only sends to verified phone numbers during trial
**Why it happens:** Twilio trial accounts restrict outbound SMS to pre-verified numbers
**How to avoid:**
- Purchase a Twilio phone number ($1.15/month for a local number)
- Upgrade from trial before production deployment
- During development, add test phone numbers to Twilio's verified list
**Warning signs:** SMS sends succeed in Twilio console but customer never receives

### Pitfall 2: Supabase Phone Auth Shares SMS Provider Config

**What goes wrong:** Configuring Twilio for phone auth in Supabase dashboard AND using Twilio directly in Edge Functions causes confusion about which credentials are used where
**Why it happens:** Supabase uses the dashboard-configured Twilio for auth OTPs; Edge Functions use their own env vars
**How to avoid:**
- Dashboard Twilio config: Used ONLY for Supabase Auth phone OTP (signInWithOtp)
- Edge Function secrets: Used for notification SMS (status change alerts)
- Can use the SAME Twilio account/number for both, but configured in two places
- Document which config controls what
**Warning signs:** Auth OTP works but notification SMS fails, or vice versa

### Pitfall 3: Database Webhook Fires Before Triggers Complete

**What goes wrong:** Webhook payload has old data because BEFORE triggers haven't run
**Why it happens:** Database webhooks fire AFTER the row changes, but the webhook might see intermediate state
**How to avoid:**
- Webhooks fire AFTER all triggers (BEFORE and AFTER) complete
- Verify by logging the webhook payload in Edge Function
- The `record` field contains the final state of the row
**Warning signs:** Notification says wrong stage or missing milestone dates

### Pitfall 4: EmailJS and Resend Confusion

**What goes wrong:** Existing EmailJS code interferes with new Resend-based notifications
**Why it happens:** Codebase already has `sendRegistrationNotification()` in emailService.ts using EmailJS
**How to avoid:**
- Keep EmailJS for lead notifications (existing functionality, client-side)
- Use Resend via Edge Functions for registration status notifications (server-side)
- Mark the EmailJS `sendRegistrationNotification()` as deprecated
- Don't try to make EmailJS send rich HTML from the browser
**Warning signs:** Duplicate emails, or emails that don't send because wrong service is called

### Pitfall 5: Notification Queue Never Processes

**What goes wrong:** Notifications sit in queue and never send
**Why it happens:** pg_cron job not enabled, Edge Function URL wrong, or secrets not configured
**How to avoid:**
- Verify pg_cron extension is enabled in Supabase dashboard (Extensions page)
- Test the process-notification-queue Edge Function manually first
- Add monitoring: query for queue items older than 10 minutes as an alert
- Log queue processing results
**Warning signs:** notification_queue table grows but registration_notifications table doesn't

### Pitfall 6: Phone Number Format Inconsistency

**What goes wrong:** Phone stored as "(713) 555-0192" but Twilio requires "+17135550192"
**Why it happens:** User input varies; no normalization on save
**How to avoid:**
- Normalize phone numbers to E.164 format (+1XXXXXXXXXX) before storing
- Create a utility function: `normalizePhone(input: string): string`
- Validate phone format in registration creation form
- Supabase Auth also requires E.164 format for signInWithOtp
**Warning signs:** Twilio API returns "invalid phone number" errors

### Pitfall 7: Unsubscribed Customers Still Receive Auth OTP

**What goes wrong:** Customer sets preference to "None" but still gets OTP SMS when logging in
**Why it happens:** Notification preferences apply to status updates, not auth OTP
**How to avoid:**
- Clearly document that "None" preference means no STATUS notifications
- Auth OTP is a transactional message required for login, not a notification
- UI should explain: "You'll still receive verification codes when logging in"
**Warning signs:** Customer complaints about receiving SMS after opting out

---

## Database Schema Design

### Migration 04: Notification System

```sql
-- ================================================================
-- 1. NOTIFICATION QUEUE TABLE (Debounce mechanism)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,

  -- What changed
  old_stage VARCHAR(50),
  new_stage VARCHAR(50) NOT NULL,

  -- When to send (debounce: NOW() + 5 minutes)
  send_after TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),

  -- Processing state
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  error TEXT,

  -- Admin control
  notify_customer BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one pending notification per registration (debounce key)
  CONSTRAINT uq_pending_notification
    UNIQUE (registration_id) WHERE (sent = false)
);

-- This partial unique constraint is the core of the debounce:
-- INSERT ON CONFLICT updates the existing pending entry,
-- pushing send_after forward by another 5 minutes.

CREATE INDEX IF NOT EXISTS idx_notification_queue_ready
ON public.notification_queue(send_after)
WHERE sent = false;

-- ================================================================
-- 2. EXTEND registration_notifications TABLE
-- ================================================================
-- Table already exists from registration_ledger.sql
-- Add columns for richer audit trail

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS old_stage VARCHAR(50);

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS new_stage VARCHAR(50);

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS template_used VARCHAR(100);

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS provider_message_id TEXT; -- Twilio SID or Resend ID

-- ================================================================
-- 3. NOTIFICATION PREFERENCES
-- ================================================================
-- Store on the registrations table for simplicity
-- (customer may have different preferences per registration)

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS notification_pref VARCHAR(10) DEFAULT 'both'
  CHECK (notification_pref IN ('sms', 'email', 'both', 'none'));

-- ================================================================
-- 4. PENDING NOTIFY FLAG
-- ================================================================
-- Admin checkbox: should this status change trigger a notification?
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS pending_notify_customer BOOLEAN;

-- ================================================================
-- 5. DATABASE WEBHOOK TRIGGER HELPER
-- ================================================================
-- Function to insert/upsert into notification_queue on status change
CREATE OR REPLACE FUNCTION queue_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if status actually changed
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Upsert: if pending notification exists, update it (debounce)
    INSERT INTO public.notification_queue (
      registration_id, old_stage, new_stage, notify_customer, send_after
    ) VALUES (
      NEW.id,
      OLD.current_stage,
      NEW.current_stage,
      COALESCE(NEW.pending_notify_customer, TRUE),
      NOW() + INTERVAL '5 minutes'
    )
    ON CONFLICT ON CONSTRAINT uq_pending_notification
    DO UPDATE SET
      new_stage = EXCLUDED.new_stage,
      notify_customer = EXCLUDED.notify_customer,
      send_after = NOW() + INTERVAL '5 minutes',
      updated_at = NOW();

    -- Clear the flag
    NEW.pending_notify_customer := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_notification_on_status_change
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION queue_status_notification();
```

### Notification Preference Storage

**Decision:** Store `notification_pref` on the registrations table (not a separate table).

**Rationale:**
- A customer may have different preferences per registration
- Keeps queries simple: one join, not two
- Default is 'both' (SMS + Email), matching CONTEXT.md opt-out model
- Values: 'sms' | 'email' | 'both' | 'none'

### Customer Phone/Email Already Exist

The registrations table already has `customer_email` and `customer_phone` columns (from registration_ledger.sql migration 01). These are currently optional (`TEXT` without NOT NULL). For Phase 4:
- Phone is required for SMS notifications and OTP login
- Email is optional but recommended
- Registration creation form should encourage both
- Normalize phone to E.164 format before storing

---

## Edge Function Design

### send-notification (Webhook Handler)

This Edge Function is triggered by a database webhook on the `notification_queue` table INSERT/UPDATE events. However, the recommended approach is simpler: use pg_cron to invoke the queue processor directly.

### process-notification-queue (Cron Job)

```typescript
// supabase/functions/process-notification-queue/index.ts
// Triggered by pg_cron every minute
// Processes all ready items in notification_queue

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Fetch ready queue items
  const { data: queue } = await supabase
    .from('notification_queue')
    .select('*, registrations(*)')
    .eq('sent', false)
    .lte('send_after', new Date().toISOString())
    .eq('notify_customer', true);

  for (const item of queue || []) {
    const reg = item.registrations;

    // Check notification preferences
    if (reg.notification_pref === 'none') {
      // Mark as sent without sending
      await markSent(item.id, 'skipped_preference_none');
      continue;
    }

    // Send SMS if preference includes SMS
    if (['sms', 'both'].includes(reg.notification_pref) && reg.customer_phone) {
      await sendSms(reg, item.new_stage);
    }

    // Send email if preference includes email
    if (['email', 'both'].includes(reg.notification_pref) && reg.customer_email) {
      await sendEmail(reg, item.new_stage);
    }

    await markSent(item.id);
  }

  return new Response(JSON.stringify({ processed: queue?.length || 0 }));
});
```

### Twilio SMS via REST API (No SDK Needed)

```typescript
// supabase/functions/_shared/twilio.ts
// Twilio REST API - no npm package needed, just fetch()

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;

export async function sendSms(to: string, body: string): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
}> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return { success: true, sid: data.sid };
  } else {
    return { success: false, error: data.message || 'Unknown error' };
  }
}
```

### Resend Email via REST API

```typescript
// supabase/functions/_shared/resend.ts

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: params.from || 'Triple J Auto Investment <notifications@triplejautoinvestment.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return { success: true, id: data.id };
  } else {
    return { success: false, error: data.message || 'Unknown error' };
  }
}
```

---

## SMS Provider Recommendation: Twilio

**Confidence:** HIGH

### Why Twilio Over Vonage

| Factor | Twilio | Vonage |
|--------|--------|--------|
| Supabase integration | Native support for phone auth | Supported but less documented |
| Documentation | Excellent, TypeScript examples | Good but sparser |
| REST API simplicity | Basic auth + form-encoded POST | API key header + JSON POST |
| US SMS pricing | $0.0083/message + ~$0.003 carrier fee | ~$0.0068/message |
| Phone number cost | $1.15/month (local) | $1.00/month (local) |
| OTP + Notifications | One account for both | Would need separate config |
| Community/Stack Overflow | Largest community | Smaller community |
| Getting started | 10-minute quickstart | 15-minute quickstart |

**Decision: Twilio.** The price difference is negligible at this volume (~100 SMS/month at $0.83/month vs $0.68/month). The native Supabase phone auth integration and superior documentation make Twilio the pragmatic choice. Using one Twilio account for both auth OTP and notification SMS simplifies operations.

### Twilio Cost Estimate (Monthly)

| Item | Cost |
|------|------|
| Phone number (local) | $1.15 |
| ~50 notification SMS/month | $0.42 |
| ~30 OTP SMS/month (customer logins) | $0.25 |
| Carrier fees (~$0.003/msg) | $0.24 |
| **Total** | **~$2.06/month** |

---

## Email Strategy

### EmailJS vs Resend

| Factor | EmailJS (existing) | Resend (new) |
|--------|-------------------|--------------|
| Execution | Client-side (browser) | Server-side (Edge Function) |
| Rich HTML | Limited template editor | Full HTML, React Email components |
| Reliability | Depends on user's browser | Sends regardless of browser state |
| Cost | Free tier: 200 emails/month | Free tier: 3,000 emails/month |
| API keys | Exposed in frontend (public key) | Server-side secrets only |

**Decision: Use both.**
- **EmailJS stays** for lead notification emails (existing, working, client-side)
- **Resend** for registration status notification emails (new, server-side, rich HTML)
- Mark `sendRegistrationNotification()` in emailService.ts as deprecated

### Rich HTML Email Templates

EmailJS supports custom HTML but is limited to its template editor. For the "mini progress visualization" required by CONTEXT.md, use React Email components rendered in the Edge Function:

```tsx
// supabase/functions/_shared/email-templates/status-update.tsx
import { Html, Head, Body, Container, Section, Text, Link, Hr } from 'npm:@react-email/components@^1.0.0';

// Renders to static HTML string via render() utility
// Include inline CSS for email client compatibility
// Progress visualization: table-based layout with colored cells
```

**React Email in Supabase Edge Functions:** Confirmed compatible. Requires `deno.json` configuration with `"jsx": "react-jsx"` and `"jsxImportSource": "react"`. Import via npm specifier: `npm:@react-email/components`.

### Resend Setup Requirements

1. Create Resend account at resend.com
2. Verify domain (triplejautoinvestment.com) for custom from address
3. Or use resend.dev domain for testing (e.g., `onboarding@resend.dev`)
4. Get API key, store as Edge Function secret
5. Free tier: 3,000 emails/month, 100/day (more than sufficient)

---

## Supabase Phone OTP Auth

**Confidence:** HIGH

### How It Works

1. **Dashboard Config:** Enable Phone Auth in Supabase Dashboard -> Auth -> Providers -> Phone
2. **SMS Provider Config:** Enter Twilio Account SID, Auth Token, and Messaging Service SID in the same dashboard
3. **Client Code:** Use `supabase.auth.signInWithOtp({ phone })` and `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
4. **OTP Details:** 6-digit code, 60-second rate limit between requests, 1-hour expiry

### RLS for Logged-In Customers

```sql
-- Customer can view their registrations by matching phone number
CREATE POLICY "Customers can view own registrations by phone"
ON public.registrations
FOR SELECT TO authenticated
USING (
  customer_phone = (auth.jwt()->>'phone')
);
```

This policy lets a logged-in customer (via phone OTP) see all registrations where the `customer_phone` matches their authenticated phone number.

### Phone Number Normalization

Supabase Auth stores phone in E.164 format (+1XXXXXXXXXX). The `customer_phone` column must match this format for the RLS policy to work. Add a normalization function:

```typescript
export function normalizePhone(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, '');
  // Add US country code if not present
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
```

---

## Debounce Implementation

**Confidence:** HIGH

### Approach: Database Queue Table + pg_cron

**Why not Edge Function delay:**
- Edge Functions have execution time limits
- Server restarts lose in-progress delays
- Multiple concurrent webhooks would create race conditions

**Why not application-level debounce:**
- SPA client-side cannot reliably debounce server-side events
- Admin might close browser after status change

**Why database queue:**
- Durable (survives restarts)
- Atomic (ON CONFLICT handles concurrent updates)
- Observable (query the queue for debugging)
- Simple (one table, one pg_cron job, one Edge Function)

### Flow

1. Admin changes status -> DB trigger `queue_status_notification()` fires
2. Trigger inserts/upserts into `notification_queue` with `send_after = NOW() + 5 min`
3. If admin changes status again within 5 minutes, the ON CONFLICT updates `send_after` to NOW() + 5 min and updates `new_stage` to the latest
4. pg_cron job runs every minute, invokes `process-notification-queue` Edge Function
5. Edge Function queries ready items (`send_after <= NOW() AND sent = false`)
6. Sends SMS/email, logs to `registration_notifications`, marks queue item as sent

### pg_cron Setup

```sql
-- Enable pg_cron extension (via Supabase Dashboard -> Extensions)
-- Schedule the queue processor to run every minute:
SELECT cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/process-notification-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Notification Templates

### SMS Templates

```typescript
const SMS_TEMPLATES = {
  // Standard stage change
  stage_update: (reg: Registration, stageName: string) =>
    `Hi ${reg.customerName}, your ${reg.vehicleYear} ${reg.vehicleMake} ${reg.vehicleModel} ` +
    `registration is now at ${stageName}. ` +
    `View details: ${BASE_URL}/track/${reg.orderId}-${reg.accessToken}` +
    `\nReply STOP to unsubscribe`,

  // Rejection (special template per CONTEXT.md)
  rejection: (reg: Registration) =>
    `Hi ${reg.customerName}, your ${reg.vehicleYear} ${reg.vehicleMake} ${reg.vehicleModel} ` +
    `registration was returned by DMV for corrections. ` +
    `Our team is addressing this. ` +
    `View details: ${BASE_URL}/track/${reg.orderId}-${reg.accessToken}` +
    `\nQuestions? Call (832) 400-9760` +
    `\nReply STOP to unsubscribe`,
};
```

### Email Template Structure (React Email)

The rich HTML email should include:
- Header with Triple J logo
- Vehicle info (year, make, model)
- Mini progress visualization (table-based, 6 colored cells)
- Stage description
- "View Full Status" button linking to tracker
- Contact info footer
- Unsubscribe link
- Rejection template variant with extra context

---

## Unsubscribe Implementation

### SMS: STOP Keyword

Twilio automatically handles STOP/START keywords when using a Messaging Service. When a customer texts STOP:
1. Twilio blocks future messages to that number from your Twilio number
2. Twilio sends a confirmation: "You have successfully been unsubscribed..."
3. Your application should also update `notification_pref` to remove SMS

To detect opt-out, configure a Twilio webhook for incoming messages and check for STOP keyword.

### Email: Unsubscribe Link

Include an unsubscribe link in every email:
```
https://triplejautoinvestment.com/unsubscribe?reg={registrationId}&token={accessToken}
```

This link goes to an Edge Function that sets `notification_pref` to 'none' (or removes 'email' from 'both').

### Preference Management UI

Both the tracker page and logged-in dashboard show a gear icon or "Notification Preferences" section:
```
Notification Preferences
[x] SMS updates  [ ] Email updates

You'll still receive verification codes when logging in.
```

---

## Existing Code Integration Points

### registrationService.ts - Already Has

- `logNotification()` function for audit trail (lines 756-785)
- `updateRegistrationStatus()` with `pending_change_reason` pattern (lines 342-386)
- `getTrackingLink()` for generating customer URLs (lines 157-159)
- `transformRegistration()` already maps `customer_email` and `customer_phone`

### types.ts - Already Has

- `RegistrationNotification` interface (lines 238-250)
- Needs update: Add notification preference to `Registration` interface
- Needs update: Expand `RegistrationNotification` with new fields

### pages/admin/Registrations.tsx - Modify

- Add "Notify customer" checkbox to status change confirmation dialog (lines 914-984)
- Add notification history view per registration
- Pass `notifyCustomer` flag through to `updateRegistrationStatus()`

### EmailJS emailService.ts - Deprecate Partially

- Keep `sendLeadNotification()` (working, client-side lead capture)
- Deprecate `sendRegistrationNotification()` (replaced by Edge Function + Resend)

---

## State of the Art

| Old Approach (Current) | New Approach (Phase 4) | Impact |
|------------------------|------------------------|--------|
| No notifications | SMS + Email on every stage change | Customers stay informed proactively |
| No customer login | Phone OTP via Supabase Auth | Returning customers see all registrations |
| Client-side email (EmailJS) | Server-side email (Resend via Edge Function) | Reliable delivery, rich HTML, no browser dependency |
| No SMS capability | Twilio REST API via Edge Function | SMS as primary channel per CONTEXT.md |
| No debounce | Database queue with 5-min delay | Prevents spam on rapid admin corrections |
| No notification preferences | SMS/Email/Both/None per registration | TCPA compliance, customer control |
| Token-only access | Token + phone login coexistence | Multiple registrations visible to returning customers |

---

## Open Questions

### Resolved During Research

1. **SMS provider choice?** Resolved: Twilio. Native Supabase integration, one account for auth + notifications, best docs, negligible price difference from Vonage.

2. **EmailJS for notifications?** Resolved: No. Keep EmailJS for leads. Use Resend for registration notifications (server-side, rich HTML, free tier sufficient).

3. **Debounce approach?** Resolved: Database queue table with partial unique constraint + pg_cron. Durable, atomic, observable.

4. **Customer phone/email columns?** Resolved: Already exist on registrations table from initial migration. Just need E.164 normalization.

5. **React Email in Edge Functions?** Resolved: Compatible with Deno runtime via npm imports. Requires deno.json JSX config.

### For Planning Phase

1. **Resend domain verification**
   - What we know: Resend requires domain verification for custom from addresses
   - What's unclear: Whether the user has DNS access to triplejautoinvestment.com for DKIM/SPF records
   - Recommendation: Start with `onboarding@resend.dev` during development; verify domain before production

2. **Twilio Messaging Service vs Phone Number**
   - What we know: Supabase dashboard asks for "Messaging Service SID" (not phone number)
   - What's unclear: Whether a Messaging Service is required or if a simple phone number works
   - Recommendation: Create a Messaging Service in Twilio (wraps phone number), use its SID for Supabase config

3. **Edge Function deployment workflow**
   - What we know: Edge Functions deploy via Supabase CLI (`supabase functions deploy`)
   - What's unclear: Whether the user has Supabase CLI installed and configured
   - Recommendation: Include CLI setup instructions in the plan

---

## Sources

### Primary (HIGH confidence)
- [Supabase Phone Login Docs](https://supabase.com/docs/guides/auth/phone-login) - OTP flow, supported providers, rate limits
- [Supabase Phone Auth with Twilio](https://supabase.com/docs/guides/auth/phone-login/twilio) - signInWithOtp/verifyOtp API
- [Supabase Database Webhooks Docs](https://supabase.com/docs/guides/database/webhooks) - Webhook events, payload format
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions) - Deno runtime, deployment, secrets
- [Supabase Send Email Example](https://supabase.com/docs/guides/functions/examples/send-emails) - Resend integration code
- [Supabase Schedule Functions](https://supabase.com/docs/guides/functions/schedule-functions) - pg_cron + pg_net setup
- [Supabase Send SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook) - Custom SMS provider hook
- [Twilio SMS US Pricing](https://www.twilio.com/en-us/sms/pricing/us) - $0.0083/msg + $1.15/month number
- [Twilio REST API](https://www.twilio.com/docs/usage/api) - Basic auth, Messages endpoint
- [Resend Pricing](https://resend.com/pricing) - Free tier: 3,000/month
- Existing codebase: `registrationService.ts`, `emailService.ts`, `types.ts`, `registration_ledger.sql`, `auth.ts`

### Secondary (MEDIUM confidence)
- [Supabase Edge Functions NPM Compatibility](https://supabase.com/blog/edge-functions-node-npm) - npm imports in Deno
- [React Email + Supabase Discussion](https://github.com/orgs/supabase/discussions/40286) - JSX config for Deno
- [React Email Render Docs](https://react.email/docs/utilities/render) - Server-side HTML generation
- [Resend + Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions) - Official integration guide
- [Notification Debounce with Postgres](https://dev.to/inngest/debounce-messages-in-queueing-systems-how-to-do-it-with-postgres-4jmj) - Queue table pattern

### Tertiary (LOW confidence)
- [Twilio vs Vonage Comparison](https://www.courier.com/integrations/compare/twilio-vs-vonage) - Pricing comparison, may not reflect latest rates
- [EmailJS Template Docs](https://www.emailjs.com/docs/user-guide/creating-email-templates/) - HTML support confirmation

---

## Metadata

**Confidence breakdown:**
- SMS provider (Twilio): HIGH - Official Supabase integration, verified pricing, REST API well-documented
- Phone OTP auth: HIGH - Supabase native feature, signInWithOtp API verified
- Email (Resend): HIGH - Official Supabase recommendation, Edge Function example verified
- Debounce approach: HIGH - Standard database queue pattern, pg_cron officially supported
- React Email in Edge Functions: MEDIUM - Confirmed compatible in community discussions, requires JSX config
- Notification templates: MEDIUM - Based on codebase patterns and CONTEXT.md requirements
- Unsubscribe/compliance: MEDIUM - Standard patterns, Twilio STOP handling documented

**Research date:** 2026-02-08
**Valid until:** 60 days (stable APIs, unlikely to change)
