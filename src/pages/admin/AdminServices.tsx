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
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, ArrowLeft, Loader2, Star } from "lucide-react";

type Category = "loan" | "insurance" | "service";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "loan", label: "Car Loans" },
  { value: "insurance", label: "Insurance" },
  { value: "service", label: "Car Services" },
];

const emptyForm = {
  id: "",
  category: "loan" as Category,
  provider_name: "",
  logo_url: "",
  title: "",
  description: "",
  highlights: "",
  interest_rate_min: "",
  interest_rate_max: "",
  tenure_min_months: "",
  tenure_max_months: "",
  processing_fee: "",
  max_loan_amount: "",
  premium_starting: "",
  idv_coverage: "",
  claim_settlement_ratio: "",
  cashless_garages: "",
  service_price_starting: "",
  service_types: "",
  turnaround_time: "",
  city: "",
  contact_phone: "",
  contact_email: "",
  website_url: "",
  cta_label: "",
  cta_url: "",
  rating: "",
  is_featured: false,
  is_active: true,
  sort_order: "0",
};

type FormState = typeof emptyForm;

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const arr = (v: string) =>
  v.split(/\n|,/).map((s) => s.trim()).filter(Boolean);

const AdminServices = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Category>("loan");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: listings = [], isLoading: loadingList } = useQuery({
    queryKey: ["admin-service-listings"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const rows = useMemo(
    () => listings.filter((l: any) => l.category === tab),
    [listings, tab],
  );

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const openNew = () => setForm({ ...emptyForm, category: tab });

  const openEdit = (l: any) =>
    setForm({
      id: l.id,
      category: l.category,
      provider_name: l.provider_name || "",
      logo_url: l.logo_url || "",
      title: l.title || "",
      description: l.description || "",
      highlights: (l.highlights || []).join("\n"),
      interest_rate_min: l.interest_rate_min?.toString() || "",
      interest_rate_max: l.interest_rate_max?.toString() || "",
      tenure_min_months: l.tenure_min_months?.toString() || "",
      tenure_max_months: l.tenure_max_months?.toString() || "",
      processing_fee: l.processing_fee || "",
      max_loan_amount: l.max_loan_amount?.toString() || "",
      premium_starting: l.premium_starting?.toString() || "",
      idv_coverage: l.idv_coverage || "",
      claim_settlement_ratio: l.claim_settlement_ratio?.toString() || "",
      cashless_garages: l.cashless_garages?.toString() || "",
      service_price_starting: l.service_price_starting?.toString() || "",
      service_types: (l.service_types || []).join("\n"),
      turnaround_time: l.turnaround_time || "",
      city: l.city || "",
      contact_phone: l.contact_phone || "",
      contact_email: l.contact_email || "",
      website_url: l.website_url || "",
      cta_label: l.cta_label || "",
      cta_url: l.cta_url || "",
      rating: l.rating?.toString() || "",
      is_featured: !!l.is_featured,
      is_active: !!l.is_active,
      sort_order: (l.sort_order ?? 0).toString(),
    });

  const save = async () => {
    if (!form) return;
    if (!form.provider_name.trim() || !form.title.trim()) {
      toast.error("Provider name and title are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      category: form.category,
      provider_name: form.provider_name.trim(),
      logo_url: form.logo_url.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      highlights: arr(form.highlights),
      interest_rate_min: num(form.interest_rate_min),
      interest_rate_max: num(form.interest_rate_max),
      tenure_min_months: num(form.tenure_min_months),
      tenure_max_months: num(form.tenure_max_months),
      processing_fee: form.processing_fee.trim() || null,
      max_loan_amount: num(form.max_loan_amount),
      premium_starting: num(form.premium_starting),
      idv_coverage: form.idv_coverage.trim() || null,
      claim_settlement_ratio: num(form.claim_settlement_ratio),
      cashless_garages: num(form.cashless_garages),
      service_price_starting: num(form.service_price_starting),
      service_types: arr(form.service_types),
      turnaround_time: form.turnaround_time.trim() || null,
      city: form.city.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      website_url: form.website_url.trim() || null,
      cta_label: form.cta_label.trim() || null,
      cta_url: form.cta_url.trim() || null,
      rating: num(form.rating),
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = form.id
      ? await supabase.from("service_listings").update(payload).eq("id", form.id)
      : await supabase.from("service_listings").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Listing updated" : "Listing created");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["admin-service-listings"] });
    qc.invalidateQueries({ queryKey: ["service-listings"] });
  };

  const toggleActive = async (l: any) => {
    const { error } = await supabase
      .from("service_listings")
      .update({ is_active: !l.is_active })
      .eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success(l.is_active ? "Listing deactivated" : "Listing activated");
    qc.invalidateQueries({ queryKey: ["admin-service-listings"] });
    qc.invalidateQueries({ queryKey: ["service-listings"] });
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("service_listings").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    qc.invalidateQueries({ queryKey: ["admin-service-listings"] });
  };

  const set = (k: keyof FormState, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const cat = form?.category;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <div>
            <Link to="/admin/vendors" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Services management
            </h1>
            <p className="text-sm text-muted-foreground">Car loans, insurance and car service listings</p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New listing
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Category)}>
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>
                {c.label} ({listings.filter((l: any) => l.category === c.value).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loadingList ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <p className="font-semibold">No listings yet</p>
              <Button onClick={openNew}>Add the first listing</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((l: any) => (
              <Card key={l.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {l.logo_url && (
                      <img src={l.logo_url} alt={`${l.provider_name} logo`} loading="lazy"
                        className="h-10 w-10 rounded object-contain bg-muted p-1" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{l.provider_name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{l.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {l.is_featured && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" />Featured</Badge>}
                      <Badge variant={l.is_active ? "default" : "outline"}>
                        {l.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {l.city && <span>{l.city}</span>}
                    <span>Order {l.sort_order}</span>
                    {l.rating != null && <span>★ {l.rating}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(l)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(l)}>
                      {l.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(l.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit listing" : "New listing"}</DialogTitle>
            <DialogDescription>Fields adapt to the selected category.</DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Tabs value={form.category} onValueChange={(v) => set("category", v as Category)}>
                    <TabsList className="w-full">
                      {CATEGORIES.map((c) => (
                        <TabsTrigger key={c.value} value={c.value} className="flex-1">{c.label}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-provider">Provider name *</Label>
                  <Input id="sl-provider" value={form.provider_name}
                    onChange={(e) => set("provider_name", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sl-title">Offer title *</Label>
                <Input id="sl-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sl-desc">Description</Label>
                <Textarea id="sl-desc" rows={3} value={form.description}
                  onChange={(e) => set("description", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sl-high">Highlights (one per line)</Label>
                <Textarea id="sl-high" rows={3} value={form.highlights}
                  onChange={(e) => set("highlights", e.target.value)} />
              </div>

              {cat === "loan" && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-irmin">Interest min (%)</Label>
                    <Input id="sl-irmin" inputMode="decimal" value={form.interest_rate_min}
                      onChange={(e) => set("interest_rate_min", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-irmax">Interest max (%)</Label>
                    <Input id="sl-irmax" inputMode="decimal" value={form.interest_rate_max}
                      onChange={(e) => set("interest_rate_max", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-maxamt">Max loan amount (₹)</Label>
                    <Input id="sl-maxamt" inputMode="numeric" value={form.max_loan_amount}
                      onChange={(e) => set("max_loan_amount", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-tmin">Tenure min (months)</Label>
                    <Input id="sl-tmin" inputMode="numeric" value={form.tenure_min_months}
                      onChange={(e) => set("tenure_min_months", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-tmax">Tenure max (months)</Label>
                    <Input id="sl-tmax" inputMode="numeric" value={form.tenure_max_months}
                      onChange={(e) => set("tenure_max_months", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-fee">Processing fee</Label>
                    <Input id="sl-fee" value={form.processing_fee}
                      onChange={(e) => set("processing_fee", e.target.value)} />
                  </div>
                </div>
              )}

              {cat === "insurance" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-prem">Premium starting (₹)</Label>
                    <Input id="sl-prem" inputMode="numeric" value={form.premium_starting}
                      onChange={(e) => set("premium_starting", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-csr">Claim settlement ratio (%)</Label>
                    <Input id="sl-csr" inputMode="decimal" value={form.claim_settlement_ratio}
                      onChange={(e) => set("claim_settlement_ratio", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-gar">Cashless garages</Label>
                    <Input id="sl-gar" inputMode="numeric" value={form.cashless_garages}
                      onChange={(e) => set("cashless_garages", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-idv">IDV / coverage</Label>
                    <Input id="sl-idv" value={form.idv_coverage}
                      onChange={(e) => set("idv_coverage", e.target.value)} />
                  </div>
                </div>
              )}

              {cat === "service" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-price">Starting price (₹)</Label>
                    <Input id="sl-price" inputMode="numeric" value={form.service_price_starting}
                      onChange={(e) => set("service_price_starting", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sl-tat">Turnaround time</Label>
                    <Input id="sl-tat" placeholder="e.g. 4 hours" value={form.turnaround_time}
                      onChange={(e) => set("turnaround_time", e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="sl-stypes">Service types (one per line)</Label>
                    <Textarea id="sl-stypes" rows={3} value={form.service_types}
                      onChange={(e) => set("service_types", e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sl-city">District / city</Label>
                  <Input id="sl-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-logo">Logo URL</Label>
                  <Input id="sl-logo" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-phone">Contact phone</Label>
                  <Input id="sl-phone" value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-email">Contact email</Label>
                  <Input id="sl-email" value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-web">Website URL</Label>
                  <Input id="sl-web" value={form.website_url}
                    onChange={(e) => set("website_url", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-ctal">CTA label</Label>
                  <Input id="sl-ctal" placeholder="Get this offer" value={form.cta_label}
                    onChange={(e) => set("cta_label", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-ctau">CTA URL</Label>
                  <Input id="sl-ctau" value={form.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-rating">Rating (0-5)</Label>
                  <Input id="sl-rating" inputMode="decimal" value={form.rating}
                    onChange={(e) => set("rating", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sl-order">Sort order</Label>
                  <Input id="sl-order" inputMode="numeric" value={form.sort_order}
                    onChange={(e) => set("sort_order", e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="sl-feat" checked={form.is_featured}
                    onCheckedChange={(v) => set("is_featured", v)} />
                  <Label htmlFor="sl-feat">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sl-active" checked={form.is_active}
                    onCheckedChange={(v) => set("is_active", v)} />
                  <Label htmlFor="sl-active">Active</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={remove}
        title="Delete listing"
        description="This listing will be permanently removed from the public services pages."
      />
    </div>
  );
};

export default AdminServices;
