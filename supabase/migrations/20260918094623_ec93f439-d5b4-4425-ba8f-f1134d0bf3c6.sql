CREATE TABLE public.shop_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand text,
  category text NOT NULL DEFAULT 'accessories',
  short_description text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  mrp numeric,
  images text[] NOT NULL DEFAULT '{}',
  highlights text[] NOT NULL DEFAULT '{}',
  rating numeric,
  review_count integer,
  buy_url text NOT NULL,
  merchant text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop products"
ON public.shop_products FOR SELECT
USING (is_active = true OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can insert shop products"
ON public.shop_products FOR INSERT TO authenticated
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can update shop products"
ON public.shop_products FOR UPDATE TO authenticated
USING (public.is_marketplace_admin(auth.uid()))
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can delete shop products"
ON public.shop_products FOR DELETE TO authenticated
USING (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_shop_products_active ON public.shop_products (is_active, sort_order);