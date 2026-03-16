-- Add finalization columns to document_agreements
-- Supports: PDF storage paths, finalize timestamp, email tracking

ALTER TABLE document_agreements
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_buyer_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_dealer_path TEXT,
  ADD COLUMN IF NOT EXISTS last_emailed_at TIMESTAMPTZ;

-- Update status CHECK to include 'finalized'
ALTER TABLE document_agreements
  DROP CONSTRAINT IF EXISTS document_agreements_status_check;
ALTER TABLE document_agreements
  ADD CONSTRAINT document_agreements_status_check
    CHECK (status IN ('pending', 'completed', 'finalized'));

-- Create storage bucket for document PDFs (if not exists)
-- NOTE: Run this in Supabase Dashboard > Storage > New Bucket:
--   Name: documents
--   Public: false (private)
--   File size limit: 10MB
--   Allowed MIME types: application/pdf
