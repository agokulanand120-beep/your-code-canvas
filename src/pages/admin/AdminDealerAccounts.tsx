import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { UserPlus, Loader2, Copy, ShieldCheck, Store } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import DealerProfileFields, { emptyDealerProfile, DealerProfileValues } from "@/components/admin/DealerProfileFields";

const randomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const AdminDealerAccounts = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [managed, setManaged] = useState(true);
  const [profile, setProfile] = useState<DealerProfileValues>(emptyDealerProfile());
  const [login, setLogin] = useState({ email: "", password: randomPassword() });

  const { data: dealers = [], isLoading: loadingDealers } = useQuery({
    queryKey: ["admin-dealer-accounts"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_email, dealer_phone, dealer_address, plan, marketplace_enabled, marketplace_status, created_at, is_admin_managed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleCreate = async () => {
    if (!profile.dealer_name?.trim()) {
      toast({ title: "Dealer name is required", variant: "destructive" });
      return;
    }
    if (!managed && (!login.email.trim() || login.password.length < 8)) {
      toast({ title: "Enter login email and a password of at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body: any = { ...profile, dealer_name: profile.dealer_name.trim(), managed };
      body.google_reviews_rating = profile.google_reviews_rating === "" ? null : Number(profile.google_reviews_rating);
      body.google_reviews_count = profile.google_reviews_count === "" ? null : Number(profile.google_reviews_count);
      if (!managed) { body.email = login.email.trim(); body.password = login.password; }
      const { data, error } = await supabase.functions.invoke("admin-create-dealer", { body });
      if (error) {
        const details = "context" in error ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      if (!managed) setCreated({ email: login.email.trim(), password: login.password });
      setOpen(false);
      setProfile(emptyDealerProfile());
      setLogin({ email: "", password: randomPassword() });
      qc.invalidateQueries({ queryKey: ["admin-dealer-accounts"] });
      toast({ title: managed ? "Managed dealer profile created" : "Dealer account created" });
      if ((data as any)?.user_id) window.location.assign(`/admin/dealer-accounts/${(data as any).user_id}`);
    } catch (e: any) {
      toast({ title: "Could not create dealer", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async (userId: string, plan: string) => {
    const { error } = await supabase.from("settings").update({ plan }).eq("user_id", userId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-dealer-accounts"] });
    toast({ title: "Plan updated" });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-5 w-5" /> Dealer Accounts
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage dealer logins and their plan.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Create dealer account
        </Button>
      </div>

      {created && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Share these credentials with the dealer
            </CardTitle>
            <CardDescription>Shown once — copy it now.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <code className="px-2 py-1 rounded bg-background border">{created.email}</code>
            <code className="px-2 py-1 rounded bg-background border">{created.password}</code>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                navigator.clipboard.writeText(`${created.email} / ${created.password}`);
                toast({ title: "Copied" });
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreated(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All dealers ({dealers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDealers && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!loadingDealers && dealers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No dealers yet.</TableCell></TableRow>
              )}
              {dealers.map((d: any) => (
                <TableRow key={d.user_id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/dealer-accounts/${d.user_id}`} className="text-primary hover:underline">
                      {d.dealer_name || "—"}
                    </Link>
                    {d.is_admin_managed && <Badge variant="outline" className="ml-2 text-[10px]">Managed</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.dealer_email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dealer_phone || "—"}</TableCell>

                  <TableCell>
                    <Select value={d.plan ?? "complete"} onValueChange={(v) => updatePlan(d.user_id, v)}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lister">Lister</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.marketplace_enabled ? "default" : "secondary"}>
                      {d.marketplace_enabled ? d.marketplace_status || "enabled" : "off"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {d.created_at ? format(new Date(d.created_at), "dd MMM yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create dealer profile</DialogTitle>
            <DialogDescription>Fill the dealer's details. A managed profile is run by you until the owner claims it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Managed by admin (no dealer login yet)</p>
                <p className="text-xs text-muted-foreground">Shows a "Claim this business" notice on their pages.</p>
              </div>
              <Switch checked={managed} onCheckedChange={setManaged} />
            </div>
            {!managed && (
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Login email *</Label><Input type="email" value={login.email} maxLength={255} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></div>
                <div>
                  <Label>Password *</Label>
                  <div className="flex gap-2">
                    <Input value={login.password} maxLength={72} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                    <Button type="button" variant="outline" onClick={() => setLogin({ ...login, password: randomPassword() })}>New</Button>
                  </div>
                </div>
              </div>
            )}
            <DealerProfileFields value={profile} onChange={setProfile} showManagedNote={managed} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDealerAccounts;
