import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  Fuel,
  Gauge,
  Settings2,
  Users,
  ShieldCheck,
  Star,
  IndianRupee,
  Images,
  ListChecks,
  Wrench,
  BadgeCheck,
  HelpCircle,
  Palette,
  History,
  ThumbsUp,
} from "lucide-react";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import { slugify } from "@/lib/seoSlug";
import { formatCurrency } from "@/lib/formatters";
import { getModel, modelPath, modelsByBrand, GENERIC_BUYING_CHECKS } from "@/data/models";
import { modelDocFromRow } from "@/data/models/fromDb";
import { getBrandLogo } from "@/lib/brandLogos";
import { cityModelPath, cityPath, type CitySegment } from "@/lib/cityPages";
import { extractDistrict } from "@/lib/location";

const SITE = "https://upcurvhub.upcurv.in";

/**
 * Turns a written price such as "₹6.49 – ₹9.10 Lakh" or "Rs. 1.52 Crore"
 * into rupees, so the EMI calculator works for premium models too.
 */
export const parseIndianPrice = (text?: string | null): number => {
  if (!text) return 0;
  const first = text.match(/[\d.,]+/)?.[0]?.replace(/,/g, "");
  const value = Number(first);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (/crore|cr\b/i.test(text)) return Math.round(value * 10000000);
  if (/lakh|lac|\bl\b/i.test(text)) return Math.round(value * 100000);
  return Math.round(value);
};


const NAV = [
  { id: "overview", label: "Overview" },
  { id: "price", label: "Price" },
  { id: "specifications", label: "Specs" },
  { id: "features", label: "Features" },
  { id: "safety", label: "Safety" },
  { id: "variants", label: "Variants" },
  { id: "colours", label: "Colours" },
  { id: "generations", label: "Generations" },
  { id: "pros-cons", label: "Pros & Cons" },
  { id: "buying-guide", label: "Buying Guide" },
  { id: "faqs", label: "FAQs" },
];

const Section = ({
  id,
  title,
  icon: Icon,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ElementType;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-28 rounded-2xl border border-border bg-card p-4 md:p-6">
    <div className="flex items-start gap-3 mb-4">
      {Icon ? (
        <span className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4.5 w-4.5" />
        </span>
      ) : null}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const Table = ({ rows }: { rows: [string, string][] }) => (
  <div className="overflow-hidden rounded-xl border border-border">
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={k} className={i % 2 ? "bg-muted/40" : ""}>
            <th scope="row" className="text-left font-medium text-muted-foreground p-3 w-1/2 align-top">{k}</th>
            <td className="p-3 text-foreground">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Dedicated model information hub: /cars/:brandSlug/:modelSlug */
const ModelHub = ({ category }: { category: "cars" | "bikes" | "commercial" }) => {
  const { brandSlug = "", modelSlug = "" } = useParams();
  const staticDoc = getModel(category, brandSlug, modelSlug);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useComparison();
  const [active, setActive] = useState("overview");
  const [shot, setShot] = useState(0);
  const [emiOpen, setEmiOpen] = useState(false);

  // Model pages can also be seeded directly as rows in the `model_docs` table.
  const { data: dbDoc, isLoading: docLoading } = useQuery({
    queryKey: ["model-doc", category, brandSlug, modelSlug],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("model_docs")
        .select("*")
        .eq("category", category)
        .eq("brand_slug", brandSlug)
        .eq("model_slug", modelSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data ? modelDocFromRow(data) : null;
    },
  });

  const doc = dbDoc || staticDoc || undefined;

  const { data } = useQuery({
    queryKey: ["model-hub-inventory", brandSlug, modelSlug],
    enabled: !!doc,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: dealers } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_slug, dealer_address, shop_logo_url, google_reviews_rating, google_reviews_count, public_page_id, marketplace_featured, marketplace_badge, dealer_phone")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);
      if (!dealers?.length) return { vehicles: [], dealers: [] };
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, slug, brand, model, variant, selling_price, strikeout_price, manufacturing_year, fuel_type, transmission, vehicle_type, odometer_reading, color, user_id, created_at, image_badge_text, image_badge_color, number_of_owners, mileage, condition, vehicle_images(image_url, is_primary)")
        .in("user_id", dealers.map((d) => d.user_id))
        .eq("status", "in_stock")
        .in("marketplace_status", ["approved", "featured"]);
      const mine = (vehicles || []).filter(
        (v: any) => slugify(v.brand) === brandSlug && slugify(v.model) === modelSlug,
      );
      return {
        dealers,
        vehicles: mine.map((v: any) => ({
          ...v,
          image_url:
            (v.vehicle_images || []).find((i: any) => i.is_primary)?.image_url ||
            (v.vehicle_images || [])[0]?.image_url,
        })),
      };
    },
  });

  // Other models of the same brand, for the "More <brand> models" strip.
  const { data: brandDocs } = useQuery({
    queryKey: ["model-doc-siblings", brandSlug],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("model_docs")
        .select("category, brand, brand_slug, model, model_slug, images, new_price, body_type")
        .eq("brand_slug", brandSlug)
        .eq("is_active", true)
        .limit(24);
      if (error) throw error;
      return data || [];
    },
  });


  const stats = useMemo(() => {
    const list = data?.vehicles || [];
    const prices = list.map((v: any) => Number(v.selling_price)).filter((n) => n > 0);
    const years = Array.from(new Set(list.map((v: any) => v.manufacturing_year).filter(Boolean))).sort();
    const byYear: Record<string, number[]> = {};
    list.forEach((v: any) => {
      if (!v.manufacturing_year || !v.selling_price) return;
      (byYear[v.manufacturing_year] ||= []).push(Number(v.selling_price));
    });
    const dealerMap = new Map<string, { name: string; slug?: string | null; city?: string | null; count: number }>();
    list.forEach((v: any) => {
      const d = (data?.dealers || []).find((x: any) => x.user_id === v.user_id);
      if (!d) return;
      const cur = dealerMap.get(d.user_id) || { name: d.dealer_name, slug: d.dealer_slug, city: d.dealer_address, count: 0 };
      cur.count += 1;
      dealerMap.set(d.user_id, cur);
    });
    return {
      count: list.length,
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      years,
      byYear,
      dealers: Array.from(dealerMap.values()),
      list,
      image: list.find((v: any) => v.image_url)?.image_url as string | undefined,
    };
  }, [data]);

  // Contextual internal links: "Used <model> in <city>" for cities that really
  // have this model in stock, plus the plain city page for that segment.
  const cityLinks = useMemo(() => {
    if (!doc) return [] as { label: string; to: string; count: number }[];
    const segment: CitySegment = doc.category === "bikes" ? "bikes" : "cars";
    const counts = new Map<string, number>();
    (stats.list || []).forEach((v: any) => {
      const dealer = (data?.dealers || []).find((d: any) => d.user_id === v.user_id);
      const city = extractDistrict(dealer?.dealer_address);
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .flatMap(([city, count]) => [
        { label: `Used ${doc.brand} ${doc.model} in ${city}`, to: cityModelPath(city, doc.brand, doc.model), count },
        { label: `Used ${doc.category === "bikes" ? "bikes" : "cars"} in ${city}`, to: cityPath(segment, city), count },
      ]);
  }, [doc, stats.list, data?.dealers]);

  // Highlight the section currently in view in the sticky sub-navigation.
  useEffect(() => {
    if (!doc) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis?.target.id) setActive(vis.target.id);
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [doc]);

  if (!doc && docLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceTopBar showBack />
        <div className="container mx-auto px-4 py-10 max-w-6xl space-y-4">
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }
  if (!doc) return <Navigate to="/marketplace/vehicles" replace />;

  const path = modelPath(doc);
  const name = `${doc.brand} ${doc.model}`;
  const kind = category === "bikes" ? "bike" : category === "commercial" ? "commercial vehicle" : "car";
  const gallery = [...(doc.images || []), ...(stats.image ? [stats.image] : [])].filter(Boolean);
  /** Descriptive, image-specific alt text (helps Google Images rank these photos). */
  const imageAlt = (i: number) => {
    const views = ["front view", "side profile", "rear view", "interior and dashboard", "boot space", "wheels and details"];
    const view = views[i % views.length];
    return `${doc.brand} ${doc.model} ${doc.bodyType || (category === "bikes" ? "bike" : "car")} ${view} — used ${doc.model} for sale in India`;
  };

  const heroImage = gallery[Math.min(shot, Math.max(gallery.length - 1, 0))];
  const brandLogo = getBrandLogo(doc.brand);
  const newPriceForEmi = parseIndianPrice(doc.newPrice) || stats.min || 500000;

  const variantCount = doc.variants.length;
  const priceLead = doc.newPrice
    ? `${name} price starts from ${doc.newPrice}.`
    : stats.min
      ? `Used ${name} prices start from ${formatCurrency(stats.min)} on UpcurvHub.`
      : `${name} price, specifications and used listings on UpcurvHub.`;
  const title = `${name} Price, Specs, Mileage${variantCount ? ", Variants" : ""} & Used ${category === "bikes" ? "Bikes" : "Cars"} | UpcurvHub`;
  const description = [
    priceLead,
    doc.bodyType ? `A ${doc.quickSpecs.seating ? `${doc.quickSpecs.seating} seater ` : ""}${doc.bodyType}` : "",
    doc.quickSpecs.engine ? `with a ${doc.quickSpecs.engine} engine` : "",
    variantCount ? `available in ${variantCount} variant${variantCount > 1 ? "s" : ""}` : "",
    /\d/.test(doc.quickSpecs.mileage || "") ? `and a claimed mileage of ${doc.quickSpecs.mileage}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+\./g, ".")
    .concat(
      `. See ${doc.model} specs, features, colours, pros and cons${stats.count ? ` and ${stats.count} used ${name} for sale` : ""}.`,
    )
    .slice(0, 300);


  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: category === "bikes" ? "Bikes" : "Cars", item: `${SITE}/marketplace/vehicles` },
        { "@type": "ListItem", position: 3, name: doc.brand, item: `${SITE}/marketplace/brand/${slugify(doc.brand)}` },
        { "@type": "ListItem", position: 4, name: doc.model, item: `${SITE}${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": category === "bikes" ? "Motorcycle" : "Car",
      name,
      url: `${SITE}${path}`,
      ...(gallery.length ? { image: gallery.slice(0, 6) } : {}),
      description: doc.overview[0] || description,
      brand: { "@type": "Brand", name: doc.brand },
      model: doc.model,
      bodyType: doc.bodyType,
      fuelType: doc.quickSpecs.fuel,
      vehicleTransmission: doc.quickSpecs.transmission,
      seatingCapacity: doc.quickSpecs.seating,
      ...(doc.quickSpecs.mileage ? { fuelEfficiency: doc.quickSpecs.mileage } : {}),
      ...(stats.count && stats.min
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: stats.min,
              highPrice: stats.max,
              offerCount: stats.count,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    },
  ];
  if (gallery.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: `${name} photos`,
      url: `${SITE}${path}#photos`,
      image: gallery.slice(0, 8).map((g, i) => ({
        "@type": "ImageObject",
        contentUrl: g,
        url: g,
        name: `${name} ${doc.bodyType || ""}`.trim(),
        caption: imageAlt(i),
        description: imageAlt(i),
      })),
    });
  }

  if (doc.faqs.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: doc.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  if (stats.count) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: stats.list.slice(0, 20).map((v: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${v.manufacturing_year || ""} ${v.brand} ${v.model} ${v.variant || ""}`.trim(),
        url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
      })),
    });
  }

  // Other models from the same brand — merged from the curated files and the
  // model_docs table, with a photo and price for the card strip.
  const siblings = (() => {
    const out = new Map<string, { path: string; model: string; image?: string; price?: string; bodyType?: string }>();
    modelsByBrand(doc.brand)
      .filter((m) => slugify(m.model) !== modelSlug)
      .forEach((m) =>
        out.set(slugify(m.model), {
          path: modelPath(m),
          model: m.model,
          image: m.images?.[0],
          price: m.newPrice,
          bodyType: m.bodyType,
        }),
      );
    (brandDocs || []).forEach((r: any) => {
      const key = r.model_slug || slugify(r.model);
      if (key === modelSlug || out.has(key)) return;
      out.set(key, {
        path: `/${r.category}/${r.brand_slug || slugify(r.brand)}/${key}`,
        model: r.model,
        image: (r.images || [])[0],
        price: r.new_price || undefined,
        bodyType: r.body_type || undefined,
      });
    });
    return Array.from(out.values()).slice(0, 10);
  })();


  const quick: { icon: React.ElementType; label: string; value?: string }[] = [
    { icon: Gauge, label: "Mileage", value: doc.quickSpecs.mileage },
    { icon: Settings2, label: "Engine", value: doc.quickSpecs.engine },
    { icon: Fuel, label: "Fuel", value: doc.quickSpecs.fuel },
    { icon: Settings2, label: "Transmission", value: doc.quickSpecs.transmission },
    { icon: Users, label: "Seating", value: doc.quickSpecs.seating },
  ];

  const tiles = [
    { id: "price", title: "Price & Variants", copy: "Used price range and all variants", icon: IndianRupee },
    { id: "specifications", title: "Specifications", copy: "Engine, dimensions, performance", icon: ListChecks },
    { id: "features", title: "Features", copy: "Comfort, infotainment, exterior", icon: Star },
    { id: "safety", title: "Safety", copy: "Safety kit and crash-test rating", icon: ShieldCheck },
    { id: "ownership", title: "Ownership", copy: "Maintenance and running costs", icon: Wrench },
    { id: "buying-guide", title: "Buying Guide", copy: "What to check before you buy", icon: BadgeCheck },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Seo title={title} description={description} path={path} image={gallery[0]} jsonLd={jsonLd} />
      <MarketplaceTopBar showBack />

      <div className="container mx-auto px-3 md:px-4 max-w-6xl pt-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/marketplace/vehicles" className="hover:text-foreground">{category === "bikes" ? "Bikes" : "Cars"}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/marketplace/brand/${slugify(doc.brand)}`} className="hover:text-foreground">{doc.brand}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{doc.model}</span>
        </nav>

        {/* ───── HERO ───── */}
        <header className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-5 md:p-8 order-2 md:order-1">
              <div className="flex items-center gap-2 mb-3">
                {brandLogo ? (
                  <img src={brandLogo} alt={`${doc.brand} logo`} className="h-8 w-8 object-contain" loading="lazy" />
                ) : null}
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{doc.brand}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">{name}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {doc.segment || `${doc.bodyType} ${kind}`} — price, specifications, mileage and used {doc.model} for sale in India.
              </p>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                {quick.filter((q) => q.value).slice(0, 4).map((q) => (
                  <div key={q.label} className="rounded-2xl bg-muted/70 p-3">
                    <q.icon className="h-4 w-4 text-primary mb-1.5" />
                    <dd className="font-semibold text-foreground text-xs leading-tight">{q.value}</dd>
                    <dt className="text-[11px] text-muted-foreground mt-0.5">{q.label}</dt>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-2 mt-5">
                <a href="#used" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  View used {doc.model}
                </a>
                <Link to="/marketplace/compare" className="px-5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold">
                  Compare
                </Link>
              </div>
            </div>

            <div className="order-1 md:order-2 relative bg-muted">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={imageAlt(shot)}
                  title={imageAlt(shot)}
                  width={1200}
                  height={750}
                  className="w-full h-full max-h-[340px] object-cover"
                  loading="eager"
                  {...({ fetchpriority: "high" } as Record<string, string>)}
                  decoding="async"
                />
              ) : (

                <div className="w-full aspect-[16/10] flex items-center justify-center text-muted-foreground text-sm">
                  {name}
                </div>
              )}
              {doc.safetyRating ? (
                <span className="absolute top-3 right-3 rounded-full bg-background/95 border border-border px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {doc.safetyRating}
                </span>
              ) : null}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 border-t border-border">
              {gallery.slice(0, 12).map((g, i) => (
                <button
                  key={g + i}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-label={`Show ${imageAlt(i)}`}
                  className={`h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 ${i === shot ? "border-primary" : "border-transparent"}`}
                >
                  <img
                    src={g}
                    alt={imageAlt(i)}
                    title={imageAlt(i)}
                    width={96}
                    height={64}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

        </header>
      </div>

      {/* ───── STICKY SECTION NAV ───── */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-y border-border mt-4">
        <div className="container mx-auto px-3 md:px-4 max-w-6xl">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  active === n.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 md:px-4 max-w-6xl py-5">
        <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <Section id="overview" title={`${name} overview`} icon={Images}>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {doc.overview.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                {tiles.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="rounded-2xl border border-border p-3 hover:border-primary transition-colors">
                    <t.icon className="h-4 w-4 text-primary mb-2" />
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.copy}</p>
                  </a>
                ))}
              </div>
            </Section>

            <Section id="price" title={`${name} price in India`} icon={IndianRupee} subtitle="Ex-showroom guidance and live used listing prices">
              {doc.newPrice && (
                <div className="mb-5 border-l-4 border-primary pl-4 py-1">
                  <p className="text-xs font-medium text-muted-foreground">Ex-showroom price</p>
                  <p className="mt-1 text-2xl md:text-3xl font-bold text-primary">{doc.newPrice}</p>
                  <Button className="mt-3 gap-2" variant="outline" onClick={() => setEmiOpen(true)}>
                    <IndianRupee className="h-4 w-4" /> Calculate EMI
                  </Button>
                </div>
              )}

              {/* Mobile/tablet: swipeable strip of other models from the same brand. */}
              {siblings.length > 0 && (
                <div className="lg:hidden -mx-4 md:-mx-6 mb-5">
                  <h3 className="px-4 md:px-6 text-sm font-semibold text-foreground mb-2">
                    More {doc.brand} models
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 md:px-6 pb-1 snap-x">
                    {siblings.map((s) => (
                      <Link
                        key={s.path}
                        to={s.path}
                        className="w-[132px] shrink-0 snap-start rounded-xl border border-border bg-card overflow-hidden"
                      >
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={`${doc.brand} ${s.model} ${s.bodyType || ""} price and specifications`.trim()}
                            width={132}
                            height={88}
                            loading="lazy"
                            className="h-[88px] w-full object-cover bg-muted"
                          />
                        ) : (
                          <span className="block h-[88px] w-full bg-muted" />
                        )}
                        <span className="block p-2">
                          <span className="block text-xs font-semibold text-foreground truncate">{s.model}</span>
                          <span className="block text-[11px] text-primary font-medium truncate">
                            {s.price || "View details"}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Table
                rows={[
                  ["Used price range", stats.min ? `${formatCurrency(stats.min)} – ${formatCurrency(stats.max)}` : "No live listings right now"],
                  ["Vehicles available", String(stats.count)],
                  ["Lowest listed price", stats.min ? formatCurrency(stats.min) : "—"],
                  ["Average listed price", stats.avg ? formatCurrency(stats.avg) : "—"],
                  ["Model years available", stats.years.length ? `${stats.years[0]} – ${stats.years[stats.years.length - 1]}` : "—"],
                ]}
              />
              <p className="text-xs text-muted-foreground mt-3">
                Used {name} prices vary with model year, variant, kilometres driven, ownership, condition and city.
              </p>
              {Object.keys(stats.byYear).length > 1 && (
                <div className="mt-5">
                  <h3 className="font-semibold mb-2 text-sm">Used {doc.model} price by model year</h3>
                  <Table
                    rows={Object.entries(stats.byYear)
                      .sort()
                      .map(([y, ps]) => [y, `${formatCurrency(Math.min(...ps))} – ${formatCurrency(Math.max(...ps))}`]) as [string, string][]}
                  />
                </div>
              )}
            </Section>

            <Section id="used" title={`Used ${name} for sale`} icon={BadgeCheck}>
              {stats.count ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {stats.list.slice(0, 9).map((v: any) => (
                    <MarketplaceVehicleCard
                      key={v.id}
                      vehicle={v}
                      dealer={(data?.dealers || []).find((d: any) => d.user_id === v.user_id)}
                      isInWishlist={isInWishlist(v.id)}
                      onWishlistToggle={() => toggleWishlist(v.id)}
                      isInCompare={isInCompare(v.id)}
                      onCompareToggle={() => toggleCompare(v.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No used {name} listings on UpcurvHub right now.
                  </p>
                  <Link to="/marketplace/vehicles" className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                    Browse all used vehicles
                  </Link>
                </div>
              )}

              {cityLinks.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold mb-2 text-sm">Used {name} by city</h3>
                  <div className="flex flex-wrap gap-2">
                    {cityLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {doc.specs.length > 0 && (
              <Section id="specifications" title={`${name} specifications`} icon={ListChecks}>
                <div className="space-y-5">
                  {doc.specs.map((g) => (
                    <div key={g.group}>
                      <h3 className="font-semibold mb-2 text-sm">{g.group}</h3>
                      <Table rows={g.rows} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {(doc.mileage.notes.length > 0 || doc.mileage.rows?.length) && (
              <Section id="mileage" title={`${name} mileage`} icon={Gauge}>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-3">
                  {doc.mileage.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
                {doc.mileage.rows?.length ? <Table rows={doc.mileage.rows} /> : null}
              </Section>
            )}

            {doc.features.length > 0 && (
              <Section id="features" title={`${name} features`} icon={Star}>
                <div className="grid md:grid-cols-2 gap-4">
                  {doc.features.map((f) => (
                    <div key={f.group} className="rounded-2xl bg-muted/50 p-4">
                      <h3 className="font-semibold text-sm mb-2">{f.group}</h3>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {f.items.map((i) => <li key={i}>{i}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {doc.safety.length > 0 && (
              <Section id="safety" title={`${name} safety`} icon={ShieldCheck}>
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {doc.safety.map((s) => (
                    <li key={s} className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />{s}</li>
                  ))}
                </ul>
                {doc.safetyRating && <p className="text-sm mt-3 text-foreground font-medium">{doc.safetyRating}</p>}
              </Section>
            )}

            {doc.variants.length > 0 && (
              <Section id="variants" title={`${name} variants`} icon={ListChecks}>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="bg-muted">
                      <tr>
                        {["Variant", "Engine", "Fuel", "Transmission", "Key features"].map((h) => (
                          <th key={h} className="text-left p-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {doc.variants.map((v) => (
                        <tr key={v.name} className="border-t border-border">
                          <td className="p-3 font-medium">{v.name}</td>
                          <td className="p-3 text-muted-foreground">{v.engine || "—"}</td>
                          <td className="p-3 text-muted-foreground">{v.fuel || "—"}</td>
                          <td className="p-3 text-muted-foreground">{v.transmission || "—"}</td>
                          <td className="p-3 text-muted-foreground">{v.highlights || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {doc.variantAdvice && (
                  <>
                    <h3 className="font-semibold text-sm mt-5 mb-2">Which {doc.model} variant should you buy?</h3>
                    <p className="text-sm text-muted-foreground">{doc.variantAdvice}</p>
                  </>
                )}
              </Section>
            )}

            {doc.colours.length > 0 && (
              <Section id="colours" title={`${name} colours`} icon={Palette}>
                <div className="flex flex-wrap gap-2">
                  {doc.colours.map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs">{c}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Available colours may vary by model year and variant.</p>
              </Section>
            )}

            {doc.generations.length > 0 && (
              <Section id="generations" title={`${name} generations and model history`} icon={History}>
                <div className="space-y-3">
                  {doc.generations.map((g) => (
                    <div key={g.name} className="rounded-2xl border-l-4 border-primary/60 bg-muted/40 p-4">
                      <h3 className="font-semibold text-sm">{g.name} <span className="text-muted-foreground font-normal">({g.years})</span></h3>
                      <p className="text-sm text-muted-foreground mt-1">{g.notes}</p>
                    </div>
                  ))}
                </div>
                {doc.yearChanges?.length ? (
                  <div className="mt-4">
                    <h3 className="font-semibold text-sm mb-2">Major changes by year</h3>
                    <Table rows={doc.yearChanges} />
                  </div>
                ) : null}
              </Section>
            )}

            {(doc.pros.length > 0 || doc.cons.length > 0) && (
              <Section id="pros-cons" title={`${name} pros and cons`} icon={ThumbsUp}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border p-4">
                    <h3 className="font-semibold text-sm mb-2 text-primary">Pros</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">{doc.pros.map((p) => <li key={p} className="flex gap-2"><span className="text-primary">+</span>{p}</li>)}</ul>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <h3 className="font-semibold text-sm mb-2 text-destructive">Cons</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">{doc.cons.map((c) => <li key={c} className="flex gap-2"><span className="text-destructive">−</span>{c}</li>)}</ul>
                  </div>
                </div>
              </Section>
            )}

            {doc.ownership.length > 0 && (
              <Section id="ownership" title={`${name} maintenance and ownership`} icon={Wrench}>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">{doc.ownership.map((o) => <li key={o}>{o}</li>)}</ul>
                {doc.maintenanceVerdict && (
                  <>
                    <h3 className="font-semibold text-sm mt-5 mb-2">Is the {doc.model} expensive to maintain?</h3>
                    <p className="text-sm text-muted-foreground">{doc.maintenanceVerdict}</p>
                  </>
                )}
              </Section>
            )}

            <Section id="buying-guide" title={`Buying a used ${name}: things to check`} icon={BadgeCheck}>
              <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                {[...doc.buyingChecks, ...GENERIC_BUYING_CHECKS].map((c) => (
                  <li key={c} className="flex gap-2"><span className="text-primary">✓</span>{c}</li>
                ))}
              </ul>
            </Section>

            {doc.goodFor.length > 0 && (
              <Section id="who-should-buy" title={`Is the ${name} a good ${kind}?`} icon={ThumbsUp}>
                <p className="text-sm text-muted-foreground mb-2">Good for:</p>
                <div className="flex flex-wrap gap-2">
                  {doc.goodFor.map((g) => <span key={g} className="px-3 py-1.5 rounded-full bg-muted text-xs">{g}</span>)}
                </div>
                {doc.considerAlternatives && (
                  <>
                    <h3 className="font-semibold text-sm mt-5 mb-2">Who should consider alternatives?</h3>
                    <p className="text-sm text-muted-foreground">{doc.considerAlternatives}</p>
                  </>
                )}
              </Section>
            )}

            {doc.alternatives.length > 0 && (
              <Section id="alternatives" title={`${name} alternatives`} icon={ListChecks}>
                <div className="flex flex-wrap gap-2">
                  {doc.alternatives.map((a) => (
                    <Link
                      key={`${a.brand}-${a.model}`}
                      to={modelPath({ category: doc.category, brand: a.brand, model: a.model })}
                      className="px-3 py-2 rounded-xl border border-border text-sm hover:border-primary"
                    >
                      {a.brand} {a.model}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {doc.faqs.length > 0 && (
              <Section id="faqs" title={`${name} FAQs`} icon={HelpCircle}>
                <div className="space-y-2">
                  {doc.faqs.map((f) => (
                    <details key={f.q} className="rounded-2xl border border-border p-4 group">
                      <summary className="font-medium text-sm cursor-pointer list-none flex justify-between gap-3">
                        {f.q}
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-90 transition-transform" />
                      </summary>
                      <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ───── SIDEBAR ───── */}
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border bg-card p-4">
              {doc.newPrice && (
                <div className="mb-4 border-b border-border pb-4">
                  <p className="text-xs text-muted-foreground">Ex-showroom price</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{doc.newPrice}</p>
                  <Button variant="outline" className="mt-3 w-full" onClick={() => setEmiOpen(true)}>Calculate EMI</Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Used {name} on UpcurvHub</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.min ? `${formatCurrency(stats.min)}+` : "No listings yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.count ? `${stats.count} verified listing${stats.count > 1 ? "s" : ""} available` : "Get notified when stock arrives"}
              </p>
              <a href="#used" className="mt-3 block text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                View used {doc.model}
              </a>
              <Link to="/sell-vehicle" className="mt-2 block text-center px-4 py-2.5 rounded-xl border border-border text-sm font-semibold">
                Sell your {doc.model}
              </Link>
            </div>

            {stats.dealers.length > 0 && (
              <div id="dealers" className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-sm mb-3">Dealers selling the {doc.model}</h2>
                <ul className="space-y-2 text-sm">
                  {stats.dealers.map((d) => (
                    <li key={d.name} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {d.slug ? <Link className="text-primary hover:underline" to={`/marketplace/dealer/${d.slug}`}>{d.name}</Link> : d.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {siblings.length > 0 && (
              <div className="hidden lg:block rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-sm mb-3">More {doc.brand} models</h2>
                <div className="space-y-2">
                  {siblings.slice(0, 6).map((s) => (
                    <Link
                      key={s.path}
                      to={s.path}
                      className="flex items-center gap-3 rounded-xl border border-border p-2 hover:border-primary transition-colors"
                    >
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={`${doc.brand} ${s.model} ${s.bodyType || ""} price and specifications`.trim()}
                          width={72}
                          height={54}
                          loading="lazy"
                          className="h-[54px] w-[72px] shrink-0 rounded-lg object-cover bg-muted"
                        />
                      ) : (
                        <span className="h-[54px] w-[72px] shrink-0 rounded-lg bg-muted" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground truncate">{s.model}</span>
                        <span className="block text-xs text-primary font-medium truncate">{s.price || "View details"}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}


            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-semibold text-sm mb-3">Explore UpcurvHub</h2>
              <div className="flex flex-col gap-2 text-sm">
                <Link className="text-primary hover:underline" to="/models">All model guides</Link>
                <Link className="text-primary hover:underline" to="/marketplace/vehicles">All used vehicles</Link>
                <Link className="text-primary hover:underline" to={`/marketplace/brand/${slugify(doc.brand)}`}>{doc.brand} stock</Link>
                <Link className="text-primary hover:underline" to="/marketplace/dealers">Verified dealers</Link>
                <Link className="text-primary hover:underline" to="/blog">Buying guides</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <MarketplaceFooter />
      <MarketplaceEMICalculator open={emiOpen} onOpenChange={setEmiOpen} vehiclePrice={newPriceForEmi} vehicleName={name} />
    </div>
  );
};

export default ModelHub;
