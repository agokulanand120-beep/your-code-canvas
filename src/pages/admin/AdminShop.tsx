import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Package, Star, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SHOP_CATEGORIES } from "@/pages/shop/ShopPage";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const listFrom = (v: string) =>
  v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

const emptyProduct = {
  id: "", name: "", slug: "", brand: "", category: "interior", short_description: "", description: "",
  price: "", mrp: "", images: "", highlights: "", rating: "", review_count: "",
  buy_url: "", merchant: "", is_featured: false, is_active: true, sort_order: "0",
};
type ProdForm = typeof emptyProduct;

const AdminShop = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProdForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<string | null>(null);

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-shop-products"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("shop_products").select("*").order("sort_order");
      return data || [];
    },
  });

  const products = useMemo(() => data || [], [data]);

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-shop-products"] });
    qc.invalidateQueries({ queryKey: ["shop-products"] });
    qc.invalidateQueries({ queryKey: ["shop-products-banner"] });
  };

  const openEdit = (p: any) =>
    setForm({
      id: p.id,
      name: p.name || "",
      slug: p.slug || "",
      brand: p.brand || "",
      category: p.category || "interior",
      short_description: p.short_description || "",
      description: p.description || "",
      price: p.price != null ? String(p.price) : "",
      mrp: p.mrp != null ? String(p.mrp) : "",
      images: (p.images || []).join("\n"),
      highlights: (p.highlights || []).join("\n"),
      rating: p.rating != null ? String(p.rating) : "",
      review_count: p.review_count != null ? String(p.review_count) : "",
      buy_url: p.buy_url || "",
      merchant: p.merchant || "",
      is_featured: !!p.is_featured,
      is_active: !!p.is_active,
      sort_order: String(p.sort_order ?? 0),
    });

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.buy_url.trim()) return toast.error("Product link is required");
    if (!/^https?:\/\//i.test(form.buy_url.trim())) return toast.error("Product link must start with http:// or https://");
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      brand: form.brand.trim() || null,
      category: form.category,
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      mrp: form.mrp ? Number(form.mrp) : null,
      images: listFrom(form.images),
      highlights: listFrom(form.highlights),
      rating: form.rating ? Number(form.rating) : null,
      review_count: form.review_count ? Number(form.review_count) : null,
      buy_url: form.buy_url.trim(),
      merchant: form.merchant.trim() || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("shop_products").update(payload).eq("id", form.id)
      : await supabase.from("shop_products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Product updated" : "Product added");
    setForm(null);
    invalidate();
  };

  const remove = async () => {
    if (!del) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", del);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    setDel(null);
    invalidate();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Products Store</h1>
          <p className="text-sm text-muted-foreground">
            Products listed on the public store page. Buyers browse here and complete the purchase at the partner store link.
          </p>
        </div>
        <Button onClick={() => setForm({ ...emptyProduct })} className="gap-2">
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      {loadingData ? (
        <PageSkeleton />
      ) : products.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">No products yet</p>
          <p className="text-sm text-muted-foreground">Add your first product to publish the store page.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {products.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{p.name}</p>
                    {p.is_featured && <Badge className="gap-1"><Star className="h-3 w-3" /> Top pick</Badge>}
                    {!p.is_active && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {[p.brand, SHOP_CATEGORIES.find((c) => c.slug === p.category)?.label].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm font-medium">{formatCurrency(Number(p.price))}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.buy_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={p.buy_url} target="_blank" rel="noopener noreferrer" aria-label="Open product link">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDel(p.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>Shown on the public store page at /shop.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Product name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="70mai Dash Cam A510" />
              </div>
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="70mai" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHOP_CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Selling price (₹)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>MRP (₹)</Label>
                <Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Product link *</Label>
                <Input value={form.buy_url} onChange={(e) => setForm({ ...form, buy_url: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <Label>Store name</Label>
                <Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Partner store" />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Short description</Label>
                <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  placeholder="2K front + rear recording with night vision" />
              </div>
              <div className="sm:col-span-2">
                <Label>Image links (one per line, or comma separated)</Label>
                <Textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })}
                  placeholder={"https://…/image1.jpg\nhttps://…/image2.jpg"} />
              </div>
              <div className="sm:col-span-2">
                <Label>Highlights (one per line)</Label>
                <Textarea rows={3} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                  placeholder={"1 year warranty\nFits all cars"} />
              </div>
              <div className="sm:col-span-2">
                <Label>Full description</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Rating (0–5)</Label>
                <Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
              <div>
                <Label>Number of ratings</Label>
                <Input type="number" value={form.review_count} onChange={(e) => setForm({ ...form, review_count: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">Top pick</p><p className="text-xs text-muted-foreground">Show in the featured strip</p></div>
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">Visible</p><p className="text-xs text-muted-foreground">Show on the store page</p></div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        onConfirm={remove}
        title="Delete product?"
        description="This removes the product from the store page."
      />
    </div>
  );
};

export default AdminShop;
