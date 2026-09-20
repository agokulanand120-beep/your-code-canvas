import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, Eye, Phone, MessageCircle, Store, Car, RefreshCw, Wrench, Package,
} from "lucide-react";

const todayStr = () => new Date().toLocaleDateString("en-CA");

const dayRange = (day: string) => {
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const AdminLeads = () => {
  const [day, setDay] = useState(todayStr());
  const qc = useQueryClient();
  const { start, end } = useMemo(() => dayRange(day), [day]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-daily-leads", day],
    staleTime: 60_000,
    queryFn: async () => {
      const [leadsRes, eventsRes, dealersRes, serviceRes, accRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, created_at, customer_name, phone, email, city, vehicle_interest, source, status, notes, user_id, admin_informed, admin_informed_at, display_number")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: false }),
        supabase
          .from("public_page_events")
          .select("event_type, user_id, public_page_id")
          .gte("created_at", start)
          .lt("created_at", end),
        supabase.from("settings").select("user_id, dealer_name, dealer_phone, public_page_id"),
        supabase
          .from("service_enquiries")
          .select("id, created_at, category, full_name, phone, email, city, message, status")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: false }),
        supabase
          .from("accessory_enquiries")
          .select("id, created_at, full_name, phone, email, city, message, status")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: false }),
      ]);

      if (leadsRes.error) throw leadsRes.error;

      const dealerMap = new Map<string, any>();
      (dealersRes.data || []).forEach((d: any) => dealerMap.set(d.user_id, d));

      return {
        leads: (leadsRes.data || []).map((l: any) => ({ ...l, dealer: dealerMap.get(l.user_id) })),
        events: eventsRes.data || [],
        serviceEnquiries: serviceRes.data || [],
        accessoryEnquiries: accRes.data || [],
      };
    },
  });

  const leads = data?.leads || [];
  const events = data?.events || [];

  const kpis = useMemo(() => {
    const marketplaceLeads = leads.filter((l: any) => l.source === "marketplace");
    const catalogueLeads = leads.filter((l: any) => l.source !== "marketplace");
    const count = (t: string) => events.filter((e: any) => e.event_type === t).length;
    return {
      totalLeads: leads.length,
      marketplaceLeads: marketplaceLeads.length,
      catalogueLeads: catalogueLeads.length,
      views: count("page_view") + count("vehicle_view") + count("dealer_view"),
      calls: count("cta_call"),
      whatsapp: count("cta_whatsapp"),
      pendingInform: leads.filter((l: any) => !l.admin_informed).length,
    };
  }, [leads, events]);

  const toggleInformed = async (lead: any, value: boolean) => {
    const { error } = await supabase
      .from("leads")
      .update({ admin_informed: value, admin_informed_at: value ? new Date().toISOString() : null })
      .eq("id", lead.id);
    if (error) {
      toast.error("Could not update", { description: error.message });
      return;
    }
    toast.success(value ? "Marked as informed" : "Marked as not informed", { duration: 4000 });
    qc.invalidateQueries({ queryKey: ["admin-daily-leads", day] });
  };

  const kpiCards = [
    { label: "Leads today", value: kpis.totalLeads, icon: Users, tone: "text-blue-600 bg-blue-50" },
    { label: "Marketplace leads", value: kpis.marketplaceLeads, icon: Store, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Catalogue leads", value: kpis.catalogueLeads, icon: Car, tone: "text-purple-600 bg-purple-50" },
    { label: "Views", value: kpis.views, icon: Eye, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Call clicks", value: kpis.calls, icon: Phone, tone: "text-amber-600 bg-amber-50" },
    { label: "WhatsApp clicks", value: kpis.whatsapp, icon: MessageCircle, tone: "text-teal-600 bg-teal-50" },
    { label: "Pending inform", value: kpis.pendingInform, icon: RefreshCw, tone: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Daily Leads & Enquiries</h1>
          <p className="text-sm text-muted-foreground">
            Everything captured from the marketplace and dealer catalogues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={day}
            max={todayStr()}
            onChange={(e) => setDay(e.target.value || todayStr())}
            className="w-[160px]"
          />
          <Button variant="outline" size="sm" onClick={() => setDay(todayStr())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-4">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">{isLoading ? "—" : k.value}</div>
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Dealer leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({data?.serviceEnquiries.length || 0})</TabsTrigger>
          <TabsTrigger value="accessories">Accessories ({data?.accessoryEnquiries.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leads captured on {day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!isLoading && leads.length === 0 && (
                <p className="text-sm text-muted-foreground">No leads captured on this day.</p>
              )}
              {leads.map((l: any) => (
                <div
                  key={l.id}
                  className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center gap-3 ${
                    l.admin_informed ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-card"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{l.customer_name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {l.source === "marketplace" ? "Marketplace" : "Catalogue"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{l.status}</Badge>
                      <span className="text-[11px] text-muted-foreground">{timeOf(l.created_at)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>📞 {l.phone}</span>
                      {l.email && <span>✉️ {l.email}</span>}
                      {l.city && <span>📍 {l.city}</span>}
                    </div>
                    <div className="text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-foreground">
                        <Car className="h-3 w-3 inline mr-1" />
                        {l.vehicle_interest || "Vehicle not specified"}
                      </span>
                      <span className="text-foreground">
                        <Store className="h-3 w-3 inline mr-1" />
                        {l.dealer?.dealer_name || "Unknown dealer"}
                        {l.dealer?.dealer_phone ? ` · ${l.dealer.dealer_phone}` : ""}
                      </span>
                    </div>
                    {l.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{l.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-foreground">
                        {l.admin_informed ? "Dealer informed" : "Inform dealer"}
                      </div>
                      {l.admin_informed && l.admin_informed_at && (
                        <div className="text-[10px] text-muted-foreground">
                          {timeOf(l.admin_informed_at)}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={!!l.admin_informed}
                      onCheckedChange={(v) => toggleInformed(l, v)}
                      aria-label="Mark dealer informed"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              {(data?.serviceEnquiries || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No service enquiries on this day.</p>
              )}
              {(data?.serviceEnquiries || []).map((e: any) => (
                <div key={e.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-foreground">{e.full_name}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{e.category}</Badge>
                    <span className="text-[11px] text-muted-foreground">{timeOf(e.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    📞 {e.phone} {e.email ? `· ✉️ ${e.email}` : ""} {e.city ? `· 📍 ${e.city}` : ""}
                  </div>
                  {e.message && <p className="text-xs mt-1.5">{e.message}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessories" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              {(data?.accessoryEnquiries || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No accessory enquiries on this day.</p>
              )}
              {(data?.accessoryEnquiries || []).map((e: any) => (
                <div key={e.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-foreground">{e.full_name}</span>
                    <span className="text-[11px] text-muted-foreground">{timeOf(e.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    📞 {e.phone} {e.email ? `· ✉️ ${e.email}` : ""} {e.city ? `· 📍 ${e.city}` : ""}
                  </div>
                  {e.message && <p className="text-xs mt-1.5">{e.message}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLeads;
