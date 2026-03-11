-- Phase 10: CRM — Expand lead statuses, add notes and tasks tables
-- Run this in your Supabase SQL Editor

-- ============================================================
-- 1. Expand lead statuses from 3 to 7
-- ============================================================

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('New', 'Contacted', 'Qualified', 'Appointment', 'Negotiation', 'Sold', 'Lost'));

-- Migrate existing "Closed" leads to "Sold"
UPDATE leads SET status = 'Sold' WHERE status = 'Closed';

-- ============================================================
-- 2. Lead notes (communication log)
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text NOT NULL DEFAULT 'note'
    CHECK (note_type IN ('call', 'text', 'email', 'visit', 'note')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes(created_at DESC);

-- ============================================================
-- 3. Lead tasks (follow-up reminders)
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date) WHERE NOT completed;

-- ============================================================
-- 4. RLS policies
-- ============================================================

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage lead notes"
  ON lead_notes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage lead tasks"
  ON lead_tasks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
