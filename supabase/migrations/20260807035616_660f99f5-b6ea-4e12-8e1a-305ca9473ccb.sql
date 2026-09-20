-- Unify admin recognition: marketplace_admins OR admin role
CREATE OR REPLACE FUNCTION public.is_marketplace_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.marketplace_admins WHERE user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

-- Buyer intent (marketplace popup) ------------------------------------
CREATE TABLE public.buyer_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  city text,
  vehicle_type text NOT NULL DEFAULT 'car',
  brand text NOT NULL,
  model text,
  source_path text,
  session_id text,
  status text NOT NULL DEFAULT 'new',
  admin_informed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.buyer_intents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_intents TO authenticated;
GRANT ALL ON public.buyer_intents TO service_role;

ALTER TABLE public.buyer_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit buyer intent"
  ON public.buyer_intents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view buyer intents"
  ON public.buyer_intents FOR SELECT TO authenticated USING (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Admins can update buyer intents"
  ON public.buyer_intents FOR UPDATE TO authenticated USING (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Admins can delete buyer intents"
  ON public.buyer_intents FOR DELETE TO authenticated USING (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER buyer_intents_updated_at BEFORE UPDATE ON public.buyer_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sell vehicle requests -------------------------------------------------
CREATE TABLE public.sell_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  state text,
  vehicle_type text NOT NULL DEFAULT 'car',
  brand text NOT NULL,
  model text NOT NULL,
  variant text,
  manufacturing_year integer,
  fuel_type text,
  transmission text,
  km_driven text,
  owners text,
  color text,
  condition text,
  registration_number text,
  insurance_valid text,
  accident_history text,
  expected_price numeric,
  description text,
  images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  admin_informed boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sell_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sell_requests TO authenticated;
GRANT ALL ON public.sell_requests TO service_role;

ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit sell request"
  ON public.sell_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view sell requests"
  ON public.sell_requests FOR SELECT TO authenticated USING (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Admins can update sell requests"
  ON public.sell_requests FOR UPDATE TO authenticated USING (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Admins can delete sell requests"
  ON public.sell_requests FOR DELETE TO authenticated USING (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER sell_requests_updated_at BEFORE UPDATE ON public.sell_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_buyer_intents_created ON public.buyer_intents (created_at DESC);
CREATE INDEX idx_sell_requests_created ON public.sell_requests (created_at DESC);