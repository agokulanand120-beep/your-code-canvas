import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Star, Package, ShieldCheck, Search, ExternalLink, ArrowRight,
  Truck, BadgeIndianRupee, Wrench, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { formatCurrency } from "@/lib/formatters";

const CANONICAL = "https://upcurvhub.upcurv.in/shop";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  short_description: string | null;
  description: string | null;
  price: number;
  mrp: number | null;
  images: string[] | null;
  highlights: string[] | null;
  rating: number | null;
  review_count: number | null;
  buy_url: string;
  merchant: string | null;
  is_featured: boolean;
  sort_order: number;
}

export const SHOP_CATEGORIES = [
  { slug: "interior", label: "Interior" },
  { slug: "exterior", label: "Exterior" },
  { slug: "electronics", label: "Electronics" },
  { slug: "car-care", label: "Car Care" },
  { slug: "safety", label: "Safety" },
  { slug: "bike", label: "Bike Gear" },
  { slug: "tools", label: "Tools" },
  { slug: "accessories", label: "Other" },
];

const categoryLabel = (slug: string) =>
  SHOP_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

const discountPct = (price: number, mrp?: number | null) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

const ProductCard = ({ p, onOpen }: { p: ShopProduct; onOpen: (p: ShopProduct) => void }) => {
  const off = discountPct(Number(p.price), p.mrp ? Number(p.mrp) : null);
  return (
    <Card className="group h-full flex flex-col overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-[0_10px_34px_-16px_hsl(var(--primary)/0.4)] transition-all">
      <button onClick={() => onOpen(p)} className="block text-left" aria-label={p.name}>
        <div className="relative aspect-square bg-muted overflow-hidden">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={`${p.name}${p.brand ? ` by ${p.brand}` : ""} — ${categoryLabel(p.category)}`}
              loading="lazy" width={480} height={480}
              className="h-full w-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {off > 0 && (
            <Badge className="absolute top-2 left-2 bg-emerald-600 hover:bg-emerald-600">{off}% OFF</Badge>
          )}
        </div>
      </button>
      <CardContent className="p-3 flex flex-col gap-1.5 flex-1">
        {p.brand && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
        <button onClick={() => onOpen(p)} className="text-left">
          <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">{p.name}</p>
        </button>
        {p.rating != null && (
          <span className="text-xs flex items-center gap-1 text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {Number(p.rating).toFixed(1)} <Star className="h-2.5 w-2.5 fill-current" />
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
        <div className="mt-auto pt-1.5 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpen(p)}>Details</Button>
          <Button size="sm" asChild>
            <a href={p.buy_url} target="_blank" rel="nofollow sponsored noopener noreferrer">Buy now</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductDialog = ({ p, onClose }: { p: ShopProduct | null; onClose: () => void }) => {
  const [img, setImg] = useState(0);
  useEffect(() => setImg(0), [p?.id]);
  if (!p) return null;
  const off = discountPct(Number(p.price), p.mrp ? Number(p.mrp) : null);
  const images = p.images?.length ? p.images : [];

  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="grid md:grid-cols-2">
          <div className="bg-muted">
            <div className="aspect-square overflow-hidden">
              {images[img] ? (
                <img src={images[img]} alt={`${p.name} — image ${img + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground" /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setImg(i)}
                    className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 ${i === img ? "border-primary" : "border-transparent"}`}>
                    <img src={src} alt={`${p.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{categoryLabel(p.category)}</Badge>
              {p.is_featured && <Badge className="gap-1"><Sparkles className="h-3 w-3" /> Top pick</Badge>}
            </div>
            {p.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
            <h2 className="text-xl font-bold leading-snug">{p.name}</h2>
            {p.short_description && <p className="text-sm text-muted-foreground">{p.short_description}</p>}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{formatCurrency(Number(p.price))}</span>
              {p.mrp && Number(p.mrp) > Number(p.price) && (
                <>
                  <span className="text-sm text-muted-foreground line-through">{formatCurrency(Number(p.mrp))}</span>
                  <span className="text-sm font-semibold text-emerald-600">{off}% off</span>
                </>
              )}
            </div>
            {!!p.highlights?.length && (
              <ul className="space-y-1.5 pt-1">
                {p.highlights.map((h, i) => (
                  <li key={i} className="text-sm flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />{h}</li>
                ))}
              </ul>
            )}
            {p.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{p.description}</p>
            )}
            <Button size="lg" className="w-full gap-2" asChild>
              <a href={p.buy_url} target="_blank" rel="nofollow sponsored noopener noreferrer">
                Buy now <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Secure checkout with our verified partner store. Price and stock updated at checkout.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShopPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [open, setOpen] = useState<ShopProduct | null>(null);

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
    const title = "Car & Bike Essentials Store — Top Picks at Best Prices | UpcurvHub";
    const desc = "Hand-picked car and bike essentials — interior, exterior, electronics, care, safety and tools. Compared, reviewed and priced for Indian roads on UpcurvHub.";
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
            <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3 w-3" /> Tried, tested, top-rated</Badge>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight leading-tight">
              Everything your car and bike needs
            </h1>
            <p className="mt-3 md:mt-4 max-w-xl text-sm md:text-base text-muted-foreground">
              Our team picks the essentials worth buying — seat covers, dash cams, care kits, helmets and tools —
              at the best price we can find, so you never scroll through hundreds of look-alike listings.
            </p>
            <div className="mt-5 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11 rounded-xl"
                placeholder="Search dash cam, seat cover, helmet…"
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

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 pt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg md:text-2xl font-bold">Top picks this week</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {featured.map((p) => (
              <div key={p.id} className="w-[46%] sm:w-[240px] shrink-0">
                <ProductCard p={p} onOpen={setOpen} />
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
            {filtered.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}
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

      <ProductDialog p={open} onClose={() => setOpen(null)} />
      <MarketplaceFooter />
    </div>
  );
};

export default ShopPage;
