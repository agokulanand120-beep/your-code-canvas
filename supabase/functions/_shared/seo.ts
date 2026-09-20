// Shared helpers for the SEO edge functions (crawler-render, sitemap-xml,
// on-listing-publish). Everything here runs in Deno on Supabase Edge.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const SITE = Deno.env.get("SITE_URL") || "https://upcurvhub.upcurv.in";

export const sb = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const slugify = (input: string) =>
  (input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const isUuid = (v?: string | null) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const inr = (n?: number | null) =>
  n == null ? "" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const PRIORITY_CITIES = [
  "Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur", "Erode",
  "Tiruchirappalli", "Tirunelveli", "Vellore", "Thanjavur", "Dindigul", "Karur",
  "Namakkal", "Krishnagiri", "Kanchipuram", "Chengalpattu", "Cuddalore",
  "Viluppuram", "Tiruvannamalai", "Kanyakumari", "Thoothukudi", "Nilgiris",
  "Virudhunagar", "Theni", "Tenkasi", "Hosur", "Ooty", "Tiruvallur", "Bangalore", "Hyderabad", "Kochi", "Mumbai", "Pune",
  "Delhi", "Ahmedabad", "Jaipur", "Lucknow", "Kolkata",
];

/** Mirrors src/lib/location.ts extractDistrict for the dealer address field. */
export const extractDistrict = (address?: string | null): string | null => {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return (
    PRIORITY_CITIES.find((c) => parts.some((p) => p.toLowerCase().includes(c.toLowerCase()))) || null
  );
};

export const DEALER_LIVE_STATUSES = ["approved", "featured", "active", "live"];

export const BIKE_TYPES = ["bike", "motorcycle", "scooter", "scooty", "moped", "ev_bike"];

export const jsonLd = (blocks: Record<string, unknown>[]) =>
  blocks
    .map(
      (b) =>
        `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");

export interface PageParts {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  schema?: Record<string, unknown>[];
  body: string;
}

/** Full crawler-facing HTML document — real content, not just meta tags. */
export function htmlDocument(p: PageParts) {
  const url = `${SITE}${p.path}`;
  const image = p.image || `${SITE}/og-image.png`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="UpcurvHub" />
<meta property="og:locale" content="en_IN" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:secure_url" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.title)}" />
<meta name="twitter:description" content="${esc(p.description)}" />
<meta name="twitter:image" content="${esc(image)}" />
${jsonLd(p.schema || [])}
</head>
<body>
${p.body}
<footer>
<nav aria-label="Site">
<a href="${SITE}/">UpcurvHub</a> ·
<a href="${SITE}/marketplace/vehicles">Used vehicles</a> ·
<a href="${SITE}/marketplace/dealers">Dealers</a> ·
<a href="${SITE}/sell-vehicle">Sell your vehicle</a> ·
<a href="${SITE}/car-loan">Car loan</a> ·
<a href="${SITE}/blog">Guides</a>
</nav>
</footer>
</body>
</html>`;
}
