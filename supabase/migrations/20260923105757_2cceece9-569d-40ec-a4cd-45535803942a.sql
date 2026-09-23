ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS is_admin_managed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS managed_source_note text,
  ADD COLUMN IF NOT EXISTS claim_status text NOT NULL DEFAULT 'unclaimed',
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.dealer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_user_id uuid NOT NULL,
  dealer_name text,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.dealer_claims TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealer_claims TO authenticated;
GRANT ALL ON public.dealer_claims TO service_role;

ALTER TABLE public.dealer_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a dealer claim"
  ON public.dealer_claims FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view dealer claims"
  ON public.dealer_claims FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can update dealer claims"
  ON public.dealer_claims FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can delete dealer claims"
  ON public.dealer_claims FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER dealer_claims_updated_at
  BEFORE UPDATE ON public.dealer_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins can insert any vehicle"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can delete any vehicle"
  ON public.vehicles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can manage all vehicle images"
  ON public.vehicle_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));