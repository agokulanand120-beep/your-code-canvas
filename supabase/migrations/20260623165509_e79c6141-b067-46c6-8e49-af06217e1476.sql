
-- 1) user_letter column on settings (per-dealer prefix)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS user_letter text UNIQUE;

-- Helper: number -> letter prefix (1->A, 26->Z, 27->AA, 28->AB...)
CREATE OR REPLACE FUNCTION public.num_to_letter(n int)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result text := '';
  v int := n;
BEGIN
  IF v IS NULL OR v < 1 THEN RETURN 'A'; END IF;
  WHILE v > 0 LOOP
    v := v - 1;
    result := chr(65 + (v % 26)) || result;
    v := v / 26;
  END LOOP;
  RETURN result;
END $$;

-- Assign letter on settings insert (and to existing settings rows once)
CREATE OR REPLACE FUNCTION public.assign_user_letter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  IF NEW.user_letter IS NOT NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.settings WHERE user_letter IS NOT NULL;
  NEW.user_letter := public.num_to_letter(v_count + 1);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_user_letter ON public.settings;
CREATE TRIGGER trg_assign_user_letter
  BEFORE INSERT ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_letter();

-- Backfill existing settings rows (ordered by created_at for determinism)
DO $$
DECLARE r record; i int := 1;
BEGIN
  FOR r IN SELECT id FROM public.settings WHERE user_letter IS NULL ORDER BY created_at NULLS FIRST, id LOOP
    UPDATE public.settings SET user_letter = public.num_to_letter(i) WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;

-- Helper to fetch a user's letter (defaults to 'A' if missing)
CREATE OR REPLACE FUNCTION public.get_user_letter(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(user_letter, 'A') FROM public.settings WHERE user_id = _user_id LIMIT 1;
$$;

-- 2) Add display_number to tables that don't have it
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.vehicle_purchases ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS display_number text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS display_number text;

-- Generic display-number generator
CREATE OR REPLACE FUNCTION public.gen_display_number(_user_id uuid, _prefix text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_letter text;
  v_count int;
BEGIN
  v_letter := public.get_user_letter(_user_id);
  -- 1-based sequence; per-table counts are computed by caller for uniqueness
  RETURN v_letter || '-' || _prefix || '-' || lpad((_count_placeholder())::text, 4, '0');
END $$;

-- Per-table BEFORE INSERT triggers (each computes its own sequence)

-- Helper macro is not possible in pg; write each trigger separately
CREATE OR REPLACE FUNCTION public.set_lead_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-LD-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.leads WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lead_display_number ON public.leads;
CREATE TRIGGER trg_lead_display_number BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_display_number();

CREATE OR REPLACE FUNCTION public.set_sale_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-SL-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.sales WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sale_display_number ON public.sales;
CREATE TRIGGER trg_sale_display_number BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_sale_display_number();

CREATE OR REPLACE FUNCTION public.set_payment_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-PY-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.payments WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_payment_display_number ON public.payments;
CREATE TRIGGER trg_payment_display_number BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_display_number();

CREATE OR REPLACE FUNCTION public.set_purchase_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-PR-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.vehicle_purchases WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_purchase_display_number ON public.vehicle_purchases;
CREATE TRIGGER trg_purchase_display_number BEFORE INSERT ON public.vehicle_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_purchase_display_number();

CREATE OR REPLACE FUNCTION public.set_customer_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-CU-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.customers WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_customer_display_number ON public.customers;
CREATE TRIGGER trg_customer_display_number BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_display_number();

CREATE OR REPLACE FUNCTION public.set_vendor_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-VN-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.vendors WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_vendor_display_number ON public.vendors;
CREATE TRIGGER trg_vendor_display_number BEFORE INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_vendor_display_number();

CREATE OR REPLACE FUNCTION public.set_vehicle_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-VH-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.vehicles WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_vehicle_display_number ON public.vehicles;
CREATE TRIGGER trg_vehicle_display_number BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_display_number();

-- Update expense trigger to use new letter format for any NEW rows going forward.
-- We keep the existing trigger name; replace function body.
CREATE OR REPLACE FUNCTION public.set_expense_display_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_letter text; v_seq int; v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN RETURN NEW; END IF;
  v_letter := public.get_user_letter(NEW.user_id);
  v_prefix := v_letter || '-EXP-';
  SELECT COUNT(*) + 1 INTO v_seq FROM public.expenses
    WHERE user_id = NEW.user_id AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END $$;

-- Ensure expense trigger exists
DROP TRIGGER IF EXISTS trg_expense_display_number ON public.expenses;
CREATE TRIGGER trg_expense_display_number BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_expense_display_number();
