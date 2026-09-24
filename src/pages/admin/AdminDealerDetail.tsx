import { useEffect, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, BarChart3, Globe, User, Car, Inbox, Flag, Loader2, Trash2, Plus, KeyRound } from "lucide-react";
import { format } from "date-fns";
import MarketplaceAnalytics from "@/pages/MarketplaceAnalytics";
import PublicPageAnalytics from "@/pages/PublicPageAnalytics";
import DealerProfileFields, { DealerProfileValues } from "@/components/admin/DealerProfileFields";
import { formatCurrency } from "@/lib/formatters";

type Tab = "profile" | "inventory" | "leads" | "claims" | "catalogue" | "marketplace";

const PROFILE_KEYS = [
  "dealer_name","shop_tagline","dealer_tag","dealer_phone","whatsapp_number","dealer_email","dealer_address","dealer_gst",
  "gmap_link","shop_logo_url","marketplace_tagline","marketplace_description","marketplace_working_hours","marketplace_badge",
  "google_reviews_rating","google_reviews_count","google_reviews_url","managed_source_note","seo_title","seo_description",
  "plan","marketplace_enabled","marketplace_status","marketplace_featured",
];

const emptyVehicle = {
  vehicle_type: "car", brand: "", model: "", variant: "", manufacturing_year: "", fuel_type: "petrol",
  transmission: "manual", odometer_reading: "", selling_price: "", color: "", registration_number: "",
  number_of_owners: "1", public_description: "",
};

const AdminDealerDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<DealerProfileValues | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [vehOpen, setVehOpen] = useState(false);
  const [veh, setVeh] = useState<any>(emptyVehicle);
  const [vehFiles, setVehFiles] = useState<File[]>([]);
  const [savingVeh, setSavingVeh] = useState(false);
  const [assign, setAssign] = useState<{ claimId?: string; email: string; password: string } | null>(null);
  const [assigning, setAssigning] = useState(false);

  const { data: dealer } = useQuery({
    queryKey: ["admin-dealer-detail", userId],
    enabled: !!userId && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (dealer) {
      const p: DealerProfileValues = {};
      PROFILE_KEYS.forEach((k) => (p[k] = (dealer as any)[k] ?? (typeof (dealer as any)[k] === "boolean" ? false : "")));
      setProfile(p);
    }
  }, [dealer]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["admin-dealer-vehicles", userId],
    enabled: !!userId && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, variant, manufacturing_year, selling_price, status, marketplace_status, is_public, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-dealer-leads", userId],
    enabled: !!userId && isAdmin && tab === "leads",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, phone, email, city, vehicle_interest, source, status, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["admin-dealer-claims", userId],
    enabled: !!userId && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealer_claims")
        .select("*")
        .eq("dealer_user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const saveProfile = async () => {
    if (!profile?.dealer_name?.trim()) {
      toast({ title: "Dealer name is required", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    const patch: any = { ...profile };
    patch.google_reviews_rating = profile.google_reviews_rating === "" ? null : Number(profile.google_reviews_rating);
    patch.google_reviews_count = profile.google_reviews_count === "" ? null : Number(profile.google_reviews_count);
    Object.keys(patch).forEach((k) => { if (patch[k] === "") patch[k] = null; });
    patch.dealer_name = profile.dealer_name.trim();
    patch.plan = profile.plan || "lister";
    const { error } = await supabase.from("settings").update(patch).eq("user_id", userId!);
    setSavingProfile(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-dealer-detail", userId] });
    qc.invalidateQueries({ queryKey: ["admin-dealer-accounts"] });
    toast({ title: "Profile saved" });
  };

  const saveVehicle = async () => {
    if (!veh.brand.trim() || !veh.model.trim()) {
      toast({ title: "Brand and model are required", variant: "destructive" });
      return;
    }
    setSavingVeh(true);
    try {
      const num = (v: string) => (v === "" ? null : Number(v));
      const { data: created, error } = await supabase
        .from("vehicles")
        .insert({
          user_id: userId!,
          code: `ADM-${Date.now().toString(36).toUpperCase()}`,
          vehicle_type: veh.vehicle_type,
          brand: veh.brand.trim(),
          model: veh.model.trim(),
          variant: veh.variant.trim() || null,
          manufacturing_year: num(veh.manufacturing_year),
          fuel_type: veh.fuel_type,
          transmission: veh.transmission,
          odometer_reading: num(veh.odometer_reading),
          selling_price: num(veh.selling_price),
          color: veh.color.trim() || null,
          registration_number: veh.registration_number.trim() || null,
          number_of_owners: num(veh.number_of_owners),
          public_description: veh.public_description.trim() || null,
          status: "in_stock",
          is_public: true,
          marketplace_status: "approved",
          purchase_status: "received",
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      for (let i = 0; i < vehFiles.length; i++) {
        const f = vehFiles[i];
        const path = `${userId}/${created.id}/${Date.now()}-${i}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("vehicle-images").upload(path, f);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("vehicle-images").getPublicUrl(path);
        await supabase.from("vehicle_images").insert({
          user_id: userId!, vehicle_id: created.id, image_url: pub.publicUrl, is_primary: i === 0, display_order: i,
        });
      }
      setVehOpen(false);
      setVeh(emptyVehicle);
      setVehFiles([]);
      qc.invalidateQueries({ queryKey: ["admin-dealer-vehicles", userId] });
      toast({ title: "Vehicle added and listed" });
    } catch (e: any) {
      toast({ title: "Could not add vehicle", description: e.message, variant: "destructive" });
    } finally {
      setSavingVeh(false);
    }
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "in_stock") { patch.is_public = true; patch.marketplace_status = "approved"; }
    const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-dealer-vehicles", userId] });
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    await supabase.from("vehicle_images").delete().eq("vehicle_id", id);
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-dealer-vehicles", userId] });
  };

  const setClaimStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("dealer_claims").update({ status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-dealer-claims", userId] });
  };

  const doAssign = async () => {
    if (!assign) return;
    if (!/^\S+@\S+\.\S+$/.test(assign.email) || assign.password.length < 8) {
      toast({ title: "Enter a valid email and a password of at least 8 characters", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-assign-dealer", {
        body: { user_id: userId, email: assign.email.trim(), password: assign.password, claim_id: assign.claimId },
      });
      if (error) {
        const details = "context" in error ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Account assigned", description: `Dealer can now sign in with ${assign.email}` });
      setAssign(null);
      qc.invalidateQueries({ queryKey: ["admin-dealer-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-dealer-claims", userId] });
      qc.invalidateQueries({ queryKey: ["admin-dealer-accounts"] });
    } catch (e: any) {
      toast({ title: "Could not assign account", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const newClaims = claims.filter((c: any) => c.status === "new").length;
  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "inventory" as Tab, label: `Inventory (${vehicles.length})`, icon: Car },
    { id: "leads" as Tab, label: "Leads", icon: Inbox },
    { id: "claims" as Tab, label: `Claims${newClaims ? ` (${newClaims})` : ""}`, icon: Flag },
    { id: "catalogue" as Tab, label: "Catalogue Analytics", icon: Globe },
    { id: "marketplace" as Tab, label: "Marketplace Analytics", icon: BarChart3 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
            <Link to="/admin/dealer-accounts"><ArrowLeft className="h-4 w-4" /> Back to dealer accounts</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-5 w-5" /> {dealer?.dealer_name || "Dealer"}
          </h1>
          <p className="text-sm text-muted-foreground">{dealer?.dealer_email || "—"} · {dealer?.dealer_phone || "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dealer?.is_admin_managed ? (
            <Badge variant="outline" className="border-primary text-primary">Managed by admin · unclaimed</Badge>
          ) : (
            <Badge variant="default">Owned by dealer</Badge>
          )}
          <Badge variant="secondary">{dealer?.plan ?? "complete"}</Badge>
          {dealer?.is_admin_managed && (
            <Button size="sm" className="gap-1" onClick={() => setAssign({ email: "", password: "" })}>
              <KeyRound className="h-4 w-4" /> Create login & assign
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && profile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dealer profile</CardTitle>
            <CardDescription>Everything the dealer would normally fill in themselves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DealerProfileFields value={profile} onChange={setProfile} showManagedNote={!!dealer?.is_admin_managed} />
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "inventory" && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Inventory</CardTitle>
            <Button size="sm" className="gap-1" onClick={() => setVehOpen(true)}><Plus className="h-4 w-4" /> Add vehicle</Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead>
                  <TableHead>Marketplace</TableHead><TableHead>Added</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No vehicles yet.</TableCell></TableRow>
                )}
                {vehicles.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{[v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" ")}</TableCell>
                    <TableCell>{v.selling_price ? formatCurrency(v.selling_price) : "—"}</TableCell>
                    <TableCell>
                      <Select value={v.status} onValueChange={(s) => updateVehicleStatus(v.id, s)}>
                        <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In stock</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant={v.is_public ? "default" : "secondary"}>{v.marketplace_status || "—"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(v.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteVehicle(v.id)} aria-label="Delete vehicle">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "leads" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Leads received ({leads.length})</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Interest</TableHead>
                  <TableHead>City</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leads yet.</TableCell></TableRow>
                )}
                {leads.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.customer_name}</TableCell>
                    <TableCell><a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a></TableCell>
                    <TableCell>{l.vehicle_interest || "—"}</TableCell>
                    <TableCell>{l.city || "—"}</TableCell>
                    <TableCell>{l.source}</TableCell>
                    <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "claims" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ownership claims</CardTitle>
            <CardDescription>People who say they own this business. Verify by phone, then create their login.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead>
                  <TableHead>Message</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No claims yet.</TableCell></TableRow>
                )}
                {claims.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell><a href={`tel:${c.phone}`} className="text-primary hover:underline">{c.phone}</a></TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell className="max-w-[240px] truncate" title={c.message}>{c.message || "—"}</TableCell>
                    <TableCell><Badge variant={c.status === "new" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="flex gap-1">
                      {dealer?.is_admin_managed && c.status !== "approved" && (
                        <Button size="sm" onClick={() => setAssign({ claimId: c.id, email: c.email || "", password: "" })}>Approve & assign</Button>
                      )}
                      {c.status === "new" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setClaimStatus(c.id, "contacted")}>Contacted</Button>
                          <Button size="sm" variant="ghost" onClick={() => setClaimStatus(c.id, "rejected")}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(tab === "catalogue" || tab === "marketplace") && (
        <Card>
          <CardContent className="p-0 md:p-2">
            {userId && (tab === "catalogue" ? <PublicPageAnalytics userId={userId} /> : <MarketplaceAnalytics userId={userId} />)}
          </CardContent>
        </Card>
      )}

      <Dialog open={vehOpen} onOpenChange={setVehOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add vehicle for {dealer?.dealer_name}</DialogTitle>
            <DialogDescription>It will be listed on the marketplace straight away.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={veh.vehicle_type} onValueChange={(v) => setVeh({ ...veh, vehicle_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="car">Car</SelectItem><SelectItem value="bike">Bike</SelectItem></SelectContent>
              </Select>
            </div>
            {([
              ["brand", "Brand *"], ["model", "Model *"], ["variant", "Variant"], ["manufacturing_year", "Year"],
              ["odometer_reading", "KM driven"], ["selling_price", "Price (₹)"], ["color", "Colour"],
              ["registration_number", "Registration no."], ["number_of_owners", "Owners"],
            ] as const).map(([k, l]) => (
              <div key={k}>
                <Label>{l}</Label>
                <Input
                  type={["manufacturing_year", "odometer_reading", "selling_price", "number_of_owners"].includes(k) ? "number" : "text"}
                  value={veh[k]}
                  onChange={(e) => setVeh({ ...veh, [k]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <Label>Fuel</Label>
              <Select value={veh.fuel_type} onValueChange={(v) => setVeh({ ...veh, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["petrol", "diesel", "cng", "electric", "hybrid"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transmission</Label>
              <Select value={veh.transmission} onValueChange={(v) => setVeh({ ...veh, transmission: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="automatic">Automatic</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input value={veh.public_description} maxLength={1000} onChange={(e) => setVeh({ ...veh, public_description: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Photos</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => setVehFiles(Array.from(e.target.files ?? []))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setVehOpen(false)}>Cancel</Button>
            <Button onClick={saveVehicle} disabled={savingVeh}>{savingVeh && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assign} onOpenChange={(o) => !o && setAssign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create login & hand over</DialogTitle>
            <DialogDescription>The dealer will own this profile, its inventory and leads from now on.</DialogDescription>
          </DialogHeader>
          {assign && (
            <div className="space-y-3">
              <div><Label>Dealer email</Label><Input type="email" value={assign.email} onChange={(e) => setAssign({ ...assign, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input value={assign.password} maxLength={72} onChange={(e) => setAssign({ ...assign, password: e.target.value })} /></div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssign(null)}>Cancel</Button>
            <Button onClick={doAssign} disabled={assigning}>{assigning && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDealerDetail;
