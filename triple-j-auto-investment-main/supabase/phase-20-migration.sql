-- Phase 20: Manheim Vehicle Intake Pipeline — Database Migration
--
-- Extends the vehicles table to support a Draft status for vehicles being
-- prepared before public listing, adds intake source tracking columns for
-- the Manheim auction pipeline, and documents the vehicle-photos storage
-- bucket setup for multi-photo uploads.
--
-- Sections:
--   1. Draft status — drop and re-create vehicles_status_check constraint
--   2. Intake source tracking columns on vehicles table
--   3. Storage bucket setup comments (vehicle-photos, run manually)
--   4. Index on intake_source column
--
-- Note: Draft vehicles are automatically hidden from the public because the
-- existing RLS policy only allows SELECT for status IN ('Available', 'Pending').

-- ================================================================
-- 1. DRAFT STATUS — UPDATE VEHICLES STATUS CONSTRAINT
-- ================================================================
-- Add 'Draft' to the allowed status values. Draft vehicles are in the
-- intake pipeline and not yet ready for public listing.

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('Available', 'Pending', 'Sold', 'Wholesale', 'Draft'));

-- ================================================================
-- 2. INTAKE SOURCE TRACKING COLUMNS
-- ================================================================
-- Track where each vehicle was sourced from (manual entry, Manheim auction,
-- etc.), original purchase price, AI-suggested listing price, and when the
-- vehicle was first ingested into the system.

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS intake_source TEXT DEFAULT 'manual';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10, 2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS intake_at TIMESTAMPTZ;

-- ================================================================
-- 3. STORAGE BUCKET SETUP (MANUAL — Supabase Dashboard)
-- ================================================================
-- The vehicle-photos bucket stores listing images uploaded during intake.
-- These steps must be run manually in the Supabase Dashboard because
-- storage bucket creation is not supported via SQL migrations.
--
-- NOTE: Run in Supabase Dashboard > Storage > New Bucket:
--   Name: vehicle-photos
--   Public: true (images are public listing photos)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage RLS policies (run in SQL Editor after bucket creation):
-- Allow authenticated users (admins) to upload
-- CREATE POLICY "Admins can upload vehicle photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'vehicle-photos'
--     AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
--   );

-- Allow public read access (photos are on public listings)
-- CREATE POLICY "Public can view vehicle photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'vehicle-photos');

-- Allow admins to delete photos
-- CREATE POLICY "Admins can delete vehicle photos"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'vehicle-photos'
--     AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
--   );

-- ================================================================
-- 4. INDEX ON INTAKE_SOURCE
-- ================================================================
-- Supports filtering vehicles by intake source (e.g., show all Manheim
-- imports vs. manually entered vehicles).

CREATE INDEX IF NOT EXISTS idx_vehicles_intake_source ON public.vehicles (intake_source);
