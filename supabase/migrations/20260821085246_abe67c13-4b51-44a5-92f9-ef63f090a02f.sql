REVOKE ALL ON FUNCTION public.notify_listing_published() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_listing_published() FROM anon;
REVOKE ALL ON FUNCTION public.notify_listing_published() FROM authenticated;