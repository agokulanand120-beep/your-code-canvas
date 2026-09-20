/**
 * City landing pages — /marketplace/vehicles/used-cars-in-<city>
 *
 * Turns location from a query param into real, indexable URLs that can rank
 * for "used cars in <city>", "second hand cars in <city>",
 * "used <brand> <model> in <city>" style searches. Slugs are parsed back into
 * a district label that matches the values produced by src/lib/location.ts.
 *
 * Supported URL shapes (all resolve to the same page):
 *   used-cars-in-coimbatore                (segment page — canonical)
 *   second-hand-cars-in-coimbatore         (alias, canonicalises to the above)
 *   used-honda-cars-in-coimbatore          (brand + segment page)
 *   used-honda-city-in-coimbatore          (brand + model page)
 *   second-hand-swift-in-coimbatore        (model-only alias)
 */

import { KNOWN_DISTRICTS, canonicalDistrict } from "@/lib/location";
import { slugify } from "@/lib/seoSlug";

export type CitySegment = "cars" | "bikes";

export interface CityPageParams {
  segment: CitySegment;
  /** Canonical district label, e.g. "Coimbatore" */
  city: string;
  slug: string;
  /** Brand slug when the URL is a brand-in-city landing page, e.g. "honda" */
  brandSlug?: string;
  /** Brand+model (or model-only) slug, e.g. "honda-city" or "swift" */
  subjectSlug?: string;
  /** True when the visitor arrived on a "second-hand-…" alias URL. */
  alias?: boolean;
}

/** Cities we always emit landing pages for, even with thin stock today. */
export const PRIORITY_CITIES = [
  "Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur", "Erode",
  "Tiruchirappalli", "Tirunelveli", "Vellore", "Thanjavur", "Dindigul", "Karur",
  "Namakkal", "Krishnagiri", "Kanchipuram", "Chengalpattu", "Cuddalore",
  "Viluppuram", "Tiruvannamalai", "Kanyakumari", "Thoothukudi", "Nilgiris",
  "Virudhunagar", "Theni", "Tenkasi", "Hosur", "Ooty", "Tiruvallur", "Bangalore", "Hyderabad", "Kochi", "Mumbai", "Pune",
  "Delhi", "Ahmedabad", "Jaipur", "Lucknow", "Kolkata",
];

export const citySlug = (segment: CitySegment, city: string) =>
  `used-${segment}-in-${slugify(city)}`;

export const cityPath = (segment: CitySegment, city: string) =>
  `/marketplace/vehicles/${citySlug(segment, city)}`;

/** "second hand cars in <city>" alias URL — canonicalises to citySlug. */
export const secondHandCityPath = (segment: CitySegment, city: string) =>
  `/marketplace/vehicles/second-hand-${segment}-in-${slugify(city)}`;

/** Dedicated brand-in-city landing page, e.g. /marketplace/vehicles/used-honda-cars-in-coimbatore */
export const cityBrandSlug = (segment: CitySegment, city: string, brand: string) =>
  `used-${slugify(brand)}-${segment}-in-${slugify(city)}`;

export const cityBrandPath = (segment: CitySegment, city: string, brand: string) =>
  `/marketplace/vehicles/${cityBrandSlug(segment, city, brand)}`;

/** Model-in-city landing page, e.g. /marketplace/vehicles/used-honda-city-in-coimbatore */
export const cityModelSlug = (city: string, brand: string, model: string) =>
  `used-${slugify(`${brand} ${model}`)}-in-${slugify(city)}`;

export const cityModelPath = (city: string, brand: string, model: string) =>
  `/marketplace/vehicles/${cityModelSlug(city, brand, model)}`;

const DISTRICT_BY_SLUG = new Map(KNOWN_DISTRICTS.map((d) => [slugify(d), d]));
/** Longest first so "navi-mumbai" wins over "mumbai". */
const DISTRICT_SLUGS = [...DISTRICT_BY_SLUG.keys()].sort((a, b) => b.length - a.length);

/** Parses "used-cars-in-coimbatore" / "second-hand-swift-in-coimbatore". */
export function parseCitySlug(slug?: string | null): CityPageParams | null {
  if (!slug) return null;
  const lower = slug.toLowerCase();
  const prefix = /^(used|second-hand|old|pre-owned)-(.+)$/.exec(lower);
  if (!prefix) return null;
  const alias = prefix[1] !== "used";
  const rest = prefix[2];

  const citySlugMatch = DISTRICT_SLUGS.find((d) => rest.endsWith(`-in-${d}`));
  if (!citySlugMatch) return null;
  const city = canonicalDistrict(DISTRICT_BY_SLUG.get(citySlugMatch)!);
  let subject = rest.slice(0, rest.length - `-in-${citySlugMatch}`.length);
  if (!subject) return null;

  // Trailing segment word, if present: "cars" / "bikes" / "honda-cars"
  let segment: CitySegment = "cars";
  const segMatch = /^(?:(.+)-)?(cars|car|bikes|bike|two-wheelers|scooters)$/.exec(subject);
  if (segMatch) {
    segment = /bike|scooter|two-wheeler/.test(segMatch[2]) ? "bikes" : "cars";
    subject = segMatch[1] || "";
  }

  if (!subject) {
    return { segment, city, slug: citySlug(segment, city), alias };
  }

  // "used-honda-cars-in-x" → brand page. "used-honda-city-in-x" → model page.
  const isBrandPage = !!segMatch;
  return {
    segment,
    city,
    alias,
    brandSlug: isBrandPage ? subject : subject.split("-")[0],
    subjectSlug: isBrandPage ? undefined : subject,
    slug: isBrandPage
      ? `used-${subject}-${segment}-in-${citySlugMatch}`
      : `used-${subject}-in-${citySlugMatch}`,
  };
}

/** Vehicle types that belong to a segment (vehicles.vehicle_type values). */
export const segmentVehicleTypes: Record<CitySegment, string[]> = {
  cars: ["car", "suv", "sedan", "hatchback", "muv", "van", "pickup", "truck"],
  bikes: ["bike", "motorcycle", "scooter", "scooty", "moped", "ev_bike"],
};

export const matchesSegment = (vehicleType: string | null | undefined, segment: CitySegment) => {
  const t = (vehicleType || "").toLowerCase();
  if (!t) return segment === "cars";
  if (segmentVehicleTypes.bikes.includes(t)) return segment === "bikes";
  return segment === "cars";
};

export const segmentLabel = (segment: CitySegment, plural = true) =>
  segment === "bikes" ? (plural ? "bikes" : "bike") : plural ? "cars" : "car";

/** Unique intro copy per city so pages aren't boilerplate duplicates. */
export function cityIntro(city: string, segment: CitySegment, count: number, dealerCount: number) {
  const noun = segmentLabel(segment);
  return `Looking for a second hand ${segmentLabel(segment, false)} in ${city}? UpcurvHub lists ${
    count > 0 ? `${count} verified used ${noun}` : `verified used ${noun}`
  } from ${dealerCount > 0 ? `${dealerCount} ` : ""}trusted ${city} dealers — each with real photos, honest kilometre readings, ownership history and a transparent asking price. Compare on-road prices of used ${noun} in ${city} across local showrooms, check EMI options, and talk to the dealer directly. No brokers, no inflated listings, and full help with RC transfer and insurance paperwork within ${city}.`;
}

export function cityFaqs(city: string, segment: CitySegment) {
  const noun = segmentLabel(segment);
  const single = segmentLabel(segment, false);
  return [
    {
      q: `How much does a used ${single} cost in ${city}?`,
      a: `Prices depend on the model, year and kilometres driven. On UpcurvHub you can filter ${city} listings by budget and see the actual asking price of every used ${single}, with no hidden dealer markup.`,
    },
    {
      q: `Where can I buy second hand ${noun} in ${city}?`,
      a: `UpcurvHub lists second hand ${noun} from verified dealers across ${city}. Browse the listings above, shortlist by budget or brand, and contact the ${city} dealer directly — no broker in between.`,
    },
    {
      q: `Are the used ${noun} in ${city} verified?`,
      a: `Yes. Every ${city} dealer on UpcurvHub is verified before listing, and vehicles carry inspection details, ownership count and service history where available.`,
    },
    {
      q: `Can I get finance or EMI on a used ${single} in ${city}?`,
      a: `Most ${city} dealers on UpcurvHub offer loan assistance. You can estimate your monthly instalment with the EMI calculator on each listing before contacting the dealer.`,
    },
    {
      q: `How do I sell my ${single} in ${city}?`,
      a: `Submit your vehicle details on the Sell Vehicle page and verified ${city} dealers will reach out with quotes, including doorstep inspection and paperwork support.`,
    },
  ];
}

/** FAQ copy for a model-in-city page, e.g. "used Honda City in Coimbatore". */
export function cityModelFaqs(city: string, label: string, count: number, priceFrom?: string) {
  return [
    {
      q: `What is the price of a used ${label} in ${city}?`,
      a: `${count > 0 ? `${count} used ${label} listings are live in ${city} on UpcurvHub` : `Used ${label} listings in ${city} are added regularly on UpcurvHub`}${
        priceFrom ? `, starting from ${priceFrom}` : ""
      }. Price varies with the year, variant, kilometres driven and ownership count — every listing shows the dealer's actual asking price.`,
    },
    {
      q: `Where can I buy a second hand ${label} in ${city}?`,
      a: `All ${label} listings above come from verified ${city} dealers on UpcurvHub. Open a listing to see photos, kilometres, ownership history and the dealer's contact details.`,
    },
    {
      q: `Is a used ${label} a good buy in ${city}?`,
      a: `Check the service history, ownership count and kilometres before you decide. UpcurvHub listings show these upfront, and ${city} dealers allow a test drive and inspection before purchase.`,
    },
    {
      q: `Can I get EMI on a used ${label} in ${city}?`,
      a: `Yes — most ${city} dealers arrange used vehicle finance. Use the EMI calculator on the listing to estimate your monthly payment before contacting the dealer.`,
    },
  ];
}
