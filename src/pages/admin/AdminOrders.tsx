import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Search, Phone, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
const PAY_STATUSES = ["unpaid", "paid", "refunded"] as const;

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  packed: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  shipped: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

interface OrderRow {
  id: string; order_number: string; full_name: string; phone: string; email: string | null;
  address_line1: string; address_line2: string | null; city: string; state: string | null;
  pincode: string; notes: string | null; payment_method: string; payment_status: string;
  status: string; subtotal: number; shipping_fee: number; total: number; created_at: string;
}
interface ItemRow {
  id: string; order_id: string; product_name: string; image_url: string | null;
  unit_price: number; quantity: number; line_total: number;
}

const AdminOrders = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-accessory-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessory_orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data || []) as unknown as OrderRow[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["admin-accessory-order-items", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase.from("accessory_order_items").select("*").eq("order_id", selected!.id);
      return (data || []) as unknown as ItemRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ = !q || o.order_number.toLowerCase().includes(q) ||
        o.full_name.toLowerCase().includes(q) || o.phone.includes(q);
      return matchQ && (statusFilter === "all" || o.status === statusFilter);
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
  }), [orders]);

  const update = async (id: string, patch: { status?: string; payment_status?: string }) => {
    const { error } = await supabase.from("accessory_orders").update(patch).eq("id", id);
    if (error) { toast.error("Could not update the order"); return; }
    toast.success("Order updated");
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } as OrderRow : s));
    qc.invalidateQueries({ queryKey: ["admin-accessory-orders"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Accessory orders</h1>
          <p className="text-sm text-muted-foreground">Manage incoming accessory purchases.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-accessory-orders"] })}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total orders", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Delivered", value: stats.delivered },
          { label: "Order value", value: formatCurrency(stats.revenue) },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search order number, name or phone"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Package className="h-8 w-8" /> No orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead><TableHead>Customer</TableHead>
                    <TableHead>Placed</TableHead><TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                      <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{o.full_name}</p>
                        <p className="text-xs text-muted-foreground">{o.phone}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="uppercase">{o.payment_method}</span>
                        <Badge variant="outline" className="ml-2 capitalize">{o.payment_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${statusColor[o.status] || ""}`} variant="secondary">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(o.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="font-mono">{selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order status</p>
                    <Select value={selected.status} onValueChange={(v) => update(selected.id, { status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment status</p>
                    <Select value={selected.payment_status} onValueChange={(v) => update(selected.id, { payment_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{selected.full_name}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}{selected.email ? ` · ${selected.email}` : ""}
                  </p>
                  <p className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      {selected.address_line1}{selected.address_line2 ? `, ${selected.address_line2}` : ""},{" "}
                      {selected.city}{selected.state ? `, ${selected.state}` : ""} — {selected.pincode}
                    </span>
                  </p>
                  {selected.notes && <p className="text-muted-foreground">Note: {selected.notes}</p>}
                </div>

                <Separator />
                <div className="space-y-2">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                        {i.image_url && <img src={i.image_url} alt={i.product_name} className="h-full w-full object-cover" />}
                      </div>
                      <span className="flex-1">{i.product_name} × {i.quantity}</span>
                      <span className="font-medium">{formatCurrency(Number(i.line_total))}</span>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(selected.subtotal))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatCurrency(Number(selected.shipping_fee))}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(Number(selected.total))}</span></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
