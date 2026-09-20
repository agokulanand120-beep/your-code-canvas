ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS shop_tagline text,
  ADD COLUMN IF NOT EXISTS dealer_tag text,
  ADD COLUMN IF NOT EXISTS gmap_link text,
  ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_ratings boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_vehicles_sold boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketplace_tagline text,
  ADD COLUMN IF NOT EXISTS marketplace_description text;