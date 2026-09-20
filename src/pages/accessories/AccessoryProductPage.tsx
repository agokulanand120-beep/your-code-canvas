import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Star, Package, Loader2, ShieldCheck, Truck, CheckCircle2, Phone, Car,
  ShoppingCart, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import AccessoriesHeader from "@/components/accessories/AccessoriesHeader";
import { formatCurrency } from "@/lib/formatters";
import { useAccessoryCart } from "@/hooks/useAccessoryCart";
import { ProductCard, discountPct, type AccessoryProduct } from "./AccessoriesPage";

const SUPPORT_PHONE = "6380715292";

const AccessoryProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useAccessoryCart();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", city: "", message: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["accessory-product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("accessory_products").select("*").eq("slug", slug!).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!product) return { product: null, related: [], category: null };
      const [relRes, catRes] = await Promise.all([
        supabase.from("accessory_products").select("*").eq("is_active", true)
          .eq("category_id", (product as any).category_id).neq("id", (product as any).id).limit(4),
        (product as any).category_id
          ? supabase.from("accessory_categories").select("name, slug").eq("id", (product as any).category_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return {
        product: product as any,
        related: (relRes.data || []) as unknown as AccessoryProduct[],
        category: (catRes as any).data as { name: string; slug: string } | null,
      };
    },
  });

  const product = data?.product;
  const images: string[] = useMemo(() => product?.images?.length ? product.images : [], [product]);
  const specs: [string, string][] = useMemo(() => {
    const s = product?.specifications;
    if (!s || typeof s !== "object" || Array.isArray(s)) return [];
    return Object.entries(s).map(([k, v]) => [k, String(v)] as [string, string]);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const title = `${product.name}${product.brand ? ` — ${product.brand}` : ""} | UpcurvHub Accessories`;
    const desc = (product.short_description || product.description || `Buy ${product.name} on UpcurvHub.`).slice(0, 155);
    const canonical = `https://upcurvhub.upcurv.in/accessories/${product.slug}`;
    document.title = title;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonical);
    if (product.images?.[0]) setMeta("property", "og:image", product.images[0]);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "accessory-jsonld";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product",
      name: product.name, brand: product.brand || undefined,
      image: product.images || undefined, description: desc,
      offers: {
        "@type": "Offer", priceCurrency: "INR", price: Number(product.price),
        availability: product.stock_status === "in_stock"
          ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: canonical,
      },
    });
    document.getElementById("accessory-jsonld")?.remove();
    document.head.appendChild(ld);
    return () => { document.getElementById("accessory-jsonld")?.remove(); };
  }, [product]);

  const submitEnquiry = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("accessory_enquiries").insert({
      product_id: product?.id ?? null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      message: form.message.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Could not submit your enquiry. Please try again."); return; }
    toast.success("Enquiry submitted — our team will call you shortly.", { duration: 6000 });
    setForm({ full_name: "", phone: "", email: "", city: "", message: "" });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Product not found</h1>
        <Link to="/accessories"><Button>Browse all accessories</Button></Link>
      </div>
    );
  }

  const off = discountPct(Number(product.price), product.mrp ? Number(product.mrp) : null);
  const outOfStock = product.stock_status !== "in_stock";
  const addToCart = () =>
    add(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] ?? null,
        price: Number(product.price),
        mrp: product.mrp ? Number(product.mrp) : null,
      },
      qty
    );

  return (
    <div className="min-h-screen bg-background">
      <AccessoriesHeader />
      <div className="container mx-auto px-4 py-6">
        <nav className="text-sm text-muted-foreground mb-5 flex items-center gap-1.5 flex-wrap">
          <Link to="/accessories" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Accessories
          </Link>
          {data?.category && (
            <>
              <span>/</span>
              <Link to={`/accessories?category=${data.category.slug}`} className="hover:text-foreground">
                {data.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl bg-muted overflow-hidden relative">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {off > 0 && <Badge className="absolute top-3 left-3 bg-emerald-600">{off}% OFF</Badge>}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                      i === activeImage ? "border-primary" : "border-transparent"
                    }`}>
                    <img src={img} alt={`${product.name} view ${i + 1}`} loading="lazy"
                      className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {product.brand && (
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              {product.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {Number(product.rating).toFixed(1)}
                  {!!product.review_count && <span className="text-muted-foreground">({product.review_count})</span>}
                </span>
              )}
              <Badge variant={product.stock_status === "in_stock" ? "default" : "secondary"}>
                {product.stock_status === "in_stock" ? "In stock" : "Out of stock"}
              </Badge>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatCurrency(Number(product.price))}</span>
              {product.mrp && Number(product.mrp) > Number(product.price) && (
                <span className="text-muted-foreground line-through">{formatCurrency(Number(product.mrp))}</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            {/* Mobile-first action buttons — below short description */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <div className="inline-flex items-center rounded-md border">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{qty}</span>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty((q) => q + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-row gap-3">
                <Button size="lg" variant="outline" className="flex-1 gap-2 h-12 text-sm sm:text-base" disabled={outOfStock}
                  onClick={() => { addToCart(); toast.success(`${product.name} added to cart`); }}>
                  <ShoppingCart className="h-4 w-4" /> Add to cart
                </Button>
                <Button size="lg" className="flex-1 gap-2 h-12 text-sm sm:text-base" disabled={outOfStock}
                  onClick={() => { addToCart(); navigate("/accessories/checkout"); }}>
                  Buy now
                </Button>
              </div>
              <a href={`tel:${SUPPORT_PHONE}`} className="block">
                <Button variant="ghost" className="w-full gap-2 h-11">
                  <Phone className="h-4 w-4" /> Call {SUPPORT_PHONE}
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {product.warranty && (
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> {product.warranty}</span>
              )}
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Fast delivery</span>
            </div>

            {!!product.features?.length && (
              <ul className="space-y-1.5">
                {product.features.map((f: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            )}

            {!!product.compatible_brands?.length && (
              <div className="flex items-start gap-2 text-sm">
                <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Compatible with: {product.compatible_brands.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description + specs */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {product.description && (
            <Card><CardContent className="p-5">
              <h2 className="font-semibold mb-2">Product details</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
            </CardContent></Card>
          )}
          {specs.length > 0 && (
            <Card><CardContent className="p-5">
              <h2 className="font-semibold mb-3">Specifications</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent></Card>
          )}
        </div>

        {/* Enquiry */}
        <Card className="mt-8">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Enquire about this product</h2>
              <p className="text-sm text-muted-foreground">
                Share your details and our team will call you back on {SUPPORT_PHONE}.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ae-name">Full name *</Label>
                <Input id="ae-name" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ae-phone">Phone *</Label>
                <Input id="ae-phone" inputMode="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ae-email">Email</Label>
                <Input id="ae-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ae-city">District</Label>
                <Input id="ae-city" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ae-msg">Message</Label>
                <Textarea id="ae-msg" rows={3} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
            </div>
            <Button onClick={submitEnquiry} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit enquiry
            </Button>
          </CardContent>
        </Card>

        {!!data?.related.length && (
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-4">Related products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.related.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AccessoryProductPage;
