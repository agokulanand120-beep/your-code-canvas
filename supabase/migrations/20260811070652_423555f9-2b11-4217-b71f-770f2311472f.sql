
-- Slug helper
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS dealer_slug text;

CREATE OR REPLACE FUNCTION public.set_vehicle_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  base := public.slugify(
    concat_ws('-', NEW.brand, NEW.model, NEW.variant, NEW.manufacturing_year::text)
  );
  IF base = '' OR base IS NULL THEN base := 'vehicle'; END IF;
  NEW.slug := base || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicles_set_slug ON public.vehicles;
CREATE TRIGGER vehicles_set_slug
BEFORE INSERT OR UPDATE OF brand, model, variant, manufacturing_year ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_slug();

CREATE OR REPLACE FUNCTION public.set_dealer_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  base := public.slugify(NEW.dealer_name);
  IF base = '' OR base IS NULL THEN
    NEW.dealer_slug := 'dealer-' || substr(replace(NEW.user_id::text, '-', ''), 1, 6);
  ELSE
    NEW.dealer_slug := base || '-' || substr(replace(NEW.user_id::text, '-', ''), 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS settings_set_dealer_slug ON public.settings;
CREATE TRIGGER settings_set_dealer_slug
BEFORE INSERT OR UPDATE OF dealer_name ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.set_dealer_slug();

-- Backfill
UPDATE public.vehicles SET slug = COALESCE(NULLIF(public.slugify(concat_ws('-', brand, model, variant, manufacturing_year::text)), ''), 'vehicle') || '-' || substr(replace(id::text, '-', ''), 1, 6);
UPDATE public.settings SET dealer_slug = CASE WHEN COALESCE(public.slugify(dealer_name), '') = '' THEN 'dealer-' || substr(replace(user_id::text, '-', ''), 1, 6) ELSE public.slugify(dealer_name) || '-' || substr(replace(user_id::text, '-', ''), 1, 6) END;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_slug_key ON public.vehicles (slug);
CREATE UNIQUE INDEX IF NOT EXISTS settings_dealer_slug_key ON public.settings (dealer_slug);
