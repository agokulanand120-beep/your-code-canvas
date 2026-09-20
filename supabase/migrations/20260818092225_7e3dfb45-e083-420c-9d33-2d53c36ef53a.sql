
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_body text,
  ADD COLUMN IF NOT EXISTS seo_faqs jsonb,
  ADD COLUMN IF NOT EXISTS seo_generated_at timestamptz;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_body text,
  ADD COLUMN IF NOT EXISTS seo_faqs jsonb,
  ADD COLUMN IF NOT EXISTS seo_generated_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_listing_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://edmssetawhjpeurzwadc.supabase.co/functions/v1/on-listing-publish';
  kind text := TG_ARGV[0];
  should_ping boolean := false;
BEGIN
  IF kind = 'vehicle' THEN
    should_ping := NEW.marketplace_status IN ('approved','featured');
  ELSE
    should_ping := COALESCE(NEW.marketplace_enabled, false)
      AND COALESCE(NEW.marketplace_status,'') IN ('approved','featured');
  END IF;

  IF should_ping THEN
    PERFORM extensions.net.http_post(
      url := fn_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'kind', kind,
        'id', CASE WHEN kind = 'vehicle' THEN NEW.id::text ELSE NEW.user_id::text END
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicles_notify_published ON public.vehicles;
CREATE TRIGGER vehicles_notify_published
AFTER INSERT OR UPDATE OF marketplace_status, selling_price, slug ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_published('vehicle');

DROP TRIGGER IF EXISTS settings_notify_published ON public.settings;
CREATE TRIGGER settings_notify_published
AFTER INSERT OR UPDATE OF marketplace_status, marketplace_enabled, dealer_slug ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_published('dealer');
