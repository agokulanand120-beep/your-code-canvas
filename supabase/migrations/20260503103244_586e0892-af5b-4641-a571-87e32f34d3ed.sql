
DO $$
DECLARE
  uid uuid := '6b969012-2d6b-4a79-ab9a-dbb4a8f3c372';
  i int;
  v_vehicle_ids uuid[] := ARRAY[]::uuid[];
  v_customer_ids uuid[] := ARRAY[]::uuid[];
  v_vendor_ids uuid[] := ARRAY[]::uuid[];
  v_sale_ids uuid[] := ARRAY[]::uuid[];
  brands text[] := ARRAY['Maruti','Hyundai','Honda','Toyota','Tata','Mahindra','Kia','Skoda','Volkswagen','Renault','Nissan','Ford','Chevrolet','MG','BMW'];
  models text[] := ARRAY['Swift','i20','City','Innova','Nexon','XUV700','Seltos','Slavia','Polo','Kwid','Magnite','EcoSport','Beat','Hector','3 Series'];
  colors text[] := ARRAY['White','Black','Red','Blue','Silver','Grey','Brown','Maroon','Yellow','Green','Orange','Beige','Bronze','Pearl','Champagne'];
  fuels text[] := ARRAY['petrol','diesel','cng','electric','petrol','diesel','petrol','diesel','petrol','diesel','petrol','diesel','petrol','diesel','petrol'];
  vid uuid; cid uuid; ven uuid; sid uuid;
BEGIN
  -- Ensure settings row
  INSERT INTO settings (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  INSERT INTO user_roles (user_id, role) VALUES (uid, 'dealer') ON CONFLICT DO NOTHING;

  -- Vendors
  FOR i IN 1..15 LOOP
    ven := gen_random_uuid();
    INSERT INTO vendors (id, user_id, code, name, phone, email, vendor_type, contact_person, address)
    VALUES (ven, uid, 'VEN'||LPAD(i::text,4,'0'), 'Vendor '||i, '900000'||LPAD(i::text,4,'0'), 'vendor'||i||'@test.com',
      CASE WHEN i % 2 = 0 THEN 'dealer' ELSE 'individual' END, 'Contact '||i, 'Address line '||i);
    v_vendor_ids := array_append(v_vendor_ids, ven);
  END LOOP;

  -- Customers
  FOR i IN 1..15 LOOP
    cid := gen_random_uuid();
    INSERT INTO customers (id, user_id, code, full_name, phone, email, address)
    VALUES (cid, uid, 'CUS'||LPAD(i::text,4,'0'), 'Customer '||i, '880000'||LPAD(i::text,4,'0'), 'customer'||i||'@test.com', 'Customer Address '||i);
    v_customer_ids := array_append(v_customer_ids, cid);
  END LOOP;

  -- Vehicles
  FOR i IN 1..15 LOOP
    vid := gen_random_uuid();
    INSERT INTO vehicles (id, user_id, code, brand, model, variant, color, vehicle_type, fuel_type, transmission,
      condition, status, purchase_price, selling_price, manufacturing_year, registration_year,
      registration_number, odometer_reading, mileage, seating_capacity, vendor_id, purchase_date)
    VALUES (vid, uid, 'VEH'||LPAD(i::text,4,'0'), brands[i], models[i], 'VXi', colors[i], 'car', fuels[i],
      CASE WHEN i % 2 = 0 THEN 'manual' ELSE 'automatic' END, 'used',
      CASE WHEN i <= 8 THEN 'in_stock' WHEN i <= 12 THEN 'sold' ELSE 'reserved' END,
      300000 + i*25000, 350000 + i*30000, 2018 + (i % 6), 2018 + (i % 6),
      'KA01AB'||LPAD(i::text,4,'0'), 20000 + i*5000, 15 + (i % 10), 5, v_vendor_ids[i], CURRENT_DATE - (i*10));
    v_vehicle_ids := array_append(v_vehicle_ids, vid);
  END LOOP;

  -- Leads
  FOR i IN 1..15 LOOP
    INSERT INTO leads (user_id, lead_number, customer_name, phone, email, vehicle_interest, source, status, priority, budget_min, budget_max, follow_up_date)
    VALUES (uid, 'LEAD'||LPAD(i::text,4,'0'), 'Lead Customer '||i, '770000'||LPAD(i::text,4,'0'), 'lead'||i||'@test.com',
      brands[i]||' '||models[i], CASE i % 4 WHEN 0 THEN 'website' WHEN 1 THEN 'walk_in' WHEN 2 THEN 'referral' ELSE 'social' END,
      CASE WHEN i <= 5 THEN 'new' WHEN i <= 9 THEN 'qualified' WHEN i <= 12 THEN 'won' ELSE 'lost' END,
      CASE i % 3 WHEN 0 THEN 'high' WHEN 1 THEN 'medium' ELSE 'low' END,
      200000 + i*10000, 500000 + i*20000, now() + (i || ' days')::interval);
  END LOOP;

  -- Purchases
  FOR i IN 1..15 LOOP
    INSERT INTO vehicle_purchases (user_id, purchase_number, vehicle_id, vendor_id, purchase_price, amount_paid, balance_amount, payment_mode, purchase_date)
    VALUES (uid, 'PUR'||LPAD(i::text,4,'0'), v_vehicle_ids[i], v_vendor_ids[i], 300000+i*25000, 200000+i*15000, 100000+i*10000,
      (ARRAY['cash','bank_transfer','upi','cheque','card'])[1+(i%5)]::payment_mode, CURRENT_DATE - (i*7));
  END LOOP;

  -- Sales (only for sold/reserved vehicles, but seed 15 rows)
  FOR i IN 1..15 LOOP
    sid := gen_random_uuid();
    INSERT INTO sales (id, user_id, sale_number, vehicle_id, customer_id, selling_price, total_amount, amount_paid, balance_amount, down_payment, payment_mode, status, sale_date)
    VALUES (sid, uid, 'SALE'||LPAD(i::text,4,'0'), v_vehicle_ids[i], v_customer_ids[i],
      350000+i*30000, 350000+i*30000, 200000+i*20000, 150000+i*10000, 50000,
      (ARRAY['cash','bank_transfer','upi','finance','cheque'])[1+(i%5)]::payment_mode,
      CASE WHEN i <= 10 THEN 'completed' ELSE 'pending' END, CURRENT_DATE - (i*5));
    v_sale_ids := array_append(v_sale_ids, sid);
  END LOOP;

  -- Payments
  FOR i IN 1..15 LOOP
    INSERT INTO payments (user_id, payment_number, amount, payment_type, payment_mode, payment_date, customer_id, reference_type, reference_id, description)
    VALUES (uid, 'PAY'||LPAD(i::text,4,'0'), 25000 + i*5000,
      CASE WHEN i % 2 = 0 THEN 'customer_payment' ELSE 'vendor_payment' END,
      (ARRAY['cash','bank_transfer','upi','cheque','card'])[1+(i%5)]::payment_mode,
      CURRENT_DATE - (i*3), v_customer_ids[i], 'sale', v_sale_ids[i], 'Payment '||i);
  END LOOP;

  -- Expenses
  FOR i IN 1..15 LOOP
    INSERT INTO expenses (user_id, expense_number, description, category, amount, expense_date, payment_mode, vehicle_id)
    VALUES (uid, 'EXP'||LPAD(i::text,4,'0'), 'Expense item '||i,
      (ARRAY['repair','transport','marketing','office','utilities','salary','misc'])[1+(i%7)],
      1000+i*500, CURRENT_DATE - (i*2),
      (ARRAY['cash','bank_transfer','upi','card'])[1+(i%4)]::payment_mode, v_vehicle_ids[i]);
  END LOOP;
END $$;
