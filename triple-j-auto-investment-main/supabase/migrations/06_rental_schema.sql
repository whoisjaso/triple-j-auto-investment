-- ================================================================
-- TRIPLE J AUTO - RENTAL MANAGEMENT SCHEMA MIGRATION
-- ================================================================
-- Migration: 06_rental_schema.sql
-- Purpose: Create complete rental management database schema
-- Run after: 05_registration_checker.sql
-- Phase: 06-rental-management-core, Plan 01
-- ================================================================
-- Tables created:
--   - rental_customers (renter profiles with DL, address, emergency contact)
--   - rental_bookings (core entity with EXCLUDE double-booking prevention)
--   - rental_payments (per-booking payment records)
--   - rental_condition_reports (checkout/return walk-around checklists)
-- Tables modified:
--   - vehicles (adds listing_type, daily_rate, weekly_rate, min/max rental days)
-- Functions created:
--   - generate_rental_booking_id() (TJ-R-YYYY-NNNN format)
-- Triggers created:
--   - set_rental_booking_id (auto-populate booking_id on INSERT)
--   - update_rental_customers_updated_at (updated_at on rental_customers)
--   - update_rental_bookings_updated_at (updated_at on rental_bookings)
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ENABLE BTREE_GIST EXTENSION
-- ================================================================
-- Required for EXCLUDE USING gist constraint on rental_bookings.
-- Must be enabled BEFORE the table that uses the exclusion constraint.
-- Supabase supports this extension but does not enable it by default.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ================================================================
-- 2. EXTEND VEHICLES TABLE WITH RENTAL FIELDS
-- ================================================================
-- Adds rental classification and rate fields to existing vehicles table.
-- Uses ADD COLUMN IF NOT EXISTS for idempotency.
-- Does NOT modify the existing vehicles.status CHECK constraint.

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale_only';

-- Add CHECK constraint separately for IF NOT EXISTS compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicles_listing_type_check'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_listing_type_check
      CHECK (listing_type IN ('sale_only', 'rental_only', 'both'));
  END IF;
END $$;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10, 2);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS min_rental_days INTEGER DEFAULT 1;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS max_rental_days INTEGER DEFAULT 30;

COMMENT ON COLUMN public.vehicles.listing_type IS
  'Vehicle availability: sale_only (default), rental_only, or both';

COMMENT ON COLUMN public.vehicles.daily_rate IS
  'Rental daily rate in USD. NULL for sale-only vehicles.';

COMMENT ON COLUMN public.vehicles.weekly_rate IS
  'Rental weekly rate in USD. NULL for sale-only vehicles or if no weekly discount.';

COMMENT ON COLUMN public.vehicles.min_rental_days IS
  'Minimum rental duration in days. Default 1.';

COMMENT ON COLUMN public.vehicles.max_rental_days IS
  'Maximum rental duration in days. Default 30.';

-- Index for filtering vehicles by listing type
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_type
  ON public.vehicles(listing_type);

-- ================================================================
-- 3. CREATE RENTAL_CUSTOMERS TABLE
-- ================================================================
-- Separate from leads -- renters require more detailed info (DL, address,
-- emergency contact, employer) for rental agreement population.

CREATE TABLE IF NOT EXISTS public.rental_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Required fields
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  drivers_license_number TEXT NOT NULL,
  address TEXT NOT NULL,

  -- Optional fields
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  employer_name TEXT,
  employer_phone TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.rental_customers IS
  'Rental customer profiles. Separate from leads -- renters need DL, address, emergency contact for agreements.';

-- ================================================================
-- 4. CREATE RENTAL_BOOKINGS TABLE
-- ================================================================
-- Core rental entity. Includes EXCLUDE USING gist constraint to prevent
-- double-booking at the database level (not application-level).
-- Uses DATE type for start_date/end_date (not TIMESTAMPTZ) per research
-- pitfall #4 -- single-timezone business avoids off-by-one date issues.

CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Human-readable booking ID (auto-generated by trigger)
  booking_id VARCHAR(20) UNIQUE NOT NULL,

  -- Foreign keys
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  customer_id UUID NOT NULL REFERENCES public.rental_customers(id),

  -- Dates (DATE type, not TIMESTAMPTZ -- single-timezone Houston TX business)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE,  -- NULL = vehicle still out

  -- Rates (snapshot at booking time, decoupled from vehicle rate changes)
  daily_rate DECIMAL(10, 2) NOT NULL,
  weekly_rate DECIMAL(10, 2),
  total_cost DECIMAL(10, 2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'active', 'returned', 'cancelled', 'overdue')),

  -- Agreement
  agreement_signed BOOLEAN DEFAULT false,
  agreement_pdf_url TEXT,
  signature_data TEXT,  -- Base64 PNG from signature pad

  -- Authorized drivers (JSONB array of driver names)
  authorized_drivers JSONB DEFAULT '[]'::jsonb,

  -- Geographic permissions
  out_of_state_permitted BOOLEAN DEFAULT false,
  permitted_states JSONB DEFAULT '[]'::jsonb,

  -- Mileage tracking
  mileage_out INTEGER,
  mileage_in INTEGER,
  mileage_limit INTEGER,

  -- Late fee management
  -- NULL = auto-calculate from daily_rate * days overdue
  -- 0 = waived
  -- > 0 = admin override amount
  late_fee_override DECIMAL(10, 2),
  late_fee_notes TEXT,

  -- Admin notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ============================================================
  -- DOUBLE-BOOKING PREVENTION (database-level constraint)
  -- ============================================================
  -- Uses EXCLUDE USING gist with daterange to prevent overlapping bookings
  -- for the same vehicle. Only active bookings are checked -- cancelled and
  -- returned bookings do not block new reservations.
  -- Requires btree_gist extension (enabled in section 1).
  -- '[)' = start inclusive, end exclusive (vehicle available on end_date)
  CONSTRAINT prevent_double_booking
    EXCLUDE USING gist (
      vehicle_id WITH =,
      daterange(start_date, end_date, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'returned'))
);

COMMENT ON TABLE public.rental_bookings IS
  'Core rental booking entity. EXCLUDE constraint prevents double-booking at DB level.';

COMMENT ON COLUMN public.rental_bookings.booking_id IS
  'Human-readable booking ID: TJ-R-YYYY-NNNN. Auto-generated by trigger.';

COMMENT ON COLUMN public.rental_bookings.actual_return_date IS
  'Date vehicle was actually returned. NULL means vehicle is still out.';

COMMENT ON COLUMN public.rental_bookings.late_fee_override IS
  'NULL = auto-calculate, 0 = waived, > 0 = admin override amount';

-- ================================================================
-- 5. CREATE RENTAL_PAYMENTS TABLE
-- ================================================================
-- Per-booking payment records. Supports mixed payment methods.
-- ON DELETE CASCADE: if booking is deleted, its payments go too.

CREATE TABLE IF NOT EXISTS public.rental_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to booking
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'zelle', 'cashapp')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metadata
  notes TEXT,
  recorded_by TEXT,  -- Admin who recorded the payment

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.rental_payments IS
  'Payment records for rental bookings. Supports cash, card, Zelle, CashApp.';

-- ================================================================
-- 6. CREATE RENTAL_CONDITION_REPORTS TABLE
-- ================================================================
-- Walk-around inspection reports at checkout and return.
-- Checklist items stored as JSONB for flexible category/item structure.
-- Photo URLs reference Supabase Storage (not base64 in DB).

CREATE TABLE IF NOT EXISTS public.rental_condition_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to booking
  booking_id UUID NOT NULL REFERENCES public.rental_bookings(id) ON DELETE CASCADE,

  -- Report type: one checkout report and one return report per booking
  report_type TEXT NOT NULL
    CHECK (report_type IN ('checkout', 'return')),

  -- Checklist items (JSONB array)
  -- Format: [{category: "Exterior", item: "Front bumper", condition: "good"|"fair"|"damaged", notes: ""}]
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Fuel level at time of report
  fuel_level TEXT
    CHECK (fuel_level IN ('empty', '1/4', '1/2', '3/4', 'full')),

  -- Odometer reading
  mileage INTEGER NOT NULL,

  -- Photo documentation (JSONB array of Supabase Storage URLs)
  photo_urls JSONB DEFAULT '[]'::jsonb,

  -- Who completed the report and when
  completed_by TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.rental_condition_reports IS
  'Vehicle condition reports at checkout and return. Photos stored in Supabase Storage.';

COMMENT ON COLUMN public.rental_condition_reports.checklist_items IS
  'JSONB array: [{category, item, condition: good|fair|damaged, notes}]';

COMMENT ON COLUMN public.rental_condition_reports.photo_urls IS
  'JSONB array of Supabase Storage URLs. Do NOT store base64 in database.';

-- ================================================================
-- 7. CREATE BOOKING ID GENERATOR FUNCTION
-- ================================================================
-- Generates human-readable booking IDs in format: TJ-R-YYYY-NNNN
-- Sequential per calendar year, zero-padded to 4 digits.
-- Example: TJ-R-2026-0001, TJ-R-2026-0002, etc.

CREATE OR REPLACE FUNCTION generate_rental_booking_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Find the highest sequence number for the current year
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(booking_id FROM 11) AS INTEGER)),
    0
  ) + 1
  INTO seq_num
  FROM public.rental_bookings
  WHERE booking_id LIKE 'TJ-R-' || year_part || '-%';

  -- Format: TJ-R-2026-0001
  new_id := 'TJ-R-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_rental_booking_id() IS
  'Generates sequential booking IDs: TJ-R-YYYY-NNNN (e.g., TJ-R-2026-0001)';

-- ================================================================
-- 8. CREATE BOOKING ID AUTO-POPULATE TRIGGER
-- ================================================================
-- Automatically sets booking_id on INSERT if not already provided.
-- BEFORE INSERT so the ID is set before the row is written.

CREATE OR REPLACE FUNCTION set_rental_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_id IS NULL THEN
    NEW.booking_id := generate_rental_booking_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_rental_booking_id ON public.rental_bookings;

CREATE TRIGGER trg_set_rental_booking_id
  BEFORE INSERT ON public.rental_bookings
  FOR EACH ROW EXECUTE FUNCTION set_rental_booking_id();

-- ================================================================
-- 9. CREATE UPDATED_AT TRIGGERS
-- ================================================================
-- Reuses the existing update_updated_at_column() function from schema.sql.
-- Same pattern as the vehicles table trigger.

-- Trigger for rental_customers
DROP TRIGGER IF EXISTS update_rental_customers_updated_at ON public.rental_customers;

CREATE TRIGGER update_rental_customers_updated_at
  BEFORE UPDATE ON public.rental_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for rental_bookings
DROP TRIGGER IF EXISTS update_rental_bookings_updated_at ON public.rental_bookings;

CREATE TRIGGER update_rental_bookings_updated_at
  BEFORE UPDATE ON public.rental_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 10. CREATE INDEXES
-- ================================================================

-- rental_bookings indexes
CREATE INDEX IF NOT EXISTS idx_rental_bookings_vehicle_id
  ON public.rental_bookings(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_rental_bookings_customer_id
  ON public.rental_bookings(customer_id);

CREATE INDEX IF NOT EXISTS idx_rental_bookings_status
  ON public.rental_bookings(status);

CREATE INDEX IF NOT EXISTS idx_rental_bookings_start_date
  ON public.rental_bookings(start_date);

CREATE INDEX IF NOT EXISTS idx_rental_bookings_end_date
  ON public.rental_bookings(end_date);

-- rental_payments indexes
CREATE INDEX IF NOT EXISTS idx_rental_payments_booking_id
  ON public.rental_payments(booking_id);

-- rental_condition_reports indexes
CREATE INDEX IF NOT EXISTS idx_rental_condition_reports_booking_id
  ON public.rental_condition_reports(booking_id);

-- ================================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ================================================================
-- All rental tables are admin-only. No public/anon access.
-- Follows the same RLS pattern as registration tables in
-- 02_registration_schema_update.sql.

ALTER TABLE public.rental_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_condition_reports ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 12. RLS POLICIES - RENTAL_CUSTOMERS
-- ================================================================

CREATE POLICY "Admins can select rental customers"
  ON public.rental_customers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert rental customers"
  ON public.rental_customers
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update rental customers"
  ON public.rental_customers
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete rental customers"
  ON public.rental_customers
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 13. RLS POLICIES - RENTAL_BOOKINGS
-- ================================================================

CREATE POLICY "Admins can select rental bookings"
  ON public.rental_bookings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert rental bookings"
  ON public.rental_bookings
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update rental bookings"
  ON public.rental_bookings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete rental bookings"
  ON public.rental_bookings
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 14. RLS POLICIES - RENTAL_PAYMENTS
-- ================================================================

CREATE POLICY "Admins can select rental payments"
  ON public.rental_payments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert rental payments"
  ON public.rental_payments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update rental payments"
  ON public.rental_payments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete rental payments"
  ON public.rental_payments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 15. RLS POLICIES - RENTAL_CONDITION_REPORTS
-- ================================================================

CREATE POLICY "Admins can select rental condition reports"
  ON public.rental_condition_reports
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert rental condition reports"
  ON public.rental_condition_reports
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update rental condition reports"
  ON public.rental_condition_reports
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete rental condition reports"
  ON public.rental_condition_reports
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ================================================================
-- 16. SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 06_rental_schema.sql completed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Enabled btree_gist extension';
  RAISE NOTICE '  - Added 5 rental columns to vehicles table (listing_type, daily_rate, weekly_rate, min_rental_days, max_rental_days)';
  RAISE NOTICE '  - Created rental_customers table';
  RAISE NOTICE '  - Created rental_bookings table with EXCLUDE double-booking constraint';
  RAISE NOTICE '  - Created rental_payments table';
  RAISE NOTICE '  - Created rental_condition_reports table';
  RAISE NOTICE '  - Created generate_rental_booking_id() function (TJ-R-YYYY-NNNN)';
  RAISE NOTICE '  - Created booking ID auto-populate trigger';
  RAISE NOTICE '  - Created updated_at triggers for rental_customers and rental_bookings';
  RAISE NOTICE '  - Created indexes for all rental tables';
  RAISE NOTICE '  - Enabled RLS with admin-only policies on all rental tables';
END $$;

COMMIT;
