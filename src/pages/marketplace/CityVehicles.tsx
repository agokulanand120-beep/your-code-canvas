import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, MapPin, Building2, ChevronRight, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import Seo from "@/components/Seo";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import { extractDistrict } from "@/lib/location";
import { vehiclePath, dealerPath, slugify } from "@/lib/seoSlug";
import { formatCurrency } from "@/lib/formatters";
import {
  PRIORITY_CITIES,
  cityFaqs,
  cityIntro,
  cityPath,
  matchesSegment,
  parseCitySlug,
  segmentLabel,
  cityBrandPath,
  cityModelFaqs,
  cityModelPath,
  type CitySegment,
} from "@/lib/cityPages";

const SITE = "https://upcurvhub.upcurv.in";

const CityVehicles = () => {
  const { citySlug: rawSlug } = useParams();
  const parsed = parseCitySlug(rawSlug);

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useComparison();

  const { data, isLoading } = useQuery({
    queryKey: ["city-vehicles"],
    queryFn: async () => {
      const { data: dealers } = await supabase
        .from("settings")
        .select(
          "user_id, dealer_name, dealer_slug, dealer_address, dealer_phone, shop_logo_url, marketplace_featured, marketplace_badge, google_reviews_rating, google_reviews_count, public_page_id",
        )
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);

      if (!dealers?.length) return { vehicles: [], dealers: [] };

      const { data: vehicles } = await supabase
        .from("vehicles")
        .select(
          "id, slug, brand, model, variant, selling_price, strikeout_price, manufacturing_year, fuel_type, transmission, vehicle_type, odometer_reading, color, user_id, created_at, image_badge_text, image_badge_color, number_of_owners, mileage, condition, vehicle_images(image_url, is_primary)",
        )
        .in("user_id", dealers.map((d) => d.user_id))
        .eq("status", "in_stock")
        .in("marketplace_status", ["approved", "featured"]);

      return {
        dealers,
        vehicles: (vehicles || []).map((v: any) => ({
          ...v,
          image_url:
            (v.vehicle_images || []).find((i: any) => i.is_primary)?.image_url ||
            (v.vehicle_images || [])[0]?.image_url,
        })),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const city = parsed?.city || "";
  const parsedSegment: CitySegment = parsed?.segment || "cars";
  const dealers = data?.dealers || [];
  const allVehicles = data?.vehicles || [];

  const cityDealers = useMemo(
    () => dealers.filter((d: any) => extractDistrict(d.dealer_address) === city),
    [dealers, city],
  );

  const cityAllVehicles = useMemo(() => {
    const ids = new Set(cityDealers.map((d: any) => d.user_id));
    return allVehicles
      .filter((v: any) => ids.has(v.user_id))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allVehicles, cityDealers]);

  const subjectSlug = parsed?.subjectSlug;

  const subjectVehicles = useMemo(() => {
    if (!subjectSlug) return [];
    return cityAllVehicles.filter((v: any) => {
      const brand = slugify(v.brand || "");
      const model = slugify(v.model || "");
      return (
        `${brand}-${model}` === subjectSlug ||
        model === subjectSlug ||
        `${brand}-${model}`.startsWith(`${subjectSlug}-`) ||
        (!!model && subjectSlug.startsWith(`${brand}-${model}`))
      );
    });
  }, [cityAllVehicles, subjectSlug]);

  // A model page inherits its segment from the matched stock.
  const segment: CitySegment = subjectSlug
    ? matchesSegment(subjectVehicles[0]?.vehicle_type, "bikes")
      ? "bikes"
      : "cars"
    : parsedSegment;

  const allCityVehicles = useMemo(
    () => (subjectSlug ? subjectVehicles : cityAllVehicles.filter((v: any) => matchesSegment(v.vehicle_type, segment))),
    [cityAllVehicles, subjectVehicles, subjectSlug, segment],
  );

  const brandSlug = subjectSlug ? undefined : parsed?.brandSlug;

  const cityVehicles = useMemo(
    () =>
      brandSlug
        ? allCityVehicles.filter((v: any) => slugify(v.brand || "") === brandSlug)
        : allCityVehicles,
    [allCityVehicles, brandSlug],
  );

  const segmentCityVehicles = useMemo(
    () => cityAllVehicles.filter((v: any) => matchesSegment(v.vehicle_type, segment)),
    [cityAllVehicles, segment],
  );

  const brands = useMemo(() => {
    const counts: Record<string, number> = {};
    segmentCityVehicles.forEach((v: any) => {
      counts[v.brand] = (counts[v.brand] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [segmentCityVehicles]);

  /** Top brand+model combos in the city — each gets its own indexable page. */
  const models = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; count: number }>();
    segmentCityVehicles.forEach((v: any) => {
      if (!v.brand || !v.model) return;
      const key = `${v.brand}|${v.model}`;
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else map.set(key, { brand: v.brand, model: v.model, count: 1 });
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 16);
  }, [segmentCityVehicles]);

  const priceRange = useMemo(() => {
    const prices = cityVehicles.map((v: any) => Number(v.selling_price)).filter(Boolean);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [cityVehicles]);

  if (!parsed) return <Navigate to="/marketplace/vehicles" replace />;
  if (isLoading) return <MarketplaceSkeleton />;

  const noun = segmentLabel(segment);
  const titleize = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const matched = subjectVehicles[0];
  const modelLabel = subjectSlug
    ? matched
      ? `${matched.brand} ${matched.model}`.trim()
      : titleize(subjectSlug)
    : "";
  const brandName = brandSlug ? cityVehicles[0]?.brand || titleize(brandSlug) : "";

  const heading = modelLabel
    ? `Used ${modelLabel} in ${city}`
    : brandName
      ? `Used ${brandName} ${noun} in ${city}`
      : `Used ${noun} in ${city}`;

  const faqs = modelLabel
    ? cityModelFaqs(city, modelLabel, cityVehicles.length, priceRange ? formatCurrency(priceRange.min) : undefined)
    : cityFaqs(city, segment);

  const intro = modelLabel
    ? `Searching for a second hand ${modelLabel} in ${city}? UpcurvHub lists ${cityVehicles.length || "verified"} used ${modelLabel} ${cityVehicles.length ? "listings " : ""}from trusted ${city} dealers${
        priceRange ? `, priced from ${formatCurrency(priceRange.min)}` : ""
      }. Compare year, variant, kilometres driven and ownership history side by side, check EMI options, and contact the ${city} dealer directly — with full RC transfer and insurance support.`
    : brandName
      ? `Looking for a used ${brandName} ${segmentLabel(segment, false)} in ${city}? UpcurvHub lists ${cityVehicles.length} verified ${brandName} ${noun} from trusted ${city} dealers — real photos, honest kilometre readings, ownership history and transparent pricing on every second hand ${brandName} ${segmentLabel(segment, false)} in ${city}, plus EMI options and full RC transfer support.`
      : cityIntro(city, segment, cityVehicles.length, cityDealers.length);

  const path = modelLabel
    ? cityModelPath(city, matched?.brand || subjectSlug!.split("-")[0], matched?.model || subjectSlug!)
    : brandName
      ? cityBrandPath(segment, city, brandName)
      : cityPath(segment, city);
  const url = `${SITE}${path}`;


  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: heading,
      url,
      description: intro,
      about: {
        "@type": "City",
        name: city,
        address: { "@type": "PostalAddress", addressLocality: city, addressCountry: "IN" },
      },
      ...(priceRange
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: priceRange.min,
              highPrice: priceRange.max,
              offerCount: cityVehicles.length,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${heading} for sale`,
      numberOfItems: cityVehicles.length,
      itemListElement: cityVehicles.slice(0, 25).map((v: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
        url: `${SITE}${vehiclePath(v)}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Vehicles", item: `${SITE}/marketplace/vehicles` },
        { "@type": "ListItem", position: 3, name: `Used ${noun} in ${city}`, item: `${SITE}${cityPath(segment, city)}` },
        ...(brandName || modelLabel
          ? [{ "@type": "ListItem", position: 4, name: modelLabel || brandName, item: url }]
          : []),
      ],
    },
    ...(modelLabel
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `Used ${modelLabel} in ${city}`,
            description: intro,
            brand: { "@type": "Brand", name: matched?.brand || modelLabel.split(" ")[0] },
            ...(cityVehicles[0]?.image_url ? { image: cityVehicles[0].image_url } : {}),
            ...(priceRange
              ? {
                  offers: {
                    "@type": "AggregateOffer",
                    priceCurrency: "INR",
                    lowPrice: priceRange.min,
                    highPrice: priceRange.max,
                    offerCount: cityVehicles.length,
                    availability: "https://schema.org/InStock",
                    areaServed: { "@type": "City", name: city },
                  },
                }
              : {}),
          },
        ]
      : []),
  ];


  const otherCities = [...new Set([...cityDealers.map(() => city), ...PRIORITY_CITIES])]
    .filter((c) => c !== city)
    .slice(0, 12);

  const Icon = segment === "bikes" ? Bike : Car;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Seo
        title={
          modelLabel
            ? `Used ${modelLabel} in ${city} — ${cityVehicles.length || ""} Listings | UpcurvHub`.replace("  ", " ")
            : brandName
              ? `Used ${brandName} ${Noun} in ${city} — ${cityVehicles.length || ""} Listings | UpcurvHub`.replace("  ", " ")
              : `Second Hand ${Noun} in ${city} — ${cityVehicles.length || ""} Used ${Noun} | UpcurvHub`.replace("  ", " ")
        }
        description={
          modelLabel
            ? `Buy a verified used ${modelLabel} in ${city}${priceRange ? ` from ${formatCurrency(priceRange.min)}` : ""}. ${cityVehicles.length || "New"} second hand ${modelLabel} listings from trusted ${city} dealers with inspection details, EMI and RC transfer support.`
            : `Buy verified second hand ${brandName ? `${brandName} ` : ""}${noun} in ${city} from ${cityDealers.length || "trusted"} local dealers. Real prices${priceRange ? ` from ${formatCurrency(priceRange.min)}` : ""}, inspection details, EMI options and RC transfer support.`
        }
        path={path}
        image={cityVehicles[0]?.image_url}
        jsonLd={jsonLd}
      />

      <MarketplaceTopBar showBack />

      {/* Hero / intro copy */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="text-xs md:text-sm text-white/70 mb-3 flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/marketplace/vehicles" className="hover:text-white">Vehicles</Link>
            <ChevronRight className="h-3 w-3" />
            {brandName || modelLabel ? (
              <>
                <Link to={cityPath(segment, city)} className="hover:text-white">
                  Used {noun} in {city}
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white">{modelLabel || brandName}</span>
              </>
            ) : (
              <span className="text-white">Used {noun} in {city}</span>
            )}
          </nav>

          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <Icon className="h-7 w-7 md:h-9 md:w-9 shrink-0" />
            {heading.charAt(0).toUpperCase() + heading.slice(1)}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge className="bg-white/15 hover:bg-white/20 text-white border-0 gap-1">
              <Icon className="h-3.5 w-3.5" /> {cityVehicles.length} listings
            </Badge>
            <Badge className="bg-white/15 hover:bg-white/20 text-white border-0 gap-1">
              <Building2 className="h-3.5 w-3.5" /> {cityDealers.length} verified dealers
            </Badge>
            <Badge className="bg-white/15 hover:bg-white/20 text-white border-0 gap-1">
              <MapPin className="h-3.5 w-3.5" /> {city}
            </Badge>
            {priceRange && (
              <Badge className="bg-white/15 hover:bg-white/20 text-white border-0">
                {formatCurrency(priceRange.min)} – {formatCurrency(priceRange.max)}
              </Badge>
            )}
          </div>

          <p className="mt-4 max-w-3xl text-sm md:text-base text-white/85 leading-relaxed">{intro}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Brand shortcuts */}
        {brands.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Popular brands in {city}
            </h2>
            <div className="flex flex-wrap gap-2">
              {brands.map(([brand, count]) => (
                <Link key={brand} to={cityBrandPath(segment, city, brand)}>
                  <Badge
                    variant={slugify(brand) === brandSlug ? "default" : "secondary"}
                    className="rounded-full px-3 py-1"
                  >
                    Used {brand} in {city} ({count})
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Model shortcuts — dedicated "used <brand> <model> in <city>" pages */}
        {models.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Popular used {noun} models in {city}
            </h2>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => {
                const active = slugify(`${m.brand} ${m.model}`) === subjectSlug;
                return (
                  <Link key={`${m.brand}-${m.model}`} to={cityModelPath(city, m.brand, m.model)}>
                    <Badge variant={active ? "default" : "secondary"} className="rounded-full px-3 py-1">
                      Used {m.brand} {m.model} in {city} ({m.count})
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Listings */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {cityVehicles.length} second hand {modelLabel ? `${modelLabel} ` : brandName ? `${brandName} ${noun} ` : `${noun} `}
            for sale in {city}
          </h2>


          {cityVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cityVehicles.map((v: any) => (
                <MarketplaceVehicleCard
                  key={v.id}
                  vehicle={v}
                  dealer={cityDealers.find((d: any) => d.user_id === v.user_id)}
                  isInWishlist={isInWishlist(v.id)}
                  isInCompare={isInCompare(v.id)}
                  onWishlistToggle={toggleWishlist}
                  onCompareToggle={toggleCompare}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No used {noun} listed in {city} right now. New stock is added by local dealers every week.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/marketplace/vehicles">Browse all vehicles</Link>
              </Button>
            </Card>
          )}
        </section>

        {/* Local dealers */}
        {cityDealers.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Verified used {noun} dealers in {city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cityDealers.map((d: any) => (
                <Link key={d.user_id} to={dealerPath(d)}>
                  <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {d.shop_logo_url ? (
                        <img src={d.shop_logo_url} alt={`${d.dealer_name} logo`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{d.dealer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{city}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Used {noun} in {city} — frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="rounded-xl border border-border divide-y divide-border">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="px-4 border-0">
                <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Nearby / other cities */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Used {noun} in other cities</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link key={c} to={cityPath(segment, c)}>
                <Badge variant="outline" className="rounded-full px-3 py-1">Used {noun} in {c}</Badge>
              </Link>
            ))}
            <Link to={cityPath(segment === "cars" ? "bikes" : "cars", city)}>
              <Badge className="rounded-full px-3 py-1">
                Used {segment === "cars" ? "bikes" : "cars"} in {city}
              </Badge>
            </Link>
          </div>
        </section>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CityVehicles;
