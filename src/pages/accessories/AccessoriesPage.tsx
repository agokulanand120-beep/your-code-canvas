import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Star, Package, Loader2, Truck, ShieldCheck, BadgeIndianRupee,
  ShoppingCart, RotateCcw, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import AccessoriesHeader from "@/components/accessories/AccessoriesHeader";
import { formatCurrency } from "@/lib/formatters";
import { useAccessoryCart } from "@/hooks/useAccessoryCart";
import { toast } from "sonner";

export interface AccessoryCategory {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; sort_order: number; is_active: boolean;
}
export interface AccessoryProduct {
  id: string; category_id: string | null; name: string; slug: string; brand: string | null;
  short_description: string | null; price: number; mrp: number | null; images: string[] | null;
  stock_status: string; rating: number | null; review_count: number | null;
  is_featured: boolean; is_active: boolean; sort_order: number;
}

const CANONICAL = "https://upcurvhub.upcurv.in/accessories";

export const discountPct = (price: number, mrp?: number | null) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const ProductCard = ({ p }: { p: AccessoryProduct }) => {
  const off = discountPct(Number(p.price), p.mrp ? Number(p.mrp) : null);
  const { add, items } = useAccessoryCart();
  const inCart = items.some((i) => i.id === p.id);
  const soldOut = p.stock_status !== "in_stock";

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      id: p.id, name: p.name, slug: p.slug, image: p.images?.[0] ?? null,
      price: Number(p.price), mrp: p.mrp ? Number(p.mrp) : null,
    });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <Card className="group overflow-hidden h-full flex flex-col border-border/60 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)] transition-all">
      <Link to={`/accessories/${p.slug}`} className="block">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt={p.name} loading="lazy"
              className="h-full w-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {off > 0 && <Badge className="absolute top-2 left-2 bg-emerald-600 hover:bg-emerald-600">{off}% OFF</Badge>}
          {soldOut && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="secondary">Out of stock</Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3 space-y-1.5 flex-1 flex flex-col">
        {p.brand && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
        <Link to={`/accessories/${p.slug}`}>
          <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">{p.name}</p>
        </Link>
        {p.rating != null && (
          <span className="text-xs flex items-center gap-1 text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {Number(p.rating).toFixed(1)} <Star className="h-2.5 w-2.5 fill-white" />
            </span>
            {!!p.review_count && `${p.review_count} ratings`}
          </span>
        )}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-bold">{formatCurrency(Number(p.price))}</span>
          {p.mrp && Number(p.mrp) > Number(p.price) && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(Number(p.mrp))}</span>
          )}
        </div>
        <Button size="sm" variant={inCart ? "secondary" : "default"} disabled={soldOut}
          className="mt-auto w-full gap-1.5" onClick={addToCart}>
          {inCart ? <><Check className="h-3.5 w-3.5" /> In cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to cart</>}
        </Button>
      </CardContent>
    </Card>
  );
};

const AccessoriesPage = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const activeCategory = params.get("category") || "all";

  const { data, isLoading } = useQuery({
    queryKey: ["accessories-catalog"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("accessory_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("accessory_products").select("*").eq("is_active", true)
          .order("is_featured", { ascending: false }).order("sort_order"),
      ]);
      return {
        categories: (catRes.data || []) as unknown as AccessoryCategory[],
        products: (prodRes.data || []) as unknown as AccessoryProduct[],
      };
    },
  });

  const categories = data?.categories || [];
  const products = data?.products || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const catId = categories.find((c) => c.slug === activeCategory)?.id;
    let rows = products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.short_description || "").toLowerCase().includes(q);
      const matchesCat = activeCategory === "all" || p.category_id === catId;
      return matchesSearch && matchesCat;
    });
    if (sortBy === "price_low") rows = [...rows].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_high") rows = [...rows].sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "rating") rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else if (sortBy === "discount") rows = [...rows].sort(
      (a, b) => discountPct(Number(b.price), b.mrp) - discountPct(Number(a.price), a.mrp));
    return rows;
  }, [products, categories, search, sortBy, activeCategory]);

  const featured = useMemo(() => products.filter((p) => p.is_featured).slice(0, 8), [products]);
  const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name;

  useEffect(() => {
    const title = "Car Accessories Online — Interior, Exterior & Care | UpcurvHub";
    const desc = "Shop verified car accessories on UpcurvHub — interior, exterior, electronics, care and safety products at the best prices with genuine warranty.";
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

  const selectCategory = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug === "all") next.delete("category");
    else next.set("category", slug);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AccessoriesHeader search={search} onSearch={setSearch} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-10 md:py-14 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> Curated for Indian roads</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Upgrade your ride with<br className="hidden md:block" /> genuine car accessories
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Interior comfort, exterior styling, electronics, care and safety — hand-picked, warranty backed,
              delivered to your doorstep with cash on delivery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })}>
                Shop all products
              </Button>
              <Link to="/accessories/cart"><Button size="lg" variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" /> View cart
              </Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, t: "Verified brands", s: "100% genuine products" },
              { icon: Truck, t: "Fast delivery", s: "2–5 day dispatch" },
              { icon: BadgeIndianRupee, t: "Best prices", s: "Free shipping over ₹999" },
              { icon: RotateCcw, t: "Easy returns", s: "7-day replacement" },
            ].map(({ icon: Icon, t, s }) => (
              <div key={t} className="rounded-xl border bg-card p-4">
                <Icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-semibold">{t}</p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold mb-4">Shop by category</h2>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Categories are being added shortly.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <button onClick={() => selectCategory("all")}
                className={`rounded-xl border p-3 text-center transition-all ${
                  activeCategory === "all" ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                }`}>
                <div className="aspect-square rounded-lg bg-muted mb-2 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium">All</span>
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => selectCategory(c.slug)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    activeCategory === c.slug ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                  }`}>
                  <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden flex items-center justify-center">
                    {c.image_url ? (
                      <img src={c.image_url} alt={`${c.name} accessories`} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs font-medium line-clamp-1">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Featured picks
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* All products */}
        <section id="all-products" className="scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <h2 className="text-xl font-bold flex-1">
              {activeCategoryName || "All accessories"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price_low">Price: low to high</SelectItem>
                <SelectItem value="price_high">Price: high to low</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="discount">Biggest discount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              No accessories match your search yet.
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AccessoriesPage;
