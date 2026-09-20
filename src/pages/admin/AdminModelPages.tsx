import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getBrandsForType } from "@/lib/vehicleData";
import { slugify } from "@/lib/seoSlug";

type Category = "cars" | "bikes" | "commercial";
type ModelRow = {
  id: string;
  category: string;
  brand: string;
  brand_slug: string | null;
  model: string;
  model_slug: string | null;
  segment: string;
  body_type: string;
  overview: unknown;
  quick_specs: unknown;
  new_price: string | null;
  images: string[];
  variants: unknown;
  faqs: unknown;
  is_active: boolean;
  updated_at: string;
};

type FormState = {
  id?: string;
  category: Category;
  brand: string;
  model: string;
  segment: string;
  bodyType: string;
  newPrice: string;
  overview: string;
  images: string;
  quickSpecs: string;
  variants: string;
  faqs: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  category: "cars",
  brand: "",
  model: "",
  segment: "",
  bodyType: "",
  newPrice: "",
  overview: "",
  images: "",
  quickSpecs: '{\n  "fuel": "Petrol",\n  "engine": "",\n  "transmission": "",\n  "mileage": "",\n  "seating": "5"\n}',
  variants: "[]",
  faqs: "[]",
  isActive: true,
});

const parseJson = (value: string, label: string) => {
  try {
    return JSON.parse(value || "null");
  } catch {
    throw new Error(`${label} contains invalid JSON`);
  }
};

const AdminModelPages = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [form, setForm] = useState<FormState>(emptyForm());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("model_docs")
      .select("id, category, brand, brand_slug, model, model_slug, segment, body_type, overview, quick_specs, new_price, images, variants, faqs, is_active, updated_at")
      .order("brand")
      .order("model")
      .limit(1000);
    if (error) toast({ title: "Could not load model pages", description: error.message, variant: "destructive" });
    setRows((data || []) as ModelRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const brands = useMemo(
    () => getBrandsForType(form.category === "bikes" ? "bike" : form.category === "commercial" ? "commercial" : "car"),
    [form.category],
  );
  const models = useMemo(() => brands.find((b) => b.name === form.brand)?.models || [], [brands, form.brand]);
  const filtered = useMemo(() => rows.filter((row) => {
    if (filter !== "all" && row.category !== filter) return false;
    const q = search.trim().toLowerCase();
    return !q || `${row.brand} ${row.model} ${row.segment}`.toLowerCase().includes(q);
  }), [rows, filter, search]);

  const startCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const startEdit = (row: ModelRow) => {
    setForm({
      id: row.id,
      category: row.category as Category,
      brand: row.brand,
      model: row.model,
      segment: row.segment,
      bodyType: row.body_type,
      newPrice: row.new_price || "",
      overview: Array.isArray(row.overview) ? row.overview.join("\n\n") : "",
      images: (row.images || []).join("\n"),
      quickSpecs: JSON.stringify(row.quick_specs || {}, null, 2),
      variants: JSON.stringify(row.variants || [], null, 2),
      faqs: JSON.stringify(row.faqs || [], null, 2),
      isActive: row.is_active,
    });
    setOpen(true);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again before uploading");
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${auth.user.id}/model-pages/${slugify(form.brand || "brand")}-${slugify(form.model || "model")}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("vehicle-images").upload(path, file, { upsert: false });
        if (error) throw error;
        uploaded.push(supabase.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl);
      }
      setForm((current) => ({ ...current, images: [current.images.trim(), ...uploaded].filter(Boolean).join("\n") }));
      toast({ title: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded` });
    } catch (error: any) {
      toast({ title: "Image upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.brand.trim() || !form.model.trim()) {
      toast({ title: "Brand and model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const quickSpecs = parseJson(form.quickSpecs, "Quick specifications");
      const variants = parseJson(form.variants, "Variants");
      const faqs = parseJson(form.faqs, "FAQs");
      if (!quickSpecs || Array.isArray(quickSpecs) || typeof quickSpecs !== "object") throw new Error("Quick specifications must be a JSON object");
      if (!Array.isArray(variants)) throw new Error("Variants must be a JSON array");
      if (!Array.isArray(faqs)) throw new Error("FAQs must be a JSON array");

      const payload = {
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        segment: form.segment.trim(),
        body_type: form.bodyType.trim(),
        new_price: form.newPrice.trim() || null,
        overview: form.overview.split(/\n\s*\n/).map((v) => v.trim()).filter(Boolean),
        images: form.images.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean),
        quick_specs: quickSpecs,
        variants,
        faqs,
        is_active: form.isActive,
      };
      const result = form.id
        ? await supabase.from("model_docs").update(payload).eq("id", form.id)
        : await supabase.from("model_docs").insert(payload);
      if (result.error) throw result.error;
      toast({ title: form.id ? "Model page updated" : "Model page created" });
      setOpen(false);
      await load();
    } catch (error: any) {
      toast({ title: "Could not save model page", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ModelRow) => {
    if (!window.confirm(`Delete ${row.brand} ${row.model}?`)) return;
    const { error } = await supabase.from("model_docs").delete().eq("id", row.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Model page deleted" }); await load(); }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Model Pages</h1>
          <p className="text-sm text-muted-foreground">Create and edit searchable car and bike information pages.</p>
        </div>
        <Button onClick={startCreate} className="gap-2"><Plus className="h-4 w-4" /> Add model page</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search model pages" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="cars">Cars</SelectItem>
            <SelectItem value="bikes">Bikes</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading model pages…</p> : (
          <div className="divide-y divide-border">
            {filtered.map((row) => {
              const path = `/${row.category}/${row.brand_slug || slugify(row.brand)}/${row.model_slug || slugify(row.model)}`;
              return (
                <div key={row.id} className="p-3 md:p-4 flex items-center gap-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {row.images?.[0] ? <img src={row.images[0]} alt="" className="h-full w-full object-contain" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{row.brand} {row.model}</p>
                      <Badge variant={row.is_active ? "default" : "secondary"}>{row.is_active ? "Active" : "Draft"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{path}</p>
                  </div>
                  <Button asChild size="icon" variant="ghost" title="Preview model page"><a href={path} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                  <Button size="icon" variant="ghost" title="Edit model page" onClick={() => startEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Delete model page" className="text-destructive" onClick={() => void remove(row)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
            {!filtered.length && <p className="p-6 text-center text-sm text-muted-foreground">No model pages found.</p>}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit model page" : "Add model page"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(category) => setForm({ ...form, category: category as Category, brand: "", model: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cars">Cars</SelectItem><SelectItem value="bikes">Bikes</SelectItem><SelectItem value="commercial">Commercial</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Brand</Label><Select value={form.brand} onValueChange={(brand) => setForm({ ...form, brand, model: "" })}><SelectTrigger><SelectValue placeholder="Choose brand" /></SelectTrigger><SelectContent className="max-h-72">{brands.map((brand) => <SelectItem key={brand.name} value={brand.name}>{brand.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Model</Label><Select value={models.some((m) => m.name === form.model) ? form.model : "__custom__"} onValueChange={(model) => setForm({ ...form, model: model === "__custom__" ? "" : model })}><SelectTrigger><SelectValue placeholder="Choose model" /></SelectTrigger><SelectContent className="max-h-72"><SelectItem value="__custom__">Enter another model</SelectItem>{models.map((model) => <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>)}</SelectContent></Select><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model name" /></div>
            <div className="space-y-2"><Label>Ex-showroom price range</Label><Input value={form.newPrice} onChange={(e) => setForm({ ...form, newPrice: e.target.value })} placeholder="₹8.49 – ₹12.56 Lakh" /></div>
            <div className="space-y-2"><Label>Segment</Label><Input value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} placeholder="Compact crossover" /></div>
            <div className="space-y-2"><Label>Body type</Label><Input value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} placeholder="Crossover" /></div>
          </div>
          <div className="space-y-2"><Label>Overview</Label><Textarea rows={4} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} placeholder="Separate paragraphs with a blank line." /></div>
          <div className="space-y-2"><Label>Images</Label><Textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="Paste comma-separated links or one link per line" /><Label className="inline-flex cursor-pointer"><Input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void uploadImages(e.target.files)} /><span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium"><ImagePlus className="h-4 w-4" />{uploading ? "Uploading…" : "Upload media"}</span></Label></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Quick specifications (JSON)</Label><Textarea className="font-mono text-xs min-h-44" value={form.quickSpecs} onChange={(e) => setForm({ ...form, quickSpecs: e.target.value })} /></div>
            <div className="space-y-2"><Label>Variants (JSON)</Label><Textarea className="font-mono text-xs min-h-44" value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} placeholder='[{"name":"Alpha","fuel":"Petrol"}]' /></div>
          </div>
          <div className="space-y-2"><Label>FAQs (JSON)</Label><Textarea className="font-mono text-xs" value={form.faqs} onChange={(e) => setForm({ ...form, faqs: e.target.value })} placeholder='[{"q":"Question?","a":"Answer"}]' /></div>
          <div className="flex items-center justify-between rounded-md border p-3"><div><Label>Published</Label><p className="text-xs text-muted-foreground">Active pages appear in the live sitemap automatically.</p></div><Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} /></div>
          <Button onClick={() => void save()} disabled={saving || uploading} className="w-full">{saving ? "Saving…" : "Save model page"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModelPages;