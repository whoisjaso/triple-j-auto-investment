-- Migration 09: Automation & Delegation Machine Foundation
-- Creates: message_templates, follow_up_queue, sent_messages, market_comparables
-- Extends: leads (new statuses + response tracking), vehicles (intake source fields)

-- ============================================================
-- 1. MESSAGE TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN (
    'lead_nurture', 'registration', 'rental', 'owner', 'system'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'voice')),
  template_key TEXT NOT NULL,  -- e.g. 'lead_nurture_t2h', 'reg_stage_documents_collected'
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es')),
  subject TEXT,  -- email subject (NULL for SMS)
  body TEXT NOT NULL,  -- template body with {variable} placeholders
  variables TEXT[] NOT NULL DEFAULT '{}',  -- list of available variables
  is_approved BOOLEAN NOT NULL DEFAULT false,
  auto_send BOOLEAN NOT NULL DEFAULT false,  -- only sends if approved AND auto_send
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_key, language)
);

-- ============================================================
-- 2. FOLLOW-UP QUEUE TABLE (Auto-Nurture Pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_up_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,  -- 'sms_2h', 'divine_24h', 'sms_48h', 'email_72h', 'sms_7d', 'cold_14d'
  template_key TEXT,  -- references message_templates.template_key
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'voice')),
  send_after TIMESTAMPTZ NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN NOT NULL DEFAULT false,
  cancelled_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, step_key)  -- one step per lead
);

CREATE INDEX idx_follow_up_queue_pending
  ON follow_up_queue(send_after)
  WHERE sent = false AND cancelled = false;

-- ============================================================
-- 3. SENT MESSAGES LOG (audit trail for all auto-messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'voice')),
  recipient TEXT NOT NULL,  -- phone or email
  subject TEXT,
  body TEXT NOT NULL,  -- rendered body (variables replaced)
  entity_type TEXT CHECK (entity_type IN ('lead', 'registration', 'rental', 'owner')),
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  provider_message_id TEXT,  -- Twilio SID or Resend ID
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sent_messages_entity ON sent_messages(entity_type, entity_id);
CREATE INDEX idx_sent_messages_template ON sent_messages(template_key);

-- ============================================================
-- 4. EXTEND LEADS TABLE (response tracking + statuses)
-- ============================================================
DO $$ BEGIN
  -- Add 'Engaged' and 'Cold' to lead status options
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
  ALTER TABLE leads ADD CONSTRAINT leads_status_check
    CHECK (status IN ('New', 'Contacted', 'Engaged', 'Scheduled', 'Cold', 'Closed'));
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_step TEXT;  -- current step in nurture sequence
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nurture_active BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_visit_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS visit_notes TEXT;

-- ============================================================
-- 5. MARKET COMPARABLES TABLE (Competitor Monitoring)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_comparables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'autotrader', 'cargurus', 'cars.com', 'manual'
  comparable_price DECIMAL(10,2) NOT NULL,
  comparable_year INTEGER,
  comparable_make TEXT,
  comparable_model TEXT,
  comparable_mileage INTEGER,
  comparable_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_comparables_vehicle ON market_comparables(vehicle_id);

-- ============================================================
-- 6. EXTEND VEHICLES TABLE (intake source tracking)
-- Already partially done in Phase 20, ensure columns exist
-- ============================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intake_source TEXT
  CHECK (intake_source IN ('manheim', 'adesa', 'other_auction', 'wholesale', 'private', 'trade_in'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intake_source_name TEXT;  -- seller/auction name
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intake_notes TEXT;  -- condition notes at intake
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS intake_condition JSONB DEFAULT '[]'::jsonb;
  -- Array of condition flags: [{flag: 'check_engine', active: true}, ...]

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_comparables ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all new tables
CREATE POLICY admin_all_message_templates ON message_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY admin_all_follow_up_queue ON follow_up_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY admin_all_sent_messages ON sent_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY admin_all_market_comparables ON market_comparables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role bypass for Edge Functions
CREATE POLICY service_all_message_templates ON message_templates
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_all_follow_up_queue ON follow_up_queue
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_all_sent_messages ON sent_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 8. AUTO-ENQUEUE FOLLOW-UP ON NEW LEAD (Trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION enqueue_lead_follow_up()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enqueue for new leads with a phone number
  IF NEW.phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g')) >= 10 THEN
    -- Step 1: SMS at T+2 hours
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'sms_2h', 'lead_nurture_sms_2h', 'sms', NOW() + INTERVAL '2 hours')
    ON CONFLICT (lead_id, step_key) DO NOTHING;

    -- Step 2: Divine re-call at T+24 hours
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'divine_24h', 'lead_nurture_divine_24h', 'voice', NOW() + INTERVAL '24 hours')
    ON CONFLICT (lead_id, step_key) DO NOTHING;

    -- Step 3: SMS with photo at T+48 hours
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'sms_48h', 'lead_nurture_sms_48h', 'sms', NOW() + INTERVAL '48 hours')
    ON CONFLICT (lead_id, step_key) DO NOTHING;

    -- Step 4: Email at T+72 hours
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'email_72h', 'lead_nurture_email_72h', 'email', NOW() + INTERVAL '72 hours')
    ON CONFLICT (lead_id, step_key) DO NOTHING;

    -- Step 5: Final SMS at T+7 days
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'sms_7d', 'lead_nurture_sms_7d', 'sms', NOW() + INTERVAL '7 days')
    ON CONFLICT (lead_id, step_key) DO NOTHING;

    -- Step 6: Auto-cold at T+14 days
    INSERT INTO follow_up_queue (lead_id, step_key, template_key, channel, send_after)
    VALUES (NEW.id, 'cold_14d', 'lead_nurture_cold_14d', 'sms', NOW() + INTERVAL '14 days')
    ON CONFLICT (lead_id, step_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enqueue_lead_follow_up
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_lead_follow_up();

-- ============================================================
-- 9. CANCEL FOLLOW-UPS WHEN LEAD RESPONDS (Trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_follow_ups_on_response()
RETURNS TRIGGER AS $$
BEGIN
  -- When lead status changes to Engaged, Scheduled, or Closed, cancel pending follow-ups
  IF NEW.status IN ('Engaged', 'Scheduled', 'Closed') AND
     (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    UPDATE follow_up_queue
    SET cancelled = true,
        cancelled_reason = 'Lead status changed to ' || NEW.status
    WHERE lead_id = NEW.id
      AND sent = false
      AND cancelled = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cancel_follow_ups_on_response
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION cancel_follow_ups_on_response();

-- ============================================================
-- 10. UPDATE TIMESTAMPS TRIGGER
-- ============================================================
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
