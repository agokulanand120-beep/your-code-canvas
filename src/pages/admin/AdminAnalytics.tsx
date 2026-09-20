import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, Eye, Phone, MessageSquare, TrendingUp, Users, Car, Store } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

const AdminAnalytics = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [period, setPeriod] = useState("30");

  const days = Number(period);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-marketplace-analytics", days],
    enabled: !!user && isAdmin,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), days)).toISOString();
      const [eventsRes, intentsRes, sellRes, vehiclesRes, dealersRes, leadsRes] = await Promise.all([
        supabase.from("public_page_events").select("event_type, session_id, created_at, vehicle_id, user_id")
          .gte("created_at", since).order("created_at", { ascending: false }).limit(10000),
        supabase.from("buyer_intents").select("brand, city, created_at").gte("created_at", since),
        supabase.from("sell_requests").select("brand, city, created_at, status").gte("created_at", since),
        supabase.from("vehicles").select("brand, marketplace_status, is_public, marketplace_listed_at").eq("is_public", true),
        supabase.from("settings").select("dealer_name, marketplace_enabled, marketplace_status, plan"),
        supabase.from("leads").select("created_at, source").gte("created_at", since),
      ]);
      return {
        events: eventsRes.data ?? [],
        intents: intentsRes.data ?? [],
        sells: sellRes.data ?? [],
        vehicles: vehiclesRes.data ?? [],
        dealers: dealersRes.data ?? [],
        leads: leadsRes.data ?? [],
      };
    },
  });

  const derived = useMemo(() => {
    const events = data?.events ?? [];
    const views = events.filter((e: any) => e.event_type === "vehicle_view" || e.event_type === "dealer_view" || e.event_type === "page_view").length;
    const calls = events.filter((e: any) => e.event_type === "cta_call").length;
    const whatsapp = events.filter((e: any) => e.event_type === "cta_whatsapp").length;
    const enquiries = events.filter((e: any) => e.event_type === "enquiry_submit").length;
    const sessions = new Set(events.map((e: any) => e.session_id).filter(Boolean)).size;
    const interactions = calls + whatsapp + enquiries + (data?.intents.length ?? 0);

    // Daily trend
    const map: Record<string, any> = {};
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "dd MMM");
      map[key] = { date: key, views: 0, calls: 0, whatsapp: 0, leads: 0 };
    }
    events.forEach((e: any) => {
      const key = format(new Date(e.created_at), "dd MMM");
      if (!map[key]) return;
      if (e.event_type === "vehicle_view" || e.event_type === "dealer_view" || e.event_type === "page_view") map[key].views++;
      if (e.event_type === "cta_call") map[key].calls++;
      if (e.event_type === "cta_whatsapp") map[key].whatsapp++;
      if (e.event_type === "enquiry_submit") map[key].leads++;
    });
    (data?.intents ?? []).forEach((r: any) => {
      const key = format(new Date(r.created_at), "dd MMM");
      if (map[key]) map[key].leads++;
    });
    const daily = Object.values(map);

    // Demand by brand (buyer intents + sell requests)
    const brandMap: Record<string, number> = {};
    (data?.intents ?? []).forEach((r: any) => { brandMap[r.brand] = (brandMap[r.brand] || 0) + 1; });
    const demandByBrand = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Supply by brand (live listings)
    const supplyMap: Record<string, number> = {};
    (data?.vehicles ?? []).forEach((v: any) => { supplyMap[v.brand] = (supplyMap[v.brand] || 0) + 1; });
    const supplyByBrand = Object.entries(supplyMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // City demand
    const cityMap: Record<string, number> = {};
    [...(data?.intents ?? []), ...(data?.sells ?? [])].forEach((r: any) => {
      if (r.city) cityMap[r.city] = (cityMap[r.city] || 0) + 1;
    });
    const cityDemand = Object.entries(cityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const funnel = [
      { stage: "Views", count: views },
      { stage: "CTA clicks", count: calls + whatsapp },
      { stage: "Enquiries", count: enquiries },
      { stage: "Buyer interests", count: data?.intents.length ?? 0 },
    ];

    const dealers = data?.dealers ?? [];
    return {
      views, calls, whatsapp, enquiries, sessions,
      conversion: views > 0 ? (interactions / views) * 100 : 0,
      daily, demandByBrand, supplyByBrand, cityDemand, funnel,
      liveListings: data?.vehicles.length ?? 0,
      activeDealers: dealers.filter((d: any) => d.marketplace_enabled).length,
      totalDealers: dealers.length,
      listerPlans: dealers.filter((d: any) => d.plan === "lister").length,
      sellRequests: data?.sells.length ?? 0,
      intents: data?.intents.length ?? 0,
    };
  }, [data, days]);

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const kpis = [
    { label: "Page views", value: derived.views, icon: Eye, tone: "text-blue-600 bg-blue-50" },
    { label: "Unique sessions", value: derived.sessions, icon: Users, tone: "text-violet-600 bg-violet-50" },
    { label: "Call clicks", value: derived.calls, icon: Phone, tone: "text-emerald-600 bg-emerald-50" },
    { label: "WhatsApp clicks", value: derived.whatsapp, icon: MessageSquare, tone: "text-teal-600 bg-teal-50" },
    { label: "Buyer interests", value: derived.intents, icon: Activity, tone: "text-amber-600 bg-amber-50" },
    { label: "Sell requests", value: derived.sellRequests, icon: Car, tone: "text-rose-600 bg-rose-50" },
    { label: "Live listings", value: derived.liveListings, icon: Store, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Conversion", value: `${derived.conversion.toFixed(1)}%`, icon: TrendingUp, tone: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace Performance</h1>
          <p className="text-sm text-muted-foreground">Traffic, demand and dealer performance across UpcurvHub.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{k.label}</p>
                <p className="text-xl font-bold">{loading ? "—" : k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Traffic & engagement trend</CardTitle>
          <CardDescription>Views vs call, WhatsApp and lead activity per day</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={derived.daily}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="views" stroke="#3B82F6" fill="url(#gv)" name="Views" />
              <Area type="monotone" dataKey="calls" stroke="#10B981" fill="transparent" name="Calls" />
              <Area type="monotone" dataKey="whatsapp" stroke="#06B6D4" fill="transparent" name="WhatsApp" />
              <Area type="monotone" dataKey="leads" stroke="#F59E0B" fill="transparent" name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversion funnel</CardTitle>
            <CardDescription>From views to captured buyer intent</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.funnel} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demand vs supply by brand</CardTitle>
            <CardDescription>Buyer interest against live listings</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={derived.supplyByBrand.map((s) => ({
                  name: s.name,
                  listings: s.value,
                  demand: derived.demandByBrand.find((d) => d.name === s.name)?.value ?? 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="listings" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Live listings" />
                <Bar dataKey="demand" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Buyer demand" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top demand cities</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {derived.cityDemand.length === 0 ? (
              <p className="text-sm text-muted-foreground">No city data in this period yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={derived.cityDemand} dataKey="value" nameKey="name" outerRadius={95} label>
                    {derived.cityDemand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dealer network health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Total dealers", derived.totalDealers],
              ["Marketplace-enabled", derived.activeDealers],
              ["On Lister plan", derived.listerPlans],
              ["On Complete plan", derived.totalDealers - derived.listerPlans],
              ["Live public listings", derived.liveListings],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge variant="secondary" className="text-sm">{value as number}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
