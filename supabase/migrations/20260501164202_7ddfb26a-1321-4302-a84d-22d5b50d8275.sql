-- Add delivery_note to document_type enum
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'delivery_note';

-- Payments: add payment_number
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_number TEXT;

-- Settings: add marketplace_status / marketplace_featured for dealer-level marketplace controls
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS marketplace_featured BOOLEAN DEFAULT false;

-- Dashboard summary RPC (aggregate counts for current user)
CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  result JSON;
BEGIN
  IF uid IS NULL THEN
    RETURN '{}'::json;
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

REVOKE EXECUTE ON FUNCTION public.dashboard_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;