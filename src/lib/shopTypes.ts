export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  short_description: string | null;
  description: string | null;
  price: number;
  mrp: number | null;
  images: string[] | null;
  highlights: string[] | null;
  rating: number | null;
  review_count: number | null;
  buy_url: string;
  merchant: string | null;
  reason: string | null;
  vehicle_types: string[] | null;
  is_featured: boolean;
  sort_order: number;
}

export interface ShopCollection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  intro: string | null;
  vehicle_type: string;
  sort_order: number;
}

export interface ShopCollectionItem {
  id: string;
  collection_id: string;
  product_id: string;
  reason: string | null;
  sort_order: number;
}

export const SHOP_CATEGORIES = [
  { slug: "interior", label: "Interior" },
  { slug: "exterior", label: "Exterior" },
  { slug: "electronics", label: "Electronics" },
  { slug: "car-care", label: "Car Care" },
  { slug: "safety", label: "Safety" },
  { slug: "bike", label: "Bike Gear" },
  { slug: "tools", label: "Tools" },
  { slug: "accessories", label: "Other" },
];

export const SHOP_VEHICLE_TYPES = [
  { slug: "car", label: "Car" },
  { slug: "bike", label: "Bike" },
];

export const categoryLabel = (slug: string) =>
  SHOP_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export const discountPct = (price: number, mrp?: number | null) =>
  mrp && Number(mrp) > price ? Math.round(((Number(mrp) - price) / Number(mrp)) * 100) : 0;

/** Normalise any dealer vehicle_type value to the store's car/bike buckets. */
export const toShopVehicleType = (vehicleType?: string | null): "car" | "bike" => {
  const t = (vehicleType || "car").toLowerCase();
  return ["bike", "motorcycle", "scooter", "scooty", "moped", "two-wheeler", "2-wheeler"].includes(t)
    ? "bike"
    : "car";
};

export const storeLabel = (merchant?: string | null) => merchant?.trim() || "Amazon";
