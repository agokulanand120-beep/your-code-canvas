import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Shield, Search, Store, Car, Users, MessageSquare, Activity,
  CheckCircle2, XCircle, ArrowRight, TrendingUp, Eye, Building2,
} from "lucide-react";

/**
 * Admin-only landing: full list of vendors (dealers) with live health and
 * business signals. Clicking a card opens the detailed profile.
 */
const AdminVendors = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-vendors-overview"],
    enabled: !!user && isAdmin,
    staleTime: 60_000,
    queryFn: async () => {
      // Aggregate what a marketplace operator actually needs to monitor.
      // support_tickets is global (no user_id), so we skip it here.
      const [dealersRes, vehiclesRes, salesRes, leadsRes, eventsRes] = await Promise.all([
        supabase.from("settings").select(
          "user_id, dealer_name, dealer_phone, dealer_email, dealer_address, shop_logo_url, marketplace_enabled, public_page_enabled, marketplace_featured, marketplace_badge, updated_at, created_at"
        ),
        supabase.from("vehicles").select("user_id, is_public, marketplace_status, status"),
        supabase.from("sales").select("user_id, total_amount, created_at"),
        supabase.from("leads").select("user_id, status"),
        supabase.from("public_page_events").select("user_id, event_type, created_at")
          .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      ]);

      const dealers = dealersRes.data || [];
      const byUser = <T extends { user_id: string | null }>(rows: T[] | null | undefined) => {
        const m = new Map<string, T[]>();
        (rows || []).forEach((r) => {
          if (!r.user_id) return;
          const arr = m.get(r.user_id) || [];
          arr.push(r);
          m.set(r.user_id, arr);
        });
        return m;
      };

      const vehiclesByUser = byUser(vehiclesRes.data);
      const salesByUser = byUser(salesRes.data);
      const leadsByUser = byUser(leadsRes.data);
      const eventsByUser = byUser(eventsRes.data);

      const rows = dealers.map((d) => {
        const vs = vehiclesByUser.get(d.user_id) || [];
        const sl = salesByUser.get(d.user_id) || [];
        const ld = leadsByUser.get(d.user_id) || [];
        const ev = eventsByUser.get(d.user_id) || [];

        const marketplaceLive = vs.filter((v: any) => v.is_public && ["approved", "featured"].includes(v.marketplace_status)).length;
        const catalogueLive = vs.filter((v: any) => v.is_public).length;
        const inStock = vs.filter((v: any) => v.status === "in_stock").length;

        const isActive = !!d.marketplace_enabled || !!d.public_page_enabled;
        const pageViews30d = ev.filter((e: any) => e.event_type === "page_view").length;
        const enquiries30d = ev.filter((e: any) => e.event_type === "enquiry_submit").length;
        const revenue30d = sl
          .filter((s: any) => new Date(s.created_at).getTime() > Date.now() - 30 * 24 * 3600 * 1000)
          .reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0);

        return {
          ...d,
          totals: {
            vehicles: vs.length,
            inStock,
            marketplaceLive,
            catalogueLive,
            sales: sl.length,
            revenue30d,
            leads: ld.length,
            openTickets: 0,
            pageViews30d,
            enquiries30d,
          },
          isActive,
        };
      });

      return rows;
    },
  });

  // Hooks must run before any early return (React rules of hooks).
  const rows = useMemo(() => data || [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && !r.isActive) return false;
      if (statusFilter === "inactive" && r.isActive) return false;
      if (!q) return true;
      return (
        (r.dealer_name || "").toLowerCase().includes(q) ||
        (r.dealer_email || "").toLowerCase().includes(q) ||
        (r.dealer_phone || "").toLowerCase().includes(q) ||
        (r.dealer_address || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => ({
    vendors: rows.length,
    active: rows.filter((r) => r.isActive).length,
    listings: rows.reduce((s, r) => s + r.totals.marketplaceLive, 0),
    revenue30d: rows.reduce((s, r) => s + r.totals.revenue30d, 0),
    openTickets: rows.reduce((s, r) => s + r.totals.openTickets, 0),
  }), [rows]);

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (loadingData) return <PageSkeleton />;


  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Admin · Vendors</h1>
              <p className="text-xs text-muted-foreground">Monitor every dealer on UpcurvHub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/marketplace">
              <Button variant="outline" size="sm">Full Marketplace Console</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Vendors", value: totals.vendors, icon: Building2, tone: "bg-blue-50 text-blue-700" },
            { label: "Active Vendors", value: totals.active, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Live Listings", value: totals.listings, icon: Car, tone: "bg-amber-50 text-amber-700" },
            { label: "Revenue (30d)", value: `₹${Math.round(totals.revenue30d / 1000)}k`, icon: TrendingUp, tone: "bg-violet-50 text-violet-700" },
            { label: "Open Tickets", value: totals.openTickets, icon: MessageSquare, tone: "bg-rose-50 text-rose-700" },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${k.tone}`}>
                  <k.icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{k.label}</p>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors by name, email, phone, city…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors ({rows.length})</SelectItem>
              <SelectItem value="active">Active ({totals.active})</SelectItem>
              <SelectItem value="inactive">Inactive ({rows.length - totals.active})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendor Grid */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No vendors match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((v) => (
              <Link key={v.user_id} to={`/admin/vendors/${v.user_id}`} className="block">
                <Card className="hover:shadow-lg hover:border-blue-300 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {v.shop_logo_url ? (
                          <img src={v.shop_logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{v.dealer_name || "Unnamed vendor"}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{v.dealer_email || v.dealer_phone || "—"}</p>
                        </div>
                      </div>
                      {v.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                      <Stat label="In stock" value={v.totals.inStock} />
                      <Stat label="Marketplace" value={v.totals.marketplaceLive} />
                      <Stat label="Catalogue" value={v.totals.catalogueLive} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-3 mt-2 border-t">
                      <Stat label="Sales" value={v.totals.sales} />
                      <Stat label="Leads" value={v.totals.leads} />
                      <Stat label="Views 30d" value={v.totals.pageViews30d} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                      <span className="text-muted-foreground">
                        {v.totals.openTickets > 0 ? (
                          <span className="text-rose-600 font-medium">{v.totals.openTickets} open ticket{v.totals.openTickets === 1 ? "" : "s"}</span>
                        ) : "No open tickets"}
                      </span>
                      <span className="text-blue-600 font-semibold inline-flex items-center gap-1">
                        View profile <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div>
    <p className="text-sm font-bold text-foreground">{value}</p>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

export default AdminVendors;
