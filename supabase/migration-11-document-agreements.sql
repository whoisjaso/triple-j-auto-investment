-- Document Agreement Tracking
-- Stores records of documents sent to customers and their completion status

CREATE TABLE IF NOT EXISTS document_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('billOfSale', 'financing', 'rental', 'form130U')),
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  vehicle_description TEXT,
  vehicle_vin TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  acknowledgments JSONB DEFAULT '{}',
  has_buyer_signature BOOLEAN DEFAULT FALSE,
  has_cobuyer_signature BOOLEAN DEFAULT FALSE,
  has_dealer_signature BOOLEAN DEFAULT FALSE,
  has_buyer_id BOOLEAN DEFAULT FALSE,
  completed_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_document_agreements_status ON document_agreements(status);
CREATE INDEX IF NOT EXISTS idx_document_agreements_sent_at ON document_agreements(sent_at DESC);

-- RLS policies
ALTER TABLE document_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON document_agreements
  FOR ALL USING (true) WITH CHECK (true);
