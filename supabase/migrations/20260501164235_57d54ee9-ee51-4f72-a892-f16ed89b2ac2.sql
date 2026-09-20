-- Add driving_license to document_type
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'driving_license';

-- Settings: add marketplace_badge
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS marketplace_badge TEXT;

-- Make vehicle_images.display_order nullable
ALTER TABLE public.vehicle_images
  ALTER COLUMN display_order DROP NOT NULL;

-- Recreate dashboard_summary with p_user_id parameter
DROP FUNCTION IF EXISTS public.dashboard_summary();
CREATE OR REPLACE FUNCTION public.dashboard_summary(p_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := COALESCE(p_user_id, auth.uid());
  result JSON;
BEGIN
  IF uid IS NULL THEN
    RETURN '{}'::json;
  END IF;
  -- Only allow callers to query their own summary unless admin
  IF uid <> auth.uid() AND NOT public.is_marketplace_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'vehicles_in_stock', (SELECT COUNT(*) FROM public.vehicles WHERE user_id = uid AND status = 'in_stock'),
    'vehicles_sold', (SELECT COUNT(*) FROM public.vehicles WHERE user_id = uid AND status = 'sold'),
    'total_vehicles', (SELECT COUNT(*) FROM public.vehicles WHERE user_id = uid),
    'open_leads', (SELECT COUNT(*) FROM public.leads WHERE user_id = uid AND status NOT IN ('closed','lost','converted')),
    'total_leads', (SELECT COUNT(*) FROM public.leads WHERE user_id = uid),
    'total_customers', (SELECT COUNT(*) FROM public.customers WHERE user_id = uid),
    'pending_emis', (SELECT COUNT(*) FROM public.emi_schedules WHERE user_id = uid AND status IN ('pending','partial','overdue')),
    'sales_revenue', (SELECT COALESCE(SUM(total_amount),0) FROM public.sales WHERE user_id = uid),
    'expenses_total', (SELECT COALESCE(SUM(amount),0) FROM public.expenses WHERE user_id = uid),
    'payments_received', (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE user_id = uid AND payment_type IN ('received','sale','emi'))
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dashboard_summary(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_summary(UUID) TO authenticated;