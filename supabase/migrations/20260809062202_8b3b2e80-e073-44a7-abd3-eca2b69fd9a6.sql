ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS show_dealer_page_views boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_dealer_page_inquiries boolean NOT NULL DEFAULT true;