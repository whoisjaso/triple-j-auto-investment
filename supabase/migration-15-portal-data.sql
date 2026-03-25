-- ============================================================
-- Migration 15: Add portal_data JSONB column
-- ============================================================
-- Stores the full CustomerLinkData payload when admin sends
-- a document to a customer. This enables short, clean portal
-- links (e.g., /documents/portal?id={uuid}) instead of encoding
-- all data in the URL hash fragment.
--
-- The portal_data column contains:
--   s   — section (financing, rental, billOfSale, form130U)
--   d   — dealer data (vehicle info, rates, fees)
--   ds  — dealer signature (base64 data URL)
--   dd  — dealer signature date
--   aid — agreement ID (self-referential)
--   abn — admin buyer name
-- ============================================================

ALTER TABLE document_agreements
  ADD COLUMN IF NOT EXISTS portal_data JSONB;
