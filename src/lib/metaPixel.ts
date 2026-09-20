export interface MetaVehicleData {
  id?: string;
  brand?: string;
  model?: string;
  variant?: string | null;
  year?: number;
  price?: number;
  currency?: string;
}

type FacebookPixel = {
  callMethod?: (...args: any[]) => void;
  queue: any[];
  push: (...args: any[]) => void;
  loaded?: boolean;
  version?: string;
};

type FacebookPixelFunction = (...args: any[]) => void;

declare global {
  interface Window {
    fbq?: FacebookPixelFunction & FacebookPixel;
  }
}

function isFbqReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

function safeFbqPush(...args: any[]) {
  if (isFbqReady()) {
    window.fbq!(...args);
  }
}

function vehiclePayload(vehicle?: MetaVehicleData | null) {
  if (!vehicle) return {};
  return {
    content_ids: [vehicle.id || ""],
    content_type: "vehicle",
    content_name: `${vehicle.brand || ""} ${vehicle.model || ""}`.trim(),
    content_category: "Used Vehicles",
    brand: vehicle.brand || undefined,
    model: vehicle.model || undefined,
    variant: vehicle.variant || undefined,
    year: vehicle.year || undefined,
    value: vehicle.price || undefined,
    currency: vehicle.currency || "INR",
  };
}

export function trackMetaEvent(
  event: string,
  params?: Record<string, any>,
  vehicle?: MetaVehicleData | null
) {
  safeFbqPush("track", event, { ...vehiclePayload(vehicle), ...params });
}

export function trackVehicleView(vehicle?: MetaVehicleData | null) {
  trackMetaEvent("ViewContent", {}, vehicle);
}

export function trackVehicleLead(vehicle?: MetaVehicleData | null, extra?: Record<string, any>) {
  trackMetaEvent("Lead", extra, vehicle);
}

export function trackVehicleContact(
  method: "whatsapp" | "call" | "email",
  vehicle?: MetaVehicleData | null
) {
  trackMetaEvent("Contact", { contact_method: method }, vehicle);
}

export function trackVehicleWishlist(vehicle?: MetaVehicleData | null, added = true) {
  trackMetaEvent("AddToWishlist", { added }, vehicle);
}

export function trackSearch(query: string, category = "Used Vehicles") {
  if (!query || !query.trim()) return;
  safeFbqPush("track", "Search", {
    search_string: query.trim(),
    content_category: category,
    content_type: "vehicle",
  });
}
