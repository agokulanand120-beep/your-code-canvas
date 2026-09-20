CREATE TABLE public.model_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'cars',
  brand text NOT NULL,
  model text NOT NULL,
  brand_slug text GENERATED ALWAYS AS (public.slugify(brand)) STORED,
  model_slug text GENERATED ALWAYS AS (public.slugify(model)) STORED,
  segment text NOT NULL DEFAULT '',
  body_type text NOT NULL DEFAULT '',
  overview jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_price text,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  mileage jsonb NOT NULL DEFAULT '{"notes":[]}'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_rating text,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  variant_advice text,
  colours jsonb NOT NULL DEFAULT '[]'::jsonb,
  generations jsonb NOT NULL DEFAULT '[]'::jsonb,
  year_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  pros jsonb NOT NULL DEFAULT '[]'::jsonb,
  cons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ownership jsonb NOT NULL DEFAULT '[]'::jsonb,
  maintenance_verdict text,
  buying_checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  good_for jsonb NOT NULL DEFAULT '[]'::jsonb,
  consider_alternatives text,
  alternatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX model_docs_unique_slug ON public.model_docs (category, brand_slug, model_slug);
CREATE INDEX model_docs_active_idx ON public.model_docs (is_active);

GRANT SELECT ON public.model_docs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_docs TO authenticated;
GRANT ALL ON public.model_docs TO service_role;

ALTER TABLE public.model_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active model docs"
ON public.model_docs FOR SELECT
USING (is_active = true OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can insert model docs"
ON public.model_docs FOR INSERT TO authenticated
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can update model docs"
ON public.model_docs FOR UPDATE TO authenticated
USING (public.is_marketplace_admin(auth.uid()))
WITH CHECK (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can delete model docs"
ON public.model_docs FOR DELETE TO authenticated
USING (public.is_marketplace_admin(auth.uid()));

CREATE TRIGGER update_model_docs_updated_at
BEFORE UPDATE ON public.model_docs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();