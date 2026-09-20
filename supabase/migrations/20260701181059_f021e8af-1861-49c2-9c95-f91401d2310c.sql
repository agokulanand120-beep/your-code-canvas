
-- ============================================================
-- 1. Dashboard summary: include tax + extras in "total revenue"
-- ============================================================
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
    -- Revenue = total_amount (selling_price - discount + tax_amount + any extras rolled in)
    'total_revenue', (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE user_id = uid AND status = 'completed'),
    'total_cost', (SELECT COALESCE(SUM(purchase_price),0) FROM vehicles WHERE user_id = uid AND status = 'sold'),
    'total_expenses', (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE user_id = uid),
    'pending_emis', (SELECT COUNT(*) FROM emi_schedules WHERE user_id = uid AND status IN ('pending','partial','overdue','partially_paid')),
    'monthly_collections', (SELECT COALESCE(SUM(amount),0) FROM payments WHERE user_id = uid AND payment_date >= v_first_of_month AND payment_type IN ('customer_payment','received','sale','emi')),
    'monthly_sales_value', (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE user_id = uid AND sale_date >= v_first_of_month),
    'outstanding_balance', (SELECT COALESCE(SUM(balance_amount),0) FROM sales WHERE user_id = uid),
    'inventory_value', json_build_object(
      'in_stock', (SELECT COALESCE(SUM(selling_price),0) FROM vehicles WHERE user_id = uid AND status = 'in_stock'),
      'sold', (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE user_id = uid AND status = 'completed'),
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


-- ============================================================
-- 2. Master seed RPC — 200 records per module for a given user
--    (Created only; do NOT auto-run.)
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_all_demo_data(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  i int;
  v_brands text[] := ARRAY['Maruti','Hyundai','Honda','Tata','Mahindra','Kia','Toyota','Skoda','Volkswagen','Renault'];
  v_models text[] := ARRAY['Swift','Creta','City','Nexon','XUV700','Seltos','Innova','Slavia','Polo','Kwid'];
  v_fuels text[] := ARRAY['petrol','diesel','cng','electric'];
  v_colors text[] := ARRAY['White','Black','Silver','Red','Blue','Grey'];
  v_status text[] := ARRAY['in_stock','sold','reserved'];
  v_lead_status text[] := ARRAY['new','contacted','qualified','test_drive','negotiation','won','lost'];
  v_categories text[] := ARRAY['fuel','maintenance','salary','rent','utilities','marketing','office','misc'];
  v_pay_modes text[] := ARRAY['cash','upi','bank_transfer','cheque','card'];
  v_sources text[] := ARRAY['website','walk_in','referral','instagram','facebook','google','whatsapp'];
  v_vendor_ids uuid[];
  v_customer_ids uuid[];
  v_vehicle_ids uuid[];
  v_lead_ids uuid[];
  v_sale_id uuid;
  v_price numeric;
  v_purchase numeric;
  v_new_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  -- Vendors (200)
  FOR i IN 1..200 LOOP
    INSERT INTO vendors (user_id, name, phone, email, address, contact_person, is_active, vendor_type)
    VALUES (
      p_user_id,
      'Vendor ' || i || ' ' || v_brands[1 + (i % array_length(v_brands,1))],
      '9' || lpad((100000000 + i)::text, 9, '0'),
      'vendor' || i || '@demo.test',
      'Shop ' || i || ', ' || v_models[1 + (i % array_length(v_models,1))] || ' Street',
      'Contact ' || i,
      true,
      CASE WHEN i % 3 = 0 THEN 'individual' ELSE 'dealer' END
    ) RETURNING id INTO v_new_id;
    v_vendor_ids := array_append(v_vendor_ids, v_new_id);
  END LOOP;

  -- Customers (200)
  FOR i IN 1..200 LOOP
    INSERT INTO customers (user_id, full_name, phone, email, address, is_active)
    VALUES (
      p_user_id,
      'Customer ' || i,
      '8' || lpad((100000000 + i)::text, 9, '0'),
      'customer' || i || '@demo.test',
      'Address ' || i,
      true
    ) RETURNING id INTO v_new_id;
    v_customer_ids := array_append(v_customer_ids, v_new_id);
  END LOOP;

  -- Vehicles (200)
  FOR i IN 1..200 LOOP
    v_purchase := 200000 + (random() * 800000)::int;
    v_price    := v_purchase + 30000 + (random() * 120000)::int;
    INSERT INTO vehicles (
      user_id, brand, model, variant, color, fuel_type, transmission,
      status, purchase_price, selling_price, manufacturing_year,
      registration_number, odometer_reading, number_of_owners,
      vendor_id, is_public, marketplace_status, purchase_status
    ) VALUES (
      p_user_id,
      v_brands[1 + (i % array_length(v_brands,1))],
      v_models[1 + (i % array_length(v_models,1))],
      'VXI',
      v_colors[1 + (i % array_length(v_colors,1))],
      v_fuels[1 + (i % array_length(v_fuels,1))]::document_type::text::text, -- cast-safe fallback
      CASE WHEN i % 2 = 0 THEN 'manual' ELSE 'automatic' END,
      v_status[1 + (i % array_length(v_status,1))],
      v_purchase,
      v_price,
      2016 + (i % 9),
      'MH' || lpad((i % 100)::text,2,'0') || 'AB' || lpad(i::text,4,'0'),
      10000 + (i * 300),
      1 + (i % 3),
      v_vendor_ids[1 + (i % array_length(v_vendor_ids,1))],
      (i % 4 = 0),
      CASE WHEN i % 4 = 0 THEN 'approved' ELSE 'not_listed' END,
      'received'
    ) RETURNING id INTO v_new_id;
    v_vehicle_ids := array_append(v_vehicle_ids, v_new_id);
  END LOOP;

  -- Leads (200)
  FOR i IN 1..200 LOOP
    INSERT INTO leads (
      user_id, customer_name, phone, email, city, vehicle_interest,
      budget_min, budget_max, source, status, priority, lead_type,
      follow_up_date
    ) VALUES (
      p_user_id,
      'Lead ' || i,
      '7' || lpad((100000000 + i)::text, 9, '0'),
      'lead' || i || '@demo.test',
      (ARRAY['Mumbai','Delhi','Bangalore','Chennai','Pune','Hyderabad'])[1 + (i % 6)],
      v_brands[1 + (i % array_length(v_brands,1))] || ' ' || v_models[1 + (i % array_length(v_models,1))],
      200000 + (i * 1000),
      500000 + (i * 2000),
      v_sources[1 + (i % array_length(v_sources,1))],
      v_lead_status[1 + (i % array_length(v_lead_status,1))]::text,
      (ARRAY['low','medium','high'])[1 + (i % 3)],
      'buyer',
      (now() + ((i % 30) || ' days')::interval)::date
    ) RETURNING id INTO v_new_id;
    v_lead_ids := array_append(v_lead_ids, v_new_id);
  END LOOP;

  -- Purchases (200)
  FOR i IN 1..200 LOOP
    INSERT INTO vehicle_purchases (
      user_id, vehicle_id, vendor_id, purchase_price, amount_paid,
      balance_amount, payment_mode, purchase_date, notes
    ) VALUES (
      p_user_id,
      v_vehicle_ids[1 + (i % array_length(v_vehicle_ids,1))],
      v_vendor_ids[1 + (i % array_length(v_vendor_ids,1))],
      200000 + (random() * 800000)::int,
      100000 + (random() * 300000)::int,
      (random() * 200000)::int,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      (now() - ((i % 180) || ' days')::interval)::date,
      'Seeded purchase #' || i
    );
  END LOOP;

  -- Sales (200) + one payment per sale
  FOR i IN 1..200 LOOP
    v_price := 300000 + (random() * 900000)::int;
    INSERT INTO sales (
      user_id, vehicle_id, customer_id, selling_price, discount,
      tax_amount, total_amount, down_payment, amount_paid, balance_amount,
      payment_mode, status, sale_date
    ) VALUES (
      p_user_id,
      v_vehicle_ids[1 + (i % array_length(v_vehicle_ids,1))],
      v_customer_ids[1 + (i % array_length(v_customer_ids,1))],
      v_price,
      (v_price * 0.02)::int,
      (v_price * 0.05)::int,
      v_price + (v_price * 0.03)::int,
      (v_price * 0.2)::int,
      (v_price * 0.6)::int,
      (v_price * 0.4)::int,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      CASE WHEN i % 5 = 0 THEN 'pending' ELSE 'completed' END,
      (now() - ((i % 200) || ' days')::interval)::date
    ) RETURNING id INTO v_sale_id;

    INSERT INTO payments (
      user_id, amount, payment_type, payment_mode, payment_date,
      payment_purpose, description, reference_id, reference_type,
      customer_id
    ) VALUES (
      p_user_id,
      (v_price * 0.6)::int,
      'customer_payment',
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      (now() - ((i % 200) || ' days')::interval)::date,
      'sale',
      'Sale payment #' || i,
      v_sale_id::text,
      'sale',
      v_customer_ids[1 + (i % array_length(v_customer_ids,1))]
    );
  END LOOP;

  -- Extra payments to reach 200 (already 200 from sales) — top-up misc
  FOR i IN 1..50 LOOP
    INSERT INTO payments (
      user_id, amount, payment_type, payment_mode, payment_date,
      payment_purpose, description
    ) VALUES (
      p_user_id,
      5000 + (random() * 50000)::int,
      CASE WHEN i % 2 = 0 THEN 'expense' ELSE 'received' END,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      (now() - ((i % 90) || ' days')::interval)::date,
      'misc',
      'Misc payment #' || i
    );
  END LOOP;

  -- Expenses (200)
  FOR i IN 1..200 LOOP
    INSERT INTO expenses (
      user_id, description, category, amount, expense_date,
      payment_mode, notes
    ) VALUES (
      p_user_id,
      'Expense ' || i || ' - ' || v_categories[1 + (i % array_length(v_categories,1))],
      v_categories[1 + (i % array_length(v_categories,1))],
      500 + (random() * 25000)::int,
      (now() - ((i % 180) || ' days')::interval)::date,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      'Seeded expense #' || i
    );
  END LOOP;

  RETURN json_build_object(
    'ok', true,
    'user_id', p_user_id,
    'created', json_build_object(
      'vendors', 200,
      'customers', 200,
      'vehicles', 200,
      'leads', 200,
      'purchases', 200,
      'sales', 200,
      'payments', 250,
      'expenses', 200
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.seed_all_demo_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_all_demo_data(uuid) TO service_role;
