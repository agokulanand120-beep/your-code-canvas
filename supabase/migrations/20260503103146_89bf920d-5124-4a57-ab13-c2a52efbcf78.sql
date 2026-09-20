
-- Fix dashboard_summary RPC to return all expected fields
CREATE OR REPLACE FUNCTION public.dashboard_summary(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := COALESCE(p_user_id, auth.uid());
  result JSON;
  v_first_of_month date := date_trunc('month', now())::date;
BEGIN
  IF uid IS NULL THEN
    RETURN '{}'::json;
  END IF;
  IF uid <> auth.uid() AND NOT public.is_marketplace_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'total_vehicles', (SELECT COUNT(*) FROM vehicles WHERE user_id = uid),
    'vehicles_in_stock', (SELECT COUNT(*) FROM vehicles WHERE user_id = uid AND status = 'in_stock'),
    'vehicles_sold', (SELECT COUNT(*) FROM vehicles WHERE user_id = uid AND status = 'sold'),
    'vehicles_reserved', (SELECT COUNT(*) FROM vehicles WHERE user_id = uid AND status = 'reserved'),
    'total_customers', (SELECT COUNT(*) FROM customers WHERE user_id = uid),
    'total_vendors', (SELECT COUNT(*) FROM vendors WHERE user_id = uid),
    'total_sales_count', (SELECT COUNT(*) FROM sales WHERE user_id = uid),
    'total_sales_value', (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE user_id = uid),
    'total_revenue', (SELECT COALESCE(SUM(selling_price),0) FROM sales WHERE user_id = uid AND status = 'completed'),
    'total_cost', (SELECT COALESCE(SUM(purchase_price),0) FROM vehicles WHERE user_id = uid AND status = 'sold'),
    'total_expenses', (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE user_id = uid),
    'pending_emis', (SELECT COUNT(*) FROM emi_schedules WHERE user_id = uid AND status IN ('pending','partial','overdue','partially_paid')),
    'monthly_collections', (SELECT COALESCE(SUM(amount),0) FROM payments WHERE user_id = uid AND payment_date >= v_first_of_month AND payment_type IN ('customer_payment','received','sale','emi')),
    'outstanding_balance', (SELECT COALESCE(SUM(balance_amount),0) FROM sales WHERE user_id = uid),
    'inventory_value', json_build_object(
      'in_stock', (SELECT COALESCE(SUM(selling_price),0) FROM vehicles WHERE user_id = uid AND status = 'in_stock'),
      'sold', (SELECT COALESCE(SUM(selling_price),0) FROM vehicles WHERE user_id = uid AND status = 'sold'),
      'reserved', (SELECT COALESCE(SUM(selling_price),0) FROM vehicles WHERE user_id = uid AND status = 'reserved')
    ),
    'lead_counts', json_build_object(
      'total', (SELECT COUNT(*) FROM leads WHERE user_id = uid),
      'qualified', (SELECT COUNT(*) FROM leads WHERE user_id = uid AND status = 'qualified'),
      'won', (SELECT COUNT(*) FROM leads WHERE user_id = uid AND status IN ('won','converted')),
      'lost', (SELECT COUNT(*) FROM leads WHERE user_id = uid AND status = 'lost')
    )
  ) INTO result;

  RETURN result;
END;
$function$;
