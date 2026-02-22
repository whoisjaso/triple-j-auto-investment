-- Phase 18: Behavioral Follow-Up Migration
--
-- Builds the automated re-engagement backend: a queue table for pending
-- follow-up messages, a Postgres function that detects behavioral triggers
-- from session_events and enqueues timed messages, a cancel trigger that
-- stops follow-ups when leads convert, and pg_cron schedules to drive
-- detection and processing.
--
-- Sections:
--   1. preferred_language column on leads table
--   2. follow_up_queue table + indexes + RLS
--   3. enqueue_behavioral_follow_ups() detection function
--   4. cancel_follow_ups_on_conversion() trigger function + trigger
--   5. pg_cron schedules (wrapped in DO block with existence check)
--
-- Note: pg_cron requires the extension to be enabled. On Supabase Free tier,
-- pg_cron may require manual enable via Dashboard -> Database -> Extensions.
-- pg_net (for HTTP calls from Postgres) also requires Pro plan or manual enable.
-- The pg_cron section is wrapped in a DO block that catches errors if unavailable.

-- ================================================================
-- 0. EXTENSIONS (required if not already enabled)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. PREFERRED_LANGUAGE COLUMN ON LEADS TABLE
-- ================================================================
-- Stores the visitor's browsing language at form submission time.
-- Phase 18-02 frontend plan wires this at form submission.
-- Defaults to 'en' if not set.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- ================================================================
-- 2. FOLLOW_UP_QUEUE TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.follow_up_queue (
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
  message_language TEXT DEFAULT 'en' CHECK (message_language IN ('en', 'es')),
  send_after TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2a. Deduplication index
-- Prevents duplicate pending messages per lead per trigger type per channel.
-- A lead can have one unsent/uncancelled message per (trigger_type, channel) combo.
-- This permits Tier 3 (abandon) to enqueue BOTH sms and email rows for the same
-- lead via CROSS JOIN unnest, while still blocking true duplicates.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_follow_up
  ON public.follow_up_queue (lead_id, trigger_type, channel)
  WHERE sent = false AND cancelled = false;

-- ---------------------------------------------------------------------------
-- 2b. Processing index
-- Efficient queue polling: find items ready to send (not sent, not cancelled,
-- send_after is in the past).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_ready
  ON public.follow_up_queue (send_after)
  WHERE sent = false AND cancelled = false;

-- ---------------------------------------------------------------------------
-- 2c. RLS policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.follow_up_queue ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins can manage follow_up_queue"
  ON public.follow_up_queue
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Note: The Edge Function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- entirely, so no separate service_role INSERT policy is needed. The admin
-- policy above covers manual queue inspection via the dashboard.

-- ================================================================
-- 3. ENQUEUE_BEHAVIORAL_FOLLOW_UPS() FUNCTION
-- ================================================================
-- Called hourly by pg_cron. Scans session_events and leads to detect
-- 4 behavioral trigger types and inserts pending follow-ups into the queue.
--
-- Rules applied to all tiers:
--   - Lead must have phone IS NOT NULL AND phone != ''
--   - Lead status must be 'New' (not yet contacted/closed)
--   - Lead must have been created within the last 48 hours
--   - Not already enqueued for this trigger type (partial unique index)
--
-- Tier priority (highest commitment wins when multiple triggers fire):
--   Tier 4 (voice) > Tier 3 (abandon) > Tier 2 (save) > Tier 1 (browse)
-- The partial unique index + ON CONFLICT DO NOTHING enforces one entry per
-- lead per trigger type.

CREATE OR REPLACE FUNCTION public.enqueue_behavioral_follow_ups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  -- -----------------------------------------------------------------------
  -- TIER 4: Voice follow-up
  -- Trigger: lead submitted 'ask_question' action in last 4 hours,
  --          no subsequent 'schedule_visit' from the same session.
  -- Channel: voice
  -- Delay: 2 hours
  -- -----------------------------------------------------------------------
  INSERT INTO public.follow_up_queue (
    lead_id, trigger_type, channel,
    vehicle_id, vehicle_year, vehicle_make, vehicle_model, vehicle_slug,
    message_language, send_after
  )
  SELECT
    l.id,
    'voice',
    'voice',
    l.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.slug,
    COALESCE(l.preferred_language, 'en'),
    NOW() + INTERVAL '2 hours'
  FROM public.leads l
  LEFT JOIN public.vehicles v ON v.id = l.vehicle_id
  WHERE
    -- Must have phone
    l.phone IS NOT NULL AND l.phone != ''
    -- Must be new lead
    AND l.status = 'New'
    -- Lead created within last 48 hours
    AND l.created_at >= NOW() - INTERVAL '48 hours'
    -- ask_question action in last 4 hours
    AND l.action_type = 'ask_question'
    AND l.created_at >= NOW() - INTERVAL '4 hours'
    -- No schedule_visit from the same session
    AND NOT EXISTS (
      SELECT 1 FROM public.leads l2
      WHERE l2.session_id = l.session_id
        AND l2.action_type = 'schedule_visit'
    )
    -- Not already enqueued for voice (partial unique index handles this,
    -- but explicit check avoids unnecessary conflict attempts)
    AND NOT EXISTS (
      SELECT 1 FROM public.follow_up_queue fq
      WHERE fq.lead_id = l.id
        AND fq.trigger_type = 'voice'
        AND fq.sent = false
        AND fq.cancelled = false
    )
  ON CONFLICT DO NOTHING;

  -- -----------------------------------------------------------------------
  -- TIER 3: Form abandonment follow-up (dual-channel: SMS + email)
  -- Trigger: session has a form_open event created 1-3 hours ago,
  --          lead with phone exists from a prior form submission on same
  --          session_id, but no lead was created AFTER the form_open event
  --          in the same session (indicating the visitor opened but did not
  --          submit the form).
  -- Channel: sms + email (two rows inserted per qualified lead)
  -- Delay: 1 hour
  -- -----------------------------------------------------------------------
  INSERT INTO public.follow_up_queue (
    lead_id, trigger_type, channel,
    vehicle_id, vehicle_year, vehicle_make, vehicle_model, vehicle_slug,
    message_language, send_after
  )
  SELECT
    l.id,
    'abandon',
    channel_series.channel,
    l.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.slug,
    COALESCE(l.preferred_language, 'en'),
    NOW() + INTERVAL '1 hour'
  FROM public.leads l
  INNER JOIN public.session_events se ON se.session_id = l.session_id
  LEFT JOIN public.vehicles v ON v.id = l.vehicle_id
  CROSS JOIN (SELECT unnest(ARRAY['sms', 'email']) AS channel) AS channel_series
  WHERE
    -- Lead must have phone
    l.phone IS NOT NULL AND l.phone != ''
    -- Lead status must be New
    AND l.status = 'New'
    -- Lead created within last 48 hours
    AND l.created_at >= NOW() - INTERVAL '48 hours'
    -- Session has a form_open event between 1-3 hours ago
    AND se.event_type = 'form_open'
    AND se.created_at >= NOW() - INTERVAL '3 hours'
    AND se.created_at <= NOW() - INTERVAL '1 hour'
    -- No lead was created AFTER the form_open event in the same session
    -- (would indicate a successful form submission = conversion, not abandon)
    AND NOT EXISTS (
      SELECT 1 FROM public.leads l2
      WHERE l2.session_id = l.session_id
        AND l2.created_at > se.created_at
    )
    -- Email channel only if lead has email
    AND (channel_series.channel = 'sms' OR l.email IS NOT NULL)
    -- Not already enqueued for abandon
    AND NOT EXISTS (
      SELECT 1 FROM public.follow_up_queue fq
      WHERE fq.lead_id = l.id
        AND fq.trigger_type = 'abandon'
        AND fq.channel = channel_series.channel
        AND fq.sent = false
        AND fq.cancelled = false
    )
  ON CONFLICT DO NOTHING;

  -- -----------------------------------------------------------------------
  -- TIER 2: Saved vehicle follow-up
  -- Trigger: session has save_toggle events, pick most recently saved vehicle.
  -- Channel: sms
  -- Delay: 4 hours
  -- Also pulls views_7d from vehicle_view_counts for scarcity signal.
  -- -----------------------------------------------------------------------
  INSERT INTO public.follow_up_queue (
    lead_id, trigger_type, channel,
    vehicle_id, vehicle_year, vehicle_make, vehicle_model, vehicle_slug,
    views_7d, message_language, send_after
  )
  SELECT DISTINCT ON (l.id)
    l.id,
    'save',
    'sms',
    se.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.slug,
    COALESCE(vvc.views_7d, 0),
    COALESCE(l.preferred_language, 'en'),
    NOW() + INTERVAL '4 hours'
  FROM public.leads l
  INNER JOIN public.session_events se ON se.session_id = l.session_id
    AND se.event_type = 'save_toggle'
    AND se.vehicle_id IS NOT NULL
  LEFT JOIN public.vehicles v ON v.id = se.vehicle_id
  LEFT JOIN public.vehicle_view_counts vvc ON vvc.vehicle_id = se.vehicle_id
  WHERE
    l.phone IS NOT NULL AND l.phone != ''
    AND l.status = 'New'
    AND l.created_at >= NOW() - INTERVAL '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.follow_up_queue fq
      WHERE fq.lead_id = l.id
        AND fq.trigger_type = 'save'
        AND fq.sent = false
        AND fq.cancelled = false
    )
  -- Pick the most recently saved vehicle per lead
  ORDER BY l.id, se.created_at DESC
  ON CONFLICT DO NOTHING;

  -- -----------------------------------------------------------------------
  -- TIER 1: Browse-only follow-up
  -- Trigger: session has dwell events with vehicle_id BUT no save_toggle or
  --          form_open events in the same session (lower commitment).
  --          Pick the vehicle with highest total dwell_seconds.
  -- Channel: sms
  -- Delay: 24 hours
  -- -----------------------------------------------------------------------
  INSERT INTO public.follow_up_queue (
    lead_id, trigger_type, channel,
    vehicle_id, vehicle_year, vehicle_make, vehicle_model, vehicle_slug,
    message_language, send_after
  )
  SELECT DISTINCT ON (l.id)
    l.id,
    'browse',
    'sms',
    se.vehicle_id,
    v.year,
    v.make,
    v.model,
    v.slug,
    COALESCE(l.preferred_language, 'en'),
    NOW() + INTERVAL '24 hours'
  FROM public.leads l
  INNER JOIN public.session_events se ON se.session_id = l.session_id
    AND se.event_type = 'dwell'
    AND se.vehicle_id IS NOT NULL
  LEFT JOIN public.vehicles v ON v.id = se.vehicle_id
  WHERE
    l.phone IS NOT NULL AND l.phone != ''
    AND l.status = 'New'
    AND l.created_at >= NOW() - INTERVAL '48 hours'
    -- No save_toggle events in this session (would qualify for Tier 2 instead)
    AND NOT EXISTS (
      SELECT 1 FROM public.session_events se2
      WHERE se2.session_id = l.session_id
        AND se2.event_type = 'save_toggle'
    )
    -- No form_open events in this session (would qualify for Tier 3 instead)
    AND NOT EXISTS (
      SELECT 1 FROM public.session_events se3
      WHERE se3.session_id = l.session_id
        AND se3.event_type = 'form_open'
    )
    -- Not already enqueued for browse
    AND NOT EXISTS (
      SELECT 1 FROM public.follow_up_queue fq
      WHERE fq.lead_id = l.id
        AND fq.trigger_type = 'browse'
        AND fq.sent = false
        AND fq.cancelled = false
    )
  -- Pick vehicle with highest total dwell_seconds per lead
  ORDER BY l.id, COALESCE((se.metadata->>'dwell_seconds')::numeric, 0) DESC
  ON CONFLICT DO NOTHING;

END;
$$;

-- ================================================================
-- 4. CANCEL_FOLLOW_UPS_ON_CONVERSION() TRIGGER FUNCTION + TRIGGER
-- ================================================================
-- When a lead's status changes to 'Contacted' or 'Closed', automatically
-- cancel all pending follow-ups for that lead. This prevents messaging
-- a customer who has already been reached or has converted.

CREATE OR REPLACE FUNCTION public.cancel_follow_ups_on_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when status actually changes to Contacted or Closed
  IF OLD.status != NEW.status AND NEW.status IN ('Contacted', 'Closed') THEN
    UPDATE public.follow_up_queue
    SET
      cancelled = true,
      cancelled_reason = 'lead_converted'
    WHERE
      lead_id = NEW.id
      AND sent = false
      AND cancelled = false;

    IF FOUND THEN
      RAISE LOG '[follow-up] Cancelled pending follow-ups for lead % (status -> %)', NEW.id, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on leads table (fires after status update)
DROP TRIGGER IF EXISTS trg_cancel_follow_ups_on_conversion ON public.leads;
CREATE TRIGGER trg_cancel_follow_ups_on_conversion
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_follow_ups_on_conversion();

-- ================================================================
-- 5. PG_CRON SCHEDULES
-- ================================================================
-- Wrapped in a DO block that catches errors if pg_cron is not available.
-- pg_cron requires the extension to be enabled:
--   Dashboard -> Database -> Extensions -> search pg_cron -> Enable
-- On Supabase Free plan, pg_cron availability varies -- Pro plan guarantees it.
-- pg_net (for HTTP calls from Postgres) is used to invoke the Edge Function.
--
-- If pg_cron is not available, these schedules must be set up manually via
-- the Supabase Dashboard -> Database -> Extensions -> pg_cron.

DO $$
BEGIN

  -- ---------------------------------------------------------------------------
  -- Schedule 1: Hourly behavioral trigger detection
  -- Runs enqueue_behavioral_follow_ups() every hour at minute 0.
  -- Scans session_events for new triggers and enqueues follow-up messages.
  -- ---------------------------------------------------------------------------
  PERFORM cron.schedule(
    'detect_follow_ups',
    '0 * * * *',
    $cron$
      SELECT public.enqueue_behavioral_follow_ups();
    $cron$
  );

  -- ---------------------------------------------------------------------------
  -- Schedule 2: Every-5-minute queue processor
  -- Calls the process-follow-up-queue Edge Function via pg_net HTTP POST.
  -- Uses the same pattern as Phase 9 notification_queue processing.
  --
  -- The Edge Function URL and service_role_key are passed via pg_net.
  -- Replace <PROJECT_REF> with your actual Supabase project reference,
  -- and ensure the SUPABASE_SERVICE_ROLE_KEY secret is configured.
  -- ---------------------------------------------------------------------------
  PERFORM cron.schedule(
    'process_follow_up_queue',
    '*/5 * * * *',
    $cron$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-follow-up-queue',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
    $cron$
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available: %. Follow-up queue schedules must be configured manually via Dashboard -> Database -> Extensions.', SQLERRM;
END;
$$;
