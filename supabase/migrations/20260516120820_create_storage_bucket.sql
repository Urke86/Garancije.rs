-- Create Storage Bucket for Receipt Images
-- Storage: Create receipt-images bucket for storing receipt photos
-- Security: Users can only access their own folder (user_id/filename)

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-images', 'receipt-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own receipt images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipt-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own receipt images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipt-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own receipt images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipt-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
