
-- 1) Add folder_path to documents for folder feature
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_path text DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON public.documents(user_id, folder_path);

-- 2) Auto-unlist vehicles from catalogue & marketplace when status becomes sold/reserved
CREATE OR REPLACE FUNCTION public.auto_unlist_vehicle_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('sold','reserved') THEN
    NEW.is_public := false;
    NEW.marketplace_status := 'unlisted';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicles_auto_unlist ON public.vehicles;
CREATE TRIGGER trg_vehicles_auto_unlist
BEFORE INSERT OR UPDATE OF status ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.auto_unlist_vehicle_on_status_change();
