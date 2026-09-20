
-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  table_name  text NOT NULL,
  record_id   text NOT NULL,
  action      text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_fields jsonb,
  old_data    jsonb,
  new_data    jsonb,
  performed_by uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- ============================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_old         jsonb;
  v_new         jsonb;
  v_changed     jsonb := '{}'::jsonb;
  v_key         text;
  v_record_id   text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_user_id := COALESCE((v_old->>'user_id')::uuid, auth.uid());
    v_record_id := COALESCE(v_old->>'id', '');
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_user_id := COALESCE((v_new->>'user_id')::uuid, auth.uid());
    v_record_id := COALESCE(v_new->>'id', '');
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_user_id := COALESCE((v_new->>'user_id')::uuid, auth.uid());
    v_record_id := COALESCE(v_new->>'id', '');
    -- compute changed fields
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key IN ('updated_at','created_at') THEN CONTINUE; END IF;
      IF v_old->v_key IS DISTINCT FROM v_new->v_key THEN
        v_changed := v_changed || jsonb_build_object(v_key, jsonb_build_object('old', v_old->v_key, 'new', v_new->v_key));
      END IF;
    END LOOP;
    -- skip noise: no real change
    IF v_changed = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    -- safety: don't log orphan rows
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  INSERT INTO public.audit_logs(user_id, table_name, record_id, action, changed_fields, old_data, new_data, performed_by)
  VALUES (v_user_id, TG_TABLE_NAME, v_record_id, TG_OP, NULLIF(v_changed,'{}'::jsonb), v_old, v_new, auth.uid());

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- ============================================================
-- ATTACH TRIGGERS TO BUSINESS TABLES
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'vehicles','customers','vendors','leads','sales','vehicle_purchases',
    'payments','expenses','emi_schedules','settings','documents','service_records'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%s_trg ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER audit_%s_trg
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- SHORT EXPENSE DISPLAY NUMBER
-- ============================================================
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS display_number text;

CREATE OR REPLACE FUNCTION public.set_expense_display_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq int;
  v_prefix text;
BEGIN
  IF NEW.display_number IS NOT NULL AND NEW.display_number <> '' THEN
    RETURN NEW;
  END IF;
  v_prefix := 'EXP-' || to_char(COALESCE(NEW.expense_date, CURRENT_DATE), 'YYMM') || '-';
  SELECT COUNT(*) + 1 INTO v_seq
    FROM public.expenses
    WHERE user_id = NEW.user_id
      AND display_number LIKE v_prefix || '%';
  NEW.display_number := v_prefix || lpad(v_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_expense_display_number_trg ON public.expenses;
CREATE TRIGGER set_expense_display_number_trg
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_expense_display_number();

-- backfill existing rows in stable creation order
WITH ranked AS (
  SELECT id, user_id,
         'EXP-' || to_char(COALESCE(expense_date, created_at::date), 'YYMM') || '-' ||
         lpad(ROW_NUMBER() OVER (
           PARTITION BY user_id, to_char(COALESCE(expense_date, created_at::date), 'YYMM')
           ORDER BY created_at, id
         )::text, 4, '0') AS new_num
  FROM public.expenses
  WHERE display_number IS NULL OR display_number = ''
)
UPDATE public.expenses e SET display_number = r.new_num
  FROM ranked r WHERE e.id = r.id;
