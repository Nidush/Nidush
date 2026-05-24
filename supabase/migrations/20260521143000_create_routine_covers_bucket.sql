-- Migration: Create routine covers storage bucket
-- Date: 2026-05-21

INSERT INTO storage.buckets (id, name, public)
VALUES ('routine-covers', 'routine-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload routine covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload routine covers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'routine-covers' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Public read access to routine covers" ON storage.objects;
CREATE POLICY "Public read access to routine covers" ON storage.objects
FOR SELECT
USING (bucket_id = 'routine-covers');
