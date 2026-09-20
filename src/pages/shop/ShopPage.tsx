import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Package, ShieldCheck, Search, ArrowRight,
  Truck, BadgeIndianRupee, Wrench, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import ShopProductCard from "@/components/shop/ShopProductCard";
import ShopCollections from "@/components/shop/ShopCollections";
import { SHOP_CATEGORIES, categoryLabel, discountPct, type ShopProduct } from "@/lib/shopTypes";

const CANONICAL = "https://upcurvhub.upcurv.in/shop";

export { SHOP_CATEGORIES };
export type { ShopProduct };

const ShopPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const { data, isLoading } = useQuery({
    queryKey: ["shop-products"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order");
      return (data || []) as unknown as ShopProduct[];
    },
  });

  const products = data || [];

  const usedCategories = useMemo(
    () => SHOP_CATEGORIES.filter((c) => products.some((p) => p.category === c.slug)),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.short_description || "").toLowerCase().includes(q);
      return matchQ && (category === "all" || p.category === category);
    });
    if (sortBy === "price_low") rows = [...rows].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_high") rows = [...rows].sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "rating") rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else if (sortBy === "discount") rows = [...rows].sort(
      (a, b) => discountPct(Number(b.price), b.mrp) - discountPct(Number(a.price), a.mrp));
    return rows;
  }, [products, search, category, sortBy]);

  const featured = useMemo(() => products.filter((p) => p.is_featured).slice(0, 6), [products]);

  useEffect(() => {
    const title = "Car & Bike Essentials — Buying Guides + Top Picks | UpcurvHub";
    const desc = "Buying guides and hand-picked car and bike essentials — what to buy, why it matters, and where to get the best price. Curated for Indian roads on UpcurvHub.";
    document.title = title;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", CANONICAL);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = CANONICAL;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceTopBar showBack />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-9 md:py-14 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> Guides, not just listings</Badge>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight leading-tight">
              What to buy for your car and bike — and why
            </h1>
            <p className="mt-3 md:mt-4 max-w-xl text-sm md:text-base text-muted-foreground">
              Every pick comes with a short reason it earned a place on the list. Read the guide, check the
              latest price at our partner store, and skip the hundreds of look-alike listings.
            </p>
            <div className="mt-5 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11 rounded-xl"
                placeholder="Search dash cam, tyre inflator, helmet…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, t: "Genuine only", s: "Verified brands and sellers" },
              { icon: BadgeIndianRupee, t: "Best price", s: "Checked across stores" },
              { icon: Truck, t: "Fast delivery", s: "Doorstep, pan-India" },
              { icon: Wrench, t: "Fitment help", s: "Ask us what fits your car" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <f.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-semibold">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category chips */}
      {usedCategories.length > 0 && (
        <section className="border-b bg-card/60">
          <div className="container mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {[{ slug: "all", label: "All products" }, ...usedCategories].map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs md:text-sm font-medium border transition-colors ${
                  category === c.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Editorial buying guides */}
      <ShopCollections />

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg md:text-2xl font-bold">Top picks this week</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {featured.map((p) => (
              <div key={p.id} className="w-[46%] sm:w-[240px] shrink-0">
                <ShopProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section className="container mx-auto px-4 py-8" id="all-products">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold">
              {category === "all" ? "All products" : categoryLabel(category)}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">{filtered.length} products</p>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Recommended</SelectItem>
              <SelectItem value="price_low">Price: low to high</SelectItem>
              <SelectItem value="price_high">Price: high to low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="discount">Biggest discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-14 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">No products here yet</p>
            <p className="text-sm text-muted-foreground">New picks are added every week — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((p) => <ShopProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* Cross-link */}
      <section className="container mx-auto px-4 pb-10">
        <div className="rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 md:p-9 text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold">Looking for the car itself?</h2>
            <p className="text-sm opacity-90 mt-1">Browse verified used cars and bikes from trusted dealers near you.</p>
          </div>
          <Button size="lg" variant="secondary" asChild className="gap-2">
            <Link to="/marketplace/vehicles">Browse vehicles <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
};

export default ShopPage;
