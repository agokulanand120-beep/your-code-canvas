CREATE OR REPLACE FUNCTION public.notify_listing_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        'type', kind,
        'kind', kind,
        'id', CASE WHEN kind = 'vehicle' THEN NEW.id::text ELSE NEW.user_id::text END
      )
    );
  END IF;
  RETURN NEW;
END;
$$;