/**
 * Sitemap generator — runs before `vite dev` and `vite build` (predev/prebuild).
 *
 * Emits public/sitemap.xml containing every static page plus one entry per
 * marketplace-listed vehicle, per marketplace dealer, and per public catalogue
 * page, so search engines can index the whole UpcurvHub surface.
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://upcurvhub.upcurv.in";

const CURATED_MODEL_PATHS = [
  "/cars/maruti-suzuki/swift",
  "/cars/maruti-suzuki/baleno",
  "/cars/maruti-suzuki/dzire",
  "/cars/tata/nexon",
  "/cars/tata/punch",
  "/cars/mahindra/scorpio",
];


type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/marketplace/vehicles", changefreq: "daily", priority: "0.9" },
  { path: "/marketplace/dealers", changefreq: "daily", priority: "0.8" },
  { path: "/marketplace/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/marketplace/compare", changefreq: "weekly", priority: "0.5" },
  { path: "/sell-vehicle", changefreq: "weekly", priority: "0.8" },
  { path: "/car-loan", changefreq: "weekly", priority: "0.8" },
  { path: "/insurance", changefreq: "weekly", priority: "0.8" },
  { path: "/car-services", changefreq: "weekly", priority: "0.8" },
  { path: "/accessories", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/blog/used-car-buying-guide-india", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/best-used-cars-under-5-lakh", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/used-electric-vehicle-buying-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/vehicle-inspection-checklist", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/sell-your-car-at-best-price", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/rto-ownership-transfer-process", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/used-car-loan-emi-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/used-car-insurance-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/buying-used-bike-in-india", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/buy-used-cars-in-coimbatore", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/best-used-hatchbacks-india", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/best-used-compact-suvs-india", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/best-used-bikes-india", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/used-cars-in-tamil-nadu", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-cars-in-chennai", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-cars-in-erode", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-cars-in-salem", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-cars-in-madurai", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-cars-in-trichy", changefreq: "weekly", priority: "0.8" },
  { path: "/blog/used-bikes-in-coimbatore", changefreq: "weekly", priority: "0.8" },
  { path: "/models", changefreq: "daily", priority: "0.8" },
  { path: "/models/cars", changefreq: "daily", priority: "0.8" },
  { path: "/models/bikes", changefreq: "daily", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/shop", changefreq: "weekly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function readEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  const envPath = resolve(".env");
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return undefined;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const toISODate = (value?: string | null) =>
  value ? new Date(value).toISOString().split("T")[0] : undefined;

/**
 * City landing pages. Mirrors src/lib/cityPages.ts + src/lib/location.ts, kept
 * inline because this script runs outside Vite's path-alias resolution.
 */
const PRIORITY_CITIES = [
  "Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur", "Erode",
  "Tiruchirappalli", "Bangalore", "Hyderabad", "Kochi", "Mumbai", "Pune",
  "Delhi", "Ahmedabad", "Jaipur", "Lucknow", "Kolkata",
];

const slugify = (input: string) =>
  input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const cityPath = (segment: "cars" | "bikes", city: string) =>
  `/marketplace/vehicles/used-${segment}-in-${slugify(city)}`;

/** Last comma-separated address part that isn't a pincode, country or state-ish token. */
const extractDistrict = (address?: string | null): string | null => {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^\d{5,6}$/.test(p) && p.toLowerCase() !== "india");
  if (!parts.length) return null;
  const hit = PRIORITY_CITIES.find((c) =>
    parts.some((p) => p.toLowerCase().includes(c.toLowerCase())),
  );
  return hit || null;
};


async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const url = readEnv("VITE_SUPABASE_URL");
  const key = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") || readEnv("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) {
    console.warn("sitemap: Supabase env vars missing — writing static entries only");
    return [];
  }

  const supabase = createClient(url, key);
  const entries: SitemapEntry[] = [];

  try {
    // Marketplace vehicle detail pages
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, slug, brand, model, vehicle_type, user_id, updated_at, marketplace_listed_at")
      .eq("status", "in_stock")
      .in("marketplace_status", ["approved", "featured"])
      .limit(5000);

    (vehicles || []).forEach((v: any) => {
      entries.push({
        path: `/marketplace/vehicle/${v.slug || v.id}`,
        lastmod: toISODate(v.updated_at || v.marketplace_listed_at),
        changefreq: "weekly",
        priority: "0.7",
      });
    });

    // Brand hubs + brand/model landing pages
    const brandSlugs = new Set<string>();
    const brandModelSlugs = new Set<string>();
    (vehicles || []).forEach((v: any) => {
      if (!v.brand) return;
      brandSlugs.add(slugify(v.brand));
      if (v.model) brandModelSlugs.add(`${slugify(v.brand)}/${slugify(v.model)}`);
    });
    [...brandSlugs].sort().forEach((b) =>
      entries.push({ path: `/marketplace/brand/${b}`, changefreq: "daily", priority: "0.7" }),
    );
    [...brandModelSlugs].sort().forEach((bm) =>
      entries.push({ path: `/marketplace/brand/${bm}`, changefreq: "daily", priority: "0.7" }),
    );

    // Dealer storefronts + public catalogue pages
    const { data: dealers } = await supabase
      .from("settings")
      .select("user_id, dealer_slug, dealer_address, updated_at, marketplace_enabled, marketplace_status, public_page_enabled, public_page_id")
      .limit(5000);

    (dealers || []).forEach((d: any) => {
      const lastmod = toISODate(d.updated_at);

      if (d.marketplace_enabled && ["approved", "featured", "active", "live"].includes(d.marketplace_status)) {
        entries.push({
          path: `/marketplace/dealer/${d.dealer_slug || d.user_id}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.7",
        });
      }

      if (d.public_page_enabled && d.public_page_id) {
        entries.push({
          path: `/d/${d.public_page_id}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.6",
        });
      }
    });

    // City landing pages — /marketplace/vehicles/used-cars-in-<city>
    const dealerCities = new Set<string>();
    (dealers || []).forEach((d: any) => {
      if (!d.marketplace_enabled) return;
      const city = extractDistrict(d.dealer_address);
      if (city) dealerCities.add(city);
    });
    PRIORITY_CITIES.forEach((c) => dealerCities.add(c));

    // Brand-in-city landing pages: /marketplace/vehicles/used-<brand>-<segment>-in-<city>
    const BIKE_TYPES = ["bike", "motorcycle", "scooter", "scooty", "moped", "ev_bike"];
    const cityByDealer = new Map<string, string>();
    (dealers || []).forEach((d: any) => {
      const c = extractDistrict(d.dealer_address);
      if (c && d.marketplace_enabled) cityByDealer.set(d.user_id, c);
    });
    const brandCity = new Set<string>();
    const modelCity = new Set<string>();
    (vehicles || []).forEach((v: any) => {
      const c = cityByDealer.get(v.user_id);
      if (!c || !v.brand) return;
      const segment = BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars";
      brandCity.add(`used-${slugify(v.brand)}-${segment}-in-${slugify(c)}`);
      if (v.model) modelCity.add(`used-${slugify(`${v.brand} ${v.model}`)}-in-${slugify(c)}`);
    });
    [...brandCity].sort().forEach((slug) =>
      entries.push({ path: `/marketplace/vehicles/${slug}`, changefreq: "daily", priority: "0.7" }),
    );
    [...modelCity].sort().forEach((slug) =>
      entries.push({ path: `/marketplace/vehicles/${slug}`, changefreq: "daily", priority: "0.75" }),
    );

    [...dealerCities].sort().forEach((city) => {
      (["cars", "bikes"] as const).forEach((segment) => {
        entries.push({
          path: cityPath(segment, city),
          changefreq: "daily",
          priority: "0.8",
        });
      });
    });


    // Accessory product pages
    const { data: products } = await supabase
      .from("accessory_products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .limit(5000);

    (products || []).forEach((p: any) => {
      if (!p.slug) return;
      entries.push({
        path: `/accessories/${p.slug}`,
        lastmod: toISODate(p.updated_at),
        changefreq: "weekly",
        priority: "0.6",
      });
    });

    // Model hub pages — every active row in model_docs
    const { data: modelDocs, error: modelDocsError } = await supabase
      .from("model_docs")
      .select("category, brand, brand_slug, model, model_slug, updated_at")
      .eq("is_active", true)
      .limit(5000);
    if (modelDocsError) throw new Error(`model_docs sitemap query failed: ${modelDocsError.message}`);
    (modelDocs || []).forEach((m: any) => {
      const brand = m.brand_slug || slugify(m.brand);
      const model = m.model_slug || slugify(m.model);
      if (!brand || !model) return;
      entries.push({
        path: `/${m.category}/${brand}/${model}`,
        lastmod: toISODate(m.updated_at),
        changefreq: "weekly",
        priority: "0.8",
      });
    });

    // Curated model hubs that live in the app code (not in model_docs).
    CURATED_MODEL_PATHS.forEach((p) =>
      entries.push({ path: p, changefreq: "weekly", priority: "0.8" }),
    );

  } catch (err) {
    console.warn("sitemap: dynamic fetch failed —", (err as Error).message);
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const unique = [...new Map(entries.map((e) => [e.path, e])).values()];
  const urls = unique.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const dynamicEntries = await fetchDynamicEntries();
const all = [...staticEntries, ...dynamicEntries];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
console.log(`sitemap.xml written (${all.length} entries)`);
