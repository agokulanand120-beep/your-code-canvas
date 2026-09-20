import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Star, ExternalLink, ShieldCheck, ChevronRight, Lightbulb, Truck, BadgeIndianRupee, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { formatCurrency } from "@/lib/formatters";
import { trackShopEvent } from "@/lib/shopAnalytics";
import { type ShopProduct, categoryLabel, discountPct, storeLabel } from "@/lib/shopTypes";

const ShopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [img, setImg] = useState(0);

  const { data: p, isLoading } = useQuery({
    queryKey: ["shop-product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      return (data || null) as unknown as ShopProduct | null;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["shop-product-related", p?.id, p?.category],
    enabled: !!p,
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .eq("category", p!.category)
        .neq("id", p!.id)
        .order("is_featured", { ascending: false })
        .order("sort_order")
        .limit(4);
      return (data || []) as unknown as ShopProduct[];
    },
  });

  useEffect(() => setImg(0), [p?.id]);

  useEffect(() => {
    if (p) trackShopEvent("impression", p);
  }, [p?.id]);

  useEffect(() => {
    if (!p) return;
    const title = `${p.name} — Price, Review & Where to Buy | UpcurvHub`;
    const desc =
      p.short_description ||
      p.reason ||
      `${p.name} — our pick for ${categoryLabel(p.category)}. See the latest price at our partner store.`;
    document.title = title;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    const url = `https://upcurvhub.upcurv.in/shop/${p.slug}`;
    setMeta("property", "og:url", url);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [p?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceTopBar showBack />
        <div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceTopBar showBack />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold">Product not found</h1>
          <p className="text-sm text-muted-foreground mt-1">It may have been removed from the store.</p>
          <Button asChild className="mt-5">
            <Link to="/shop">Back to the store</Link>
          </Button>
        </div>
        <MarketplaceFooter />
      </div>
    );
  }

  const off = discountPct(Number(p.price), p.mrp);
  const images = p.images?.length ? p.images : [];
  const store = storeLabel(p.merchant);

  const BuyButton = ({ size = "lg" as const }) => (
    <Button size={size} className="w-full gap-2" asChild>
      <a
        href={p.buy_url}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        onClick={() => trackShopEvent("click", p)}
      >
        Check Price on {store} <ExternalLink className="h-4 w-4" />
      </a>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceTopBar showBack />

      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 pt-4 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link to="/shop" className="hover:text-foreground">Store</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop#all-products" className="hover:text-foreground">{categoryLabel(p.category)}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-[60vw]">{p.name}</span>
      </nav>

      <div className="container mx-auto px-4 py-6 grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            {images[img] ? (
              <img
                src={images[img]}
                alt={`${p.name} — image ${img + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-14 w-14 text-muted-foreground" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 pt-3 overflow-x-auto scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImg(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 ${
                    i === img ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={src} alt={`${p.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{categoryLabel(p.category)}</Badge>
            {p.is_featured && <Badge>Top pick</Badge>}
            {p.vehicle_types?.map((t) => (
              <Badge key={t} variant="outline" className="capitalize">{t}</Badge>
            ))}
          </div>

          {p.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">{p.name}</h1>

          {p.rating != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {Number(p.rating).toFixed(1)} <Star className="h-3 w-3 fill-current" />
              </span>
              {!!p.review_count && <span>{p.review_count} ratings on {store}</span>}
            </div>
          )}

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-primary">{formatCurrency(Number(p.price))}</span>
            {p.mrp && Number(p.mrp) > Number(p.price) && (
              <>
                <span className="text-base text-muted-foreground line-through">{formatCurrency(Number(p.mrp))}</span>
                <span className="text-base font-semibold text-emerald-600">{off}% off</span>
              </>
            )}
          </div>

          {(p.reason || p.short_description) && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Why we recommend it
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.reason || p.short_description}
              </p>
            </div>
          )}

          <BuyButton />
          <p className="text-[11px] text-muted-foreground text-center">
            Price and stock are confirmed on {store}. As an affiliate we may earn a commission on qualifying
            purchases — it costs you nothing extra.
          </p>

          {!!p.highlights?.length && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Key features</h2>
              <ul className="space-y-2">
                {p.highlights.map((h, i) => (
                  <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, t: "Genuine only" },
              { icon: BadgeIndianRupee, t: "Best price" },
              { icon: Truck, t: "Fast delivery" },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 text-center">
                <f.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-[11px] font-medium">{f.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long-form description */}
      {p.description && (
        <section className="container mx-auto px-4 pb-4">
          <Card>
            <CardContent className="p-5 md:p-7">
              <h2 className="text-lg md:text-xl font-bold mb-3">About this product</h2>
              <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                {p.description}
              </p>
              <div className="mt-5 max-w-sm">
                <BuyButton size="default" />
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Related */}
      {!!related?.length && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg md:text-2xl font-bold">More {categoryLabel(p.category)} picks</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {related.map((r) => <ShopProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-10">
        <div className="rounded-2xl md:rounded-3xl border border-border bg-card/60 p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Still shopping for the vehicle?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse verified used cars and bikes from trusted dealers near you.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/marketplace/vehicles">Browse vehicles <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
};

export default ShopProductPage;
