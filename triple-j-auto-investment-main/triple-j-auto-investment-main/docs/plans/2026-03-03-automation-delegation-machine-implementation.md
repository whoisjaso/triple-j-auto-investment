# Automation & Delegation Machine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform every manual workflow into an automated, employee-delegatable system — the "Delegation Machine."

**Architecture:** Build 7 interconnected features in dependency order. Foundation layers first (database + template system), then automation pipelines, then the unified Command Center that consumes everything. Each task is a self-contained commit.

**Tech Stack:** React 19 + TypeScript 5.8 + Supabase (PostgreSQL + Edge Functions + pg_cron) + Tailwind CSS + Framer Motion + Twilio (SMS) + Resend (email) + Retell AI (voice) + Google Gemini (AI content) + NHTSA (VIN decode)

**Existing Patterns to Follow:**
- Store: Facade Context in `context/Store.tsx` delegating to `lib/store/*.ts` modules
- Services: Pure functions in `services/*.ts`, return null/[] on error, snake_case→camelCase transforms
- Types: All interfaces in `types.ts` (778 lines)
- Translations: `utils/translations.ts` with `t.en.*` / `t.es.*` namespaces, accessed via `useLanguage()`
- Components: Functional React components, Tailwind classes, tj-green/tj-gold color palette
- Migrations: Sequential SQL in `supabase/migrations/`, RLS on all tables, SECURITY DEFINER triggers
- Edge Functions: Deno in `supabase/functions/*/index.ts`, service_role key, batch processing with try/catch per item

---

## Build Order & Dependencies

```
Task 1: Database Migration (foundation tables)
    ↓
Task 2: Template Service + Seed Data
    ↓
Task 3: Template Manager Admin Page
    ↓
Task 4: Vehicle Quick-Intake Wizard (standalone)
    ↓
Task 5: Auto-Nurture Lead Pipeline Service
    ↓
Task 6: Auto-Nurture Edge Function
    ↓
Task 7: Registration Auto-Pilot (document upload + auto-notify enhancements)
    ↓
Task 8: Rental Booking Wizard (refactored)
    ↓
Task 9: Rental Return Wizard + Payment Tracking
    ↓
Task 10: Action Queue Service (intelligence computation)
    ↓
Task 11: Smart Command Center Page
    ↓
Task 12: Weekly Digest Edge Function
    ↓
Task 13: Rental Auto-Alerts Edge Function
    ↓
Task 14: Competitor Monitoring Service
```

---

## Task 1: Database Migration — Foundation Tables

**Files:**
- Create: `supabase/migrations/09_automation_foundation.sql`
- Modify: `types.ts` (add new interfaces)

**Step 1: Write the migration SQL**

```sql
-- Migration 09: Automation & Delegation Machine Foundation
-- Creates: message_templates, follow_up_queue, action_items (view), market_comparables
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
```

**Step 2: Add TypeScript types**

Add to `types.ts`:

```typescript
// ============================================================
// MESSAGE TEMPLATES
// ============================================================
export type TemplateCategory = 'lead_nurture' | 'registration' | 'rental' | 'owner' | 'system';
export type TemplateChannel = 'sms' | 'email' | 'voice';

export interface MessageTemplate {
  id: string;
  category: TemplateCategory;
  channel: TemplateChannel;
  templateKey: string;
  language: Language;
  subject: string | null;
  body: string;
  variables: string[];
  isApproved: boolean;
  autoSend: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// FOLLOW-UP QUEUE
// ============================================================
export type FollowUpStepKey = 'sms_2h' | 'divine_24h' | 'sms_48h' | 'email_72h' | 'sms_7d' | 'cold_14d';

export interface FollowUpQueueItem {
  id: string;
  leadId: string;
  stepKey: FollowUpStepKey;
  templateKey: string | null;
  channel: TemplateChannel;
  sendAfter: string;
  sent: boolean;
  sentAt: string | null;
  cancelled: boolean;
  cancelledReason: string | null;
  error: string | null;
  createdAt: string;
}

// ============================================================
// SENT MESSAGES
// ============================================================
export type SentMessageStatus = 'sent' | 'delivered' | 'failed' | 'bounced';
export type SentMessageEntityType = 'lead' | 'registration' | 'rental' | 'owner';

export interface SentMessage {
  id: string;
  templateId: string | null;
  templateKey: string;
  channel: TemplateChannel;
  recipient: string;
  subject: string | null;
  body: string;
  entityType: SentMessageEntityType | null;
  entityId: string | null;
  status: SentMessageStatus;
  providerMessageId: string | null;
  error: string | null;
  sentAt: string;
  createdAt: string;
}

// ============================================================
// MARKET COMPARABLES
// ============================================================
export interface MarketComparable {
  id: string;
  vehicleId: string;
  source: string;
  comparablePrice: number;
  comparableYear: number | null;
  comparableMake: string | null;
  comparableModel: string | null;
  comparableMileage: number | null;
  comparableUrl: string | null;
  fetchedAt: string;
  createdAt: string;
}

// ============================================================
// ACTION QUEUE ITEM (Command Center)
// ============================================================
export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low' | 'info';
export type ActionCategory = 'rental' | 'lead' | 'registration' | 'inventory' | 'insurance' | 'plate' | 'referral' | 'system';

export interface ActionItem {
  id: string;
  priority: ActionPriority;
  category: ActionCategory;
  title: string;
  description: string;
  actionType: string;  // 'advance_stage', 'call_lead', 'adjust_price', etc.
  actionLabel: string;  // button text
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// INTAKE CONDITION FLAGS
// ============================================================
export interface IntakeConditionFlag {
  flag: 'check_engine' | 'dents' | 'scratches' | 'tire_wear' | 'interior_damage' | 'mechanical_issues' | 'other';
  active: boolean;
  notes?: string;
}

export type IntakeSource = 'manheim' | 'adesa' | 'other_auction' | 'wholesale' | 'private' | 'trade_in';

// ============================================================
// LEAD STATUS (extended)
// ============================================================
export type LeadStatus = 'New' | 'Contacted' | 'Engaged' | 'Scheduled' | 'Cold' | 'Closed';
```

**Step 3: Run migration against Supabase**

```bash
# Apply via Supabase Dashboard SQL Editor or CLI
# This migration creates 4 new tables, extends leads + vehicles, adds 2 triggers
```

**Step 4: Commit**

```bash
git add supabase/migrations/09_automation_foundation.sql types.ts
git commit -m "feat: add automation foundation tables — templates, follow-up queue, sent messages, market comparables"
```

---

## Task 2: Template Service + Seed Data

**Files:**
- Create: `services/templateService.ts`
- Create: `supabase/migrations/09b_seed_templates.sql`

**Step 1: Write the template service**

```typescript
// services/templateService.ts
import { supabase } from '../supabase/config';
import { MessageTemplate, TemplateCategory, TemplateChannel, SentMessage } from '../types';

// ============================================================
// TRANSFORMERS
// ============================================================
function transformTemplate(row: any): MessageTemplate {
  return {
    id: row.id,
    category: row.category,
    channel: row.channel,
    templateKey: row.template_key,
    language: row.language,
    subject: row.subject,
    body: row.body,
    variables: row.variables || [],
    isApproved: row.is_approved,
    autoSend: row.auto_send,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformSentMessage(row: any): SentMessage {
  return {
    id: row.id,
    templateId: row.template_id,
    templateKey: row.template_key,
    channel: row.channel,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    providerMessageId: row.provider_message_id,
    error: row.error,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

// ============================================================
// TEMPLATE CRUD
// ============================================================
export async function getAllTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('category')
    .order('sort_order');
  if (error) { console.error('Failed to fetch templates:', error); return []; }
  return (data || []).map(transformTemplate);
}

export async function getTemplatesByCategory(category: TemplateCategory): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('category', category)
    .order('sort_order');
  if (error) { console.error('Failed to fetch templates:', error); return []; }
  return (data || []).map(transformTemplate);
}

export async function getTemplateByKey(templateKey: string, language: string = 'en'): Promise<MessageTemplate | null> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('language', language)
    .single();
  if (error) return null;
  return transformTemplate(data);
}

export async function updateTemplate(
  id: string,
  updates: { body?: string; subject?: string; isApproved?: boolean; autoSend?: boolean }
): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.body !== undefined) dbUpdates.body = updates.body;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
  if (updates.autoSend !== undefined) dbUpdates.auto_send = updates.autoSend;

  const { error } = await supabase
    .from('message_templates')
    .update(dbUpdates)
    .eq('id', id);
  if (error) { console.error('Failed to update template:', error); return false; }
  return true;
}

// ============================================================
// TEMPLATE RENDERING
// ============================================================
export function renderTemplate(body: string, variables: Record<string, string>): string {
  let rendered = body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return rendered;
}

// ============================================================
// SENT MESSAGES
// ============================================================
export async function getSentMessages(
  entityType?: string,
  entityId?: string,
  limit: number = 50
): Promise<SentMessage[]> {
  let query = supabase
    .from('sent_messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query;
  if (error) { console.error('Failed to fetch sent messages:', error); return []; }
  return (data || []).map(transformSentMessage);
}

export async function getRecentCommunications(limit: number = 20): Promise<SentMessage[]> {
  const { data, error } = await supabase
    .from('sent_messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Failed to fetch communications:', error); return []; }
  return (data || []).map(transformSentMessage);
}
```

**Step 2: Write seed data migration**

```sql
-- Migration 09b: Seed default message templates
-- All templates start as is_approved=false, auto_send=false (admin must review first)

-- LEAD NURTURE TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'lead_nurture_sms_2h', 'en',
 'Hi {customer_name}, this is Triple J Auto Investment. We tried reaching you about the {vehicle_year} {vehicle_make} {vehicle_model}. Text us back or call (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 1),

('lead_nurture', 'voice', 'lead_nurture_divine_24h', 'en',
 'Follow-up call for {customer_name} about {vehicle_year} {vehicle_make} {vehicle_model} priced at {vehicle_price}.',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price'], 2),

('lead_nurture', 'sms', 'lead_nurture_sms_48h', 'en',
 'Still thinking about the {vehicle_year} {vehicle_make} {vehicle_model}? It''s still available at ${vehicle_price}. View it here: {vehicle_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price', 'vehicle_url'], 3),

('lead_nurture', 'email', 'lead_nurture_email_72h', 'en',
 'Hi {customer_name}, the {vehicle_year} {vehicle_make} {vehicle_model} you inquired about is still available. Estimated monthly payment: ${monthly_payment}/mo with $500 down. We also have similar vehicles you might like. Visit us at triplejautoinvestment.com/inventory',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'monthly_payment'], 4),

('lead_nurture', 'sms', 'lead_nurture_sms_7d', 'en',
 '{customer_name}, last chance — the {vehicle_year} {vehicle_make} {vehicle_model} has had {inquiry_count} other inquiries this week. Call (832) 400-9760 before it''s gone!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'inquiry_count'], 5),

('lead_nurture', 'sms', 'lead_nurture_cold_14d', 'en',
 '', ARRAY[]::TEXT[], 6)  -- Empty body = system action only (mark cold, no message sent)
ON CONFLICT (template_key, language) DO NOTHING;

-- LEAD NURTURE TEMPLATES (Spanish)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'lead_nurture_sms_2h', 'es',
 'Hola {customer_name}, somos Triple J Auto Investment. Intentamos comunicarnos sobre el {vehicle_year} {vehicle_make} {vehicle_model}. Responda o llame al (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 1),

('lead_nurture', 'sms', 'lead_nurture_sms_48h', 'es',
 'Todavia pensando en el {vehicle_year} {vehicle_make} {vehicle_model}? Sigue disponible a ${vehicle_price}. Velo aqui: {vehicle_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price', 'vehicle_url'], 3),

('lead_nurture', 'sms', 'lead_nurture_sms_7d', 'es',
 '{customer_name}, ultima oportunidad — el {vehicle_year} {vehicle_make} {vehicle_model} ha tenido {inquiry_count} consultas esta semana. Llame al (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'inquiry_count'], 5)
ON CONFLICT (template_key, language) DO NOTHING;

-- REGISTRATION TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('registration', 'sms', 'reg_stage_documents_collected', 'en',
 'Hi {customer_name}, we''ve received your documents for the {vehicle_year} {vehicle_make} {vehicle_model}. We''re preparing your DMV submission. Track progress: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'tracker_url'], 1),

('registration', 'sms', 'reg_stage_submitted_to_dmv', 'en',
 'Great news {customer_name}! Your registration for the {vehicle_year} {vehicle_make} {vehicle_model} has been submitted to the DMV. Track progress: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'tracker_url'], 2),

('registration', 'sms', 'reg_stage_sticker_ready', 'en',
 'Your registration sticker is ready for pickup, {customer_name}! Call us at (832) 400-9760 to schedule pickup for your {vehicle_year} {vehicle_make} {vehicle_model}.',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 5),

('registration', 'sms', 'reg_doc_reminder', 'en',
 'Hi {customer_name}, we still need the following documents to start your registration: {missing_docs}. Upload here: {portal_url}',
 ARRAY['customer_name', 'missing_docs', 'portal_url'], 7),

('registration', 'sms', 'reg_weekly_update', 'en',
 'Hi {customer_name}, your {vehicle_year} {vehicle_make} {vehicle_model} registration update: {stage_label} (Stage {stage_number} of 6). Track anytime: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'stage_label', 'stage_number', 'tracker_url'], 8)
ON CONFLICT (template_key, language) DO NOTHING;

-- RENTAL TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('rental', 'sms', 'rental_booking_confirm', 'en',
 'Booking confirmed! {customer_name}, your {vehicle_year} {vehicle_make} {vehicle_model} rental is set for {start_date} to {end_date}. Booking #: {booking_id}. Questions? Call (832) 400-9760',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'start_date', 'end_date', 'booking_id'], 1),

('rental', 'sms', 'rental_return_reminder', 'en',
 'Reminder: Your rental of the {vehicle_year} {vehicle_make} {vehicle_model} is due back tomorrow ({return_date}). Please return to 8774 Almeda Genoa Rd. Booking #: {booking_id}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'return_date', 'booking_id'], 2),

('rental', 'sms', 'rental_overdue', 'en',
 '{customer_name}, your rental (Booking #{booking_id}) was due back on {return_date}. Late fees of ${daily_rate}/day are being applied. Please return the vehicle or call (832) 400-9760 immediately.',
 ARRAY['customer_name', 'booking_id', 'return_date', 'daily_rate'], 3),

('rental', 'sms', 'rental_payment_reminder', 'en',
 'Hi {customer_name}, you have an outstanding balance of ${balance} for rental booking #{booking_id}. Please call (832) 400-9760 to arrange payment.',
 ARRAY['customer_name', 'balance', 'booking_id'], 4)
ON CONFLICT (template_key, language) DO NOTHING;

-- VISIT SCHEDULING TEMPLATES
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'visit_confirmation', 'en',
 'See you soon, {customer_name}! Your visit to Triple J Auto Investment is confirmed. Address: 8774 Almeda Genoa Rd, Houston TX 77075. Call if anything changes: (832) 400-9760',
 ARRAY['customer_name'], 10),

('lead_nurture', 'sms', 'visit_reminder_1h', 'en',
 'Reminder: Your visit to Triple J Auto Investment is in about 1 hour! 8774 Almeda Genoa Rd, Houston TX 77075. See you soon, {customer_name}!',
 ARRAY['customer_name'], 11),

('lead_nurture', 'sms', 'visit_followup', 'en',
 'Thanks for visiting Triple J, {customer_name}! Have questions about any vehicle you saw? Text us anytime or call (832) 400-9760.',
 ARRAY['customer_name'], 12)
ON CONFLICT (template_key, language) DO NOTHING;
```

**Step 3: Commit**

```bash
git add services/templateService.ts supabase/migrations/09b_seed_templates.sql
git commit -m "feat: add template service with CRUD, rendering, and seed data for all message categories"
```

---

## Task 3: Template Manager Admin Page

**Files:**
- Create: `pages/admin/Templates.tsx`
- Modify: `App.tsx` (add route)

**Step 1: Create the Template Manager page**

This page lets the admin:
- View all templates grouped by category
- Edit template body/subject with live preview
- Toggle approved/auto-send per template
- View sent message history per template
- Test-send to own phone/email
- Side-by-side EN/ES editing

Key UI structure:
```
┌──────────────────────────────────────────────────────┐
│ AdminHeader                                          │
├──────────────────────────────────────────────────────┤
│ Category Tabs: Lead Nurture | Registration | Rental  │
│                | Owner | System                      │
├──────────────────────────────────────────────────────┤
│ Template Card (for each template in category)        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [SMS] lead_nurture_sms_2h                        │ │
│ │ ┌────────────────┬────────────────┐              │ │
│ │ │ English        │ Spanish        │              │ │
│ │ │ [textarea]     │ [textarea]     │              │ │
│ │ └────────────────┴────────────────┘              │ │
│ │ Variables: {customer_name} {vehicle_year} ...     │ │
│ │ Preview: "Hi John, this is Triple J..."          │ │
│ │ [✓ Approved] [✓ Auto-Send] [Test Send] [Save]   │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Sent Messages History (collapsible)                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 2026-03-02 14:30 → (832) 555-0123 → Delivered   │ │
│ │ 2026-03-01 09:15 → (832) 555-0456 → Sent        │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Component should:
- Use `getAllTemplates()` from templateService
- Group templates by category
- Use `renderTemplate()` for live preview with sample data
- Call `updateTemplate()` on save
- Display `getSentMessages()` filtered by template_key
- Include the `AdminHeader` navigation (same pattern as other admin pages)

**Step 2: Add route to App.tsx**

Add after the plates route (~line 483):
```typescript
const AdminTemplates = lazyWithErrorHandling(
  () => import('./pages/admin/Templates'),
  'Templates'
);

// In routes:
<Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />
```

**Step 3: Add nav link to AdminHeader**

In the AdminHeader component (duplicated across admin pages), add "Templates" tab linking to `/admin/templates`.

**Step 4: Commit**

```bash
git add pages/admin/Templates.tsx App.tsx
git commit -m "feat: add Template Manager admin page with live preview, approval toggles, and sent history"
```

---

## Task 4: Vehicle Quick-Intake Wizard

**Files:**
- Create: `components/admin/VehicleIntakeWizard.tsx`
- Modify: `pages/admin/Inventory.tsx` (add wizard trigger)
- Modify: `types.ts` (IntakeConditionFlag already added in Task 1)

**Step 1: Build the 5-step wizard component**

```typescript
// components/admin/VehicleIntakeWizard.tsx
// Props: { isOpen: boolean; onClose: () => void; onCreated: (vehicle: Vehicle) => void }

// STEP STATE:
// step: 1 | 2 | 3 | 4 | 5
// vehicleData: Partial<Vehicle> (accumulated across steps)

// STEP 1 — VIN DECODE
// - Single VIN input field
// - On paste/enter: call decodeVin() from nhtsaService
// - Auto-populate: year, make, model, bodyType
// - Display decoded fields as read-only confirmation
// - Auto-set status = 'Draft'
// - "Next" button

// STEP 2 — COSTS & PRICING
// - purchasePrice (cost field), costTowing, costMechanical, costCosmetic, costOther
// - Auto-calculate suggestedPrice = Math.round((totalCost * 1.4) / 500) * 500
// - Show marketEstimate via estimateMarketValue()
// - price field (editable, pre-filled with suggestedPrice)

// STEP 2.5 — CONDITION & SOURCE
// - Condition toggles: CONDITION_FLAGS array of {flag, label} objects
// - Each toggle: checkbox + optional notes input
// - Store as intakeCondition JSONB array
// - Source dropdown: intake_source enum
// - Seller/auction name: intakeSourceName text input
// - Free-text intakeNotes textarea

// STEP 3 — PHOTOS
// - Drag-and-drop zone (accept image/*)
// - Multi-file select
// - Upload to vehicle-photos bucket (existing pattern from Inventory.tsx)
// - Reuse resizeImage() from Inventory.tsx (extract to utils if not already)
// - Show thumbnails as uploaded
// - First image = imageUrl, rest = gallery array

// STEP 4 — AI CONTENT (auto-generates on step entry)
// - useEffect on step === 4: fire 3 parallel calls:
//   Promise.all([
//     generateVehicleDescription(make, model, year, diagnosticsFromCondition),
//     generateIdentityHeadline(make, model, year, bodyType, diagnosticsFromCondition),
//     generateVehicleStory(make, model, year, mileage, diagnosticsFromCondition, description)
//   ])
// - Show results in editable textareas
// - Loading spinner while generating
// - "Regenerate" buttons per field

// STEP 5 — REVIEW & PUBLISH
// - Preview card (reuse vehicle card layout from Inventory page)
// - Toggle: "Publish now" (status = 'Available') or "Keep as Draft" (status = 'Draft')
// - Toggle: listingType (sale_only / rental_only / both)
// - If rental: dailyRate, weeklyRate inputs
// - "Create Vehicle" button → calls addVehicle() from store
// - On success: onCreated(vehicle), onClose()
```

**Step 2: Add wizard trigger to Inventory page**

In `Inventory.tsx`, add a prominent "+ Quick Intake" button at the top that opens the wizard modal. Keep the existing manual form as a fallback ("Advanced Add" or expand existing form).

**Step 3: Extract resizeImage to shared utility**

Move the `resizeImage()` function from Inventory.tsx to a shared utility file if it isn't already:
```typescript
// utils/imageUtils.ts
export async function resizeImage(file: File, maxWidth = 800): Promise<string> { ... }
```

**Step 4: Commit**

```bash
git add components/admin/VehicleIntakeWizard.tsx pages/admin/Inventory.tsx utils/imageUtils.ts
git commit -m "feat: add Vehicle Quick-Intake Wizard — VIN decode, costs, condition, photos, auto-AI, publish in 90 seconds"
```

---

## Task 5: Auto-Nurture Lead Pipeline Service

**Files:**
- Create: `services/followUpService.ts`
- Modify: `services/vehicleLeadService.ts` (add lead status updates)

**Step 1: Write the follow-up service**

```typescript
// services/followUpService.ts
// Manages the auto-nurture pipeline state from the frontend perspective

import { supabase } from '../supabase/config';
import { FollowUpQueueItem, Lead } from '../types';

function transformQueueItem(row: any): FollowUpQueueItem { /* snake→camel */ }

// Get pending follow-ups for a lead
export async function getFollowUpsForLead(leadId: string): Promise<FollowUpQueueItem[]> { ... }

// Get all pending follow-ups (for Command Center)
export async function getPendingFollowUps(limit: number = 50): Promise<FollowUpQueueItem[]> { ... }

// Cancel all pending follow-ups for a lead (when human takes over)
export async function cancelFollowUps(leadId: string, reason: string): Promise<boolean> { ... }

// Mark lead as responded (promotes to Engaged, cancels pending follow-ups)
export async function markLeadResponded(leadId: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ status: 'Engaged', responded_at: new Date().toISOString() })
    .eq('id', leadId);
  // Trigger will auto-cancel follow-ups
  return !error;
}

// Schedule a visit for a lead
export async function scheduleVisit(
  leadId: string, visitAt: string, notes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({
      status: 'Scheduled',
      scheduled_visit_at: visitAt,
      visit_notes: notes || null,
    })
    .eq('id', leadId);
  // Trigger will auto-cancel follow-ups
  // TODO: Enqueue visit confirmation + reminder SMS via follow_up_queue
  return !error;
}

// Get pipeline stats (for Command Center)
export async function getPipelineStats(): Promise<{
  inNurture: number;
  engaged: number;
  scheduled: number;
  cold: number;
}> {
  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .in('status', ['New', 'Contacted', 'Engaged', 'Scheduled', 'Cold']);

  if (error || !data) return { inNurture: 0, engaged: 0, scheduled: 0, cold: 0 };

  return {
    inNurture: data.filter(l => l.status === 'New' || l.status === 'Contacted').length,
    engaged: data.filter(l => l.status === 'Engaged').length,
    scheduled: data.filter(l => l.status === 'Scheduled').length,
    cold: data.filter(l => l.status === 'Cold').length,
  };
}
```

**Step 2: Commit**

```bash
git add services/followUpService.ts
git commit -m "feat: add follow-up service for auto-nurture pipeline state management"
```

---

## Task 6: Auto-Nurture Edge Function

**Files:**
- Create: `supabase/functions/process-follow-up-queue/index.ts`

**Step 1: Write the Edge Function**

This function runs on a schedule (every 5 minutes via pg_cron) and processes pending follow-up queue items:

```typescript
// supabase/functions/process-follow-up-queue/index.ts
// Processes follow_up_queue items where send_after <= NOW() and sent=false and cancelled=false
// For each item:
//   1. Fetch the template by template_key + lead's preferred_language
//   2. Fetch lead data for variable rendering
//   3. Render template with variables
//   4. Send via appropriate channel (SMS/email/voice)
//   5. Log to sent_messages table
//   6. Mark queue item as sent
//   7. Special handling for 'cold_14d' step: just update lead status to 'Cold'

// Follow existing Edge Function patterns from process-notification-queue:
// - Service role Supabase client
// - Batch processing (limit 50)
// - Per-item try/catch
// - Mark sent even on error (prevent infinite retry)
// - Twilio for SMS, Resend for email, Retell for voice
```

Key logic for each channel:
- **SMS**: POST to Twilio API (same pattern as process-notification-queue)
- **Email**: POST to Resend API (same pattern as process-review-requests)
- **Voice**: POST to Retell API create-phone-call endpoint (same as retellService.triggerOutboundCall)
- **cold_14d**: No message sent — just UPDATE leads SET status='Cold', nurture_active=false

**Step 2: Add pg_cron schedule**

```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'process-follow-up-queue',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/process-follow-up-queue',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )$$
);
```

**Step 3: Commit**

```bash
git add supabase/functions/process-follow-up-queue/index.ts
git commit -m "feat: add auto-nurture Edge Function — processes follow-up queue with SMS, email, voice channels"
```

---

## Task 7: Registration Auto-Pilot Enhancements

**Files:**
- Modify: `pages/CustomerStatusTracker.tsx` (add document upload section)
- Create: `components/CustomerDocumentUpload.tsx`
- Modify: `services/registrationService.ts` (add document upload function)

**Step 1: Add customer document upload component**

```typescript
// components/CustomerDocumentUpload.tsx
// Props: { registrationId: string; accessToken: string }
// Shows document checklist with upload buttons for each missing document:
// - Title (front)
// - Title (back)
// - Form 130-U
// - Insurance
// - Inspection
// Each uploads to registration_documents table with file stored in Supabase Storage
// Shows checkmark for already-uploaded documents
// Uses existing uploadDocument() from registrationService
```

**Step 2: Integrate into CustomerStatusTracker**

Add the document upload section below the progress visualization. Only show when current_stage is 'sale_complete' or 'documents_collected' (stages where documents are needed).

**Step 3: Add registration proactive update queries**

Add to registrationService.ts:
```typescript
// Get registrations needing document reminders (sale_complete for 3+ days, docs incomplete)
export async function getRegistrationsNeedingDocs(): Promise<Registration[]> { ... }

// Get registrations stale in same stage (7+ days)
export async function getStaleRegistrations(): Promise<Registration[]> { ... }
```

**Step 4: Commit**

```bash
git add components/CustomerDocumentUpload.tsx pages/CustomerStatusTracker.tsx services/registrationService.ts
git commit -m "feat: add customer document upload portal and registration auto-pilot queries"
```

---

## Task 8: Rental Booking Wizard (Refactored)

**Files:**
- Create: `components/admin/RentalBookingWizard.tsx`
- Modify: `pages/admin/Rentals.tsx` (swap modal for wizard)

**Step 1: Build the 8-step booking wizard**

Replace the existing 1525-line `RentalBookingModal` with a step-by-step wizard that guides employees through every step:

```
Step 1: Select Vehicle (grid of available rentals with rates)
Step 2: Select/Create Customer (phone lookup → auto-fill, or create new)
Step 3: Pick Dates (calendar with conflict visualization)
Step 4: Insurance (upload card, auto-validate TX minimums)
Step 5: Agreement (auto-generated, digital signature)
Step 6: Assign Plate (available dealer plates list)
Step 7: Condition Report (guided photo checklist)
Step 8: Confirm & Dispatch (summary with "Create Booking" button)
```

Each step shows a progress bar and checklist of completed steps. Navigation: Back/Next buttons. Cannot skip steps. Each step validates before allowing Next.

Reuse existing service functions:
- `getAvailableVehicles()` from rentalService (Step 1)
- `searchCustomers()` / `createCustomer()` from rentalService (Step 2)
- `getCustomerLastInsurance()` from insuranceService (Step 4 pre-fill)
- `validateInsuranceCoverage()` from insuranceService (Step 4 validation)
- `getAvailableDealerPlates()` from plateService (Step 6)
- `createBooking()` from rentalService (Step 8)
- `assignPlateToBooking()` from plateService (Step 8)

**Step 2: Commit**

```bash
git add components/admin/RentalBookingWizard.tsx pages/admin/Rentals.tsx
git commit -m "feat: add guided 8-step Rental Booking Wizard replacing modal"
```

---

## Task 9: Rental Return Wizard + Payment Tracking

**Files:**
- Create: `components/admin/RentalReturnWizard.tsx`
- Modify: `pages/admin/Rentals.tsx` (add return flow)

**Step 1: Build the 6-step return wizard**

```
Step 1: Post-rental condition report (guided photos, compare with checkout report)
Step 2: Mileage recording (mileage_in input)
Step 3: Damage assessment (flag damage items, auto-calculate charges)
Step 4: Collect plate (mark plate assignment as returned)
Step 5: Late fee calculation (auto-computed, with override input)
Step 6: Final payment summary (total owed, payments received, balance)
```

Reuse existing:
- `createConditionReport()` from rentalService (Step 1)
- `returnBooking()` from rentalService (Step 2)
- `calculateLateFee()` from rentalService (Step 5)
- `returnPlateAssignment()` from plateService (Step 4)
- `getPaymentsForBooking()` / `createPayment()` from rentalService (Step 6)

**Step 2: Add payment ledger view to rentals page**

Show per-booking payment history with: amount, date, method, recorded_by. Show outstanding balance prominently.

**Step 3: Commit**

```bash
git add components/admin/RentalReturnWizard.tsx pages/admin/Rentals.tsx
git commit -m "feat: add 6-step Rental Return Wizard with payment tracking and late fee calculation"
```

---

## Task 10: Action Queue Service (Intelligence Engine)

**Files:**
- Create: `services/actionQueueService.ts`

**Step 1: Write the action queue computation service**

This is the brain of the Command Center. It queries all data sources and generates a prioritized list of ActionItems:

```typescript
// services/actionQueueService.ts
import { supabase } from '../supabase/config';
import { ActionItem, ActionPriority } from '../types';

export async function computeActionQueue(): Promise<ActionItem[]> {
  const items: ActionItem[] = [];

  // Run all queries in parallel
  const [
    rentalsData,
    leadsData,
    registrationsData,
    vehiclesData,
    insuranceAlerts,
    plateAlerts,
    referralData,
  ] = await Promise.all([
    fetchRentalActions(),
    fetchLeadActions(),
    fetchRegistrationActions(),
    fetchInventoryActions(),
    fetchInsuranceAlerts(),
    fetchPlateAlerts(),
    fetchReferralActivity(),
  ]);

  items.push(...rentalsData, ...leadsData, ...registrationsData,
    ...vehiclesData, ...insuranceAlerts, ...plateAlerts, ...referralData);

  // Sort by priority (urgent first), then by date
  return items.sort((a, b) => {
    const priorityOrder: Record<ActionPriority, number> = {
      urgent: 0, high: 1, medium: 2, low: 3, info: 4
    };
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Each fetch function queries its data source and returns ActionItem[]:

async function fetchRentalActions(): Promise<ActionItem[]> {
  // URGENT: Rentals returning today (end_date = today, status = 'active')
  // URGENT: Overdue rentals (end_date < today, status = 'active'/'overdue')
  // URGENT: Outstanding payment balances > 7 days
}

async function fetchLeadActions(): Promise<ActionItem[]> {
  // HIGH: Leads with status = 'Engaged' (customer responded, needs human action)
  // HIGH: Leads with status = 'Scheduled' (visit upcoming)
  // HIGH: New leads from last 24h
}

async function fetchRegistrationActions(): Promise<ActionItem[]> {
  // HIGH: Registrations ready to advance (based on time in current stage)
  // MEDIUM: Document collection needed (3+ days in sale_complete, docs incomplete)
  // HIGH: Sticker ready for delivery
}

async function fetchInventoryActions(): Promise<ActionItem[]> {
  // MEDIUM: Stale inventory (21+ days, 0 leads)
  // MEDIUM: Price opportunity (marketEstimate > price * 1.1)
  // LOW: Cost anomaly (totalCost > soldPrice for Sold vehicles)
}

async function fetchInsuranceAlerts(): Promise<ActionItem[]> {
  // URGENT: Expired insurance on active rental
  // LOW: Insurance expiring within 7 days
}

async function fetchPlateAlerts(): Promise<ActionItem[]> {
  // URGENT: Overdue plate returns
  // LOW: Plates expiring within 14 days
}

async function fetchReferralActivity(): Promise<ActionItem[]> {
  // INFO: Referral codes used 3+ times this week
}
```

**Step 2: Add quick stats service**

```typescript
export async function computeQuickStats(): Promise<{
  vehicles: { available: number; pending: number; soldThisMonth: number };
  revenue: { thisMonth: number; profit: number; margin: number };
  costs: { mechanical: number; cosmetic: number; towing: number };
  leads: { newThisWeek: number; contacted: number; qualified: number };
  registrations: { inProgress: number; readyForDelivery: number };
  rentals: { active: number; revenueThisMonth: number };
}> {
  // Parallel queries to compute all stats
  // Reuse calculation patterns from Dashboard.tsx (lines 147-180)
}
```

**Step 3: Commit**

```bash
git add services/actionQueueService.ts
git commit -m "feat: add Action Queue service — computes prioritized action items from all data sources"
```

---

## Task 11: Smart Command Center Page

**Files:**
- Create: `pages/admin/CommandCenter.tsx`
- Modify: `App.tsx` (add route, make it the default admin page)

**Step 1: Build the Command Center page**

```
┌──────────────────────────────────────────────────────────────────┐
│ AdminHeader (with CommandCenter as active tab)                   │
├──────────────────────────────────┬───────────────────────────────┤
│ ACTION QUEUE (Zone 1)            │ QUICK STATS (Zone 2)         │
│                                  │                               │
│ 🔴 URGENT (2)                   │ Vehicles: 3/1/2              │
│ ├ Rental #042 returning today   │ Revenue: $17k / $8.2k / 48%  │
│ │ [Mark Returned]               │ Costs: $3.1k mech / $800 cos │
│ ├ Maria G. responded to SMS     │ Best: 2019 Camry (+$4.2k)    │
│ │ [Schedule Visit]              │ Leads: 5/3/1                 │
│ 🟠 HIGH (3)                     │ Registrations: 2 / 1 ready   │
│ ├ Reg TJ-2026-0015 → advance   │ Rentals: 1 active / $2.4k    │
│ │ [Advance Stage]               │                               │
│ ├ 2 new leads (Divine called)   ├───────────────────────────────┤
│ │ [View Leads]                  │ PIPELINE HEALTH               │
│ 🟡 MEDIUM (1)                   │ 12 nurturing / 3 engaged     │
│ ├ 2019 Camry listed 21 days    │ / 1 scheduled                │
│ │ [Adjust Price]                │                               │
│ 🟢 LOW (1)                      │                               │
│ ├ Insurance expires in 5 days   │                               │
│ │ [Notify Customer]             │                               │
│ ℹ INFO (1)                      │                               │
│ └ James T. referral used 3x    │                               │
├──────────────────────────────────┴───────────────────────────────┤
│ CUSTOMER COMMS FEED (Zone 3)                                     │
│ 2 min ago  Maria G. replied: "Yes, Saturday at 10am works"      │
│ 1 hr ago   Divine called James T. — 3 min call, interested      │
│ 3 hrs ago  Lead form: Carlos R. asked about financing            │
│ yesterday  SMS sent to Lisa M.: registration submitted           │
├──────────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS (Zone 4)                                           │
│ [+ New Vehicle] [+ Registration] [+ Rental] [All Leads] [Cal]  │
└──────────────────────────────────────────────────────────────────┘
```

Component structure:
- Uses `computeActionQueue()` and `computeQuickStats()` from actionQueueService
- Uses `getPipelineStats()` from followUpService
- Uses `getRecentCommunications()` from templateService
- Action buttons dispatch to relevant services (advanceStage, markLeadResponded, etc.)
- Auto-refresh every 60 seconds
- Mobile-responsive (stacked layout on mobile)

**Step 2: Update App.tsx routing**

```typescript
// Make Command Center the default admin landing page
<Route path="/admin" element={<Navigate to="/admin/command-center" replace />} />
<Route path="/admin/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
// Keep /admin/dashboard as legacy route
```

**Step 3: Commit**

```bash
git add pages/admin/CommandCenter.tsx App.tsx
git commit -m "feat: add Smart Command Center — unified admin hub with action queue, stats, comms feed"
```

---

## Task 12: Weekly Digest Edge Function

**Files:**
- Create: `supabase/functions/weekly-digest/index.ts`

**Step 1: Write the weekly digest Edge Function**

Runs Sunday at 8pm CT via pg_cron. Compiles a comprehensive weekly summary email sent to the admin:

```typescript
// Queries:
// - Vehicles added/sold this week, avg days on lot
// - Leads: total new, conversion rate, response rate
// - Revenue: gross, net, margin
// - Registrations: completed, in progress
// - Rentals: active, revenue, late returns
// - Top referrer of the week
// - Recommended actions for next week (stale vehicles, upcoming returns, etc.)

// Sends via Resend as HTML email
// Uses the same dark-theme email design from process-review-requests
```

**Step 2: Commit**

```bash
git add supabase/functions/weekly-digest/index.ts
git commit -m "feat: add weekly digest Edge Function — Sunday night business summary email"
```

---

## Task 13: Rental Auto-Alerts Edge Function

**Files:**
- Create: `supabase/functions/rental-alerts/index.ts`

**Step 1: Write the rental alerts Edge Function**

Runs daily at 8am CT. Sends proactive customer SMS for:
- Return reminder (T-1 day)
- Overdue notice (T+1 day)
- Payment reminder (outstanding balance > 3 days)
- Insurance expiry warning

Uses template system: fetches template by key, renders with variables, sends via Twilio, logs to sent_messages.

**Step 2: Commit**

```bash
git add supabase/functions/rental-alerts/index.ts
git commit -m "feat: add rental auto-alerts Edge Function — return reminders, overdue notices, payment reminders"
```

---

## Task 14: Competitor Monitoring Service

**Files:**
- Create: `services/competitorService.ts`

**Step 1: Write the competitor monitoring service**

For now, implement a manual entry system (admin can add comparable listings) with the data structure ready for future automation:

```typescript
// services/competitorService.ts
// CRUD for market_comparables table
// computePricePosition(vehicleId) → { avgMarketPrice, priceDelta, percentDiff, recommendation }
// getVehiclesWithPriceOpportunity() → vehicles where market avg > listing price by 10%+
```

The intelligence layer (Task 10) already queries this data via `fetchInventoryActions()`.

**Step 2: Commit**

```bash
git add services/competitorService.ts
git commit -m "feat: add competitor monitoring service with market comparable tracking"
```

---

## Translation Updates

Throughout all tasks, add translations for new UI strings to `utils/translations.ts` under both `t.en` and `t.es` namespaces. Key namespaces to add:

```typescript
commandCenter: {
  title: 'Command Center' / 'Centro de Comando',
  actionQueue: 'Action Queue' / 'Cola de Acciones',
  quickStats: 'Quick Stats' / 'Estadisticas Rapidas',
  commsFeed: 'Customer Communications' / 'Comunicaciones con Clientes',
  // ... per-action labels
},
templates: {
  title: 'Message Templates' / 'Plantillas de Mensajes',
  approved: 'Approved' / 'Aprobado',
  autoSend: 'Auto-Send' / 'Envio Automatico',
  // ...
},
intake: {
  title: 'Quick Vehicle Intake' / 'Ingreso Rapido de Vehiculo',
  step1: 'VIN Decode' / 'Decodificar VIN',
  step2: 'Costs & Pricing' / 'Costos y Precios',
  // ...
},
```

---

## Post-Implementation Checklist

After all 14 tasks are complete, verify:

- [ ] All new tables have RLS enabled with admin-only policies
- [ ] All Edge Functions use service_role key (bypass RLS)
- [ ] All services follow snake_case→camelCase transform pattern
- [ ] All UI strings are bilingual (EN + ES)
- [ ] Command Center loads in under 2 seconds
- [ ] Vehicle intake wizard completes in under 2 minutes
- [ ] Auto-nurture pipeline processes within 5 minutes of schedule
- [ ] Template changes take effect on next scheduled send
- [ ] Mobile layout works for Command Center (stacked zones)
- [ ] All new admin pages include AdminHeader navigation
- [ ] No API keys exposed in frontend bundles
- [ ] Existing features (inventory, registrations, rentals, plates) still work correctly
