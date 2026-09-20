import { supabase } from "@/integrations/supabase/client";
import { setCatalogOverlay } from "./vehicleData";

let loaded = false;

/**
 * Loads admin-managed brand/model/variant additions and merges them into the
 * static vehicle catalogue used by all forms.
 */
export async function loadVehicleCatalogOverlay(force = false) {
  if (loaded && !force) return;
  loaded = true;
  const { data, error } = await supabase
    .from("vehicle_catalog")
    .select("vehicle_type, brand, model, variant")
    .eq("is_active", true)
    .limit(5000);
  if (error) return;
  setCatalogOverlay(data || []);
}
