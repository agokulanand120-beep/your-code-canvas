
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own documents bucket files" ON storage.objects;
  DROP POLICY IF EXISTS "Users read own documents bucket files" ON storage.objects;
  DROP POLICY IF EXISTS "Users insert own documents bucket files" ON storage.objects;
  DROP POLICY IF EXISTS "Users update own documents bucket files" ON storage.objects;
  DROP POLICY IF EXISTS "Users delete own documents bucket files" ON storage.objects;
END $$;

CREATE POLICY "Users read own documents bucket files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "Users insert own documents bucket files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "Users update own documents bucket files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid())
WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "Users delete own documents bucket files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());
