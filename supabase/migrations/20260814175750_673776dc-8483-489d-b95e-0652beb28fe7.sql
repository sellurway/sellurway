CREATE POLICY "store media read" ON storage.objects FOR SELECT USING (bucket_id = 'store-media');
CREATE POLICY "store media insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "store media update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "store media delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);