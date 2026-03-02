-- ================================================================
-- Migration: Phase 19 Retention Engine
-- Phase: 19-retention-engine
-- Plan: 01 - Data Foundation
--
-- Purpose: Create Owner Portal data layer: owner_referrals,
-- referral_clicks, and review_requests tables with RLS policies,
-- helper functions, triggers, and pg_cron schedules. Extends the
-- registrations table with mileage_at_purchase and review_completed.
--
-- Depends on: All previous migrations (registrations table must exist)
-- Pattern: Follows Phase 18 migration conventions (DO/EXCEPTION block
-- for pg_cron, SECURITY DEFINER functions, idempotent ON CONFLICT DO NOTHING)
-- ================================================================

-- ================================================================
-- SECTION 1: Add mileage_at_purchase to registrations
-- ================================================================
-- Captures the odometer reading at the point of sticker delivery.
-- Used by the Value Tracker to compute cost-per-mile and depreciation.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS mileage_at_purchase INTEGER;

-- Trigger function: snapshot mileage from vehicles table when
-- current_stage transitions to 'sticker_delivered'.
CREATE OR REPLACE FUNCTION public.snapshot_mileage_at_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire on sticker_delivered transition (not on re-saves)
  IF NEW.current_stage = 'sticker_delivered'
     AND OLD.current_stage <> 'sticker_delivered'
     AND NEW.mileage_at_purchase IS NULL
     AND NEW.vehicle_id IS NOT NULL
  THEN
    UPDATE public.registrations
    SET mileage_at_purchase = (
      SELECT v.mileage
      FROM public.vehicles v
      WHERE v.id = NEW.vehicle_id
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_mileage ON public.registrations;

CREATE TRIGGER trg_snapshot_mileage
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_mileage_at_purchase();

-- ================================================================
-- SECTION 2: owner_referrals table
-- ================================================================
-- One row per registration. Created automatically when a registration
-- transitions to 'sticker_delivered'. Tracks referral counts and
-- reward tiers (0=none, 1=$50, 3=$100, 5=$200).

CREATE TABLE IF NOT EXISTS public.owner_referrals (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id   UUID          NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  customer_phone    TEXT          NOT NULL,
  referrer_name     TEXT          NOT NULL,
  referral_code     TEXT          UNIQUE NOT NULL,
  referral_link     TEXT          NOT NULL,
  referral_count    INTEGER       NOT NULL DEFAULT 0,
  converted_count   INTEGER       NOT NULL DEFAULT 0,
  reward_tier       INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- RLS: customers may only SELECT their own row (matched by phone).
-- Service role retains full access for triggers and Edge Functions.
ALTER TABLE public.owner_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_referrals_customer_select" ON public.owner_referrals;
CREATE POLICY "owner_referrals_customer_select"
  ON public.owner_referrals
  FOR SELECT
  TO authenticated
  USING (customer_phone = auth.jwt() ->> 'phone');

DROP POLICY IF EXISTS "owner_referrals_service_all" ON public.owner_referrals;
CREATE POLICY "owner_referrals_service_all"
  ON public.owner_referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- SECTION 3: referral_clicks table
-- ================================================================
-- Append-only log of clicks on referral links. Anon INSERT allowed
-- so the referral landing page can log clicks without authentication.

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code TEXT          NOT NULL REFERENCES public.owner_referrals(referral_code) ON DELETE CASCADE,
  clicked_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  device_type   TEXT
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_clicks_anon_insert" ON public.referral_clicks;
CREATE POLICY "referral_clicks_anon_insert"
  ON public.referral_clicks
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "referral_clicks_service_select" ON public.referral_clicks;
CREATE POLICY "referral_clicks_service_select"
  ON public.referral_clicks
  FOR SELECT
  TO service_role
  USING (true);

-- ================================================================
-- SECTION 4: review_requests table
-- ================================================================
-- Enqueued review request messages (SMS + email) for each registration
-- at 3 days post-purchase (initial) and 7 days (followup).
-- Processed by the send-review-requests Edge Function.

CREATE TABLE IF NOT EXISTS public.review_requests (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID          NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  channel         TEXT          NOT NULL CHECK (channel IN ('sms', 'email')),
  request_type    TEXT          NOT NULL DEFAULT 'initial' CHECK (request_type IN ('initial', 'followup')),
  send_after      TIMESTAMPTZ   NOT NULL,
  sent            BOOLEAN       NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (registration_id, channel, request_type)
);

-- No direct customer access to review_requests. Service role only.
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_requests_service_all" ON public.review_requests;
CREATE POLICY "review_requests_service_all"
  ON public.review_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- SECTION 5: Add review_completed to registrations
-- ================================================================
-- Allows the 7-day follow-up to be skipped if the owner marks
-- "I left a review" in the Owner Portal.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS review_completed BOOLEAN NOT NULL DEFAULT false;

-- ================================================================
-- SECTION 6: generate_referral_code() function
-- ================================================================
-- Generates a short, human-friendly referral code from the customer
-- name. Excludes confusable characters (0, O, I, 1) for clarity.
-- Format: XXX-YYYY (3 name chars + hyphen + 4 random chars)

CREATE OR REPLACE FUNCTION public.generate_referral_code(customer_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  name_part   TEXT;
  rand_chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- excludes 0,O,I,1
  rand_part   TEXT := '';
  raw_bytes   BYTEA;
  i           INTEGER;
  byte_val    INTEGER;
BEGIN
  -- Take first 3 uppercase letters of name (LPAD for short names)
  name_part := UPPER(LPAD(REGEXP_REPLACE(customer_name, '[^A-Za-z]', '', 'g'), 3, 'X'));
  name_part := SUBSTRING(name_part FROM 1 FOR 3);

  -- Generate 4 random chars from the safe alphabet
  raw_bytes := gen_random_bytes(4);
  FOR i IN 0..3 LOOP
    byte_val := get_byte(raw_bytes, i);
    rand_part := rand_part || SUBSTRING(rand_chars FROM (byte_val % length(rand_chars)) + 1 FOR 1);
  END LOOP;

  RETURN name_part || '-' || rand_part;
END;
$$;

-- ================================================================
-- SECTION 7: auto_create_owner_referral() trigger function
-- ================================================================
-- Fires AFTER UPDATE on registrations when current_stage transitions
-- to 'sticker_delivered'. Creates the owner_referrals row and
-- snapshots mileage_at_purchase. Idempotent via ON CONFLICT DO NOTHING.

CREATE OR REPLACE FUNCTION public.auto_create_owner_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code          TEXT;
  v_link          TEXT;
  v_base_url      TEXT := 'https://triplejautoinvestment.com';
  v_mileage       INTEGER;
BEGIN
  -- Only fire on sticker_delivered transition
  IF NEW.current_stage = 'sticker_delivered'
     AND OLD.current_stage <> 'sticker_delivered'
  THEN
    -- Generate a unique referral code (retry on collision)
    LOOP
      v_code := public.generate_referral_code(NEW.customer_name);
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.owner_referrals WHERE referral_code = v_code
      );
    END LOOP;

    v_link := v_base_url || '/refer/' || v_code;

    -- Snapshot mileage from vehicles table if not already set
    IF NEW.mileage_at_purchase IS NULL AND NEW.vehicle_id IS NOT NULL THEN
      SELECT mileage INTO v_mileage
      FROM public.vehicles
      WHERE id = NEW.vehicle_id
      LIMIT 1;

      UPDATE public.registrations
      SET mileage_at_purchase = v_mileage
      WHERE id = NEW.id;
    END IF;

    -- Create owner_referrals row (idempotent)
    INSERT INTO public.owner_referrals (
      registration_id,
      customer_phone,
      referrer_name,
      referral_code,
      referral_link
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.customer_phone, ''),
      NEW.customer_name,
      v_code,
      v_link
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_owner_referral ON public.registrations;

CREATE TRIGGER trg_auto_create_owner_referral
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_owner_referral();

-- ================================================================
-- SECTION 8: enqueue_review_requests() SECURITY DEFINER function
-- ================================================================
-- Called by pg_cron every hour. Finds registrations that are 3 days
-- post-purchase and enqueues initial review requests (SMS + email)
-- for those that do not already have an initial request.

CREATE OR REPLACE FUNCTION public.enqueue_review_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.review_requests (registration_id, channel, request_type, send_after)
  SELECT
    r.id,
    ch.channel,
    'initial',
    NOW()
  FROM public.registrations r
  CROSS JOIN UNNEST(ARRAY['sms', 'email']::TEXT[]) AS ch(channel)
  WHERE r.current_stage = 'sticker_delivered'
    AND r.purchase_date >= (NOW() - INTERVAL '3 days 2 hours')::DATE
    AND r.purchase_date < (NOW() - INTERVAL '3 days')::DATE
    AND NOT EXISTS (
      SELECT 1
      FROM public.review_requests rr
      WHERE rr.registration_id = r.id
        AND rr.request_type = 'initial'
    )
  ON CONFLICT (registration_id, channel, request_type) DO NOTHING;
END;
$$;

-- ================================================================
-- SECTION 9: enqueue_followup_review_requests() SECURITY DEFINER function
-- ================================================================
-- Called by pg_cron every hour. Finds registrations that are 7 days
-- post-purchase, have not completed a review, and enqueues followup
-- review requests (SMS + email).

CREATE OR REPLACE FUNCTION public.enqueue_followup_review_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.review_requests (registration_id, channel, request_type, send_after)
  SELECT
    r.id,
    ch.channel,
    'followup',
    NOW()
  FROM public.registrations r
  CROSS JOIN UNNEST(ARRAY['sms', 'email']::TEXT[]) AS ch(channel)
  WHERE r.current_stage = 'sticker_delivered'
    AND r.purchase_date >= (NOW() - INTERVAL '7 days 2 hours')::DATE
    AND r.purchase_date < (NOW() - INTERVAL '7 days')::DATE
    AND r.review_completed = false
    AND NOT EXISTS (
      SELECT 1
      FROM public.review_requests rr
      WHERE rr.registration_id = r.id
        AND rr.request_type = 'followup'
    )
  ON CONFLICT (registration_id, channel, request_type) DO NOTHING;
END;
$$;

-- ================================================================
-- SECTION 10: pg_cron schedules
-- ================================================================
-- Wrapped in DO/EXCEPTION block for graceful degradation on Free plan.
-- On Supabase Pro, these schedules will activate automatically.
-- On Free plan, the RAISE NOTICE logs the skip without failing migration.

DO $$
BEGIN
  -- Enqueue initial review requests every hour
  PERFORM cron.schedule(
    'enqueue-review-requests',
    '0 * * * *',
    'SELECT public.enqueue_review_requests()'
  );

  -- Enqueue follow-up review requests every hour
  PERFORM cron.schedule(
    'enqueue-followup-review-requests',
    '0 * * * *',
    'SELECT public.enqueue_followup_review_requests()'
  );

  RAISE NOTICE 'pg_cron schedules registered for Phase 19 review request queue.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available (Free plan). Skipping schedule registration. Error: %', SQLERRM;
END;
$$;

-- ================================================================
-- SECTION 11: Indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_owner_referrals_phone
  ON public.owner_referrals(customer_phone);

CREATE INDEX IF NOT EXISTS idx_owner_referrals_code
  ON public.owner_referrals(referral_code);

CREATE INDEX IF NOT EXISTS idx_review_requests_unsent
  ON public.review_requests(sent, send_after)
  WHERE sent = false;

CREATE INDEX IF NOT EXISTS idx_referral_clicks_code
  ON public.referral_clicks(referral_code);
