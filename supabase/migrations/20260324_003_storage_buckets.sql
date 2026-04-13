-- ============================================================
-- Storage Buckets & Policies
-- ============================================================
-- Bucket classification:
--   face-raw-private       : raw user selfies, private, short retention
--   avatars-private        : final avatar images, private
--   daily-visuals-private  : hero visuals, private
--   public-previews        : teaser/sample assets, public

-- ---------- Create buckets ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('face-raw-private', 'face-raw-private', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('avatars-private', 'avatars-private', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('daily-visuals-private', 'daily-visuals-private', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('public-previews', 'public-previews', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- face-raw-private: user can upload to own folder, read own files
-- ==========================================
CREATE POLICY "face_raw_user_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'face-raw-private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "face_raw_user_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'face-raw-private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==========================================
-- avatars-private: read-only for owner, service role writes
-- ==========================================
CREATE POLICY "avatars_user_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars-private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==========================================
-- daily-visuals-private: read-only for owner, service role writes
-- ==========================================
CREATE POLICY "visuals_user_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'daily-visuals-private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==========================================
-- public-previews: public read
-- ==========================================
CREATE POLICY "previews_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-previews');

-- ==========================================
-- Cleanup: service-only deletion on private buckets (no user delete)
-- Users request deletion through an edge function that uses service role.
-- ==========================================
