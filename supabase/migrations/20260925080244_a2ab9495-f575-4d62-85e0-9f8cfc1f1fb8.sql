CREATE TABLE public.vehicle_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_promotions TO authenticated;
GRANT ALL ON public.vehicle_promotions TO service_role;
ALTER TABLE public.vehicle_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view promotions" ON public.vehicle_promotions FOR SELECT USING (true);
CREATE POLICY "Admins manage promotions" ON public.vehicle_promotions FOR ALL TO authenticated
  USING (public.is_marketplace_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_marketplace_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_vehicle_promotions_updated_at BEFORE UPDATE ON public.vehicle_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();