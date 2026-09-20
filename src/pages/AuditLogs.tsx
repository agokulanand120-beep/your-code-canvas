import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Activity, Search, Eye, FileText, LayoutGrid, List as ListIcon } from "lucide-react";
import { format } from "date-fns";
import { useViewMode } from "@/hooks/useViewMode";


interface AuditRow {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_fields: Record<string, { old: any; new: any }> | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  performed_by: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
};

const formatVal = (v: any): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const labelFor = (row: AuditRow) => {
  const d = row.new_data || row.old_data || {};
  return (
    d.display_number ||
    d.expense_number ||
    d.lead_number ||
    d.payment_number ||
    d.sale_number ||
    d.purchase_number ||
    d.customer_name ||
    d.brand ||
    d.name ||
    row.record_id.slice(0, 8)
  );
};

const HIDDEN_KEYS = new Set(["id", "user_id", "created_at", "updated_at"]);

const PrettyRecord = ({ data }: { data: Record<string, any> }) => {
  const entries = Object.entries(data).filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== "");
  if (entries.length === 0) return <p className="text-xs text-muted-foreground p-3">No fields</p>;
  return (
    <div className="border rounded-lg divide-y">
      {entries.map(([k, v]) => (
        <div key={k} className="p-3 grid grid-cols-[160px_1fr] gap-3 text-xs items-start">
          <div className="font-medium text-muted-foreground capitalize">{k.replace(/_/g, " ")}</div>
          <div className="break-words">{formatVal(v)}</div>
        </div>
      ))}
    </div>
  );
};

export default function AuditLogs() {
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode("audit-logs");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);


  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []) as unknown as AuditRow[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const tables = useMemo(
    () => Array.from(new Set((logs || []).map((l) => l.table_name))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    return (logs || []).filter((l) => {
      if (tableFilter !== "all" && l.table_name !== tableFilter) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.table_name} ${labelFor(l)} ${l.record_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, tableFilter, actionFilter, search]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete history of every create, update, and delete in your account.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5 self-start">
          <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")} className="h-8 gap-1.5"><ListIcon className="h-3.5 w-3.5" /> List</Button>
          <Button size="sm" variant={viewMode === "grid" ? "default" : "ghost"} onClick={() => setViewMode("grid")} className="h-8 gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Grid</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">

            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by record, ID..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {tables.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Activity ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No audit activity yet.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
              {filtered.map((row) => (
                <button
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="text-left rounded-lg border p-3 hover:shadow-sm hover:bg-muted/40 transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`${ACTION_COLORS[row.action]} shrink-0`}>
                      {row.action === "INSERT" ? "Created" : row.action === "UPDATE" ? "Updated" : "Deleted"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(row.created_at), "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{labelFor(row)}</div>
                  <div className="text-xs text-muted-foreground capitalize truncate">
                    {row.table_name.replace(/_/g, " ")}
                  </div>
                  {row.action === "UPDATE" && row.changed_fields && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      Changed: {Object.keys(row.changed_fields).slice(0, 3).join(", ")}
                      {Object.keys(row.changed_fields).length > 3 ? "…" : ""}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((row) => (
                <button
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="w-full px-4 py-3 flex items-start justify-between gap-3 hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Badge variant="outline" className={`${ACTION_COLORS[row.action]} shrink-0`}>
                      {row.action === "INSERT" ? "Created" : row.action === "UPDATE" ? "Updated" : "Deleted"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        <span className="text-muted-foreground capitalize">
                          {row.table_name.replace(/_/g, " ")}
                        </span>{" "}
                        · {labelFor(row)}
                      </div>
                      {row.action === "UPDATE" && row.changed_fields && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Changed: {Object.keys(row.changed_fields).slice(0, 4).join(", ")}
                          {Object.keys(row.changed_fields).length > 4 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-2">
                    {format(new Date(row.created_at), "dd MMM, HH:mm")}
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline" className={selected ? ACTION_COLORS[selected.action] : ""}>
                {selected?.action}
              </Badge>
              <span className="capitalize">{selected?.table_name.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground font-normal">
                · {selected && labelFor(selected)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-3">
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">When</div>
                    {format(new Date(selected.created_at), "dd MMM yyyy, HH:mm:ss")}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Record ID</div>
                    <code className="text-[10px] break-all">{selected.record_id}</code>
                  </div>
                </div>

                {selected.action === "UPDATE" && selected.changed_fields && (
                  <div>
                    <div className="font-semibold mb-2">Changed fields</div>
                    <div className="border rounded-lg divide-y">
                      {Object.entries(selected.changed_fields).map(([key, diff]) => (
                        <div key={key} className="p-3 grid grid-cols-[120px_1fr_1fr] gap-3 text-xs items-start">
                          <div className="font-medium text-muted-foreground">{key}</div>
                          <div className="text-rose-600 break-words">
                            <div className="text-[10px] uppercase opacity-60">Before</div>
                            {formatVal(diff.old)}
                          </div>
                          <div className="text-emerald-600 break-words">
                            <div className="text-[10px] uppercase opacity-60">After</div>
                            {formatVal(diff.new)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.action === "INSERT" && selected.new_data && (
                  <div>
                    <div className="font-semibold mb-2">Created with</div>
                    <PrettyRecord data={selected.new_data} />
                  </div>
                )}

                {selected.action === "DELETE" && selected.old_data && (
                  <div>
                    <div className="font-semibold mb-2">Deleted data</div>
                    <PrettyRecord data={selected.old_data} />
                  </div>
                )}

              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
