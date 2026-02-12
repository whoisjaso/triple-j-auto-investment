-- ================================================================
-- Migration 05: Registration Checker
-- Phase: 05-registration-checker
-- Plan: 01 - Database Schema and VIN Validation Foundation
--
-- Purpose: Add mileage, checker_results (JSONB), and related
-- columns to the registrations table. Create an invalidation
-- trigger that automatically clears checker results when VIN or
-- mileage change on the record.
--
-- Depends on: 02_registration_schema_update.sql
-- ================================================================

-- ================================================================
-- SECTION 1: ADD MILEAGE COLUMN
-- ================================================================
-- Odometer reading stored on the registration record. Used for
-- cross-document consistency checks (130-U Box 9, inspection).

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- ================================================================
-- SECTION 2: ADD CHECKER STATE COLUMNS
-- ================================================================
-- Persistent checker results so admin sees last check status
-- without re-running every time.

-- JSONB blob storing the full CheckerResult object
-- (docComplete, vinFormatValid, vinConfirmedOnDocs, mileageConfirmedOnDocs,
--  surrenderedFront, surrenderedBack)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS checker_results JSONB DEFAULT NULL;

-- Timestamp when all checks passed (NULL if not yet completed or invalidated)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS checker_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Whether admin overrode failed checks to proceed anyway
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS checker_override BOOLEAN DEFAULT FALSE;

-- When the override was confirmed
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS checker_override_at TIMESTAMPTZ DEFAULT NULL;

-- ================================================================
-- SECTION 3: INVALIDATION TRIGGER
-- ================================================================
-- When VIN or mileage change on a registration, automatically
-- clear all checker state. This prevents stale "pass" results
-- from persisting after the underlying data changes.

CREATE OR REPLACE FUNCTION invalidate_checker_on_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If VIN or mileage changed, invalidate checker results
  IF OLD.vin IS DISTINCT FROM NEW.vin OR OLD.mileage IS DISTINCT FROM NEW.mileage THEN
    NEW.checker_results := NULL;
    NEW.checker_completed_at := NULL;
    NEW.checker_override := FALSE;
    NEW.checker_override_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotency)
DROP TRIGGER IF EXISTS trg_invalidate_checker ON public.registrations;

CREATE TRIGGER trg_invalidate_checker
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION invalidate_checker_on_data_change();

-- ================================================================
-- SUCCESS NOTICE
-- ================================================================
DO $$ BEGIN
  RAISE NOTICE 'Migration 05: Registration Checker schema created successfully!';
  RAISE NOTICE 'Columns added: mileage, checker_results, checker_completed_at, checker_override, checker_override_at';
  RAISE NOTICE 'Trigger: trg_invalidate_checker (clears checker on VIN/mileage change)';
END $$;

-- ================================================================
-- ROLLBACK INSTRUCTIONS
-- ================================================================
-- To undo this migration, run in order:
--
--   DROP TRIGGER IF EXISTS trg_invalidate_checker ON public.registrations;
--   DROP FUNCTION IF EXISTS invalidate_checker_on_data_change();
--
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS checker_override_at;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS checker_override;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS checker_completed_at;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS checker_results;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS mileage;
-- ================================================================
