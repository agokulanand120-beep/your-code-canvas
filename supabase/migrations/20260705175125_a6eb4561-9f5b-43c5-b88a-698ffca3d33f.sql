
CREATE OR REPLACE FUNCTION public.mark_lead_won_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT phone INTO v_phone FROM public.customers WHERE id = NEW.customer_id;
  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN NEW;
  END IF;

  UPDATE public.leads
     SET status = 'won',
         updated_at = now()
   WHERE user_id = NEW.user_id
     AND phone = v_phone
     AND status NOT IN ('won','lost','converted');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_lead_won_on_sale ON public.sales;
CREATE TRIGGER trg_mark_lead_won_on_sale
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.mark_lead_won_on_sale();
