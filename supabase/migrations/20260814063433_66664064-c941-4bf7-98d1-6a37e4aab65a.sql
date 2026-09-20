DELETE FROM public.vehicle_catalog a
USING public.vehicle_catalog b
WHERE a.ctid < b.ctid
  AND a.vehicle_type IS NOT DISTINCT FROM b.vehicle_type
  AND a.brand IS NOT DISTINCT FROM b.brand
  AND a.model IS NOT DISTINCT FROM b.model
  AND a.variant IS NOT DISTINCT FROM b.variant;

CREATE UNIQUE INDEX IF NOT EXISTS vehicle_catalog_unique_combo
  ON public.vehicle_catalog (vehicle_type, brand, model, variant) NULLS NOT DISTINCT;