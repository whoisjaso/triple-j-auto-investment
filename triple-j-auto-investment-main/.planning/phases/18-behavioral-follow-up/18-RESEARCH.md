# Phase 18: Behavioral Follow-Up - Research

**Researched:** 2026-02-21
**Domain:** Automated behavioral re-engagement — Supabase queue/cron, Twilio SMS, Resend email, Retell AI voice, session_events data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Trigger rules & timing:** One message per trigger type per visitor (browse gets one, save gets one, abandon gets one — never repeated). If multiple triggers fire, highest commitment wins (form_abandon > save > browse). No business-hours restriction. Timing: browse=24h, save=4h, abandon=1h.
- **Message content:** Always vehicle-specific — reference year/make/model. Every message includes vehicle page link AND dealership phone (832) 400-9760 as CTAs.
- **Channel stack:** Full 3-channel: SMS (Twilio) + Email (Resend) + Retell AI voice calls.
- **Opt-out:** STOP keyword for SMS (Twilio), unsubscribe link for email (existing Phase 9 Edge Function). Consent via small-print on form submission.
- **Conversion stop:** Auto-cancel pending follow-ups when lead is marked contacted/converted.
- **Eligibility:** Only leads who provided phone numbers through forms — anonymous browsers don't get messaged.
- **Tier 4 (Returning Visitor):** FOLLOW-05 is about surfacing previously-viewed vehicles prominently — NOT a new outbound message.

### Claude's Discretion

- Exact delay timings per tier (roadmap suggests 24h/4h/1h/2h)
- Priority logic when multiple triggers fire for same visitor
- Tone calibration per tier (casual vs professional gradient)
- Bilingual detection method
- Channel routing strategy (escalation vs tier-matched)
- Voice call trigger threshold
- SMS budget cap (if any)
- Admin queue visibility level
- Eligibility boundary for messaging
- Opt-out implementation per channel
- Consent language/placement on forms
- Conversion auto-stop logic

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOLLOW-01 | Tier 1 — SMS 24hr after browse-only with vehicle they viewed longest | session_events `dwell` events with `dwell_seconds` in metadata identify longest-viewed vehicle; leads table phone linkage via session_id enables SMS |
| FOLLOW-02 | Tier 2 — SMS 4hr after save/favorite (scarcity + loss aversion trigger) | `save_toggle` events in session_events; vehicle_view_counts for real scarcity data; leads table phone linkage |
| FOLLOW-03 | Tier 3 — SMS/email 1hr after abandoned form ("Your info is saved") | `form_open` events without matching lead submission within session; phone from partial form capture |
| FOLLOW-04 | Tier 4 — AI voice call 2hr after question without scheduling | ask_question leads without follow-up schedule_visit lead; Retell triggerOutboundCall() already exists |
| FOLLOW-05 | Return visitor recognition — surface previously viewed vehicles on return | useRecentlyViewed localStorage hook already populates RecentlyViewedRow; this is a UI surfacing task, not outbound messaging |
</phase_requirements>

---

## Summary

Phase 18 builds a behavioral re-engagement engine on top of infrastructure that is almost entirely already in place. The project has Twilio SMS, Resend email, and Retell AI voice already wired into Edge Functions. The session_events table (Phase 16) tracks browse, save, form_open, and dwell events with vehicle context. The leads table stores phone numbers for anyone who submitted a form. The critical design problem is: **how do you match an anonymous session's behavior to a person with a phone number?**

The answer is the `session_id` column on leads. When a visitor submits any form (price_alert, vehicle_report, schedule_visit, ask_question, reserve), the lead is created with their `session_id` (from localStorage). The session_events table also carries `session_id`. So the join is: leads.session_id = session_events.session_id. This gives you phone + vehicle + behavioral signal in a single query.

The architecture mirrors the existing notification_queue pattern from Phase 9: a PostgreSQL table holds pending follow-ups with a `send_after` timestamp, a pg_cron job fires every minute to check for ready items, and a Supabase Edge Function processes each item by calling Twilio/Resend/Retell. A Postgres trigger or scheduled function enqueues follow-ups when behavioral events are detected. FOLLOW-05 (return visitor recognition) is already substantially implemented via useRecentlyViewed.ts + RecentlyViewedRow.tsx — it needs only minor surfacing improvements, not a new outbound message system.

**Primary recommendation:** Implement Phase 18 as: (1) a new `follow_up_queue` DB table + pg_cron enqueuer function, (2) a `process-follow-up-queue` Edge Function that dispatches SMS/email/voice, (3) a `detect-follow-up-triggers` pg_cron job that scans session_events daily/hourly to enqueue leads, and (4) minor admin UI additions for queue visibility. FOLLOW-05 is a frontend-only task using the existing hooks.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase pg_cron | Built-in (requires extension) | Schedule trigger detection + queue processing | Already used in Phase 9 + 16 migrations; project pattern |
| Supabase pg_net | Built-in (requires extension) | HTTP calls from pg_cron to Edge Functions | Already used in Phase 9 notification queue |
| Twilio REST API | Direct fetch (no SDK) | Outbound SMS | Already in `_shared/twilio.ts` — use verbatim |
| Resend REST API | Direct fetch (no SDK) | Follow-up email | Already in `_shared/resend.ts` — use verbatim |
| Retell AI v2 | Direct fetch (no SDK) | AI voice calls (Tier 4) | Already in `retellService.ts` — adapt for Edge Function use |
| Supabase Edge Functions (Deno) | Current | Server-side queue processor | All messaging logic must be server-side |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React (existing) | 19 | FOLLOW-05 UI surfacing | Already in VehicleDetail, Inventory |
| useRecentlyViewed.ts | Existing hook | FOLLOW-05 recently viewed data | Already implemented — may just need surfacing priority changes |
| Framer Motion | Existing | Animate returning-visitor surface | Already in project for transitions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_cron polling queue | Database triggers on session_events | Triggers fire synchronously on every insert — bad for high-volume tracking table. Cron polling is safer |
| Supabase Edge Function per trigger | Frontend calling API on unload | Frontend is unreliable (tab close, offline) — server-side is required |
| Custom queue table | Supabase pgmq | pgmq adds retry/visibility timeout but is not already used in project — follow existing notification_queue pattern |

**Installation:** No new packages needed. All infrastructure exists.

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/
├── functions/
│   ├── _shared/
│   │   ├── twilio.ts              # EXISTING — use as-is
│   │   └── resend.ts              # EXISTING — use as-is
│   └── process-follow-up-queue/
│       └── index.ts               # NEW — mirrors process-notification-queue
├── phase-18-migration.sql         # NEW — follow_up_queue table + enqueue function + cron jobs
services/
└── followUpService.ts             # NEW — client-side trigger for FOLLOW-05 surfacing (minimal)
components/admin/
└── AdminFollowUpPanel.tsx         # NEW — admin queue visibility
pages/admin/
└── Dashboard.tsx                  # MODIFY — add collapsible Follow-Up section
```

### Pattern 1: Queue Table Matches Existing Notification Queue

The project already uses `notification_queue` (Phase 9) with this pattern:

```
behavioral event detected
  → INSERT into follow_up_queue (send_after = NOW() + interval)
  → pg_cron fires every minute
  → process-follow-up-queue Edge Function: SELECT * WHERE sent=false AND send_after <= NOW()
  → call Twilio/Resend/Retell
  → UPDATE follow_up_queue SET sent=true
```

**What:** A `follow_up_queue` table stores pending messages with: lead_id (FK to leads), trigger_type (browse/save/abandon/voice), channel (sms/email/voice), vehicle_id, send_after, sent, sent_at, error, cancelled.

**When to use:** All tiers. One row per trigger type per lead (partial unique index on `(lead_id, trigger_type) WHERE sent=false AND cancelled=false`).

**Example schema:**
```sql
-- Source: Mirrors Phase 9 notification_queue pattern (verified in codebase)
CREATE TABLE public.follow_up_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('browse', 'save', 'abandon', 'voice')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'voice')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_slug TEXT,
  views_7d INTEGER DEFAULT 0,
  send_after TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One pending follow-up per trigger type per lead (dedup/debounce)
CREATE UNIQUE INDEX uq_pending_follow_up
ON public.follow_up_queue (lead_id, trigger_type)
WHERE (sent = false AND cancelled = false);
```

### Pattern 2: Trigger Detection via pg_cron Scheduled Function

Detection of behavioral triggers requires scanning session_events and joining leads. This is done by a scheduled Postgres function, not a DB trigger on session_events (which fires on every single insert — too hot).

```sql
-- Source: Project pattern from phase-16-migration.sql + phase-9 04_notification_system.sql
-- Runs hourly. Finds sessions with form_open but no lead in last 2 hours (abandon).
-- Finds sessions with save_toggle events linked to a lead via session_id.
-- Finds sessions with dwell/vehicle_view but no save/form — browse-only.
-- Enqueues into follow_up_queue if not already queued.

CREATE OR REPLACE FUNCTION enqueue_behavioral_follow_ups()
RETURNS VOID AS $$
DECLARE
  -- ... see Code Examples section
BEGIN
  -- Tier 1: Browse-only (session has vehicle_view/dwell, has lead, no form_open/save in this session)
  -- Tier 2: Save (session has save_toggle, has lead)
  -- Tier 3: Abandon (session has form_open, has lead phone, but no lead.action_type = non-contact in last 2h)
  -- Tier 4: Voice (lead.action_type = 'ask_question', no follow-up schedule_visit in 2h)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Session-to-Lead Join

**The core linkage:** `leads.session_id` is the bridge between anonymous behavior data and a person's phone number.

```sql
-- Source: Verified in phase-16-migration.sql (session_id column on leads)
-- and trackingService.ts (getSessionId() → same localStorage key used in attributionService.ts)

-- Example: Find leads eligible for browse-only follow-up
SELECT
  l.id AS lead_id,
  l.phone,
  l.session_id,
  -- Find vehicle with max dwell time in this session
  se.vehicle_id,
  v.year, v.make, v.model, v.slug,
  SUM((se.metadata->>'dwell_seconds')::int) AS total_dwell
FROM public.leads l
JOIN public.session_events se ON se.session_id = l.session_id
JOIN public.vehicles v ON v.id = se.vehicle_id
WHERE
  se.event_type = 'dwell'
  AND l.phone IS NOT NULL AND l.phone != ''
  AND l.status = 'New'  -- not yet contacted
  AND l.created_at > NOW() - INTERVAL '48 hours'  -- recent leads only
  -- Not already queued for browse
  AND NOT EXISTS (
    SELECT 1 FROM public.follow_up_queue fq
    WHERE fq.lead_id = l.id AND fq.trigger_type = 'browse'
  )
GROUP BY l.id, l.phone, l.session_id, se.vehicle_id, v.year, v.make, v.model, v.slug
ORDER BY total_dwell DESC;
```

### Pattern 4: Channel Routing Strategy (Tier-Matched, Not Escalation Ladder)

Based on the context decisions and industry patterns for a small Texas BHPH dealer:

| Tier | Trigger | Delay | Channel | Why |
|------|---------|-------|---------|-----|
| 1 (Browse) | Vehicle view + dwell, no form submission | 24h | SMS only | Low commitment — single low-friction touchpoint |
| 2 (Save) | save_toggle event + lead phone | 4h | SMS only | Medium commitment — scarcity signal, SMS is immediate |
| 3 (Abandon) | form_open without completed lead submission | 1h | SMS + Email | High intent — captured partial info; dual channel reinforces urgency |
| 4 (Voice) | ask_question lead, no schedule_visit in 2h | 2h | Retell voice call | Highest commitment — they asked a question, human-feel follow-up |

**Rationale:** Escalation ladder (SMS → email → voice for same person) creates annoyance. Tier-matching means each tier gets the appropriate channel at first contact. One message per trigger, never repeated.

### Pattern 5: FOLLOW-05 (Return Visitor) — Frontend Only

FOLLOW-05 requires no outbound messaging. The useRecentlyViewed hook (Phase 16) already tracks viewed vehicles in localStorage. The RecentlyViewedRow component already surfaces them on Inventory page. The success criterion — "previously viewed vehicles surfaced prominently without needing to search again" — is already partially met.

What FOLLOW-05 may add:
- Ensure RecentlyViewedRow appears at top of Inventory page (above grid) — already done per Phase 16 STATE.md
- On VehicleDetail page, a "You were looking at this" pill/badge on return if the visitor previously viewed this exact vehicle
- Possibly a "Welcome back" toast with a link to most recently viewed vehicle on Inventory/Home page load

This is a small UI task — no new backend, no new Edge Functions.

### Anti-Patterns to Avoid

- **Triggering on session_events row insert:** session_events gets a row for every page view and every tracked interaction — a trigger on it fires hundreds of times per session. Use scheduled function instead.
- **Queuing anonymous sessions:** Only queue leads with `leads.session_id` match AND `leads.phone IS NOT NULL`. Anonymous browsers cannot be messaged — no phone.
- **Calling Retell from pg_cron directly:** Retell uses VITE_ env vars in the current retellService.ts (client-side). For Tier 4, Retell must be called from the Edge Function with server-side credentials (RETELL_API_KEY as Deno secret, not VITE_).
- **Sending duplicate messages:** The partial unique index on `(lead_id, trigger_type) WHERE sent=false AND cancelled=false` prevents duplicates. Additionally, the detection query must check `NOT EXISTS (SELECT 1 FROM follow_up_queue WHERE lead_id=... AND trigger_type=...)` before inserting.
- **Never cancelling on conversion:** When admin marks a lead as 'Contacted' or 'Closed', all pending follow_up_queue rows for that lead should be `SET cancelled=true, cancelled_reason='lead_converted'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS delivery | Custom HTTP Twilio wrapper | `_shared/twilio.ts` (existing) | Already handles auth, error cases, logging |
| Email delivery | Custom Resend wrapper | `_shared/resend.ts` (existing) | Already handles auth, error logging |
| AI voice calls | New Retell integration | Adapt retellService.ts patterns into Edge Function | Same API, just move RETELL_API_KEY to Deno.env |
| Queue deduplication | Custom application logic | Postgres partial unique index | Database-level guarantee, no race conditions |
| Opt-out tracking | Custom STOP webhook parser | Twilio auto-handles STOP at carrier level | Twilio natively blocks re-sends to opted-out numbers. No webhook needed for basic compliance. |
| Cron scheduling | Node.js cron / external scheduler | pg_cron (already in Phase 9 migration) | Database-native, survives Edge Function restarts |

**Key insight:** The entire messaging infrastructure stack exists. Phase 18 is primarily wiring behavioral detection to the existing delivery stack, not building new delivery capabilities.

---

## Common Pitfalls

### Pitfall 1: Retell Credentials Are Client-Side

**What goes wrong:** `retellService.ts` uses `import.meta.env.VITE_RETELL_API_KEY` — a client-side env var. You cannot use this in a Deno Edge Function.

**Why it happens:** retellService.ts was built for direct frontend use in Phase 17. Edge Functions use `Deno.env.get()`.

**How to avoid:** In the `process-follow-up-queue` Edge Function, call Retell directly using `Deno.env.get('RETELL_API_KEY')` (a new secret to configure). The API call shape is already documented in retellService.ts — copy the fetch pattern, adapt for Deno.

**Warning signs:** TypeScript error on `import.meta.env` inside a Deno file.

### Pitfall 2: Session ID Is Only Available When a Lead Exists

**What goes wrong:** Tier 1 (browse-only) assumes you can message any browsing visitor. But anonymous visitors have no phone number.

**Why it happens:** The session_id in localStorage is anonymous until a form is submitted. Leads.session_id is populated only when captureAttribution() runs at form submission.

**How to avoid:** All trigger detection queries must JOIN leads ON leads.session_id = session_events.session_id AND leads.phone IS NOT NULL. Browse-only means "has lead with phone, but that session had no save/form_open events." There will be fewer Tier 1 messages than expected — this is correct behavior.

**Warning signs:** Enqueuing leads without validating phone exists.

### Pitfall 3: Save Is in localStorage, Not session_events (Partially)

**What goes wrong:** The `save_toggle` event IS tracked in session_events (Phase 16, form_open tracking via onClickCapture). However, useSavedVehicles stores IDs in localStorage as `tj_saved_vehicles`. You must rely on session_events save_toggle events for server-side detection, not the localStorage key.

**Why it happens:** Two parallel systems track saves — one for UI state (localStorage) and one for analytics (session_events).

**How to avoid:** Tier 2 detection uses: `session_events WHERE event_type = 'save_toggle' AND session_id IN (SELECT session_id FROM leads WHERE phone IS NOT NULL)`.

**Warning signs:** Trying to read localStorage from a Postgres function (impossible).

### Pitfall 4: pg_cron Requires Pro Plan on Supabase (Or Manual Enable)

**What goes wrong:** Phase 9 already documents this: pg_cron/pg_net sections were SKIPPED in migrations because they require the Pro plan or manual extension enable.

**Why it happens:** Supabase Free tier may not have pg_cron available in all regions.

**How to avoid:** Phase 18 migration must include the same pattern as Phase 16: `CREATE EXTENSION IF NOT EXISTS pg_cron;` with a notice that it requires Pro plan or Dashboard enable. The detection cron job runs every hour (not every minute) to reduce load — appropriate for 1h/4h/24h delays.

**Warning signs:** `ERROR: extension "pg_cron" does not exist` during migration.

### Pitfall 5: Tier 3 (Form Abandon) Detection Is Hard

**What goes wrong:** "Abandoned a form mid-completion" is difficult to detect server-side. form_open events fire when a form is clicked/opened. A lead row exists if the form was submitted. Abandon = form_open event with no matching lead created in the same session within a reasonable window.

**Why it happens:** There's a time window problem — the visitor might still be typing. A 1-hour delay after form_open with no lead = likely abandon.

**How to avoid:** Tier 3 detection query: `session_events WHERE event_type = 'form_open' AND session_id IN (leads) AND created_at BETWEEN NOW()-3h AND NOW()-1h` AND that session has NO lead created AFTER the form_open event. This gives a 1-2h window to confirm abandonment before queuing.

**Warning signs:** Messaging someone who just took 45 minutes to complete a form.

### Pitfall 6: Twilio STOP Opt-Out

**What goes wrong:** If you send to a number that has opted out (texted STOP), Twilio will return error 21610: "Attempt to send to unsubscribed recipient."

**Why it happens:** Twilio auto-manages a blocklist per number. Your message just fails.

**How to avoid:** Log Twilio errors in follow_up_queue.error column. Do NOT retry 21610 errors. Twilio handles the compliance layer automatically — you don't need to parse STOP webhooks for basic opt-out compliance. The existing `_shared/twilio.ts` already returns `{ success: false, error: errorMsg }` which gets logged.

---

## Code Examples

### Example 1: Follow-Up Queue Table

```sql
-- Source: Codebase verification — mirrors Phase 9 notification_queue pattern
-- File: supabase/phase-18-migration.sql (to be created)

CREATE TABLE public.follow_up_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('browse', 'save', 'abandon', 'voice')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'voice')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_slug TEXT,
  views_7d INTEGER DEFAULT 0,       -- For scarcity signal in Tier 2
  send_after TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deduplication: one pending follow-up per trigger type per lead
CREATE UNIQUE INDEX uq_pending_follow_up
ON public.follow_up_queue (lead_id, trigger_type)
WHERE (sent = false AND cancelled = false);

-- Processing index
CREATE INDEX idx_follow_up_queue_ready
ON public.follow_up_queue(send_after)
WHERE sent = false AND cancelled = false;

-- RLS: admin only
ALTER TABLE public.follow_up_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage follow_up_queue"
ON public.follow_up_queue FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
```

### Example 2: Tier 1 Browse-Only Detection Query

```sql
-- Source: Derived from session_events schema (phase-16-migration.sql) + leads schema
-- Finds leads whose session had vehicle dwell but no save/form_open/lead submission

INSERT INTO public.follow_up_queue
  (lead_id, trigger_type, channel, vehicle_id, vehicle_year, vehicle_make, vehicle_model, vehicle_slug, send_after)
SELECT DISTINCT ON (l.id)
  l.id,
  'browse',
  'sms',
  max_dwell.vehicle_id,
  v.year,
  v.make,
  v.model,
  v.slug,
  NOW() + INTERVAL '24 hours'
FROM public.leads l
JOIN (
  -- Find the vehicle with the most dwell time per session
  SELECT
    session_id,
    vehicle_id,
    SUM(COALESCE((metadata->>'dwell_seconds')::int, 0)) AS total_dwell
  FROM public.session_events
  WHERE event_type = 'dwell' AND vehicle_id IS NOT NULL
    AND created_at > NOW() - INTERVAL '48 hours'
  GROUP BY session_id, vehicle_id
  ORDER BY session_id, total_dwell DESC
) max_dwell ON max_dwell.session_id = l.session_id
JOIN public.vehicles v ON v.id = max_dwell.vehicle_id
WHERE
  l.phone IS NOT NULL AND l.phone != ''
  AND l.status = 'New'
  AND l.created_at > NOW() - INTERVAL '48 hours'
  -- No save_toggle in this session
  AND NOT EXISTS (
    SELECT 1 FROM public.session_events se2
    WHERE se2.session_id = l.session_id AND se2.event_type = 'save_toggle'
  )
  -- No form_open in this session
  AND NOT EXISTS (
    SELECT 1 FROM public.session_events se3
    WHERE se3.session_id = l.session_id AND se3.event_type = 'form_open'
  )
  -- Not already queued for browse follow-up
  AND NOT EXISTS (
    SELECT 1 FROM public.follow_up_queue fq
    WHERE fq.lead_id = l.id AND fq.trigger_type = 'browse'
  )
ON CONFLICT DO NOTHING;
```

### Example 3: Process-Follow-Up-Queue Edge Function (SMS Path)

```typescript
// Source: Mirrors process-notification-queue/index.ts pattern (verified in codebase)
// File: supabase/functions/process-follow-up-queue/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms } from '../_shared/twilio.ts';
import { sendEmail } from '../_shared/resend.ts';

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch ready queue items joined with lead phone data
  const { data: queue } = await supabase
    .from('follow_up_queue')
    .select('*, leads(phone, name, session_id)')
    .eq('sent', false)
    .eq('cancelled', false)
    .lte('send_after', new Date().toISOString())
    .limit(50);

  for (const item of queue ?? []) {
    try {
      const lead = item.leads;
      if (!lead?.phone) continue;

      const vehicleUrl = `https://triplejautoinvestment.com/vehicles/${item.vehicle_slug}`;
      const phone = '(832) 400-9760';

      if (item.channel === 'sms') {
        const body = buildSmsBody(item, vehicleUrl, phone);
        const result = await sendSms(lead.phone, body);
        await markSent(supabase, item.id, result.success ? undefined : result.error);
      } else if (item.channel === 'voice') {
        await triggerRetellCall(item, lead);
        await markSent(supabase, item.id);
      }
      // email path similar...
    } catch (err) {
      await markSent(supabase, item.id, String(err));
    }
  }

  return new Response(JSON.stringify({ processed: queue?.length ?? 0 }));
});

function buildSmsBody(item: Record<string, unknown>, vehicleUrl: string, phone: string): string {
  const vehicle = `${item.vehicle_year} ${item.vehicle_make} ${item.vehicle_model}`;
  switch (item.trigger_type) {
    case 'browse':
      return `Hi! You were looking at the ${vehicle} — still available! View it here: ${vehicleUrl} or call us: ${phone}\nReply STOP to unsubscribe`;
    case 'save':
      return `Hi! The ${vehicle} you saved is getting attention — ${item.views_7d} views this week. Still interested? ${vehicleUrl} or call ${phone}\nReply STOP to unsubscribe`;
    case 'abandon':
      return `Hi! Your info is saved from your inquiry about the ${vehicle}. Pick up where you left off: ${vehicleUrl} or call us: ${phone}\nReply STOP to unsubscribe`;
    default:
      return `Hi! We'd love to help with the ${vehicle}. ${vehicleUrl} | ${phone}\nReply STOP to unsubscribe`;
  }
}
```

### Example 4: Retell Voice Call from Edge Function (Tier 4)

```typescript
// Source: Adapted from retellService.ts (verified in codebase)
// Key difference: use Deno.env.get() not import.meta.env.VITE_*

async function triggerRetellCall(item: Record<string, unknown>, lead: { phone: string; name: string }) {
  const apiKey = Deno.env.get('RETELL_API_KEY');
  const agentId = Deno.env.get('RETELL_OUTBOUND_AGENT_ID');
  const fromNumber = Deno.env.get('RETELL_OUTBOUND_NUMBER');

  if (!apiKey || !agentId || !fromNumber) {
    throw new Error('Retell credentials not configured');
  }

  const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
      to_number: lead.phone,
      from_number: fromNumber,
      retell_llm_dynamic_variables: {
        customer_name: lead.name || 'there',
        vehicle_full: `${item.vehicle_year} ${item.vehicle_make} ${item.vehicle_model}`,
        vehicle_year: String(item.vehicle_year),
        vehicle_make: item.vehicle_make,
        vehicle_model: item.vehicle_model,
        inquiry_source: 'follow_up',
        is_rental: 'no',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Retell API error ${response.status}: ${text}`);
  }
}
```

### Example 5: Conversion Auto-Cancel Trigger

```sql
-- Source: Pattern from Phase 9 queue_notification_on_status_change trigger
-- Cancels pending follow-ups when a lead is marked Contacted or Closed

CREATE OR REPLACE FUNCTION cancel_follow_ups_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'New' AND NEW.status IN ('Contacted', 'Closed') THEN
    UPDATE public.follow_up_queue
    SET cancelled = TRUE, cancelled_reason = 'lead_converted'
    WHERE lead_id = NEW.id AND sent = FALSE AND cancelled = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cancel_follow_ups_on_lead_conversion
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION cancel_follow_ups_on_conversion();
```

### Example 6: Bilingual Detection for Message Language

```typescript
// Source: Phase 17 pattern (preferred_language in metadata) + Phase 16 session_events
// Detect visitor's language from session_events page_path or metadata

// In Edge Function, after fetching the queue item:
// Check if session had page events with Spanish-language signals
// Simplest approach: check leads.utm_campaign for 'es' or stored language preference

// In the absence of a stored preference, default to English
// but check if the most recent page_view in their session was on a /es path
// (the project uses bilingual toggle, not separate URLs, so this is LOW confidence)

// Recommended approach: add a `preferred_language` column to leads table
// populated from the LanguageContext on form submission (Phase 13/10 pattern)
// This gives definitive language at lead creation time.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling from frontend | Server-side pg_cron + Edge Function queue | Phase 9 (notification_queue) | Reliable even if user closes browser |
| All messaging in same Edge Function | Shared `_shared/twilio.ts` and `_shared/resend.ts` helpers | Phase 9 | Reusable across multiple Edge Functions |
| Retell called from frontend only | Retell called from Edge Function server-side | New in Phase 18 | Removes VITE_ credential exposure; runs even when user is offline |

**Deprecated/outdated:**
- `import.meta.env.VITE_RETELL_*` usage in Edge Functions: not valid in Deno — must use `Deno.env.get('RETELL_*')`.

---

## Open Questions

1. **Bilingual language detection for messages**
   - What we know: Phase 13 adds browser language auto-detection (navigator.language) that saves to localStorage. Phase 17 passes `preferred_language` to Retell via metadata. The leads table does NOT currently have a `preferred_language` column.
   - What's unclear: There's no server-side record of which language a visitor was browsing in.
   - Recommendation: Add `preferred_language TEXT DEFAULT 'en'` column to leads table in the Phase 18 migration. Populate it from the LanguageContext value at form submission time (similar to how sessionId is captured via captureAttribution). This is a clean, low-cost fix.

2. **Tier 3 (Abandon) — partial form data availability**
   - What we know: form_open events fire when a form is opened. The lead row only exists if the form was submitted. If someone opens a form but doesn't submit, we have their session_id but NOT their phone number (since phone is collected in the form).
   - What's unclear: Can we send a Tier 3 follow-up to someone who opened a form but never gave us their phone?
   - Recommendation: Tier 3 only targets visitors who have a phone on file from a DIFFERENT prior form submission (same session_id, different form). A visitor who opens their very first form and abandons it is unreachable. This significantly narrows Tier 3's scope — document this clearly in the plan.

3. **SMS cost cap**
   - What we know: No cap was decided. The context leaves this to Claude's discretion.
   - What's unclear: Volume at this small dealer will be low (likely <50 messages/month), making cost controls unnecessary.
   - Recommendation: No SMS budget cap for now. A single Twilio message costs ~$0.0079 USD. At 50 leads/month with 3 message types each = ~$1.20/month. Document the skip with a TODO for when volume grows.

4. **pg_cron availability on current Supabase plan**
   - What we know: Phase 9 and 16 both note pg_cron requires Pro plan or manual extension enable. The current project is on Free plan for dev.
   - What's unclear: Is pg_cron currently enabled on the dev Supabase project?
   - Recommendation: Include `CREATE EXTENSION IF NOT EXISTS pg_cron;` in migration with a comment that it may need manual enable. The detection and queue functions still work even if cron isn't set up yet — they can be called manually for testing.

---

## FOLLOW-05 Specific Research

FOLLOW-05 ("return visitor recognition — surface previously viewed vehicles") is intentionally UI-only.

### What Already Exists (HIGH confidence — verified in codebase)

- `useRecentlyViewed.ts` — localStorage hook storing up to 8 recently-viewed vehicle IDs with timestamps
- `RecentlyViewedRow.tsx` — horizontal scroll component rendering vehicle cards for recently viewed vehicles
- Phase 16 STATE.md: "Inventory.tsx: RecentlyViewedRow above grid" — already integrated

### What FOLLOW-05 Adds

1. On the Inventory page: RecentlyViewedRow already appears above the grid. No changes needed if it's already there.
2. On VehicleDetail page: If `useRecentlyViewed` indicates this vehicle was previously viewed, surface a "Welcome back" indicator (pill badge or toast). Low-effort.
3. On Home page: If any recently-viewed vehicles exist, a "Continue Where You Left Off" row could appear. Optional enhancement.

**Implementation:** Read `localStorage.getItem('tj_recently_viewed')` via useRecentlyViewed hook. Filter for the current vehicle ID on VehicleDetail. No backend changes required.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `triple-j-auto-investment-main/supabase/functions/process-notification-queue/index.ts` — queue processing pattern
- Codebase: `triple-j-auto-investment-main/supabase/functions/_shared/twilio.ts` — SMS delivery helper
- Codebase: `triple-j-auto-investment-main/supabase/functions/_shared/resend.ts` — email delivery helper
- Codebase: `triple-j-auto-investment-main/supabase/phase-16-migration.sql` — session_events + vehicle_view_counts schema
- Codebase: `triple-j-auto-investment-main/supabase/migrations/04_notification_system.sql` — notification_queue pattern and pg_cron setup
- Codebase: `triple-j-auto-investment-main/services/retellService.ts` — Retell AI voice call API shape
- Codebase: `triple-j-auto-investment-main/services/trackingService.ts` — session_id source and tracking pattern
- Codebase: `triple-j-auto-investment-main/hooks/useRecentlyViewed.ts` — FOLLOW-05 existing implementation
- Codebase: `triple-j-auto-investment-main/hooks/useSavedVehicles.ts` — save_toggle localStorage pattern
- Codebase: `triple-j-auto-investment-main/types.ts` — Lead interface with session_id, TrackingEventType

### Secondary (MEDIUM confidence)

- [Supabase Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) — pg_cron + pg_net pattern for Edge Function invocation
- [Supabase Cron Guide](https://supabase.com/docs/guides/cron) — scheduling configuration and job history
- [Twilio Advanced Opt-Out](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out) — STOP keyword auto-handling behavior
- [Twilio STOP filtering](https://help.twilio.com/articles/223134027-Twilio-support-for-opt-out-keywords-SMS-STOP-filtering) — Twilio auto-handles STOP at carrier level, error 21610 on retry

### Tertiary (LOW confidence — not needed, foundational patterns verified above)

- None needed. All critical patterns are verified from the codebase itself.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified in codebase, all tools already deployed
- Architecture: HIGH — mirrors proven Phase 9 pattern already in production
- Pitfalls: HIGH for most (verified from code); MEDIUM for Tier 3 abandon detection edge cases
- FOLLOW-05: HIGH — hooks and components verified as existing

**Research date:** 2026-02-21
**Valid until:** 2026-04-21 (stable infrastructure — Twilio, Resend, Supabase, Retell APIs are stable)
