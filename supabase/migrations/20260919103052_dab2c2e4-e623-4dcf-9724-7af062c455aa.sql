ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS vehicle_types text[] NOT NULL DEFAULT ARRAY['car','bike']::text[],
  ADD COLUMN IF NOT EXISTS reason text;

CREATE TABLE IF NOT EXISTS public.shop_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  intro text,
  vehicle_type text NOT NULL DEFAULT 'both',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_collections TO authenticated;
GRANT ALL ON public.shop_collections TO service_role;
ALTER TABLE public.shop_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active collections" ON public.shop_collections
  FOR SELECT USING (is_active = true OR public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Admins manage collections" ON public.shop_collections
  FOR ALL TO authenticated USING (public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER update_shop_collections_updated_at BEFORE UPDATE ON public.shop_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.shop_collection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.shop_collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  reason text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, product_id)
);

GRANT SELECT ON public.shop_collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_collection_items TO authenticated;
GRANT ALL ON public.shop_collection_items TO service_role;
ALTER TABLE public.shop_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collection items" ON public.shop_collection_items
  FOR SELECT USING (true);
CREATE POLICY "Admins manage collection items" ON public.shop_collection_items
  FOR ALL TO authenticated USING (public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.shop_product_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  category text,
  source_path text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_product_events_product_idx ON public.shop_product_events (product_id, event_type);
CREATE INDEX IF NOT EXISTS shop_product_events_created_idx ON public.shop_product_events (created_at DESC);

GRANT INSERT ON public.shop_product_events TO anon;
GRANT INSERT, SELECT ON public.shop_product_events TO authenticated;
GRANT ALL ON public.shop_product_events TO service_role;
ALTER TABLE public.shop_product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record product events" ON public.shop_product_events
  FOR INSERT WITH CHECK (event_type IN ('impression','click'));
CREATE POLICY "Admins can view product events" ON public.shop_product_events
  FOR SELECT TO authenticated USING (public.is_marketplace_admin(auth.uid()));