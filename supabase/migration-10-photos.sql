-- Migration: Vehicle Photo Storage
-- Phase: 10 (CRM + Photos)
-- Applied: 2026-03-11
--
-- Creates Supabase Storage bucket for vehicle photos
-- with public read access and unrestricted upload/delete (admin auth at middleware level)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vehicle-photos', 'vehicle-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read vehicle photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow upload vehicle photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow delete vehicle photos" ON storage.objects;
END $$;

CREATE POLICY "Public read vehicle photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow upload vehicle photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow delete vehicle photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicle-photos');
