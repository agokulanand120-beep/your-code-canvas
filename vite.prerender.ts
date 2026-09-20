import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

/**
 * Bakes per-route <head> metadata into its own dist/<route>/index.html at build
 * time, so crawlers and link previews get correct titles/descriptions/OG tags
 * even without JavaScript (and even if the edge worker is unavailable).
 *
 * The metadata mirrors ROUTE_META in src/components/Seo.tsx.
 */

const SITE_URL = "https://upcurvhub.upcurv.in";
const SITE_NAME = "UpcurvHub";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface RouteMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

export const PRERENDER_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: "UpcurvHub — Buy & Sell Verified Used Cars & Bikes in India",
    description:
      "Browse verified used cars and bikes from trusted dealers across India. Real prices, inspection reports, easy EMI and hassle-free RC transfer.",
  },
  "/marketplace/vehicles": {
    title: "Used Cars & Bikes for Sale in India | UpcurvHub",
    description:
      "Search thousands of verified second-hand cars and bikes by brand, budget, fuel type and city. Compare prices and book a test drive on UpcurvHub.",
  },
  "/marketplace/dealers": {
    title: "Verified Used Car & Bike Dealers Near You | UpcurvHub",
    description:
      "Find trusted pre-owned vehicle dealers across India. See live stock, ratings and contact details for every verified UpcurvHub dealer.",
  },
  "/marketplace/brands": {
    title: "Browse Used Cars & Bikes by Brand | UpcurvHub",
    description:
      "Explore used Maruti Suzuki, Hyundai, Tata, Honda, Royal Enfield, Bajaj, Yamaha and more. Pick a brand and see verified stock near you.",
  },
  "/marketplace/compare": {
    title: "Compare Used Cars & Bikes Side by Side | UpcurvHub",
    description:
      "Compare price, year, kilometres, fuel type and features of used vehicles side by side before you buy.",
  },
  "/sell-vehicle": {
    title: "Sell Your Used Car or Bike Online | UpcurvHub",
    description:
      "Get a free valuation and sell your used car or bike to verified UpcurvHub dealers. Fast quotes, doorstep inspection and instant payment.",
  },
  "/car-loan": {
    title: "Used Car Loan & EMI Options in India | UpcurvHub",
    description:
      "Compare used car loan offers, interest rates and tenures from partner lenders. Calculate your EMI before you buy on UpcurvHub.",
  },
  "/insurance": {
    title: "Used Car & Bike Insurance Plans | UpcurvHub",
    description:
      "Compare motor insurance plans for pre-owned cars and bikes — premiums, IDV cover, cashless garages and claim settlement ratios.",
  },
  "/car-services": {
    title: "Car & Bike Service Packages Near You | UpcurvHub",
    description:
      "Book periodic servicing, detailing and repairs for your car or bike with vetted service partners on UpcurvHub.",
  },
  "/accessories": {
    title: "Car & Bike Accessories Online | UpcurvHub",
    description:
      "Shop genuine car and bike accessories — infotainment, seat covers, helmets, care products and more, delivered across India.",
  },
  "/about": {
    title: "About UpcurvHub — India's Trusted Vehicle Marketplace",
    description:
      "UpcurvHub connects buyers with verified used car and bike dealers across India, backed by inspections and transparent pricing.",
  },
  "/how-it-works": {
    title: "How UpcurvHub Works — Buying & Selling Explained",
    description:
      "See how buying and selling a used car or bike works on UpcurvHub, from search and inspection to paperwork and delivery.",
  },
  "/contact": {
    title: "Contact UpcurvHub — Support for Buyers & Dealers",
    description:
      "Reach the UpcurvHub team for buyer support, dealer onboarding or partnership enquiries. Based in Coimbatore, serving all of India.",
  },
  "/faq": {
    title: "Frequently Asked Questions | UpcurvHub",
    description:
      "Answers on vehicle verification, EMI, RC transfer, dealer listings, returns and payments on the UpcurvHub marketplace.",
  },
  "/blog": {
    title: "Used Car & Bike Buying Guides | UpcurvHub Blog",
    description:
      "Practical guides on buying and selling pre-owned vehicles in India — pricing, paperwork, inspections and ownership costs.",
  },
  "/models": {
    title: "Car & Bike Models — Prices, Specs & Used Listings | UpcurvHub",
    description:
      "Explore model pages for cars and bikes in India. Check ex-showroom prices, specifications, mileage, variants and live used listings.",
  },
  "/models/cars": {
    title: "Car Models — Prices, Specs & Used Listings in India | UpcurvHub",
    description:
      "Browse car model pages with ex-showroom prices, key specs, variants, mileage and verified used car listings across India.",
  },
  "/models/bikes": {
    title: "Bike Models — Prices, Specs & Used Listings in India | UpcurvHub",
    description:
      "Browse bike and scooter model pages with ex-showroom prices, specs, variants, mileage and verified used two-wheeler listings.",
  },
  "/pricing": {
    title: "UpcurvHub Dealer Plans & Pricing",
    description:
      "See UpcurvHub marketplace plans for dealers — list vehicles, get leads, manage enquiries and grow your used-vehicle business.",
  },
  "/terms": {
    title: "Terms of Service | UpcurvHub",
    description: "The terms that govern use of the UpcurvHub marketplace.",
  },
  "/privacy": {
    title: "Privacy Policy | UpcurvHub",
    description: "How UpcurvHub collects, uses and protects your personal data.",
  },
};

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function headFor(route: string, meta: RouteMeta) {
  const url = `${SITE_URL}${route === "/" ? "/" : route}`;
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    meta.noindex
      ? `<meta name="robots" content="noindex, follow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${DEFAULT_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE}" />`,
  ].join("\n    ");
}

/** Strips the template's own title/description/canonical/OG/twitter tags. */
function stripHead(html: string) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "");
}

export function prerenderStaticRoutes(): Plugin {
  return {
    name: "prerender-static-routes",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const template = fs.readFileSync(indexPath, "utf8");

      for (const [route, meta] of Object.entries(PRERENDER_ROUTES)) {
        const html = stripHead(template).replace("</head>", `  ${headFor(route, meta)}\n  </head>`);

        const target =
          route === "/" ? indexPath : path.join(dist, route.replace(/^\//, ""), "index.html");

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html, "utf8");
      }
    },
  };
}

export default prerenderStaticRoutes;
