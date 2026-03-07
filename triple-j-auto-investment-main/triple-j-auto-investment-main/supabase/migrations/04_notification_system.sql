-- ================================================================
-- Migration 04: Notification System
-- Phase: 04-customer-portal-notifications-login
-- Plan: 01 - Notification Database Infrastructure
--
-- Purpose: Create notification queue with debounce, notification
-- preferences, admin notify control, phone-auth RLS, and pg_cron
-- schedule for automated queue processing.
--
-- Depends on: 02_registration_schema_update.sql, 03_customer_portal_access.sql
-- ================================================================

-- ================================================================
-- SECTION 1: NOTIFICATION QUEUE TABLE (Debounce Mechanism)
-- ================================================================
-- The notification_queue table holds pending notifications that are
-- debounced over a 5-minute window. If the admin changes a registration
-- status multiple times within 5 minutes, only the final state is
-- sent to the customer.

CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  old_stage VARCHAR(50),
  new_stage VARCHAR(50) NOT NULL,
  send_after TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  error TEXT,
  notify_customer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: only one pending (unsent) notification per registration.
-- This is the debounce key. PostgreSQL does not support WHERE on inline
-- UNIQUE constraints, so we use CREATE UNIQUE INDEX instead.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_notification
ON public.notification_queue (registration_id) WHERE (sent = false);

-- Index for efficient queue processing: find ready-to-send items
CREATE INDEX IF NOT EXISTS idx_notification_queue_ready
ON public.notification_queue(send_after) WHERE sent = false;

-- Enable RLS on notification_queue (admin-only access, no public access)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- SECTION 2: EXTEND REGISTRATION_NOTIFICATIONS TABLE
-- ================================================================
-- The registration_notifications table already exists from
-- registration_ledger.sql. Add columns for richer audit trail.

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS old_stage VARCHAR(50);

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS new_stage VARCHAR(50);

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS template_used VARCHAR(100);

-- Provider message ID: Twilio SID for SMS, Resend ID for email
ALTER TABLE public.registration_notifications
ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

-- ================================================================
-- SECTION 3: NOTIFICATION PREFERENCES ON REGISTRATIONS
-- ================================================================
-- Store per-registration notification preference. Default is 'both'
-- (SMS + Email) per CONTEXT.md opt-out model.

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS notification_pref VARCHAR(10) DEFAULT 'both'
  CHECK (notification_pref IN ('sms', 'email', 'both', 'none'));

-- ================================================================
-- SECTION 4: PENDING NOTIFY FLAG ON REGISTRATIONS
-- ================================================================
-- Admin checkbox: should this status change trigger a notification?
-- Set before UPDATE, captured by the queue trigger, then cleared.
-- NULL = default behavior (notify). FALSE = skip notification.

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS pending_notify_customer BOOLEAN;

-- ================================================================
-- SECTION 5: DEBOUNCE TRIGGER FUNCTION AND TRIGGER
-- ================================================================
-- This BEFORE UPDATE trigger fires when current_stage changes.
-- It inserts/upserts into notification_queue with a 5-minute delay.
-- If a pending entry already exists (debounce), it updates the
-- existing entry with the new stage and resets the 5-minute window.
--
-- IMPORTANT: This is a BEFORE UPDATE trigger so it can modify
-- NEW.pending_notify_customer (clear it after capturing the value).
-- PostgreSQL fires BEFORE UPDATE triggers in alphabetical order by
-- trigger name. "queue_notification..." comes before
-- "update_registrations..." and "validate_registration_status",
-- so the ordering is correct.

CREATE OR REPLACE FUNCTION queue_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if stage actually changed
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Upsert: if a pending notification exists for this registration,
    -- update it (debounce). Otherwise insert a new queue entry.
    INSERT INTO public.notification_queue (
      registration_id, old_stage, new_stage, notify_customer, send_after
    ) VALUES (
      NEW.id,
      OLD.current_stage,
      NEW.current_stage,
      COALESCE(NEW.pending_notify_customer, TRUE),
      NOW() + INTERVAL '5 minutes'
    )
    ON CONFLICT (registration_id) WHERE (sent = false)
    DO UPDATE SET
      new_stage = EXCLUDED.new_stage,
      notify_customer = EXCLUDED.notify_customer,
      send_after = NOW() + INTERVAL '5 minutes',
      updated_at = NOW();

    -- Clear the pending flag after capturing its value
    NEW.pending_notify_customer := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS queue_notification_on_status_change ON public.registrations;

CREATE TRIGGER queue_notification_on_status_change
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION queue_status_notification();

-- ================================================================
-- SECTION 6: RLS POLICIES
-- ================================================================

-- 6a. Phone-authenticated customer SELECT policy on registrations
-- When a customer logs in via phone OTP, Supabase Auth populates the
-- JWT 'phone' claim. This policy lets them see all registrations
-- matching their authenticated phone number.
CREATE POLICY "Customers can view own registrations by phone"
ON public.registrations
FOR SELECT TO authenticated
USING (
  customer_phone IS NOT NULL
  AND customer_phone = (auth.jwt()->>'phone')
);

-- 6b. Admin full access policy on notification_queue
CREATE POLICY "Admins can manage notification_queue"
ON public.notification_queue
FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- ================================================================
-- SECTION 7: PG_CRON SCHEDULE FOR QUEUE PROCESSING
-- ================================================================
-- This schedule invokes the process-notification-queue Edge Function
-- every minute to process ready items in the notification queue.
--
-- PREREQUISITES:
--   1. Enable pg_cron extension: Supabase Dashboard -> Database -> Extensions -> pg_cron
--   2. Enable pg_net extension: Supabase Dashboard -> Database -> Extensions -> pg_net
--
-- CONFIGURATION:
--   The Edge Function URL and service_role_key must be accessible.
--   There are two approaches:
--
--   APPROACH A: Custom PostgreSQL settings (simpler)
--     ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
--     ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
--
--   APPROACH B: Supabase Vault (more secure, recommended for production)
--     SELECT vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
--     SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
--     Then use:
--       (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
--       (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
--
-- The schedule below uses Approach A (app.settings). If using Approach B (Vault),
-- replace current_setting() calls with vault subqueries as shown above.

SELECT cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-notification-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ================================================================
-- SUCCESS NOTICE
-- ================================================================
DO $$ BEGIN
  RAISE NOTICE 'Migration 04: Notification system created successfully!';
  RAISE NOTICE 'Tables: notification_queue';
  RAISE NOTICE 'Columns added: notification_pref, pending_notify_customer, + 5 on registration_notifications';
  RAISE NOTICE 'Trigger: queue_notification_on_status_change';
  RAISE NOTICE 'Cron: process-notification-queue (every minute)';
  RAISE NOTICE 'IMPORTANT: Enable pg_cron and pg_net extensions in Supabase Dashboard';
END $$;

-- ================================================================
-- ROLLBACK INSTRUCTIONS
-- ================================================================
-- To undo this migration, run in order:
--
--   SELECT cron.unschedule('process-notification-queue');
--
--   DROP TRIGGER IF EXISTS queue_notification_on_status_change ON public.registrations;
--   DROP FUNCTION IF EXISTS queue_status_notification();
--
--   DROP POLICY IF EXISTS "Customers can view own registrations by phone" ON public.registrations;
--   DROP POLICY IF EXISTS "Admins can manage notification_queue" ON public.notification_queue;
--
--   DROP TABLE IF EXISTS public.notification_queue;
--
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS notification_pref;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS pending_notify_customer;
--
--   ALTER TABLE public.registration_notifications DROP COLUMN IF EXISTS old_stage;
--   ALTER TABLE public.registration_notifications DROP COLUMN IF EXISTS new_stage;
--   ALTER TABLE public.registration_notifications DROP COLUMN IF EXISTS subject;
--   ALTER TABLE public.registration_notifications DROP COLUMN IF EXISTS template_used;
--   ALTER TABLE public.registration_notifications DROP COLUMN IF EXISTS provider_message_id;
-- ================================================================
