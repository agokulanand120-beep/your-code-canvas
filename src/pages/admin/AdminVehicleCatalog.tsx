import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Layers } from "lucide-react";
import { getBrandsForType } from "@/lib/vehicleData";
import { loadVehicleCatalogOverlay } from "@/lib/vehicleCatalog";

type CatalogRow = {
  id: string;
  vehicle_type: string;
  brand: string;
  model: string | null;
  variant: string | null;
};

const types = [
  { value: "car", label: "Cars" },
  { value: "bike", label: "Bikes" },
  { value: "commercial", label: "Commercial" },
];

const AdminVehicleCatalog = () => {
  const { toast } = useToast();
  const [vehicleType, setVehicleType] = useState("car");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [open, setOpen] = useState(false);
  const [openExisting, setOpenExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ brand: "", model: "", variants: "" });
  const [exForm, setExForm] = useState({ brand: "", model: "", newModel: "", variants: "" });


  const load = async () => {
    const { data } = await supabase
      .from("vehicle_catalog")
      .select("id, vehicle_type, brand, model, variant")
      .order("brand");
    setRows((data || []) as CatalogRow[]);
    await loadVehicleCatalogOverlay(true);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customKeys = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) =>
      set.add(`${r.vehicle_type}|${r.brand}|${r.model || ""}|${r.variant || ""}`)
    );
    return set;
  }, [rows]);

  const brands = useMemo(() => {
    const all = getBrandsForType(vehicleType);
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all
      .map((b) => ({
        ...b,
        models: b.models.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            b.name.toLowerCase().includes(q) ||
            m.variants.some((v) => v.name.toLowerCase().includes(q))
        ),
      }))
      .filter((b) => b.name.toLowerCase().includes(q) || b.models.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, search, refreshKey]);

  const totals = useMemo(() => {
    const all = getBrandsForType(vehicleType);
    const models = all.reduce((n, b) => n + b.models.length, 0);
    const variants = all.reduce(
      (n, b) => n + b.models.reduce((k, m) => k + m.variants.length, 0),
      0
    );
    return { brands: all.length, models, variants };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, refreshKey]);

  const handleCreate = async () => {
    if (!form.brand.trim()) {
      toast({ title: "Brand is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const variants = form.variants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const base = {
        vehicle_type: vehicleType,
        brand: form.brand.trim(),
        created_by: userData.user?.id ?? null,
      };
      const payload =
        form.model.trim() && variants.length > 0
          ? variants.map((v) => ({ ...base, model: form.model.trim(), variant: v }))
          : form.model.trim()
          ? [{ ...base, model: form.model.trim(), variant: null }]
          : [{ ...base, model: null, variant: null }];

      const { error } = await supabase
        .from("vehicle_catalog")
        .upsert(payload, { onConflict: "vehicle_type,brand,model,variant", ignoreDuplicates: true });
      if (error) throw error;
      toast({ title: "Catalogue updated" });
      setForm({ brand: "", model: "", variants: "" });
      setOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allBrands = useMemo(() => getBrandsForType(vehicleType), [vehicleType, refreshKey]);
  const exModels = useMemo(
    () => allBrands.find((b) => b.name === exForm.brand)?.models ?? [],
    [allBrands, exForm.brand]
  );

  const handleAddToExisting = async () => {
    const brand = exForm.brand.trim();
    const model = (exForm.model === "__new__" ? exForm.newModel : exForm.model).trim();
    const variants = exForm.variants
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (!brand) {
      toast({ title: "Choose a brand", variant: "destructive" });
      return;
    }
    if (!model) {
      toast({ title: "Choose or enter a model", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const base = {
        vehicle_type: vehicleType,
        brand,
        created_by: userData.user?.id ?? null,
      };
      const payload =
        variants.length > 0
          ? variants.map((v) => ({ ...base, model, variant: v }))
          : [{ ...base, model, variant: null }];

      const { error } = await supabase
        .from("vehicle_catalog")
        .upsert(payload, { onConflict: "vehicle_type,brand,model,variant", ignoreDuplicates: true });
      if (error) throw error;
      toast({ title: "Added to catalogue" });
      setExForm({ brand: "", model: "", newModel: "", variants: "" });
      setOpenExisting(false);
      await load();
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vehicle_catalog").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Entry removed" });
    await load();
  };

  const customRows = rows.filter((r) => r.vehicle_type === vehicleType);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Brands, Models & Variants
          </h1>
          <p className="text-sm text-muted-foreground">
            {totals.brands} brands · {totals.models} models · {totals.variants} variants
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add brand / model / variants</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Hyundai"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. Creta N Line"
                />
              </div>
              <div className="space-y-2">
                <Label>Variants (comma separated)</Label>
                <Input
                  value={form.variants}
                  onChange={(e) => setForm({ ...form, variants: e.target.value })}
                  placeholder="N8, N10, N10 DCT"
                />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save to catalogue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openExisting} onOpenChange={setOpenExisting}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add to existing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add model / variants to an existing brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle type</Label>
                <Select
                  value={vehicleType}
                  onValueChange={(v) => {
                    setVehicleType(v);
                    setExForm({ brand: "", model: "", newModel: "", variants: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand *</Label>
                <Select
                  value={exForm.brand}
                  onValueChange={(v) =>
                    setExForm({ ...exForm, brand: v, model: "", newModel: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose brand" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allBrands.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model *</Label>
                <Select
                  value={exForm.model}
                  onValueChange={(v) => setExForm({ ...exForm, model: v })}
                  disabled={!exForm.brand}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={exForm.brand ? "Choose model" : "Select a brand first"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__new__">➕ New model…</SelectItem>
                    {exModels.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {exForm.model === "__new__" && (
                <div className="space-y-2">
                  <Label>New model name *</Label>
                  <Input
                    value={exForm.newModel}
                    onChange={(e) => setExForm({ ...exForm, newModel: e.target.value })}
                    placeholder="e.g. Creta N Line"
                  />
                </div>
              )}

              {exForm.model && exForm.model !== "__new__" && (
                <div className="flex flex-wrap gap-1.5">
                  {(exModels.find((m) => m.name === exForm.model)?.variants ?? []).map((v) => (
                    <Badge key={v.name} variant="outline" className="text-[11px]">
                      {v.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Variants to add (comma separated)</Label>
                <Input
                  value={exForm.variants}
                  onChange={(e) => setExForm({ ...exForm, variants: e.target.value })}
                  placeholder="N8, N10, N10 DCT"
                />
              </div>

              <Button onClick={handleAddToExisting} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Add to catalogue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={vehicleType} onValueChange={setVehicleType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search brand, model or variant"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-2 md:p-4">
        <Accordion type="multiple" className="w-full">
          {brands.map((brand) => (
            <AccordionItem key={brand.name} value={brand.name}>
              <AccordionTrigger className="text-sm font-semibold">
                <span className="flex items-center gap-2">
                  {brand.name}
                  <Badge variant="secondary">{brand.models.length} models</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {brand.models.map((model) => {
                    const isCustom = customKeys.has(
                      `${vehicleType}|${brand.name}|${model.name}|`
                    );
                    return (
                      <div
                        key={model.name}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium">{model.name}</span>
                          {isCustom && <Badge className="text-[10px]">Custom</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {model.variants.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              No variants added
                            </span>
                          )}
                          {model.variants.map((v) => (
                            <Badge key={v.name} variant="outline" className="text-[11px]">
                              {v.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {brand.models.length === 0 && (
                    <p className="text-xs text-muted-foreground">No models yet</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {customRows.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Custom entries you added</h2>
          <div className="space-y-2">
            {customRows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 text-sm border border-border rounded-lg px-3 py-2"
              >
                <span className="truncate">
                  {r.brand}
                  {r.model ? ` · ${r.model}` : ""}
                  {r.variant ? ` · ${r.variant}` : ""}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminVehicleCatalog;
