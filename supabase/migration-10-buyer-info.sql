-- ============================================================
-- v0.2 Phase 10: CRM Buyer Info — Migration
-- Adds buyer_name and buyer_phone to leads table
-- These fields capture the actual buyer at time of sale,
-- which may differ from the original lead contact.
-- Future: syncs to bill of sale, 130u, rental agreements,
-- as-is guides, vehicle registration guides.
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS buyer_phone text;
