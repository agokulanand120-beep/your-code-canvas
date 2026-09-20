
CREATE OR REPLACE FUNCTION public.seed_all_demo_data(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  i int; v_brands text[] := ARRAY['Maruti','Hyundai','Honda','Tata','Mahindra','Kia','Toyota','Skoda','Volkswagen','Renault'];
  v_models text[] := ARRAY['Swift','Creta','City','Nexon','XUV700','Seltos','Innova','Slavia','Polo','Kwid'];
  v_fuels text[] := ARRAY['petrol','diesel','cng','electric'];
  v_colors text[] := ARRAY['White','Black','Silver','Red','Blue','Grey'];
  v_status text[] := ARRAY['in_stock','sold','reserved'];
  v_lead_status text[] := ARRAY['new','contacted','qualified','test_drive','negotiation','won','lost'];
  v_categories text[] := ARRAY['fuel','maintenance','salary','rent','utilities','marketing','office','misc'];
  v_pay_modes text[] := ARRAY['cash','upi','bank_transfer','cheque','card'];
  v_sources text[] := ARRAY['website','walk_in','referral','instagram','facebook','google','whatsapp'];
  v_vendor_ids uuid[]; v_customer_ids uuid[]; v_vehicle_ids uuid[];
  v_sale_id uuid; v_price numeric; v_purchase numeric; v_new_id uuid; v_tag text;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'user_id required'; END IF;
  v_tag := to_char(now(),'YYYYMMDDHH24MISS');

  FOR i IN 1..200 LOOP
    INSERT INTO vendors (user_id, code, name, phone, email, address, contact_person, is_active, vendor_type)
    VALUES (p_user_id, 'VND-'||v_tag||'-'||lpad(i::text,4,'0'),
      'Vendor ' || i, '9' || lpad((100000000 + i)::text, 9, '0'),
      'vendor' || i || '@demo.test', 'Shop ' || i, 'Contact ' || i, true,
      CASE WHEN i % 3 = 0 THEN 'individual' ELSE 'dealer' END)
    RETURNING id INTO v_new_id;
    v_vendor_ids := array_append(v_vendor_ids, v_new_id);
  END LOOP;

  FOR i IN 1..200 LOOP
    INSERT INTO customers (user_id, code, full_name, phone, email, address, is_active)
    VALUES (p_user_id, 'CUS-'||v_tag||'-'||lpad(i::text,4,'0'),
      'Customer ' || i, '8' || lpad((100000000 + i)::text, 9, '0'),
      'customer' || i || '@demo.test', 'Address ' || i, true)
    RETURNING id INTO v_new_id;
    v_customer_ids := array_append(v_customer_ids, v_new_id);
  END LOOP;

  FOR i IN 1..200 LOOP
    v_purchase := 200000 + (random() * 800000)::int;
    v_price := v_purchase + 30000 + (random() * 120000)::int;
    INSERT INTO vehicles (user_id, code, brand, model, variant, color, fuel_type, transmission,
      status, purchase_price, selling_price, manufacturing_year, registration_number, odometer_reading,
      number_of_owners, vendor_id, is_public, marketplace_status, purchase_status)
    VALUES (p_user_id, 'VEH-'||v_tag||'-'||lpad(i::text,4,'0'),
      v_brands[1 + (i % array_length(v_brands,1))],
      v_models[1 + (i % array_length(v_models,1))],
      'VXI', v_colors[1 + (i % array_length(v_colors,1))],
      v_fuels[1 + (i % array_length(v_fuels,1))],
      CASE WHEN i % 2 = 0 THEN 'manual' ELSE 'automatic' END,
      v_status[1 + (i % array_length(v_status,1))], v_purchase, v_price,
      2016 + (i % 9), 'MH' || lpad((i % 100)::text,2,'0') || 'AB' || lpad(i::text,4,'0'),
      10000 + (i * 300), 1 + (i % 3),
      v_vendor_ids[1 + (i % array_length(v_vendor_ids,1))],
      (i % 4 = 0), CASE WHEN i % 4 = 0 THEN 'approved' ELSE 'not_listed' END, 'received')
    RETURNING id INTO v_new_id;
    v_vehicle_ids := array_append(v_vehicle_ids, v_new_id);
  END LOOP;

  FOR i IN 1..200 LOOP
    INSERT INTO leads (user_id, lead_number, customer_name, phone, email, city, vehicle_interest,
      budget_min, budget_max, source, status, priority, lead_type, follow_up_date)
    VALUES (p_user_id, 'LED-'||v_tag||'-'||lpad(i::text,4,'0'),
      'Lead ' || i, '7' || lpad((100000000 + i)::text, 9, '0'),
      'lead' || i || '@demo.test',
      (ARRAY['Mumbai','Delhi','Bangalore','Chennai','Pune','Hyderabad'])[1 + (i % 6)],
      v_brands[1 + (i % array_length(v_brands,1))] || ' ' || v_models[1 + (i % array_length(v_models,1))],
      200000 + (i * 1000), 500000 + (i * 2000),
      v_sources[1 + (i % array_length(v_sources,1))],
      v_lead_status[1 + (i % array_length(v_lead_status,1))],
      (ARRAY['low','medium','high'])[1 + (i % 3)], 'buyer',
      (now() + ((i % 30) || ' days')::interval)::date);
  END LOOP;

  FOR i IN 1..200 LOOP
    INSERT INTO vehicle_purchases (user_id, purchase_number, vehicle_id, vendor_id, purchase_price,
      amount_paid, balance_amount, payment_mode, purchase_date, notes)
    VALUES (p_user_id, 'PUR-'||v_tag||'-'||lpad(i::text,4,'0'),
      v_vehicle_ids[1 + (i % array_length(v_vehicle_ids,1))],
      v_vendor_ids[1 + (i % array_length(v_vendor_ids,1))],
      200000 + (random() * 800000)::int, 100000 + (random() * 300000)::int,
      (random() * 200000)::int,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      (now() - ((i % 180) || ' days')::interval)::date, 'Seeded purchase #' || i);
  END LOOP;

  FOR i IN 1..200 LOOP
    v_price := 300000 + (random() * 900000)::int;
    INSERT INTO sales (user_id, sale_number, vehicle_id, customer_id, selling_price, discount,
      tax_amount, total_amount, down_payment, amount_paid, balance_amount,
      payment_mode, status, sale_date, additional_charges)
    VALUES (p_user_id, 'SLE-'||v_tag||'-'||lpad(i::text,4,'0'),
      v_vehicle_ids[1 + (i % array_length(v_vehicle_ids,1))],
      v_customer_ids[1 + (i % array_length(v_customer_ids,1))],
      v_price, (v_price * 0.02)::int, (v_price * 0.05)::int,
      v_price + (v_price * 0.03)::int,
      (v_price * 0.2)::int, (v_price * 0.6)::int, (v_price * 0.4)::int,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      CASE WHEN i % 5 = 0 THEN 'pending' ELSE 'completed' END,
      (now() - ((i % 200) || ' days')::interval)::date,
      CASE WHEN i % 3 = 0
        THEN jsonb_build_array(jsonb_build_object('name','RTO','amount', 5000 + (i % 20) * 500))
        ELSE '[]'::jsonb END)
    RETURNING id INTO v_sale_id;

    INSERT INTO payments (user_id, payment_number, amount, payment_type, payment_mode, payment_date,
      payment_purpose, description, reference_id, reference_type, customer_id)
    VALUES (p_user_id, 'PAY-'||v_tag||'-'||lpad(i::text,4,'0'),
      (v_price * 0.6)::int, 'customer_payment',
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      (now() - ((i % 200) || ' days')::interval)::date,
      'sale', 'Sale payment #' || i, v_sale_id, 'sale',
      v_customer_ids[1 + (i % array_length(v_customer_ids,1))]);
  END LOOP;

  FOR i IN 1..200 LOOP
    INSERT INTO expenses (user_id, expense_number, description, category, amount, expense_date, payment_mode, notes)
    VALUES (p_user_id, 'EXP-'||v_tag||'-'||lpad(i::text,4,'0'),
      'Expense ' || i || ' - ' || v_categories[1 + (i % array_length(v_categories,1))],
      v_categories[1 + (i % array_length(v_categories,1))],
      500 + (random() * 25000)::int,
      (now() - ((i % 180) || ' days')::interval)::date,
      v_pay_modes[1 + (i % array_length(v_pay_modes,1))]::payment_mode,
      'Seeded expense #' || i);
  END LOOP;

  RETURN json_build_object('ok', true, 'user_id', p_user_id);
END;
$function$;
