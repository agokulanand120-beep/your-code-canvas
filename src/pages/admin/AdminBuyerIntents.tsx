import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Sparkles, Search, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

const AdminBuyerIntents = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: rows = [], isLoading: loading } = useQuery({
    queryKey: ["admin-buyer-intents"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyer_intents")
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
      [r.full_name, r.phone, r.city, r.brand, r.model].some((v) => (v || "").toLowerCase().includes(s))
    );
  }, [rows, q]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return rows.filter((r: any) => new Date(r.created_at).toDateString() === today).length;
  }, [rows]);

  if (isLoading) return <PageSkeleton />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const toggleInformed = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from("buyer_intents")
      .update({ admin_informed: value, status: value ? "contacted" : "new" })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-buyer-intents"] });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Buyer Interests
        </h1>
        <p className="text-sm text-muted-foreground">
          Vehicle interest captured from the marketplace popup form.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Today</p><p className="text-2xl font-bold">{todayCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending contact</p><p className="text-2xl font-bold">{rows.filter((r: any) => !r.admin_informed).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Submissions ({filtered.length})</CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Interested in</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Informed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No buyer interests yet.</TableCell></TableRow>
              )}
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>
                    <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone className="h-3.5 w-3.5" />{r.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.city ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.city}</span> : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.brand}{r.model ? ` · ${r.model}` : ""}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{r.source_path || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd MMM, hh:mm a")}</TableCell>
                  <TableCell className="text-right">
                    <Switch checked={!!r.admin_informed} onCheckedChange={(v) => toggleInformed(r.id, v)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBuyerIntents;
