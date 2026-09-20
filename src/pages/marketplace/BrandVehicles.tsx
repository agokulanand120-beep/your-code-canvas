import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import Seo from "@/components/Seo";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import { slugify, vehiclePath } from "@/lib/seoSlug";
import { formatCurrency } from "@/lib/formatters";

const SITE = "https://upcurvhub.upcurv.in";

/** Indexable hub page for every brand with live stock: /marketplace/brand/:brandSlug */
const BrandVehicles = () => {
  const { brandSlug = "", modelSlug = "" } = useParams();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useComparison();

  const { data, isLoading } = useQuery({
    queryKey: ["brand-vehicles"],
    queryFn: async () => {
      const { data: dealers } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_slug, dealer_address, dealer_phone, shop_logo_url, marketplace_featured, marketplace_badge, google_reviews_rating, google_reviews_count, public_page_id")
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

  const brandList = useMemo(
    () =>
      (data?.vehicles || [])
        .filter((v: any) => slugify(v.brand) === brandSlug)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [data, brandSlug],
  );

  const list = useMemo(
    () =>
      brandList
        .filter((v: any) => !modelSlug || slugify(v.model || "") === modelSlug)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [brandList, modelSlug],
  );

  const brand = list[0]?.brand || brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const model =
    (modelSlug && list[0]?.model) ||
    (modelSlug ? modelSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");
  const label = model ? `${brand} ${model}` : brand;

  const prices = list.map((v: any) => Number(v.selling_price)).filter(Boolean);
  const priceRange = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  const models = useMemo(() => {
    const counts: Record<string, number> = {};
    brandList.forEach((v: any) => v.model && (counts[v.model] = (counts[v.model] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [brandList]);

  if (isLoading) return <MarketplaceSkeleton />;

  const path = modelSlug ? `/marketplace/brand/${brandSlug}/${modelSlug}` : `/marketplace/brand/${brandSlug}`;
  const url = `${SITE}${path}`;
  const intro = `Browse ${list.length} verified used ${label} vehicles listed by trusted UpcurvHub dealers${
    priceRange ? `, priced from ${formatCurrency(priceRange.min)} to ${formatCurrency(priceRange.max)}` : ""
  }. Every listing shows real photos, kilometres driven, ownership history and direct dealer contact.`;

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Used ${label} vehicles for sale`,
      url,
      description: intro,
      about: model
        ? { "@type": "Product", name: label, brand: { "@type": "Brand", name: brand } }
        : { "@type": "Brand", name: brand },
      ...(priceRange
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: priceRange.min,
              highPrice: priceRange.max,
              offerCount: list.length,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.slice(0, 25).map((v: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: [v.manufacturing_year, v.brand, v.model].filter(Boolean).join(" "),
        url: `${SITE}${vehiclePath(v)}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Brands", item: `${SITE}/marketplace/brands` },
        { "@type": "ListItem", position: 3, name: brand, item: `${SITE}/marketplace/brand/${brandSlug}` },
        ...(model ? [{ "@type": "ListItem", position: 4, name: model, item: url }] : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Seo
        title={`Used ${label} for Sale${list.length ? ` — ${list.length} Listings` : ""} | UpcurvHub`}
        description={`Buy verified used ${label} vehicles on UpcurvHub${
          priceRange ? ` from ${formatCurrency(priceRange.min)}` : ""
        }. Inspected condition, real photos, EMI options and RC transfer support.`}
        path={path}
        image={list[0]?.image_url}
        jsonLd={jsonLd}
      />

      <MarketplaceTopBar showBack />

      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="text-xs md:text-sm text-white/70 mb-3 flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/marketplace/brands" className="hover:text-white">Brands</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/marketplace/brand/${brandSlug}`} className="hover:text-white">{brand}</Link>
            {model && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white">{model}</span>
              </>
            )}
          </nav>

          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
            <Car className="h-7 w-7 md:h-9 md:w-9 shrink-0" />
            Used {label} for Sale
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge className="bg-white/15 hover:bg-white/20 text-white border-0">{list.length} listings</Badge>
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
        {models.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">All {brand} models</h2>
            <div className="flex flex-wrap gap-2">
              {models.map(([model, count]) => (
                <Link
                  key={model}
                  to={`/marketplace/brand/${brandSlug}/${slugify(model)}`}
                >
                  <Badge
                    variant={slugify(model) === modelSlug ? "default" : "secondary"}
                    className="rounded-full px-3 py-1"
                  >
                    Used {brand} {model} ({count})
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {list.length} used {label} vehicles available
          </h2>

          {list.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {list.map((v: any) => {
                const dealer = (data?.dealers || []).find((d: any) => d.user_id === v.user_id);
                return (
                  <MarketplaceVehicleCard
                    key={v.id}
                    vehicle={v}
                    dealer={dealer}
                    isInWishlist={isInWishlist(v.id)}
                    onWishlistToggle={() => toggleWishlist(v.id)}
                    isInCompare={isInCompare(v.id)}
                    onCompareToggle={() => toggleCompare(v.id)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No {label} vehicles in stock right now.{" "}
              <Link to="/marketplace/vehicles" className="text-primary underline">
                Browse all vehicles
              </Link>
              .
            </p>
          )}
        </section>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default BrandVehicles;
