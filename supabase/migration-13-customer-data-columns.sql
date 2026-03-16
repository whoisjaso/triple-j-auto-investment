-- ============================================================
-- Migration 13: Add individual customer data columns
-- ============================================================
-- Stores structured customer-submitted data from the portal
-- so the admin dashboard can display it without decoding the
-- compressed completed_link blob.
--
-- Field mapping by document type:
--   Bill of Sale:  buyerAddress → buyer_address, buyerLicense → buyer_license, etc.
--   Rental:        renterAddress → buyer_address, renterLicense → buyer_license, etc.
--   Financing:     buyerAddress → buyer_address (no city/state/zip split)
--   Form 130-U:    mailingAddress → buyer_address, applicantIdNumber → buyer_license, etc.
-- ============================================================

ALTER TABLE document_agreements
  ADD COLUMN IF NOT EXISTS buyer_address TEXT,
  ADD COLUMN IF NOT EXISTS buyer_city TEXT,
  ADD COLUMN IF NOT EXISTS buyer_state TEXT,
  ADD COLUMN IF NOT EXISTS buyer_zip TEXT,
  ADD COLUMN IF NOT EXISTS buyer_license TEXT,
  ADD COLUMN IF NOT EXISTS buyer_license_state TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_address TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_city TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_state TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_zip TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_license TEXT,
  ADD COLUMN IF NOT EXISTS co_buyer_license_state TEXT;
