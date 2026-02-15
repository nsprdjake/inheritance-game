-- Create Supabase Storage bucket for legacy videos

-- Insert bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('legacy-videos', 'legacy-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
CREATE POLICY "legacy_videos_benefactor_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'legacy-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_videos_benefactor_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'legacy-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_videos_benefactor_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'legacy-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

-- Beneficiaries can view unlocked videos only
CREATE POLICY "legacy_videos_beneficiary_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'legacy-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT la.id::text 
      FROM legacy_accounts la
      JOIN beneficiaries b ON b.legacy_account_id = la.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Trustees can view all videos in accounts they manage
CREATE POLICY "legacy_videos_trustee_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'legacy-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT lt.legacy_account_id::text
      FROM legacy_trustees lt
      WHERE lt.user_id = auth.uid() AND lt.invitation_status = 'accepted'
    )
  );
