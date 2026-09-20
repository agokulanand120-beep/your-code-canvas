
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('vehicle-images', 'vehicle-images', true),
  ('shop-logos', 'shop-logos', true),
  ('documents', 'documents', false),
  ('emi-documents', 'emi-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for public buckets
CREATE POLICY "Public read vehicle-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "Public read shop-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-logos');

-- Authenticated users can upload/manage their own files (folder = user id)
CREATE POLICY "Users upload own vehicle-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own vehicle-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own vehicle-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own shop-logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own shop-logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own shop-logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Private buckets: only owner accesses files in their own folder
CREATE POLICY "Users read own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own emi-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'emi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own emi-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'emi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own emi-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'emi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own emi-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'emi-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-update timestamp triggers (one per table that has updated_at)
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'settings','vendors','customers','vehicles','vehicle_purchases','vehicle_inspections',
    'sales','emi_schedules','expenses','documents','service_packages','service_records',
    'sticky_notes','dealer_testimonials','support_tickets','marketplace_settings'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- Auth user provisioning trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Performance indexes for hot query paths (all scoped by user_id)
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_status ON public.vehicles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_public ON public.vehicles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_public_page ON public.vehicles(public_page_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON public.vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON public.vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_purchases_user ON public.vehicle_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle ON public.sales(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_user ON public.emi_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_sale ON public.emi_schedules(sale_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_due ON public.emi_schedules(due_date) WHERE status IN ('pending','partial','overdue');
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON public.payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_ref ON public.documents(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_service_records_user ON public.service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user ON public.sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_public_page_events_user ON public.public_page_events(user_id);
CREATE INDEX IF NOT EXISTS idx_public_page_events_vehicle ON public.public_page_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_admins_user ON public.marketplace_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user ON public.settings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_settings_user ON public.settings(user_id);
