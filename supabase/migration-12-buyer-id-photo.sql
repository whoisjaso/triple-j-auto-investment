-- Migration 12: Add buyer_id_photo column for storing customer ID images
-- Also add agreement_id tracking for linking admin-sent and customer-completed records

ALTER TABLE document_agreements ADD COLUMN IF NOT EXISTS buyer_id_photo TEXT;
