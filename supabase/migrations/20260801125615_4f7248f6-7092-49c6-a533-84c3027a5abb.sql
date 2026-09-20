CREATE TABLE public.service_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  provider_name text NOT NULL,
  logo_url text,
  title text NOT NULL,
  description text,
  highlights text[] DEFAULT '{}',
  interest_rate_min numeric,
  interest_rate_max numeric,
  tenure_min_months integer,
  tenure_max_months integer,
  processing_fee text,
  max_loan_amount numeric,
  premium_starting numeric,
  idv_coverage text,
  claim_settlement_ratio numeric,
  cashless_garages integer,
  service_price_starting numeric,
  service_types text[] DEFAULT '{}',
  turnaround_time text,
  city text,
  contact_phone text,
  contact_email text,
  website_url text,
  cta_label text,
  cta_url text,
  rating numeric,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_listings TO authenticated;
GRANT ALL ON public.service_listings TO service_role;

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active service listings"
  ON public.service_listings FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert service listings"
  ON public.service_listings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service listings"
  ON public.service_listings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service listings"
  ON public.service_listings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.service_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  listing_id uuid REFERENCES public.service_listings(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.service_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_enquiries TO authenticated;
GRANT ALL ON public.service_enquiries TO service_role;

ALTER TABLE public.service_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a service enquiry"
  ON public.service_enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view service enquiries"
  ON public.service_enquiries FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service enquiries"
  ON public.service_enquiries FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service enquiries"
  ON public.service_enquiries FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_service_listings_category ON public.service_listings (category, is_active, sort_order);
CREATE INDEX idx_service_enquiries_created ON public.service_enquiries (created_at DESC);

CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON public.service_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_enquiries_updated_at
  BEFORE UPDATE ON public.service_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();