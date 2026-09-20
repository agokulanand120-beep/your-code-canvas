import { useMemo, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ArrowLeft, Store, BarChart3, Globe } from "lucide-react";
import MarketplaceAnalytics from "@/pages/MarketplaceAnalytics";
import PublicPageAnalytics from "@/pages/PublicPageAnalytics";

type Tab = "catalogue" | "marketplace";

const AdminDealerDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("catalogue");

  const { data: dealer } = useQuery({
    queryKey: ["admin-dealer-detail", userId],
    enabled: !!userId && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_email, dealer_phone, dealer_address, plan, marketplace_enabled, marketplace_status")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const tabs = useMemo(
    () => [
      { id: "catalogue" as Tab, label: "Catalogue Analytics", icon: Globe },
      { id: "marketplace" as Tab, label: "Marketplace Analytics", icon: BarChart3 },
    ],
    []
  );

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
            <Link to="/admin/dealer-accounts">
              <ArrowLeft className="h-4 w-4" /> Back to dealer accounts
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-5 w-5" /> {dealer?.dealer_name || "Dealer"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dealer?.dealer_email || "—"} · {dealer?.dealer_phone || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{dealer?.plan ?? "complete"}</Badge>
          <Badge variant={dealer?.marketplace_enabled ? "default" : "secondary"}>
            {dealer?.marketplace_enabled ? dealer?.marketplace_status || "enabled" : "marketplace off"}
          </Badge>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {tab === "catalogue" ? "Catalogue performance" : "Marketplace performance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-2">
          {userId && (tab === "catalogue"
            ? <PublicPageAnalytics userId={userId} />
            : <MarketplaceAnalytics userId={userId} />)}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDealerDetail;
