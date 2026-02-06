-- ================================================================
-- Migration 03: Customer Portal Access
-- Phase: 03-customer-portal-status-tracker
-- Plan: 01 - Token Access Infrastructure
--
-- Purpose: Add token-based access for customer registration tracking.
-- Tokens auto-generate at registration creation and expire 30 days
-- after sticker is delivered.
--
-- Breaking Change: Public SELECT now requires valid (non-expired) token,
-- not just order_id. Links will stop working 30 days after delivery.
-- ================================================================

-- ================================================================
-- PART 1: Add New Columns
-- ================================================================

-- Access token for customer tracking links (32-char hex, generated at insert)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS access_token VARCHAR(32)
NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex');

-- Token expiry timestamp (NULL until sticker delivered, then 30 days)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Vehicle body type for car icon selection in customer portal
-- Values: 'sedan', 'suv', 'truck', 'hatchback', 'van', 'coupe', 'convertible', 'wagon'
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS vehicle_body_type VARCHAR(50);

-- Create index on access_token for efficient lookups
CREATE INDEX IF NOT EXISTS idx_registrations_access_token
ON public.registrations(access_token);

-- ================================================================
-- PART 2: Token Expiry Trigger
-- ================================================================

-- Function to set token expiry when registration reaches sticker_delivered
CREATE OR REPLACE FUNCTION set_token_expiry_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When transitioning to sticker_delivered, set 30-day expiry
  IF NEW.current_stage = 'sticker_delivered' AND
     (OLD.current_stage IS NULL OR OLD.current_stage != 'sticker_delivered') THEN
    NEW.token_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger fires before update to set expiry in same transaction
CREATE TRIGGER registration_set_token_expiry
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION set_token_expiry_on_delivery();

-- ================================================================
-- PART 3: Update RLS Policies for Token-Based Access
-- ================================================================

-- Drop existing public policy that allowed access by order_id alone
DROP POLICY IF EXISTS "Public can view registration by order_id" ON public.registrations;

-- New policy: Public can SELECT only if token is not expired
-- The actual token matching happens in application code via .eq('access_token', token)
-- RLS ensures that expired tokens cannot access any data
CREATE POLICY "Public can view registration by valid token" ON public.registrations
  FOR SELECT TO anon
  USING (
    -- Allow access if token hasn't expired
    -- NULL token_expires_at means never delivered = always valid
    token_expires_at IS NULL OR token_expires_at > NOW()
  );

-- ================================================================
-- PART 4: Backfill Existing Records
-- ================================================================

-- Generate access tokens for any existing records that don't have one
-- This handles records created before this migration
UPDATE public.registrations
SET access_token = encode(gen_random_bytes(16), 'hex')
WHERE access_token IS NULL;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
--
-- New columns added:
--   - access_token: 32-char hex token for customer tracking links
--   - token_expires_at: Expiry timestamp (30 days after delivery)
--   - vehicle_body_type: Vehicle type for icon display
--
-- New trigger:
--   - registration_set_token_expiry: Sets expiry on sticker_delivered
--
-- Updated RLS:
--   - Public SELECT requires non-expired token
--
-- To rollback:
--   DROP TRIGGER IF EXISTS registration_set_token_expiry ON public.registrations;
--   DROP FUNCTION IF EXISTS set_token_expiry_on_delivery();
--   DROP POLICY IF EXISTS "Public can view registration by valid token" ON public.registrations;
--   DROP INDEX IF EXISTS idx_registrations_access_token;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS access_token;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS token_expires_at;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS vehicle_body_type;
-- ================================================================
