ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS marketplace_listed_at timestamptz;

UPDATE public.vehicles
SET marketplace_listed_at = COALESCE(updated_at, created_at)
WHERE marketplace_listed_at IS NULL
  AND marketplace_status IN ('approved','featured');

CREATE OR REPLACE FUNCTION public.set_marketplace_listed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.marketplace_status IN ('approved','featured')
     AND (TG_OP = 'INSERT' OR OLD.marketplace_status IS DISTINCT FROM NEW.marketplace_status)
  THEN
    NEW.marketplace_listed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_marketplace_listed_at ON public.vehicles;
CREATE TRIGGER trg_set_marketplace_listed_at
BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_marketplace_listed_at();

CREATE INDEX IF NOT EXISTS idx_vehicles_marketplace_listed_at
  ON public.vehicles (marketplace_listed_at DESC);