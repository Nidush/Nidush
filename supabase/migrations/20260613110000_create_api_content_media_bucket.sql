-- Bucket público para guardar GIFs/media sincronizados por cron das APIs externas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('api-content-media', 'api-content-media', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public read access to api content media" ON storage.objects;
CREATE POLICY "Public read access to api content media" ON storage.objects
FOR SELECT
USING (bucket_id = 'api-content-media');
