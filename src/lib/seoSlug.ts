/**
 * SEO-friendly URL helpers.
 *
 * Vehicles and dealers carry a database-generated `slug`
 * (e.g. `maruti-swift-vxi-2019-3700c7`, `ug-automobiles-a1b2c3`) so that
 * search engines see keyword-rich URLs instead of raw UUIDs. Legacy UUID
 * URLs keep working; the pages canonicalise to the slug version.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value?: string | null) => !!value && UUID_RE.test(value);

export function slugify(input?: string | null): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type VehicleLike = {
  id: string;
  slug?: string | null;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  manufacturing_year?: number | string | null;
};

/** brand-model-variant-year-<6 char id> */
export function vehicleSlug(vehicle: VehicleLike): string {
  if (vehicle.slug) return vehicle.slug;
  const base =
    slugify([vehicle.brand, vehicle.model, vehicle.variant, vehicle.manufacturing_year].filter(Boolean).join(" ")) ||
    "vehicle";
  return `${base}-${vehicle.id.replace(/-/g, "").slice(0, 6)}`;
}

export const vehiclePath = (vehicle: VehicleLike) => `/marketplace/vehicle/${vehicleSlug(vehicle)}`;

type DealerLike = {
  user_id?: string | null;
  dealer_slug?: string | null;
  public_page_id?: string | null;
  dealer_name?: string | null;
};

export function dealerSlug(dealer: DealerLike): string {
  if (dealer.dealer_slug) return dealer.dealer_slug;
  const base = slugify(dealer.dealer_name) || "dealer";
  const id = (dealer.user_id || "").replace(/-/g, "").slice(0, 6);
  return id ? `${base}-${id}` : dealer.public_page_id || base;
}

export const dealerPath = (dealer: DealerLike) => `/marketplace/dealer/${dealerSlug(dealer)}`;

/** Descriptive storage filename so image search can read the vehicle from the URL. */
export function imageFileName(vehicle: VehicleLike, index: number, originalName: string): string {
  const ext = (originalName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = vehicleSlug(vehicle);
  return `${base}-${index + 1}.${ext}`;
}

/** Human-readable alt text used on every vehicle image. */
export function imageAlt(vehicle: VehicleLike, index = 0, dealerName?: string | null): string {
  const parts = [vehicle.manufacturing_year, vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
  const suffix = dealerName ? ` at ${dealerName}` : "";
  return `Used ${parts} for sale${suffix} — photo ${index + 1} | UpcurvHub`;
}
