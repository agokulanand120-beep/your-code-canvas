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
  const [form, setForm] = useState({
    dealerName: "",
    email: "",
    password: randomPassword(),
    phone: "",
    address: "",
    plan: "lister" as "lister" | "complete",
  });

  const { data: dealers = [], isLoading: loadingDealers } = useQuery({
    queryKey: ["admin-dealer-accounts"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_email, dealer_phone, dealer_address, plan, marketplace_enabled, marketplace_status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleCreate = async () => {
    if (!form.dealerName.trim() || !form.email.trim() || form.password.length < 8) {
      toast({ title: "Fill dealer name, email and a password of at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-dealer", {
        body: {
          dealer_name: form.dealerName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          address: form.address.trim(),
          plan: form.plan,
        },
      });
      if (error) {
        const details = "context" in error ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      setCreated({ email: form.email.trim(), password: form.password });
      setOpen(false);
      setForm({ dealerName: "", email: "", password: randomPassword(), phone: "", address: "", plan: "lister" });
      qc.invalidateQueries({ queryKey: ["admin-dealer-accounts"] });
      toast({ title: "Dealer account created" });
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create dealer account</DialogTitle>
            <DialogDescription>The dealer can sign in immediately with these credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="d-name">Dealer / shop name *</Label>
              <Input id="d-name" value={form.dealerName} maxLength={150} onChange={(e) => setForm({ ...form, dealerName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="d-email">Email *</Label>
              <Input id="d-email" type="email" value={form.email} maxLength={255} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="d-pass">Password *</Label>
              <div className="flex gap-2">
                <Input id="d-pass" value={form.password} maxLength={72} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: randomPassword() })}>New</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="d-phone">Phone</Label>
                <Input id="d-phone" value={form.phone} maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={(v: "lister" | "complete") => setForm({ ...form, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lister">Lister (listing only)</SelectItem>
                    <SelectItem value="complete">Complete (full suite)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="d-addr">Address</Label>
              <Input id="d-addr" value={form.address} maxLength={250} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
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
