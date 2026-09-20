import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";


const SITE_URL = "https://upcurvhub.upcurv.in";
const SITE_NAME = "UpcurvHub";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoProps {
  title: string;
  description: string;
  /** Absolute path for this page, e.g. "/marketplace/vehicles". Defaults to the current route. */
  path?: string;
  image?: string;
  noindex?: boolean;
  /** Extra JSON-LD blocks rendered for this page. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Per-route <head> tags. Overrides the sitewide defaults in index.html. */
/** One canonical shape per page: no trailing slash (except the homepage), no query string. */
export const canonicalPath = (raw: string) => {
  const clean = (raw || "/").split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
};

export const Seo = ({ title, description, path, image, noindex, jsonLd }: SeoProps) => {
  const location = useLocation();
  const url = `${SITE_URL}${canonicalPath(path ?? location.pathname)}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Social crawlers (WhatsApp, Facebook, X) require an absolute image URL.
  const rawImage = image || DEFAULT_IMAGE;
  const imageUrl = rawImage.startsWith("http") ? rawImage : `${SITE_URL}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;

  // index.html ships sitewide description/og tags as a no-JS fallback. Helmet
  // only dedupes its own tags, so drop the static ones once a route sets its
  // own — otherwise every page renders two descriptions.
  useEffect(() => {
    const selectors = [
      'link[rel="canonical"]',
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
    ];
    selectors.forEach((sel) => {
      document.head.querySelectorAll(`${sel}:not([data-rh])`).forEach((el) => el.remove());
    });
  }, [title, description, url, imageUrl]);



  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  );
};

interface RouteMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

/**
 * Static-route metadata map. Keeps every public page on its own title,
 * description and self-referencing canonical instead of the sitewide default.
 */
const ROUTE_META: Record<string, RouteMeta> = {
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
  "/terms": { title: "Terms of Service | UpcurvHub", description: "The terms that govern use of the UpcurvHub marketplace." },
  "/privacy": { title: "Privacy Policy | UpcurvHub", description: "How UpcurvHub collects, uses and protects your personal data." },
  "/auth": { title: "Dealer Login | UpcurvHub", description: "Sign in to your UpcurvHub dealer dashboard.", noindex: true },
  "/marketplace/wishlist": { title: "Your Saved Vehicles | UpcurvHub", description: "Vehicles you saved on UpcurvHub.", noindex: true },
};

const NOINDEX_PREFIXES = ["/admin", "/dashboard", "/settings", "/accessories/cart", "/accessories/checkout", "/accessories/order-success"];

/**
 * Mounted once inside the router. Emits metadata for known static routes and
 * a noindex directive for private areas. Pages that render their own <Seo>
 * (e.g. vehicle detail) override these values.
 */
export const RouteSeo = () => {
  const pathname = canonicalPath(useLocation().pathname);
  const meta = ROUTE_META[pathname];

  if (meta) return <Seo title={meta.title} description={meta.description} noindex={meta.noindex} />;

  if (NOINDEX_PREFIXES.some((p) => pathname.startsWith(p))) {
    return (
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  // Unknown/dynamic route: still self-reference a canonical so nothing
  // collapses onto the homepage URL.
  return (
    <Helmet>
      <link rel="canonical" href={`${SITE_URL}${canonicalPath(pathname)}`} />
    </Helmet>
  );
};

export default Seo;
