-- Phase 16: Behavioral Intelligence Migration
--
-- Creates session tracking infrastructure for anonymous visitor behavior,
-- vehicle view count aggregation for urgency badges, and attribution
-- columns on leads for conversion source tracking.
--
-- Sections:
--   1. session_events table + indexes + RLS
--   2. vehicle_view_counts table + RLS
--   3. Attribution columns on leads table + indexes
--   4. pg_cron jobs (view count aggregation, event cleanup, cron history cleanup)
--
-- Note: pg_cron requires the extension to be enabled. On Supabase Free tier,
-- pg_cron is available but CREATE EXTENSION may need to be run via the
-- Supabase dashboard SQL editor if superuser privileges are required.

-- ================================================================
-- 0. EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ================================================================
-- 1. SESSION_EVENTS TABLE
-- ================================================================

CREATE TABLE public.session_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'vehicle_view', 'cta_click', 'form_open',
    'calculator_use', 'save_toggle', 'dwell'
  )),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_session_events_session ON public.session_events(session_id);
CREATE INDEX idx_session_events_vehicle ON public.session_events(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_session_events_type ON public.session_events(event_type);
CREATE INDEX idx_session_events_created ON public.session_events(created_at DESC);

-- Composite index for popular badge counting (vehicle_view events per vehicle)
CREATE INDEX idx_session_events_vehicle_type_date ON public.session_events(vehicle_id, event_type, created_at)
  WHERE event_type = 'vehicle_view';

-- RLS
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can track)
CREATE POLICY "Anyone can insert session events"
  ON public.session_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only admins can read event data (privacy)
CREATE POLICY "Admins can read session events"
  ON public.session_events
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- ================================================================
-- 2. VEHICLE_VIEW_COUNTS TABLE (Aggregated by pg_cron)
-- ================================================================

CREATE TABLE public.vehicle_view_counts (
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE PRIMARY KEY,
  views_7d INTEGER DEFAULT 0,
  views_30d INTEGER DEFAULT 0,
  unique_sessions_7d INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.vehicle_view_counts ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for urgency badges on public pages)
CREATE POLICY "Public can read view counts"
  ON public.vehicle_view_counts
  FOR SELECT
  TO anon
  USING (true);

-- Admins can manage view counts (insert/update/delete for maintenance)
CREATE POLICY "Admins can manage view counts"
  ON public.vehicle_view_counts
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- ================================================================
-- 3. ATTRIBUTION COLUMNS ON LEADS TABLE
-- ================================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Indexes for attribution queries
CREATE INDEX idx_leads_session ON public.leads(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_leads_utm ON public.leads(utm_source) WHERE utm_source IS NOT NULL;

-- ================================================================
-- 4. PG_CRON JOBS
-- ================================================================

-- Daily view count aggregation at 2 AM UTC
-- Counts vehicle_view events per vehicle for 7d and 30d windows,
-- plus unique sessions in 7d. Upserts into vehicle_view_counts.
SELECT cron.schedule(
  'aggregate-view-counts',
  '0 2 * * *',
  $$
  INSERT INTO public.vehicle_view_counts (vehicle_id, views_7d, views_30d, unique_sessions_7d, last_updated)
  SELECT
    vehicle_id,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS views_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS views_30d,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS unique_sessions_7d,
    NOW()
  FROM public.session_events
  WHERE event_type = 'vehicle_view' AND vehicle_id IS NOT NULL
  GROUP BY vehicle_id
  ON CONFLICT (vehicle_id) DO UPDATE SET
    views_7d = EXCLUDED.views_7d,
    views_30d = EXCLUDED.views_30d,
    unique_sessions_7d = EXCLUDED.unique_sessions_7d,
    last_updated = NOW()
  $$
);

-- Weekly cleanup of events older than 90 days (Saturday 3:30 AM UTC)
SELECT cron.schedule(
  'cleanup-old-events',
  '30 3 * * 6',
  $$ DELETE FROM public.session_events WHERE created_at < NOW() - INTERVAL '90 days' $$
);

-- Weekly cleanup of cron run history (Saturday 4 AM UTC)
SELECT cron.schedule(
  'cleanup-cron-history',
  '0 4 * * 6',
  $$ DELETE FROM cron.job_run_details WHERE end_time < NOW() - INTERVAL '30 days' $$
);
