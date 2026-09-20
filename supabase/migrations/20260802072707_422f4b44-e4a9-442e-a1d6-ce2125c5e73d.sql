CREATE TABLE public.accessory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.accessory_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.accessory_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand text,
  short_description text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  mrp numeric,
  images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}'::jsonb,
  compatible_brands text[] DEFAULT '{}',
  sku text,
  warranty text,
  stock_status text NOT NULL DEFAULT 'in_stock',
  rating numeric,
  review_count integer DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.accessory_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.accessory_products(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_accessory_products_category ON public.accessory_products(category_id);
CREATE INDEX idx_accessory_products_active ON public.accessory_products(is_active, sort_order);

GRANT SELECT ON public.accessory_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessory_categories TO authenticated;
GRANT ALL ON public.accessory_categories TO service_role;

GRANT SELECT ON public.accessory_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessory_products TO authenticated;
GRANT ALL ON public.accessory_products TO service_role;

GRANT INSERT ON public.accessory_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessory_enquiries TO authenticated;
GRANT ALL ON public.accessory_enquiries TO service_role;

ALTER TABLE public.accessory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active accessory categories are viewable by everyone"
ON public.accessory_categories FOR SELECT
USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage accessory categories"
ON public.accessory_categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Active accessory products are viewable by everyone"
ON public.accessory_products FOR SELECT
USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage accessory products"
ON public.accessory_products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit accessory enquiries"
ON public.accessory_enquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view accessory enquiries"
ON public.accessory_enquiries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update accessory enquiries"
ON public.accessory_enquiries FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_accessory_categories_updated_at BEFORE UPDATE ON public.accessory_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accessory_products_updated_at BEFORE UPDATE ON public.accessory_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accessory_enquiries_updated_at BEFORE UPDATE ON public.accessory_enquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();