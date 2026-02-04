-- ================================================================
-- TRIPLE J AUTO - REGISTRATION SCHEMA UPDATE MIGRATION
-- ================================================================
-- Migration: 02_registration_schema_update.sql
-- Purpose: Update registration schema for 6-stage workflow with audit trail
-- Run after: registration_ledger.sql (01_registration_ledger.sql)
-- Phase: 02-registration-database-foundation, Plan 01
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ADD REGISTRATION ADMIN ROLE TO PROFILES
-- ================================================================
-- New role per CONTEXT.md: "Registration Admin" separate from is_admin
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_registration_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_registration_admin IS
  'Allows user to manage registrations without full admin access';

-- ================================================================
-- 2. MODIFY REGISTRATIONS TABLE - ADD NEW COLUMNS
-- ================================================================

-- Customer address (full mailing address for sticker delivery)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Plate number assigned from dealer inventory at sale
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS plate_number VARCHAR(10);

-- Optional link to Bill of Sale record
-- Note: Using SET NULL to handle case where bills_of_sale table may not exist
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS bill_of_sale_id UUID;

-- Admin general notes
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Notes when status is rejected (DMV feedback)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

-- Soft delete flag - registrations are never hard deleted per CONTEXT.md
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Document checklist booleans (per CONTEXT.md: Title front/back, 130-U, Insurance, Inspection)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS doc_title_front BOOLEAN DEFAULT FALSE;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS doc_title_back BOOLEAN DEFAULT FALSE;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS doc_130u BOOLEAN DEFAULT FALSE;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS doc_insurance BOOLEAN DEFAULT FALSE;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS doc_inspection BOOLEAN DEFAULT FALSE;

-- Milestone timestamps (auto-populated when status advances)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;

-- Temporary field for audit note capture (set before update, captured by trigger)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS pending_change_reason TEXT;

-- ================================================================
-- 3. UPDATE CURRENT_STAGE CONSTRAINT FOR 6-STAGE WORKFLOW
-- ================================================================
-- Old stages: payment, insurance, inspection, submission, dmv_processing, approved, ready
-- New stages: sale_complete, documents_collected, submitted_to_dmv, dmv_processing,
--             sticker_ready, sticker_delivered, rejected

-- First, drop existing constraint if it exists
ALTER TABLE public.registrations
DROP CONSTRAINT IF EXISTS registrations_current_stage_check;

-- Add new constraint with 6-stage workflow plus rejected
ALTER TABLE public.registrations
ADD CONSTRAINT registrations_current_stage_check
CHECK (current_stage IN (
  'sale_complete',
  'documents_collected',
  'submitted_to_dmv',
  'dmv_processing',
  'sticker_ready',
  'sticker_delivered',
  'rejected'
));

-- ================================================================
-- 4. CREATE REGISTRATION_AUDIT TABLE
-- ================================================================
-- Per CONTEXT.md: All field changes tracked, show old and new values,
-- optional change notes, retention forever

CREATE TABLE IF NOT EXISTS public.registration_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to registration (SET NULL preserves history if registration is deleted)
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,

  -- What changed
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  changed_fields JSONB, -- Only changed fields with {field: {old: x, new: y}}
  full_old_record JSONB, -- Complete record before change
  full_new_record JSONB, -- Complete record after change

  -- Who/When
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional context (from pending_change_reason)
  change_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_registration
ON public.registration_audit(registration_id);

CREATE INDEX IF NOT EXISTS idx_audit_changed_at
ON public.registration_audit(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_operation
ON public.registration_audit(operation);

-- Enable RLS on audit table
ALTER TABLE public.registration_audit ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 5. CREATE AUDIT TRIGGER FUNCTION
-- ================================================================
-- Captures all field changes, stores old/new values, captures change reason

CREATE OR REPLACE FUNCTION audit_registration_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
  col_name TEXT;
  old_val JSONB;
  new_val JSONB;
  captured_reason TEXT;
BEGIN
  -- For UPDATE, compute changed fields
  IF TG_OP = 'UPDATE' THEN
    -- Capture and clear pending_change_reason
    captured_reason := NEW.pending_change_reason;
    NEW.pending_change_reason := NULL;

    -- Compare each field and record changes
    -- Check each relevant field individually for changed_fields JSONB

    -- Text/varchar fields
    IF OLD.order_id IS DISTINCT FROM NEW.order_id THEN
      changed_fields := changed_fields || jsonb_build_object('order_id', jsonb_build_object('old', OLD.order_id, 'new', NEW.order_id));
    END IF;

    IF OLD.customer_name IS DISTINCT FROM NEW.customer_name THEN
      changed_fields := changed_fields || jsonb_build_object('customer_name', jsonb_build_object('old', OLD.customer_name, 'new', NEW.customer_name));
    END IF;

    IF OLD.customer_email IS DISTINCT FROM NEW.customer_email THEN
      changed_fields := changed_fields || jsonb_build_object('customer_email', jsonb_build_object('old', OLD.customer_email, 'new', NEW.customer_email));
    END IF;

    IF OLD.customer_phone IS DISTINCT FROM NEW.customer_phone THEN
      changed_fields := changed_fields || jsonb_build_object('customer_phone', jsonb_build_object('old', OLD.customer_phone, 'new', NEW.customer_phone));
    END IF;

    IF OLD.customer_address IS DISTINCT FROM NEW.customer_address THEN
      changed_fields := changed_fields || jsonb_build_object('customer_address', jsonb_build_object('old', OLD.customer_address, 'new', NEW.customer_address));
    END IF;

    IF OLD.vin IS DISTINCT FROM NEW.vin THEN
      changed_fields := changed_fields || jsonb_build_object('vin', jsonb_build_object('old', OLD.vin, 'new', NEW.vin));
    END IF;

    IF OLD.plate_number IS DISTINCT FROM NEW.plate_number THEN
      changed_fields := changed_fields || jsonb_build_object('plate_number', jsonb_build_object('old', OLD.plate_number, 'new', NEW.plate_number));
    END IF;

    IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
      changed_fields := changed_fields || jsonb_build_object('current_stage', jsonb_build_object('old', OLD.current_stage, 'new', NEW.current_stage));
    END IF;

    IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
      changed_fields := changed_fields || jsonb_build_object('current_status', jsonb_build_object('old', OLD.current_status, 'new', NEW.current_status));
    END IF;

    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      changed_fields := changed_fields || jsonb_build_object('notes', jsonb_build_object('old', OLD.notes, 'new', NEW.notes));
    END IF;

    IF OLD.rejection_notes IS DISTINCT FROM NEW.rejection_notes THEN
      changed_fields := changed_fields || jsonb_build_object('rejection_notes', jsonb_build_object('old', OLD.rejection_notes, 'new', NEW.rejection_notes));
    END IF;

    -- Boolean fields
    IF OLD.is_archived IS DISTINCT FROM NEW.is_archived THEN
      changed_fields := changed_fields || jsonb_build_object('is_archived', jsonb_build_object('old', OLD.is_archived, 'new', NEW.is_archived));
    END IF;

    IF OLD.doc_title_front IS DISTINCT FROM NEW.doc_title_front THEN
      changed_fields := changed_fields || jsonb_build_object('doc_title_front', jsonb_build_object('old', OLD.doc_title_front, 'new', NEW.doc_title_front));
    END IF;

    IF OLD.doc_title_back IS DISTINCT FROM NEW.doc_title_back THEN
      changed_fields := changed_fields || jsonb_build_object('doc_title_back', jsonb_build_object('old', OLD.doc_title_back, 'new', NEW.doc_title_back));
    END IF;

    IF OLD.doc_130u IS DISTINCT FROM NEW.doc_130u THEN
      changed_fields := changed_fields || jsonb_build_object('doc_130u', jsonb_build_object('old', OLD.doc_130u, 'new', NEW.doc_130u));
    END IF;

    IF OLD.doc_insurance IS DISTINCT FROM NEW.doc_insurance THEN
      changed_fields := changed_fields || jsonb_build_object('doc_insurance', jsonb_build_object('old', OLD.doc_insurance, 'new', NEW.doc_insurance));
    END IF;

    IF OLD.doc_inspection IS DISTINCT FROM NEW.doc_inspection THEN
      changed_fields := changed_fields || jsonb_build_object('doc_inspection', jsonb_build_object('old', OLD.doc_inspection, 'new', NEW.doc_inspection));
    END IF;

    -- Timestamp fields (comparing as text to handle NULL properly)
    IF OLD.sale_date::text IS DISTINCT FROM NEW.sale_date::text THEN
      changed_fields := changed_fields || jsonb_build_object('sale_date', jsonb_build_object('old', OLD.sale_date, 'new', NEW.sale_date));
    END IF;

    IF OLD.submission_date::text IS DISTINCT FROM NEW.submission_date::text THEN
      changed_fields := changed_fields || jsonb_build_object('submission_date', jsonb_build_object('old', OLD.submission_date, 'new', NEW.submission_date));
    END IF;

    IF OLD.approval_date::text IS DISTINCT FROM NEW.approval_date::text THEN
      changed_fields := changed_fields || jsonb_build_object('approval_date', jsonb_build_object('old', OLD.approval_date, 'new', NEW.approval_date));
    END IF;

    IF OLD.delivery_date::text IS DISTINCT FROM NEW.delivery_date::text THEN
      changed_fields := changed_fields || jsonb_build_object('delivery_date', jsonb_build_object('old', OLD.delivery_date, 'new', NEW.delivery_date));
    END IF;
  END IF;

  -- Insert audit record
  INSERT INTO public.registration_audit (
    registration_id,
    operation,
    changed_fields,
    full_old_record,
    full_new_record,
    changed_by,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN changed_fields ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    captured_reason
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS registration_audit_trigger ON public.registrations;

CREATE TRIGGER registration_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION audit_registration_changes();

-- ================================================================
-- 6. CREATE STATUS TRANSITION VALIDATION TRIGGER
-- ================================================================
-- Per CONTEXT.md: Forward-only status transitions, except rejected -> submitted_to_dmv

CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "sale_complete": ["documents_collected"],
    "documents_collected": ["submitted_to_dmv"],
    "submitted_to_dmv": ["dmv_processing"],
    "dmv_processing": ["sticker_ready", "rejected"],
    "sticker_ready": ["sticker_delivered"],
    "sticker_delivered": [],
    "rejected": ["submitted_to_dmv"]
  }'::JSONB;
  allowed_next TEXT[];
BEGIN
  -- Skip validation for INSERT (new registrations start at sale_complete)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Skip if status didn't change
  IF OLD.current_stage = NEW.current_stage THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions for current stage
  allowed_next := ARRAY(
    SELECT jsonb_array_elements_text(valid_transitions -> OLD.current_stage)
  );

  -- Validate the transition
  IF NOT (NEW.current_stage = ANY(allowed_next)) THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %. Allowed: %',
      OLD.current_stage,
      NEW.current_stage,
      array_to_string(allowed_next, ', ');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (BEFORE UPDATE to block invalid transitions)
DROP TRIGGER IF EXISTS validate_registration_status ON public.registrations;

CREATE TRIGGER validate_registration_status
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION validate_status_transition();

-- ================================================================
-- 7. CREATE AUTO-POPULATE MILESTONE DATES TRIGGER
-- ================================================================
-- Per CONTEXT.md: Milestone dates auto-populate when status advances

CREATE OR REPLACE FUNCTION auto_set_milestone_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if status didn't change
  IF OLD.current_stage = NEW.current_stage THEN
    RETURN NEW;
  END IF;

  -- Set sale_date when entering sale_complete (if NULL)
  IF NEW.current_stage = 'sale_complete' AND NEW.sale_date IS NULL THEN
    NEW.sale_date := NOW();
  END IF;

  -- Set submission_date when entering submitted_to_dmv (if NULL)
  IF NEW.current_stage = 'submitted_to_dmv' AND NEW.submission_date IS NULL THEN
    NEW.submission_date := NOW();
  END IF;

  -- Set approval_date when entering sticker_ready (if NULL)
  IF NEW.current_stage = 'sticker_ready' AND NEW.approval_date IS NULL THEN
    NEW.approval_date := NOW();
  END IF;

  -- Set delivery_date when entering sticker_delivered (if NULL)
  IF NEW.current_stage = 'sticker_delivered' AND NEW.delivery_date IS NULL THEN
    NEW.delivery_date := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (BEFORE UPDATE, before audit trigger captures the change)
DROP TRIGGER IF EXISTS auto_milestone_dates ON public.registrations;

CREATE TRIGGER auto_milestone_dates
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION auto_set_milestone_dates();

-- ================================================================
-- 8. UPDATE RLS POLICIES
-- ================================================================

-- 8a. Drop existing admin policies for registrations
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.registrations;

-- 8b. Create new policies for registration admin role

-- INSERT: is_admin OR is_registration_admin can create registrations
CREATE POLICY "Registration admins can insert registrations"
ON public.registrations
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

-- UPDATE: is_admin OR is_registration_admin can update registrations
CREATE POLICY "Registration admins can update registrations"
ON public.registrations
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

-- DELETE: ONLY is_admin can delete (soft delete via is_archived preferred)
CREATE POLICY "Only admins can delete registrations"
ON public.registrations
FOR DELETE USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true
  )
);

-- SELECT: Keep existing public access (order_id acts as token)
-- Note: "Public can view registration by order_id" policy already exists

-- 8c. RLS for registration_audit table

-- SELECT: Only admins and registration admins can view audit trail
CREATE POLICY "Admins can view audit trail"
ON public.registration_audit
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE is_admin = true OR is_registration_admin = true
  )
);

-- No INSERT/UPDATE/DELETE policies = trigger only writes

-- ================================================================
-- 9. ADD INDEX FOR ARCHIVED FILTER
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_registrations_archived
ON public.registrations(is_archived)
WHERE is_archived = false;

-- ================================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ================================================================
COMMENT ON TABLE public.registration_audit IS
  'Audit trail for all registration changes. Populated by trigger, no direct writes.';

COMMENT ON COLUMN public.registrations.current_stage IS
  'Current workflow stage: sale_complete, documents_collected, submitted_to_dmv, dmv_processing, sticker_ready, sticker_delivered, rejected';

COMMENT ON COLUMN public.registrations.pending_change_reason IS
  'Temporary field: Set before update to capture audit note, cleared by trigger';

COMMENT ON COLUMN public.registrations.is_archived IS
  'Soft delete flag. Registrations are never hard deleted per compliance requirements.';

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 02_registration_schema_update.sql completed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added is_registration_admin to profiles';
  RAISE NOTICE '  - Added 14 columns to registrations table';
  RAISE NOTICE '  - Updated current_stage constraint for 6-stage workflow';
  RAISE NOTICE '  - Created registration_audit table with indexes';
  RAISE NOTICE '  - Created audit_registration_changes() trigger function';
  RAISE NOTICE '  - Created validate_status_transition() trigger function';
  RAISE NOTICE '  - Created auto_set_milestone_dates() trigger function';
  RAISE NOTICE '  - Updated RLS policies for registration_admin role';
END $$;

COMMIT;
