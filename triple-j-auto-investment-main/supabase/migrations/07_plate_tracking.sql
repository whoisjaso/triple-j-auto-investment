-- ================================================================
-- TRIPLE J AUTO - PLATE TRACKING SCHEMA MIGRATION
-- ================================================================
-- Migration: 07_plate_tracking.sql
-- Purpose: Create plate tracking database schema with assignment history and alerts
-- Run after: 06_rental_schema.sql
-- Phase: 07-plate-tracking, Plan 01
-- ================================================================
-- Tables created:
--   - plates (first-class plate entity with type, status, expiration)
--   - plate_assignments (immutable assignment history log)
--   - plate_alerts (alert deduplication for notifications)
-- Functions created:
--   - update_plate_status_on_assignment() (auto-sync plate status)
--   - update_plates_updated_at() (updated_at on plates)
-- Triggers created:
--   - trg_plate_status_on_assignment (AFTER INSERT/UPDATE on plate_assignments)
--   - trg_update_plates_updated_at (BEFORE UPDATE on plates)
-- Indexes created:
--   - uq_plate_active_assignment (partial unique: one active assignment per plate)
--   - uq_plate_active_alert (partial unique: one active alert per type per plate)
--   - idx_plates_status (dashboard filtering)
--   - idx_plate_assignments_plate_id (history lookups)
--   - idx_plate_assignments_booking_id (rental join queries)
-- ================================================================

BEGIN;

-- ================================================================
-- 1. PLATES TABLE (first-class entity)
-- ================================================================
-- Plates are independent entities with their own lifecycle.
-- Three types: dealer (metal, dealership-owned), buyer_tag (60-day temp),
-- permanent (post-registration, customer-owned).

CREATE TABLE IF NOT EXISTS public.plates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plate identification
  plate_number VARCHAR(20) NOT NULL,
  plate_type TEXT NOT NULL
    CHECK (plate_type IN ('dealer', 'buyer_tag', 'permanent')),

  -- Status (managed by DB trigger on assignments)
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'expired', 'lost')),

  -- Expiration (required for buyer_tag, optional for dealer, N/A for permanent)
  expiration_date DATE,

  -- Photo reference (Supabase Storage URL)
  photo_url TEXT,

  -- Admin notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on plate_number (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'plates_plate_number_unique'
      AND table_name = 'plates'
  ) THEN
    ALTER TABLE public.plates
      ADD CONSTRAINT plates_plate_number_unique UNIQUE (plate_number);
  END IF;
END $$;

COMMENT ON TABLE public.plates IS
  'First-class plate entities. Three types: dealer (metal, loaned during rentals), buyer_tag (60-day temporary from txDMV), permanent (post-registration).';

COMMENT ON COLUMN public.plates.plate_type IS
  'dealer = dealership-owned metal plate, buyer_tag = 60-day temporary state-issued, permanent = customer-owned post-registration';

COMMENT ON COLUMN public.plates.status IS
  'available = in inventory, assigned = currently out, expired = past expiration_date, lost = unaccounted for. Auto-managed by trigger on plate_assignments.';

COMMENT ON COLUMN public.plates.expiration_date IS
  'Required for buyer_tag (60-day countdown from sale date). Optional for dealer plates. N/A for permanent plates.';

-- ================================================================
-- 2. PLATE_ASSIGNMENTS TABLE (immutable history log)
-- ================================================================
-- Every assignment/return is a new record. returned_at = NULL means
-- the plate is currently out. This creates a complete audit trail.
-- Immutable: no DELETE policy, only INSERT and UPDATE (to set returned_at).

CREATE TABLE IF NOT EXISTS public.plate_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plate reference
  plate_id UUID NOT NULL REFERENCES public.plates(id),

  -- Context references (at least one should be set)
  vehicle_id UUID REFERENCES public.vehicles(id),
  booking_id UUID REFERENCES public.rental_bookings(id),
  registration_id UUID REFERENCES public.registrations(id),

  -- Denormalized customer info (fast dashboard queries without joins)
  customer_name TEXT,
  customer_phone TEXT,

  -- Assignment classification
  assignment_type TEXT NOT NULL
    CHECK (assignment_type IN ('rental', 'sale', 'inventory')),

  -- Timing
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,
  returned_at TIMESTAMPTZ,  -- NULL = still out
  return_confirmed BOOLEAN DEFAULT false,  -- Admin confirmed physical return

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.plate_assignments IS
  'Immutable assignment history log. Each row is an assignment event. returned_at = NULL means plate is currently out.';

COMMENT ON COLUMN public.plate_assignments.customer_name IS
  'Denormalized from rental_customers or registration. Avoids joins for dashboard display.';

COMMENT ON COLUMN public.plate_assignments.return_confirmed IS
  'Admin confirmed physical plate return. false with returned_at set = system return without physical confirmation.';

-- ================================================================
-- 3. PLATE_ALERTS TABLE (deduplication for notifications)
-- ================================================================
-- Tracks alert conditions to prevent notification spam.
-- One active (unresolved) alert per type per plate.

CREATE TABLE IF NOT EXISTS public.plate_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plate reference
  plate_id UUID NOT NULL REFERENCES public.plates(id),

  -- Alert classification
  alert_type TEXT NOT NULL
    CHECK (alert_type IN ('overdue_rental', 'expiring_buyer_tag', 'unaccounted')),

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

COMMENT ON TABLE public.plate_alerts IS
  'Alert deduplication table. One active alert per type per plate. Prevents notification spam.';

COMMENT ON COLUMN public.plate_alerts.severity IS
  'warning = 14 days before expiry or minor issue. urgent = 7 days before expiry or overdue.';

COMMENT ON COLUMN public.plate_alerts.last_notified_at IS
  'Tracks when admin was last notified. Used by Edge Function to avoid re-alerting.';

-- ================================================================
-- 4. INDEXES
-- ================================================================

-- Partial unique: only one active assignment per plate
-- Prevents two admins from assigning the same plate simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS uq_plate_active_assignment
  ON public.plate_assignments (plate_id) WHERE (returned_at IS NULL);

-- Partial unique: one active (unresolved) alert per type per plate
CREATE UNIQUE INDEX IF NOT EXISTS uq_plate_active_alert
  ON public.plate_alerts (plate_id, alert_type) WHERE (resolved_at IS NULL);

-- Dashboard filtering by plate status
CREATE INDEX IF NOT EXISTS idx_plates_status
  ON public.plates(status);

-- History lookups for a specific plate
CREATE INDEX IF NOT EXISTS idx_plate_assignments_plate_id
  ON public.plate_assignments(plate_id);

-- Rental join queries (find plate assignment for a booking)
CREATE INDEX IF NOT EXISTS idx_plate_assignments_booking_id
  ON public.plate_assignments(booking_id);

-- ================================================================
-- 5. TRIGGER: AUTO-UPDATE PLATE STATUS ON ASSIGNMENT
-- ================================================================
-- AFTER INSERT: If new assignment has returned_at IS NULL, set plate status to 'assigned'
-- AFTER UPDATE: If returned_at was set (old NULL -> new NOT NULL), check for other active
--               assignments; if none remain, set plate status to 'available'
-- SECURITY DEFINER: Runs with function owner's permissions (same pattern as Phase 4)

CREATE OR REPLACE FUNCTION update_plate_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.returned_at IS NULL THEN
    -- New active assignment: mark plate as assigned
    UPDATE public.plates SET status = 'assigned', updated_at = NOW()
    WHERE id = NEW.plate_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    -- Assignment returned: check if plate has any other active assignments
    IF NOT EXISTS (
      SELECT 1 FROM public.plate_assignments
      WHERE plate_id = NEW.plate_id AND returned_at IS NULL AND id != NEW.id
    ) THEN
      -- No other active assignments: mark plate as available
      UPDATE public.plates SET status = 'available', updated_at = NOW()
      WHERE id = NEW.plate_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_plate_status_on_assignment() IS
  'Auto-syncs plates.status with active assignments. SECURITY DEFINER to bypass RLS on plates table update.';

DROP TRIGGER IF EXISTS trg_plate_status_on_assignment ON public.plate_assignments;

CREATE TRIGGER trg_plate_status_on_assignment
  AFTER INSERT OR UPDATE ON public.plate_assignments
  FOR EACH ROW EXECUTE FUNCTION update_plate_status_on_assignment();

-- ================================================================
-- 6. TRIGGER: UPDATE plates.updated_at ON MODIFICATION
-- ================================================================
-- Uses a dedicated function (not the generic update_updated_at_column)
-- because the generic one may not exist in all environments.

CREATE OR REPLACE FUNCTION update_plates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_plates_updated_at ON public.plates;

CREATE TRIGGER trg_update_plates_updated_at
  BEFORE UPDATE ON public.plates
  FOR EACH ROW EXECUTE FUNCTION update_plates_updated_at();

-- ================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ================================================================
-- All plate tables are admin-only. Follows the same RLS pattern as
-- rental tables in 06_rental_schema.sql.

ALTER TABLE public.plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plate_alerts ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 8. RLS POLICIES - PLATES
-- ================================================================
-- Admin can SELECT, INSERT, UPDATE, DELETE

CREATE POLICY "Admins can select plates"
  ON public.plates
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert plates"
  ON public.plates
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update plates"
  ON public.plates
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete plates"
  ON public.plates
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 9. RLS POLICIES - PLATE_ASSIGNMENTS
-- ================================================================
-- Admin can SELECT, INSERT, UPDATE. No DELETE (immutable log).

CREATE POLICY "Admins can select plate assignments"
  ON public.plate_assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert plate assignments"
  ON public.plate_assignments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update plate assignments"
  ON public.plate_assignments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- NO DELETE POLICY: plate_assignments is an immutable history log

-- ================================================================
-- 10. RLS POLICIES - PLATE_ALERTS
-- ================================================================
-- Admin can SELECT, INSERT, UPDATE. No DELETE.

CREATE POLICY "Admins can select plate alerts"
  ON public.plate_alerts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert plate alerts"
  ON public.plate_alerts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update plate alerts"
  ON public.plate_alerts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- NO DELETE POLICY: plate_alerts should be resolved, not deleted

-- ================================================================
-- 11. SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 07_plate_tracking.sql completed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Created plates table (first-class plate entity)';
  RAISE NOTICE '  - Created plate_assignments table (immutable assignment history)';
  RAISE NOTICE '  - Created plate_alerts table (alert deduplication)';
  RAISE NOTICE '  - Created partial unique index uq_plate_active_assignment';
  RAISE NOTICE '  - Created partial unique index uq_plate_active_alert';
  RAISE NOTICE '  - Created indexes: idx_plates_status, idx_plate_assignments_plate_id, idx_plate_assignments_booking_id';
  RAISE NOTICE '  - Created update_plate_status_on_assignment() trigger function (SECURITY DEFINER)';
  RAISE NOTICE '  - Created update_plates_updated_at() trigger function';
  RAISE NOTICE '  - Enabled RLS with admin-only policies on all plate tables';
  RAISE NOTICE '  - plate_assignments and plate_alerts have no DELETE policy (immutable)';
END $$;

COMMIT;
