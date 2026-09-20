import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, ArrowLeft, Loader2, Package, Star } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

const emptyCategory = { id: "", name: "", slug: "", description: "", image_url: "", sort_order: "0", is_active: true };
const emptyProduct = {
  id: "", category_id: "", name: "", slug: "", brand: "", short_description: "", description: "",
  price: "", mrp: "", images: "", features: "", specifications: "", compatible_brands: "",
  sku: "", warranty: "", stock_status: "in_stock", rating: "", review_count: "",
  is_featured: false, is_active: true, sort_order: "0",
};

type CatForm = typeof emptyCategory;
type ProdForm = typeof emptyProduct;

const AdminAccessories = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [catForm, setCatForm] = useState<CatForm | null>(null);
  const [prodForm, setProdForm] = useState<ProdForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<{ table: "accessory_categories" | "accessory_products"; id: string } | null>(null);

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-accessories"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [cats, prods] = await Promise.all([
        supabase.from("accessory_categories").select("*").order("sort_order"),
        supabase.from("accessory_products").select("*").order("sort_order"),
      ]);
      return { categories: cats.data || [], products: prods.data || [] };
    },
  });

  const categories = useMemo(() => data?.categories || [], [data]);
  const products = useMemo(() => data?.products || [], [data]);

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-accessories"] });
    qc.invalidateQueries({ queryKey: ["accessories-catalog"] });
  };

  const saveCategory = async () => {
    if (!catForm) return;
    if (!catForm.name.trim()) return toast.error("Category name is required");
    setSaving(true);
    const payload = {
      name: catForm.name.trim(),
      slug: slugify(catForm.slug || catForm.name),
      description: catForm.description.trim() || null,
      image_url: catForm.image_url.trim() || null,
      sort_order: Number(catForm.sort_order) || 0,
      is_active: catForm.is_active,
    };
    const { error } = catForm.id
      ? await supabase.from("accessory_categories").update(payload).eq("id", catForm.id)
      : await supabase.from("accessory_categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(catForm.id ? "Category updated" : "Category created");
    setCatForm(null);
    invalidate();
  };

  const saveProduct = async () => {
    if (!prodForm) return;
    if (!prodForm.name.trim()) return toast.error("Product name is required");
    let specs: Record<string, unknown> = {};
    if (prodForm.specifications.trim()) {
      try {
        // Accept either JSON or "Key: Value" lines
        specs = prodForm.specifications.trim().startsWith("{")
          ? JSON.parse(prodForm.specifications)
          : Object.fromEntries(
              lines(prodForm.specifications)
                .map((l) => l.split(":"))
                .filter((p) => p.length >= 2)
                .map((p) => [p[0].trim(), p.slice(1).join(":").trim()]),
            );
      } catch {
        return toast.error("Specifications must be valid JSON or 'Key: Value' lines");
      }
    }
    setSaving(true);
    const payload: any = {
      category_id: prodForm.category_id || null,
      name: prodForm.name.trim(),
      slug: slugify(prodForm.slug || prodForm.name),
      brand: prodForm.brand.trim() || null,
      short_description: prodForm.short_description.trim() || null,
      description: prodForm.description.trim() || null,
      price: Number(prodForm.price) || 0,
      mrp: prodForm.mrp.trim() ? Number(prodForm.mrp) : null,
      images: lines(prodForm.images),
      features: lines(prodForm.features),
      specifications: specs,
      compatible_brands: prodForm.compatible_brands.split(",").map((s) => s.trim()).filter(Boolean),
      sku: prodForm.sku.trim() || null,
      warranty: prodForm.warranty.trim() || null,
      stock_status: prodForm.stock_status,
      rating: prodForm.rating.trim() ? Number(prodForm.rating) : null,
      review_count: prodForm.review_count.trim() ? Number(prodForm.review_count) : 0,
      is_featured: prodForm.is_featured,
      is_active: prodForm.is_active,
      sort_order: Number(prodForm.sort_order) || 0,
    };
    const { error } = prodForm.id
      ? await supabase.from("accessory_products").update(payload).eq("id", prodForm.id)
      : await supabase.from("accessory_products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(prodForm.id ? "Product updated" : "Product created");
    setProdForm(null);
    invalidate();
  };

  const toggleActive = async (table: "accessory_categories" | "accessory_products", row: any) => {
    const { error } = await supabase.from(table).update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.is_active ? "Deactivated" : "Activated");
    invalidate();
  };

  const remove = async () => {
    if (!del) return;
    const { error } = await supabase.from(del.table).delete().eq("id", del.id);
    setDel(null);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    invalidate();
  };

  const editProduct = (p: any) =>
    setProdForm({
      id: p.id,
      category_id: p.category_id || "",
      name: p.name || "",
      slug: p.slug || "",
      brand: p.brand || "",
      short_description: p.short_description || "",
      description: p.description || "",
      price: p.price?.toString() || "",
      mrp: p.mrp?.toString() || "",
      images: (p.images || []).join("\n"),
      features: (p.features || []).join("\n"),
      specifications: p.specifications && Object.keys(p.specifications).length
        ? Object.entries(p.specifications).map(([k, v]) => `${k}: ${v}`).join("\n") : "",
      compatible_brands: (p.compatible_brands || []).join(", "),
      sku: p.sku || "",
      warranty: p.warranty || "",
      stock_status: p.stock_status || "in_stock",
      rating: p.rating?.toString() || "",
      review_count: (p.review_count ?? 0).toString(),
      is_featured: !!p.is_featured,
      is_active: !!p.is_active,
      sort_order: (p.sort_order ?? 0).toString(),
    });

  const setC = (k: keyof CatForm, v: any) => setCatForm((f) => (f ? { ...f, [k]: v } : f));
  const setP = (k: keyof ProdForm, v: any) => setProdForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <div>
            <Link to="/admin/vendors" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Accessories management
            </h1>
            <p className="text-sm text-muted-foreground">Categories and products for the accessories store</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => (tab === "products" ? setProdForm({ ...emptyProduct }) : setCatForm({ ...emptyCategory }))}
          >
            <Plus className="h-4 w-4" /> {tab === "products" ? "New product" : "New category"}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loadingData ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : tab === "products" ? (
          products.length === 0 ? (
            <Card><CardContent className="py-16 text-center space-y-3">
              <p className="font-semibold">No products yet</p>
              <Button onClick={() => setProdForm({ ...emptyProduct })}>Add the first product</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.map((p: any) => (
                <Card key={p.id}><CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                        : <Package className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(p.price))}
                        {" · "}
                        {categories.find((c: any) => c.id === p.category_id)?.name || "Uncategorised"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {p.is_featured && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" />Featured</Badge>}
                      <Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => editProduct(p)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive("accessory_products", p)}>
                      {p.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => setDel({ table: "accessory_products", id: p.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        ) : categories.length === 0 ? (
          <Card><CardContent className="py-16 text-center space-y-3">
            <p className="font-semibold">No categories yet</p>
            <Button onClick={() => setCatForm({ ...emptyCategory })}>Add the first category</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((c: any) => (
              <Card key={c.id}><CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {c.image_url
                      ? <img src={c.image_url} alt={`${c.name} category`} loading="lazy" className="h-full w-full object-cover" />
                      : <Package className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
                  </div>
                  <Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1"
                    onClick={() => setCatForm({
                      id: c.id, name: c.name || "", slug: c.slug || "", description: c.description || "",
                      image_url: c.image_url || "", sort_order: (c.sort_order ?? 0).toString(), is_active: !!c.is_active,
                    })}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive("accessory_categories", c)}>
                    {c.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => setDel({ table: "accessory_categories", id: c.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>

      {/* Category dialog */}
      <Dialog open={!!catForm} onOpenChange={(o) => !o && setCatForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{catForm?.id ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Category cards appear at the top of the accessories store.</DialogDescription>
          </DialogHeader>
          {catForm && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ac-name">Name *</Label>
                <Input id="ac-name" value={catForm.name} onChange={(e) => setC("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-slug">Slug</Label>
                <Input id="ac-slug" placeholder="auto from name" value={catForm.slug}
                  onChange={(e) => setC("slug", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-img">Card image URL</Label>
                <Input id="ac-img" value={catForm.image_url} onChange={(e) => setC("image_url", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-desc">Description</Label>
                <Textarea id="ac-desc" rows={2} value={catForm.description}
                  onChange={(e) => setC("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="ac-order">Sort order</Label>
                  <Input id="ac-order" inputMode="numeric" value={catForm.sort_order}
                    onChange={(e) => setC("sort_order", e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="ac-active" checked={catForm.is_active} onCheckedChange={(v) => setC("is_active", v)} />
                  <Label htmlFor="ac-active">Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatForm(null)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product dialog */}
      <Dialog open={!!prodForm} onOpenChange={(o) => !o && setProdForm(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{prodForm?.id ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>These fields power the product card and the detail page.</DialogDescription>
          </DialogHeader>
          {prodForm && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ap-name">Product name *</Label>
                  <Input id="ap-name" value={prodForm.name} onChange={(e) => setP("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-slug">Slug</Label>
                  <Input id="ap-slug" placeholder="auto from name" value={prodForm.slug}
                    onChange={(e) => setP("slug", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={prodForm.category_id || "none"}
                    onValueChange={(v) => setP("category_id", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorised</SelectItem>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-brand">Brand</Label>
                  <Input id="ap-brand" value={prodForm.brand} onChange={(e) => setP("brand", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-price">Selling price (₹) *</Label>
                  <Input id="ap-price" inputMode="numeric" value={prodForm.price}
                    onChange={(e) => setP("price", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-mrp">MRP (₹)</Label>
                  <Input id="ap-mrp" inputMode="numeric" value={prodForm.mrp}
                    onChange={(e) => setP("mrp", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-sku">SKU</Label>
                  <Input id="ap-sku" value={prodForm.sku} onChange={(e) => setP("sku", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-warranty">Warranty</Label>
                  <Input id="ap-warranty" placeholder="e.g. 1 year brand warranty"
                    value={prodForm.warranty} onChange={(e) => setP("warranty", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock status</Label>
                  <Select value={prodForm.stock_status} onValueChange={(v) => setP("stock_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of stock</SelectItem>
                      <SelectItem value="made_to_order">Made to order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-rating">Rating (0-5)</Label>
                  <Input id="ap-rating" inputMode="decimal" value={prodForm.rating}
                    onChange={(e) => setP("rating", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-reviews">Review count</Label>
                  <Input id="ap-reviews" inputMode="numeric" value={prodForm.review_count}
                    onChange={(e) => setP("review_count", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ap-order">Sort order</Label>
                  <Input id="ap-order" inputMode="numeric" value={prodForm.sort_order}
                    onChange={(e) => setP("sort_order", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-short">Short description</Label>
                <Input id="ap-short" value={prodForm.short_description}
                  onChange={(e) => setP("short_description", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-desc">Full description</Label>
                <Textarea id="ap-desc" rows={4} value={prodForm.description}
                  onChange={(e) => setP("description", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-images">Image URLs (one per line)</Label>
                <Textarea id="ap-images" rows={3} value={prodForm.images}
                  onChange={(e) => setP("images", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-features">Features (one per line)</Label>
                <Textarea id="ap-features" rows={3} value={prodForm.features}
                  onChange={(e) => setP("features", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-specs">Specifications (“Key: Value” per line or JSON)</Label>
                <Textarea id="ap-specs" rows={3} value={prodForm.specifications}
                  onChange={(e) => setP("specifications", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-compat">Compatible car brands (comma separated)</Label>
                <Input id="ap-compat" value={prodForm.compatible_brands}
                  onChange={(e) => setP("compatible_brands", e.target.value)} />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="ap-feat" checked={prodForm.is_featured} onCheckedChange={(v) => setP("is_featured", v)} />
                  <Label htmlFor="ap-feat">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="ap-active" checked={prodForm.is_active} onCheckedChange={(v) => setP("is_active", v)} />
                  <Label htmlFor="ap-active">Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdForm(null)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        onConfirm={remove}
        title="Delete item"
        description="This will permanently remove the item from the accessories store."
      />
    </div>
  );
};

export default AdminAccessories;
