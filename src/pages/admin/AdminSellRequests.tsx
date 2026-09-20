import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatCurrency } from "@/lib/formatters";
import { Car, Search, Phone, Eye } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["new", "contacted", "listed", "closed", "rejected"];

const AdminSellRequests = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<any>(null);

  const { data: rows = [], isLoading: loading } = useQuery({
    queryKey: ["admin-sell-requests"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sell_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) =>
      [r.seller_name, r.phone, r.city, r.brand, r.model, r.registration_number]
        .some((v) => (v || "").toLowerCase().includes(s))
    );
  }, [rows, q]);

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("sell_requests").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-sell-requests"] });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-5 w-5" /> Sell Requests
        </h1>
        <p className="text-sm text-muted-foreground">Vehicles submitted by owners through "Sell your car".</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">New</p><p className="text-2xl font-bold">{rows.filter((r: any) => r.status === "new").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Contacted</p><p className="text-2xl font-bold">{rows.filter((r: any) => r.status === "contacted").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Listed</p><p className="text-2xl font-bold">{rows.filter((r: any) => r.status === "listed").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Requests ({filtered.length})</CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No sell requests yet.</TableCell></TableRow>
              )}
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.seller_name}</TableCell>
                  <TableCell>
                    <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone className="h-3.5 w-3.5" />{r.phone}
                    </a>
                  </TableCell>
                  <TableCell>
                    {r.manufacturing_year ? `${r.manufacturing_year} ` : ""}{r.brand} {r.model}
                    {r.variant ? <span className="text-muted-foreground"> {r.variant}</span> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.city || "—"}</TableCell>
                  <TableCell>{r.expected_price ? formatCurrency(r.expected_price) : "—"}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd MMM, hh:mm a")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.manufacturing_year} {detail?.brand} {detail?.model} {detail?.variant}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              {detail.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {detail.images.map((src: string, i: number) => (
                    <img key={i} src={src} alt={`Vehicle photo ${i + 1}`} className="rounded-lg object-cover aspect-video" loading="lazy" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  ["Seller", detail.seller_name],
                  ["Phone", detail.phone],
                  ["Email", detail.email],
                  ["City", detail.city],
                  ["State", detail.state],
                  ["Fuel", detail.fuel_type],
                  ["Transmission", detail.transmission],
                  ["KM driven", detail.km_driven],
                  ["Owners", detail.owners],
                  ["Colour", detail.color],
                  ["Condition", detail.condition],
                  ["Registration", detail.registration_number],
                  ["Insurance", detail.insurance_valid],
                  ["Accident history", detail.accident_history],
                  ["Expected price", detail.expected_price ? formatCurrency(detail.expected_price) : null],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {detail.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}
              <Badge variant="secondary">Status: {detail.status}</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellRequests;
