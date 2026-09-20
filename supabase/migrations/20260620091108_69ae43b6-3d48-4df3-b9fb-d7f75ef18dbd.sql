
-- VEHICLE-IMAGES bucket policies
DROP POLICY IF EXISTS "vehicle_images_read" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_update" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_delete" ON storage.objects;

CREATE POLICY "vehicle_images_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "vehicle_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "vehicle_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'vehicle-images' AND owner = auth.uid());

CREATE POLICY "vehicle_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND owner = auth.uid());

-- DOCUMENTS bucket policies (refresh, allow any authenticated user to insert)
DROP POLICY IF EXISTS "documents_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;

CREATE POLICY "documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (owner = auth.uid() OR owner IS NULL));

CREATE POLICY "documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND owner = auth.uid());

-- EMI-DOCUMENTS bucket policies
DROP POLICY IF EXISTS "emi_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "emi_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "emi_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "emi_documents_delete" ON storage.objects;

CREATE POLICY "emi_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'emi-documents' AND owner = auth.uid());

CREATE POLICY "emi_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'emi-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "emi_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'emi-documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'emi-documents' AND owner = auth.uid());

CREATE POLICY "emi_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'emi-documents' AND owner = auth.uid());

-- SHOP-LOGOS (public read)
DROP POLICY IF EXISTS "shop_logos_read" ON storage.objects;
DROP POLICY IF EXISTS "shop_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "shop_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "shop_logos_delete" ON storage.objects;

CREATE POLICY "shop_logos_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'shop-logos');

CREATE POLICY "shop_logos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shop_logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-logos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'shop-logos' AND owner = auth.uid());

CREATE POLICY "shop_logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'shop-logos' AND owner = auth.uid());
