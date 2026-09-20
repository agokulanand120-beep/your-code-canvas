/**
 * Permanent "model knowledge" layer for the Model Hub pages
 * (/cars/{brand}/{model}, /bikes/{brand}/{model}, /commercial/{brand}/{model}).
 *
 * Everything in here is static, hand-curated content. Live marketplace data
 * (prices, listings, dealers, cities) is fetched separately at render time.
 */

export type ModelCategory = "cars" | "bikes" | "commercial";

export interface ModelVariantRow {
  name: string;
  engine?: string;
  fuel?: string;
  transmission?: string;
  power?: string;
  mileage?: string;
  highlights?: string;
}

export interface ModelGeneration {
  name: string;
  years: string;
  notes: string;
}

export interface ModelFaq {
  q: string;
  a: string;
}

export interface SpecGroup {
  group: string;
  rows: [string, string][];
}

export interface FeatureGroup {
  group: string;
  items: string[];
}

export interface ModelDoc {
  category: ModelCategory;
  brand: string;
  model: string;
  /** One-line positioning shown under the H1 support line. */
  segment: string;
  bodyType: string;
  /** Optional gallery image URLs for the hero strip. */
  images?: string[];
  /** 2-3 original paragraphs. */
  overview: string[];
  quickSpecs: {
    fuel?: string;
    engine?: string;
    transmission?: string;
    mileage?: string;
    power?: string;
    torque?: string;
    seating?: string;
    bootSpace?: string;
    fuelTank?: string;
    groundClearance?: string;
    kerbWeight?: string;
  };
  /** Ex-showroom guidance for the new vehicle, where still on sale. */
  newPrice?: string;
  specs: SpecGroup[];
  mileage: {
    notes: string[];
    rows?: [string, string][];
  };
  features: FeatureGroup[];
  safety: string[];
  safetyRating?: string;
  variants: ModelVariantRow[];
  variantAdvice?: string;
  colours: string[];
  generations: ModelGeneration[];
  yearChanges?: [string, string][];
  pros: string[];
  cons: string[];
  ownership: string[];
  maintenanceVerdict?: string;
  /** Model-specific checks, added to the generic used-buying checklist. */
  buyingChecks: string[];
  goodFor: string[];
  considerAlternatives?: string;
  alternatives: { brand: string; model: string }[];
  faqs: ModelFaq[];
}

/** Checks that apply to every used vehicle, shown alongside model-specific ones. */
export const GENERIC_BUYING_CHECKS = [
  "Service history and stamped service book",
  "Cold-start behaviour, idle and engine noise",
  "Gear shifts, clutch bite point and any slipping",
  "Suspension noise over speed breakers",
  "Tyre age, wear pattern and matching brands",
  "Panel gaps, repainted panels and accident repair",
  "Odometer consistency against service invoices",
  "RC, chassis and engine number match",
  "Insurance status, NCB and any claim history",
  "Number of previous owners and RTO transfer readiness",
];
