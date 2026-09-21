import { useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MousePointerClick, TrendingUp, ExternalLink, BarChart3 } from "lucide-react";
import { categoryLabel } from "@/lib/shopTypes";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

interface EventRow {
  product_id: string | null;
  event_type: string;
  category: string | null;
  created_at: string;
}

const AdminShopAnalytics = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [range, setRange] = useState("30");

  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-shop-analytics", range],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
      const [events, products] = await Promise.all([
        supabase
          .from("shop_product_events")
          .select("product_id,event_type,category,created_at")
          .gte("created_at", since)
          .limit(20000),
        supabase.from("shop_products").select("id,name,slug,category,price,images"),
      ]);
      return {
        events: (events.data || []) as EventRow[],
        products: (products.data || []) as any[],
      };
    },
  });

  const stats = useMemo(() => {
    const events = data?.events || [];
    const products = data?.products || [];
    const byId = new Map(products.map((p) => [p.id, p]));

    const impressions = events.filter((e) => e.event_type === "impression").length;
    const clicks = events.filter((e) => e.event_type === "click").length;

    const perProduct = new Map<string, { impressions: number; clicks: number }>();
    const perCategory = new Map<string, { impressions: number; clicks: number }>();

    for (const e of events) {
      if (e.product_id) {
        const row = perProduct.get(e.product_id) || { impressions: 0, clicks: 0 };
        if (e.event_type === "click") row.clicks++;
        else row.impressions++;
        perProduct.set(e.product_id, row);
      }
      const cat = e.category || byId.get(e.product_id || "")?.category || "accessories";
      const c = perCategory.get(cat) || { impressions: 0, clicks: 0 };
      if (e.event_type === "click") c.clicks++;
      else c.impressions++;
      perCategory.set(cat, c);
    }

    const topProducts = [...perProduct.entries()]
      .map(([id, v]) => ({ id, product: byId.get(id), ...v }))
      .filter((r) => r.product)
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, 20);

    const categories = [...perCategory.entries()]
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.clicks - a.clicks);

    return { impressions, clicks, topProducts, categories };
  }, [data]);

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const ctr = stats.impressions ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Store Analytics</h1>
          <p className="text-sm text-muted-foreground">
            How shoppers move from seeing a product to opening the partner store.
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loadingData ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Product views</p>
                <p className="text-2xl font-bold mt-1">{stats.impressions.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> Store clicks</p>
                <p className="text-2xl font-bold mt-1">{stats.clicks.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Click rate</p>
                <p className="text-2xl font-bold mt-1">{ctr}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Most clicked products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No activity yet in this period.
                </p>
              ) : (
                stats.topProducts.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0">
                      {r.product.images?.[0] && (
                        <img src={r.product.images[0]} alt={r.product.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.product.name}</p>
                      <p className="text-xs text-muted-foreground">{categoryLabel(r.product.category)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{r.clicks.toLocaleString("en-IN")} clicks</p>
                      <p className="text-xs text-muted-foreground">{r.impressions.toLocaleString("en-IN")} views</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/shop/${r.product.slug}`} aria-label="Open product page">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Interest by category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
              ) : (
                stats.categories.map((c) => {
                  const pct = stats.clicks ? Math.round((c.clicks / stats.clicks) * 100) : 0;
                  return (
                    <div key={c.slug} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{categoryLabel(c.slug)}</span>
                        <span className="text-muted-foreground">
                          {c.clicks.toLocaleString("en-IN")} clicks · {c.impressions.toLocaleString("en-IN")} views
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="mr-2">Note</Badge>
            Purchases and commission are reported inside your partner affiliate dashboard; this page tracks everything up to the moment a shopper leaves for the store.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminShopAnalytics;
