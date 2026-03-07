-- ================================================================
-- TRIPLE J AUTO - RENTAL INSURANCE VERIFICATION SCHEMA MIGRATION
-- ================================================================
-- Migration: 08_rental_insurance.sql
-- Purpose: Create insurance verification tables for rental bookings
-- Run after: 07_plate_tracking.sql
-- Phase: 08-rental-insurance-verification, Plan 01
-- ================================================================
-- Tables created:
--   - rental_insurance (1:1 with rental_bookings, policy details, coverage, verification)
--   - insurance_alerts (alert deduplication for expiry/coverage notifications)
-- Columns added:
--   - rental_customers.last_insurance_company (pre-fill cache)
--   - rental_customers.last_policy_number (pre-fill cache)
--   - rental_customers.last_insurance_expiry (pre-fill cache)
-- Functions created:
--   - update_insurance_updated_at() (updated_at on rental_insurance)
-- Triggers created:
--   - trg_update_insurance_updated_at (BEFORE UPDATE on rental_insurance)
-- Indexes created:
--   - uq_rental_insurance_booking_id (UNIQUE: 1:1 with rental_bookings)
--   - uq_insurance_active_alert (partial unique: one active alert per type per booking)
--   - idx_insurance_alerts_booking_resolved (composite for active alert queries)
--   - idx_insurance_alerts_active (partial index WHERE resolved_at IS NULL)
-- ================================================================

BEGIN;

-- ================================================================
-- 1. RENTAL_INSURANCE TABLE (1:1 with rental_bookings)
-- ================================================================
-- Tracks insurance details for each rental booking.
-- Supports both customer-provided insurance and dealer-provided coverage.
-- Verification is dual: system flags + admin final call.

CREATE TABLE IF NOT EXISTS public.rental_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,

  -- Insurance source type
  insurance_type TEXT NOT NULL DEFAULT 'customer_provided'
    CHECK (insurance_type IN ('customer_provided', 'dealer_coverage')),

  -- Policy details (customer_provided)
  insurance_company TEXT,
  policy_number TEXT,
  effective_date DATE,
  expiration_date DATE,

  -- Coverage amounts (whole dollars, INTEGER -- not DECIMAL)
  bodily_injury_per_person INTEGER,    -- Texas min: 30000
  bodily_injury_per_accident INTEGER,  -- Texas min: 60000
  property_damage INTEGER,             -- Texas min: 25000

  -- Insurance card image
  card_image_url TEXT,

  -- Verification status
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'overridden')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- System-computed flags (set by application layer before insert/update)
  coverage_meets_minimum BOOLEAN DEFAULT false,
  expires_during_rental BOOLEAN DEFAULT false,

  -- Dealer coverage specifics (when insurance_type = 'dealer_coverage')
  dealer_coverage_daily_rate DECIMAL(10,2),
  dealer_coverage_total DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIQUE constraint on booking_id (1:1 relationship with rental_bookings)
-- Uses DO block + information_schema guard for idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_rental_insurance_booking_id'
      AND table_name = 'rental_insurance'
  ) THEN
    ALTER TABLE public.rental_insurance
      ADD CONSTRAINT uq_rental_insurance_booking_id UNIQUE (booking_id);
  END IF;
END $$;

COMMENT ON TABLE public.rental_insurance IS
  'Insurance verification for rental bookings. 1:1 with rental_bookings. Supports customer-provided insurance and dealer-provided coverage.';

COMMENT ON COLUMN public.rental_insurance.insurance_type IS
  'customer_provided = customer brings their own policy, dealer_coverage = dealer provides coverage at daily surcharge';

COMMENT ON COLUMN public.rental_insurance.verification_status IS
  'pending = awaiting review, verified = admin approved, failed = admin rejected, overridden = admin bypassed flags';

COMMENT ON COLUMN public.rental_insurance.bodily_injury_per_person IS
  'Bodily injury liability per person in whole dollars. Texas minimum: $30,000';

COMMENT ON COLUMN public.rental_insurance.bodily_injury_per_accident IS
  'Bodily injury liability per accident in whole dollars. Texas minimum: $60,000';

COMMENT ON COLUMN public.rental_insurance.property_damage IS
  'Property damage liability in whole dollars. Texas minimum: $25,000';

COMMENT ON COLUMN public.rental_insurance.coverage_meets_minimum IS
  'System-computed: all coverage amounts meet or exceed Texas 30/60/25 minimums';

COMMENT ON COLUMN public.rental_insurance.expires_during_rental IS
  'System-computed: insurance expiration_date falls before booking end_date';

-- ================================================================
-- 2. INSURANCE_ALERTS TABLE (parallel to plate_alerts)
-- ================================================================
-- Separate table from plate_alerts (per RESEARCH.md Pitfall 6).
-- Tracks alert conditions to prevent notification spam.
-- One active (unresolved) alert per type per booking.

CREATE TABLE IF NOT EXISTS public.insurance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Booking reference
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,

  -- Alert classification
  alert_type TEXT NOT NULL
    CHECK (alert_type IN ('expiring_soon', 'expired', 'coverage_below_minimum', 'missing_insurance')),

  -- Severity tier
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('warning', 'urgent')),

  -- Timing
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,  -- NULL = still active

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.insurance_alerts IS
  'Alert deduplication table for insurance issues. One active alert per type per booking. Resolve, do not delete.';

COMMENT ON COLUMN public.insurance_alerts.alert_type IS
  'expiring_soon = policy expires within warning window, expired = policy already expired, coverage_below_minimum = below Texas 30/60/25, missing_insurance = active booking with no insurance record';

COMMENT ON COLUMN public.insurance_alerts.severity IS
  'warning = approaching issue, urgent = immediate action required';

-- ================================================================
-- 3. CUSTOMER PRE-FILL COLUMNS ON rental_customers
-- ================================================================
-- Allows pre-filling insurance from the customer's most recent booking.
-- Always require verification per booking (insurance can change between rentals).

ALTER TABLE public.rental_customers
  ADD COLUMN IF NOT EXISTS last_insurance_company TEXT;

ALTER TABLE public.rental_customers
  ADD COLUMN IF NOT EXISTS last_policy_number TEXT;

ALTER TABLE public.rental_customers
  ADD COLUMN IF NOT EXISTS last_insurance_expiry DATE;

COMMENT ON COLUMN public.rental_customers.last_insurance_company IS
  'Cached from most recent booking for pre-fill. Must be re-verified each booking.';

COMMENT ON COLUMN public.rental_customers.last_policy_number IS
  'Cached from most recent booking for pre-fill. Must be re-verified each booking.';

COMMENT ON COLUMN public.rental_customers.last_insurance_expiry IS
  'Cached from most recent booking for pre-fill. Must be re-verified each booking.';

-- ================================================================
-- 4. TRIGGER: UPDATE rental_insurance.updated_at ON MODIFICATION
-- ================================================================
-- Uses a dedicated function (not the generic update_updated_at_column)
-- because the generic one may not exist in all environments.
-- Same pattern as update_plates_updated_at() from 07_plate_tracking.sql.

CREATE OR REPLACE FUNCTION update_insurance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_insurance_updated_at ON public.rental_insurance;

CREATE TRIGGER trg_update_insurance_updated_at
  BEFORE UPDATE ON public.rental_insurance
  FOR EACH ROW EXECUTE FUNCTION update_insurance_updated_at();

-- ================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.rental_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_alerts ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 6. RLS POLICIES - RENTAL_INSURANCE
-- ================================================================
-- Admin can SELECT, INSERT, UPDATE, DELETE. No public access.

CREATE POLICY "Admins can select rental insurance"
  ON public.rental_insurance
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert rental insurance"
  ON public.rental_insurance
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update rental insurance"
  ON public.rental_insurance
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete rental insurance"
  ON public.rental_insurance
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 7. RLS POLICIES - INSURANCE_ALERTS
-- ================================================================
-- Admin can SELECT, INSERT, UPDATE. No DELETE (immutable alert log).

CREATE POLICY "Admins can select insurance alerts"
  ON public.insurance_alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert insurance alerts"
  ON public.insurance_alerts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update insurance alerts"
  ON public.insurance_alerts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- NO DELETE POLICY: insurance_alerts should be resolved, not deleted

-- ================================================================
-- 8. INDEXES
-- ================================================================

-- Index on rental_insurance(booking_id) for FK lookups
-- Already covered by the UNIQUE constraint uq_rental_insurance_booking_id,
-- but explicit for clarity in query planning.
-- (The UNIQUE constraint creates an implicit index, so this is a no-op)

-- Partial unique: one active (unresolved) alert per type per booking
-- Needed by Plan 03's Edge Function for dedup via upsert
CREATE UNIQUE INDEX IF NOT EXISTS uq_insurance_active_alert
  ON public.insurance_alerts (booking_id, alert_type) WHERE (resolved_at IS NULL);

-- Composite index for active alert queries (booking + resolution status)
CREATE INDEX IF NOT EXISTS idx_insurance_alerts_booking_resolved
  ON public.insurance_alerts(booking_id, resolved_at);

-- Partial index for fast active-alert lookups (WHERE resolved_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_insurance_alerts_active
  ON public.insurance_alerts(booking_id) WHERE (resolved_at IS NULL);

-- ================================================================
-- 9. SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 08_rental_insurance.sql completed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Created rental_insurance table (1:1 with rental_bookings)';
  RAISE NOTICE '  - Created insurance_alerts table (alert deduplication)';
  RAISE NOTICE '  - Added customer pre-fill columns to rental_customers';
  RAISE NOTICE '  - Created UNIQUE constraint uq_rental_insurance_booking_id';
  RAISE NOTICE '  - Created partial unique index uq_insurance_active_alert';
  RAISE NOTICE '  - Created indexes: idx_insurance_alerts_booking_resolved, idx_insurance_alerts_active';
  RAISE NOTICE '  - Created update_insurance_updated_at() trigger function';
  RAISE NOTICE '  - Enabled RLS with admin-only policies on both tables';
  RAISE NOTICE '  - insurance_alerts has no DELETE policy (immutable)';
  RAISE NOTICE '';
  RAISE NOTICE 'TODOs:';
  RAISE NOTICE '  - Create Supabase Storage bucket: insurance-cards';
  RAISE NOTICE '  - Configure bucket access policy for authenticated uploads';
END $$;

COMMIT;
