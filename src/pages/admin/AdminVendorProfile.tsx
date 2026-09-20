import { useMemo, useState, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import {
  ArrowLeft, Store, Phone, Mail, MapPin, ExternalLink, Shield,
  CheckCircle2, XCircle, Car, ShoppingCart,
  Ticket, Eye, PhoneCall, MessageCircle, Send, TrendingUp, Gauge,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";
import { format, subDays } from "date-fns";

const AdminVendorProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isAdmin, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<"lister" | "complete">("complete");

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-vendor-profile", userId],
    enabled: !!userId && !!user && isAdmin,
    staleTime: 60_000,
    queryFn: async () => {
      const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [settings, vehicles, sales, leads, events, sellRequests] = await Promise.all([
        supabase.from("settings").select("*").eq("user_id", userId!).maybeSingle(),
        supabase.from("vehicles").select("id, brand, model, variant, selling_price, status, is_public, marketplace_status, created_at, code").eq("user_id", userId!),
        supabase.from("sales").select("id, sale_number, total_amount, sale_date, status, created_at").eq("user_id", userId!),
        supabase.from("leads").select("id, customer_name, status, created_at, source, lead_type").eq("user_id", userId!),
        supabase.from("public_page_events").select("event_type, created_at, vehicle_id").eq("user_id", userId!).gte("created_at", since30),
        supabase.from("leads").select("id, customer_name, phone, created_at, lead_type").eq("user_id", userId!).eq("lead_type", "seller"),
      ]);
      return {
        settings: settings.data,
        vehicles: vehicles.data || [],
        sales: sales.data || [],
        leads: leads.data || [],
        tickets: [] as any[], // support_tickets is global (no user_id) — shown only in MarketplaceAdmin
        events: events.data || [],
        sellRequests: sellRequests.data || [],
      };
    },
  });

  const settings = data?.settings ?? null;
  const vehicles = data?.vehicles ?? [];
  const sales = data?.sales ?? [];
  const leads = data?.leads ?? [];
  const tickets = data?.tickets ?? [];
  const events = data?.events ?? [];
  const sellRequests = data?.sellRequests ?? [];

  useEffect(() => {
    if (settings?.plan === "lister" || settings?.plan === "complete") setPlan(settings.plan);
  }, [settings?.plan]);

  const savePlan = useMutation({
    mutationFn: async (next: "lister" | "complete") => {
      const { error } = await supabase.from("settings").update({ plan: next }).eq("user_id", userId!);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      setPlan(next);
      toast.success(`Plan updated to ${next === "lister" ? "Lister" : "Complete"}`, { duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ["admin-vendor-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-vendors-overview"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update plan", { duration: 6000 }),
  });

  // ── Derived analytics (all hooks run before any early return) ──
  const trafficByDay = useMemo(() => {
    const buckets: Record<string, { date: string; views: number; enquiries: number; calls: number; whatsapp: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      buckets[format(d, "yyyy-MM-dd")] = { date: format(d, "MMM d"), views: 0, enquiries: 0, calls: 0, whatsapp: 0 };
    }
    events.forEach((e: any) => {
      const b = buckets[format(new Date(e.created_at), "yyyy-MM-dd")];
      if (!b) return;
      if (e.event_type === "page_view") b.views++;
      else if (e.event_type === "enquiry_submit") b.enquiries++;
      else if (e.event_type === "cta_call") b.calls++;
      else if (e.event_type === "cta_whatsapp") b.whatsapp++;
    });
    return Object.values(buckets);
  }, [events]);

  const leadFunnel = useMemo(() => {
    const status = ["new", "contacted", "qualified", "negotiation", "won", "lost"];
    return status.map((s) => ({ status: s, count: leads.filter((l: any) => l.status === s).length }));
  }, [leads]);

  // Monitoring: per-listing performance (views + CTA per live vehicle, last 30 days)
  const listingPerformance = useMemo(() => {
    const byVehicle = new Map<string, { views: number; ctas: number; enquiries: number }>();
    events.forEach((e: any) => {
      if (!e.vehicle_id) return;
      const row = byVehicle.get(e.vehicle_id) || { views: 0, ctas: 0, enquiries: 0 };
      if (e.event_type === "page_view") row.views++;
      else if (e.event_type === "enquiry_submit") row.enquiries++;
      else if (e.event_type === "cta_call" || e.event_type === "cta_whatsapp") row.ctas++;
      byVehicle.set(e.vehicle_id, row);
    });
    return vehicles
      .map((v: any) => {
        const m = byVehicle.get(v.id) || { views: 0, ctas: 0, enquiries: 0 };
        return {
          id: v.id,
          name: `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ""}`,
          code: v.code,
          price: Number(v.selling_price) || 0,
          live: !!v.is_public && ["approved", "featured"].includes(v.marketplace_status),
          ...m,
          ctr: m.views ? Math.round(((m.ctas + m.enquiries) / m.views) * 100) : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [events, vehicles]);

  const conversionFunnel = useMemo(() => {
    const views = events.filter((e: any) => e.event_type === "page_view").length;
    const ctas = events.filter((e: any) => ["cta_call", "cta_whatsapp"].includes(e.event_type)).length;
    const enquiries = events.filter((e: any) => e.event_type === "enquiry_submit").length;
    const qualified = leads.filter((l: any) => ["qualified", "negotiation", "won"].includes(l.status)).length;
    const won = leads.filter((l: any) => l.status === "won").length;
    return [
      { stage: "Views", count: views },
      { stage: "CTA taps", count: ctas },
      { stage: "Enquiries", count: enquiries },
      { stage: "Qualified", count: qualified },
      { stage: "Won", count: won },
    ];
  }, [events, leads]);

  const ctaOverTime = useMemo(
    () => trafficByDay.map((d) => ({ date: d.date, calls: d.calls, whatsapp: d.whatsapp, enquiries: d.enquiries })),
    [trafficByDay]
  );

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (loadingData || !data) return <PageSkeleton />;

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card><CardContent className="p-10 text-center">
          <p className="text-muted-foreground">Vendor not found.</p>
          <Link to="/admin/vendors"><Button variant="outline" size="sm" className="mt-4">Back to vendors</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  const isActive = !!settings.marketplace_enabled || !!settings.public_page_enabled;
  const marketplaceLive = vehicles.filter((v: any) => v.is_public && ["approved", "featured"].includes(v.marketplace_status)).length;
  const catalogueLive = vehicles.filter((v: any) => v.is_public).length;
  const totalRevenue = sales.reduce((s: number, x: any) => s + (Number(x.total_amount) || 0), 0);

  const openTickets = tickets.filter((t: any) => t.status !== "closed" && t.status !== "resolved");
  const contactForms = tickets.filter((t: any) => (t as any).category !== "abuse_report");
  const reportForms = tickets.filter((t: any) => (t as any).category === "abuse_report");

  const totalViews = events.filter((e: any) => e.event_type === "page_view").length;
  const totalCtas = events.filter((e: any) => ["cta_call", "cta_whatsapp"].includes(e.event_type)).length;
  const totalEnquiries = events.filter((e: any) => e.event_type === "enquiry_submit").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/admin/vendors">
              <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Vendors</Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {settings.shop_logo_url ? (
                <img src={settings.shop_logo_url} alt="" className="h-16 w-16 rounded-xl object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">{settings.dealer_name || "Unnamed vendor"}</h1>
                  {isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Inactive</Badge>
                  )}
                  <Badge variant="outline" className="capitalize">{plan} plan</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  {settings.dealer_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{settings.dealer_phone}</span>}
                  {settings.dealer_email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{settings.dealer_email}</span>}
                  {settings.dealer_address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{settings.dealer_address}</span>}
                </div>
              </div>
            </div>
            {settings.public_page_id && (
              <Link to={`/d/${settings.public_page_id}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" /> Open public catalogue</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <KPI icon={Car} label="Vehicles" value={vehicles.length} tone="bg-blue-50 text-blue-700" />
          <KPI icon={Shield} label="Marketplace" value={marketplaceLive} tone="bg-amber-50 text-amber-700" />
          <KPI icon={Store} label="Catalogue" value={catalogueLive} tone="bg-violet-50 text-violet-700" />
          <KPI icon={ShoppingCart} label="Sales" value={sales.length} tone="bg-emerald-50 text-emerald-700" />
          <KPI icon={TrendingUp} label="Revenue" value={formatCurrency(totalRevenue)} tone="bg-teal-50 text-teal-700" />
          <KPI icon={Ticket} label="Open tickets" value={openTickets.length} tone={openTickets.length ? "bg-rose-50 text-rose-700" : "bg-muted text-muted-foreground"} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 md:grid-cols-8 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="tickets">Contact / Report</TabsTrigger>
            <TabsTrigger value="sellers">Seller Forms</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          {/* Overview: Analytics */}
          <TabsContent value="overview" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Public Traffic — Last 30 Days</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trafficByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="enquiries" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="calls" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="whatsapp" stackId="4" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniKPI icon={Eye} label="Page views" value={totalViews} />
              <MiniKPI icon={Send} label="Enquiries" value={totalEnquiries} />
              <MiniKPI icon={PhoneCall} label="Call CTA" value={events.filter((e: any) => e.event_type === "cta_call").length} />
              <MiniKPI icon={MessageCircle} label="WhatsApp CTA" value={events.filter((e: any) => e.event_type === "cta_whatsapp").length} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Lead Funnel</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leadFunnel}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniKPI icon={Gauge} label="Live listings" value={marketplaceLive} />
              <MiniKPI icon={Eye} label="Views (30d)" value={totalViews} />
              <MiniKPI icon={PhoneCall} label="CTA taps (30d)" value={totalCtas} />
              <MiniKPI
                icon={TrendingUp}
                label="View → contact rate"
                value={`${totalViews ? Math.round(((totalCtas + totalEnquiries) / totalViews) * 100) : 0}%`}
              />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Conversion Funnel (last 30 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={conversionFunnel} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">CTA Performance Over Time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={ctaOverTime}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calls" stroke="#F59E0B" strokeWidth={2} dot={false} name="Call" />
                    <Line type="monotone" dataKey="whatsapp" stroke="#10B981" strokeWidth={2} dot={false} name="WhatsApp" />
                    <Line type="monotone" dataKey="enquiries" stroke="#3B82F6" strokeWidth={2} dot={false} name="Enquiry" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Listing Performance (top 15 by views)</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {listingPerformance.length === 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">No listing activity in the last 30 days.</p>
                  )}
                  {listingPerformance.map((l) => (
                    <div key={l.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.code} · {formatCurrency(l.price)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        {l.live ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">live</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">offline</Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-3.5 w-3.5" />{l.views}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><PhoneCall className="h-3.5 w-3.5" />{l.ctas}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Send className="h-3.5 w-3.5" />{l.enquiries}</span>
                        <span className="font-semibold text-foreground w-10 text-right">{l.ctr}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalogue" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">All Vehicles ({vehicles.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {vehicles.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No vehicles yet.</p>}
                  {vehicles.map((v: any) => (
                    <div key={v.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{v.brand} {v.model} {v.variant || ""}</p>
                        <p className="text-xs text-muted-foreground">{v.code} · {formatCurrency(v.selling_price || 0)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] capitalize">{v.status?.replace("_", " ")}</Badge>
                        {v.is_public && <Badge className="bg-violet-100 text-violet-700 text-[10px]">catalogue</Badge>}
                        {["approved", "featured"].includes(v.marketplace_status) && <Badge className="bg-amber-100 text-amber-700 text-[10px]">marketplace</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Leads ({leads.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {leads.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No leads yet.</p>}
                  {leads.slice(0, 50).map((l: any) => (
                    <div key={l.id} className="p-3 flex items-center justify-between hover:bg-muted/40">
                      <div>
                        <p className="font-medium text-sm">{l.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{l.source} · {format(new Date(l.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">{l.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Sales ({sales.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sales.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No sales yet.</p>}
                  {sales.slice(0, 50).map((s: any) => (
                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/40">
                      <div>
                        <p className="font-medium text-sm">{s.sale_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(s.sale_date || s.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(s.total_amount || 0)}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Contact submissions ({contactForms.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {contactForms.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No contact form submissions.</p>}
                  {contactForms.slice(0, 50).map((t: any) => (
                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.subject || "(no subject)"}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize ml-2 shrink-0">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Reports ({reportForms.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {reportForms.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No abuse reports.</p>}
                  {reportForms.slice(0, 50).map((t: any) => (
                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      </div>
                      <Badge className="bg-rose-100 text-rose-700 text-[10px] ml-2 shrink-0 capitalize">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sellers" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Seller form receivings ({sellRequests.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sellRequests.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No seller submissions.</p>}
                  {sellRequests.slice(0, 50).map((l: any) => (
                    <div key={l.id} className="p-3 flex items-center justify-between hover:bg-muted/40">
                      <div>
                        <p className="font-medium text-sm">{l.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{l.phone} · {format(new Date(l.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Seller</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access / plan configuration */}
          <TabsContent value="access" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Plan & access control</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <Select value={plan} onValueChange={(v) => setPlan(v as "lister" | "complete")}>
                    <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lister">Lister — listing only</SelectItem>
                      <SelectItem value="complete">Complete — full suite</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => savePlan.mutate(plan)}
                    disabled={savePlan.isPending || plan === (settings.plan ?? "complete")}
                  >
                    {savePlan.isPending ? "Saving…" : "Save plan"}
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4">
                    <p className="font-semibold text-sm mb-2">Lister</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>Vehicles &amp; listing management</li>
                      <li>Leads / enquiries</li>
                      <li>Marketplace hub &amp; catalogue analytics</li>
                      <li>Vendor profile settings only</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="font-semibold text-sm mb-2">Complete</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>Everything in Lister</li>
                      <li>Sales, purchases, payments, EMI, expenses</li>
                      <li>Customers, vendors, documents</li>
                      <li>Dashboard, reports &amp; audit logs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, tone }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-lg font-bold text-foreground truncate">{value}</p>
    </CardContent>
  </Card>
);

const MiniKPI = ({ icon: Icon, label, value }: any) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminVendorProfile;
