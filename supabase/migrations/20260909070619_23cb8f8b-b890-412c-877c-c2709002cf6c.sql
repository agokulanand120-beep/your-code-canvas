CREATE OR REPLACE FUNCTION public.notify_model_doc_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://edmssetawhjpeurzwadc.supabase.co/functions/v1/notify-indexnow';
  p text;
BEGIN
  IF COALESCE(NEW.is_active, false) THEN
    p := '/' || NEW.category || '/' ||
         COALESCE(NULLIF(NEW.brand_slug, ''), public.slugify(NEW.brand)) || '/' ||
         COALESCE(NULLIF(NEW.model_slug, ''), public.slugify(NEW.model));
    PERFORM net.http_post(
      url := fn_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('paths', jsonb_build_array(p, '/models', '/sitemap.xml'))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS model_docs_notify_published ON public.model_docs;
CREATE TRIGGER model_docs_notify_published
AFTER INSERT OR UPDATE OF is_active, brand, model, brand_slug, model_slug, overview ON public.model_docs
FOR EACH ROW EXECUTE FUNCTION public.notify_model_doc_published();