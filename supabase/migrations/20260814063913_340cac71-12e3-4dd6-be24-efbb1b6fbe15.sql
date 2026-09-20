GRANT EXECUTE ON FUNCTION public.is_marketplace_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

GRANT SELECT ON public.vehicle_catalog TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_catalog TO authenticated;
GRANT ALL ON public.vehicle_catalog TO service_role;