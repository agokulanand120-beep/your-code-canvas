// Always-current sitemap. Served at /sitemap.xml through the Cloudflare worker
// (public/_worker.js) so newly published listings appear without a redeploy.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { BIKE_TYPES, DEALER_LIVE_STATUSES, SITE, esc, extractDistrict, sb, slugify } from "../_shared/seo.ts";

const CURATED_MODEL_PATHS = [
  "/cars/maruti-suzuki/swift",
  "/cars/maruti-suzuki/baleno",
  "/cars/maruti-suzuki/dzire",
  "/cars/tata/nexon",
  "/cars/tata/punch",
  "/cars/mahindra/scorpio",
];

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const STATIC: Entry[] = [
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
  { path: "/models", changefreq: "daily", priority: "0.8" },
  { path: "/models/cars", changefreq: "daily", priority: "0.8" },
  { path: "/models/bikes", changefreq: "daily", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/shop", changefreq: "weekly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];


const BLOG_SLUGS = [
  "used-car-buying-guide-india",
  "best-used-cars-under-5-lakh",
  "used-electric-vehicle-buying-guide",
  "vehicle-inspection-checklist",
  "sell-your-car-at-best-price",
  "rto-ownership-transfer-process",
  "used-car-loan-emi-guide",
  "used-car-insurance-guide",
  "buying-used-bike-in-india",
  "buy-used-cars-in-coimbatore",
  "best-used-hatchbacks-india",
  "best-used-compact-suvs-india",
  "best-used-bikes-india",
  "used-cars-in-tamil-nadu", "used-cars-in-chennai", "used-cars-in-erode", "used-cars-in-salem", "used-cars-in-madurai", "used-cars-in-trichy", "used-bikes-in-coimbatore",
];

const iso = (v?: string | null) => (v ? new Date(v).toISOString().split("T")[0] : undefined);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const entries: Entry[] = [
    ...STATIC,
    ...BLOG_SLUGS.map((slug) => ({ path: `/blog/${slug}`, changefreq: "monthly", priority: "0.6" })),
  ];
  try {
    const client = sb();

    const { data: vehicles } = await client
      .from("vehicles")
      .select("id, slug, updated_at, vehicle_type, brand, model, user_id")
      .eq("status", "in_stock")
      .in("marketplace_status", ["approved", "featured"])
      .limit(20000);

    (vehicles || []).forEach((v: any) =>
      entries.push({
        path: `/marketplace/vehicle/${v.slug || v.id}`,
        lastmod: iso(v.updated_at),
        changefreq: "weekly",
        priority: "0.7",
      }),
    );

    const { data: dealers } = await client
      .from("settings")
      .select("user_id, dealer_slug, dealer_address, updated_at, marketplace_enabled, marketplace_status, public_page_enabled, public_page_id")
      .limit(5000);

    const cityByDealer = new Map<string, string>();
    (dealers || []).forEach((d: any) => {
      if (d.marketplace_enabled && DEALER_LIVE_STATUSES.includes(d.marketplace_status)) {
        entries.push({
          path: `/marketplace/dealer/${d.dealer_slug || d.user_id}`,
          lastmod: iso(d.updated_at),
          changefreq: "weekly",
          priority: "0.7",
        });
        const city = extractDistrict(d.dealer_address);
        if (city) cityByDealer.set(d.user_id, city);
      }
      if (d.public_page_enabled && d.public_page_id) {
        entries.push({ path: `/d/${d.public_page_id}`, lastmod: iso(d.updated_at), changefreq: "weekly", priority: "0.6" });
      }
    });

    // City landing pages: only where real stock exists for that segment, so we
    // never submit empty doorway pages to search engines.
    const citySegments = new Set<string>();
    (vehicles || []).forEach((v: any) => {
      const city = cityByDealer.get(v.user_id);
      if (!city) return;
      const segment = BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars";
      citySegments.add(`used-${segment}-in-${slugify(city)}`);
    });
    [...citySegments].sort().forEach((slug) =>
      entries.push({ path: `/marketplace/vehicles/${slug}`, changefreq: "daily", priority: "0.8" }),
    );

    const brands = new Set<string>();
    const brandModels = new Set<string>();
    (vehicles || []).forEach((v: any) => {
      if (!v.brand) return;
      brands.add(slugify(v.brand));
      if (v.model) brandModels.add(`${slugify(v.brand)}/${slugify(v.model)}`);
    });
    [...brands].sort().forEach((b) => entries.push({ path: `/marketplace/brand/${b}`, changefreq: "daily", priority: "0.7" }));
    [...brandModels].sort().forEach((bm) => entries.push({ path: `/marketplace/brand/${bm}`, changefreq: "daily", priority: "0.7" }));

    // Brand-in-city landing pages: /marketplace/vehicles/used-<brand>-<segment>-in-<city>
    const brandCity = new Set<string>();
    const modelCity = new Set<string>();
    (vehicles || []).forEach((v: any) => {
      const city = cityByDealer.get(v.user_id);
      if (!city || !v.brand) return;
      const segment = BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars";
      brandCity.add(`used-${slugify(v.brand)}-${segment}-in-${slugify(city)}`);
      if (v.model) modelCity.add(`used-${slugify(`${v.brand} ${v.model}`)}-in-${slugify(city)}`);
    });
    [...brandCity].sort().forEach((slug) =>
      entries.push({ path: `/marketplace/vehicles/${slug}`, changefreq: "daily", priority: "0.7" }),
    );
    // Model-in-city landing pages: /marketplace/vehicles/used-<brand>-<model>-in-<city>
    [...modelCity].sort().forEach((slug) =>
      entries.push({ path: `/marketplace/vehicles/${slug}`, changefreq: "daily", priority: "0.75" }),
    );

    // Model hub pages — every active row in model_docs, no redeploy needed.
    const { data: modelDocs, error: modelDocsError } = await client
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
        lastmod: iso(m.updated_at),
        changefreq: "weekly",
        priority: "0.8",
      });
    });

    // Curated model hubs that live in the app code (not in model_docs).
    CURATED_MODEL_PATHS.forEach((p) =>
      entries.push({ path: p, changefreq: "weekly", priority: "0.8" }),
    );


    const { data: products } = await client
      .from("accessory_products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .limit(5000);
    (products || []).forEach((p: any) => {
      if (p.slug) entries.push({ path: `/accessories/${p.slug}`, lastmod: iso(p.updated_at), changefreq: "weekly", priority: "0.6" });
    });
  } catch (err) {
    console.error("sitemap-xml dynamic fetch failed", err);
    return new Response(`sitemap error: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...uniqueEntries.map((e) =>
      [
        "  <url>",
        `    <loc>${esc(SITE + e.path)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    `</urlset>`,
  ].join("\n");

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=300" },
  });
});
