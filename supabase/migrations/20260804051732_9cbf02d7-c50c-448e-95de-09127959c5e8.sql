-- Fix anon access to accessories catalog (has_role EXECUTE was denied for anon)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT SELECT ON public.accessory_categories TO anon, authenticated;
GRANT SELECT ON public.accessory_products TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.accessory_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('ACC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  pincode text NOT NULL,
  notes text,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accessory_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.accessory_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.accessory_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_slug text,
  image_url text,
  unit_price numeric NOT NULL DEFAULT 0,
  mrp numeric,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accessory_orders_created_at ON public.accessory_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accessory_order_items_order ON public.accessory_order_items (order_id);

GRANT SELECT, INSERT ON public.accessory_orders TO anon, authenticated;
GRANT UPDATE ON public.accessory_orders TO authenticated;
GRANT SELECT, INSERT ON public.accessory_order_items TO anon, authenticated;
GRANT ALL ON public.accessory_orders TO service_role;
GRANT ALL ON public.accessory_order_items TO service_role;

ALTER TABLE public.accessory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order" ON public.accessory_orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view orders" ON public.accessory_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.accessory_orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view their orders" ON public.accessory_orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can add order items" ON public.accessory_order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view order items" ON public.accessory_order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_accessory_orders_updated_at BEFORE UPDATE ON public.accessory_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();