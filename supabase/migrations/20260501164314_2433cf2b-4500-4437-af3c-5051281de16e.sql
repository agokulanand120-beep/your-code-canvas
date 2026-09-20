ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'sale_agreement';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'company';

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS google_reviews_rating NUMERIC,
  ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;