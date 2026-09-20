CREATE TABLE public.vehicle_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text NOT NULL DEFAULT 'car',
  brand text NOT NULL,
  model text,
  variant text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX vehicle_catalog_unique_entry
  ON public.vehicle_catalog (vehicle_type, brand, COALESCE(model,''), COALESCE(variant,''));

GRANT SELECT ON public.vehicle_catalog TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_catalog TO authenticated;
GRANT ALL ON public.vehicle_catalog TO service_role;

ALTER TABLE public.vehicle_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle catalog"
  ON public.vehicle_catalog FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert vehicle catalog"
  ON public.vehicle_catalog FOR INSERT TO authenticated
  WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can update vehicle catalog"
  ON public.vehicle_catalog FOR UPDATE TO authenticated
  USING (public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can delete vehicle catalog"
  ON public.vehicle_catalog FOR DELETE TO authenticated
  USING (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER vehicle_catalog_updated_at
  BEFORE UPDATE ON public.vehicle_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();