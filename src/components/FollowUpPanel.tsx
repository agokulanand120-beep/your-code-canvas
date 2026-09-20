import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Phone, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { format, isToday, isPast, parseISO, isFuture } from "date-fns";

interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  vehicle_interest: string | null;
  status: string;
  priority: string;
  follow_up_date: string | null;
  notes: string | null;
  last_contact_date: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function FollowUpPanel({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["follow-ups", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, customer_name, phone, vehicle_interest, status, priority, follow_up_date, notes, last_contact_date")
        .eq("user_id", user!.id)
        .not("follow_up_date", "is", null)
        .not("status", "in", "(won,lost)")
        .order("follow_up_date", { ascending: true });
      return (data || []) as Lead[];
    },
    enabled: !!user && open,
    staleTime: 30_000,
  });

  // Realtime
  useEffect(() => {
    if (!user || !open) return;
    const ch = supabase
      .channel("followup-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, open, queryClient]);

  const groups = {
    overdue: [] as Lead[],
    today: [] as Lead[],
    upcoming: [] as Lead[],
  };
  leads.forEach((l) => {
    if (!l.follow_up_date) return;
    const d = parseISO(l.follow_up_date);
    if (isToday(d)) groups.today.push(l);
    else if (isPast(d)) groups.overdue.push(l);
    else if (isFuture(d)) groups.upcoming.push(l);
  });

  const markDone = async (lead: Lead, note?: string) => {
    const newNotes = note
      ? `${lead.notes || ""}\n[${format(new Date(), "dd MMM HH:mm")}] Follow-up done: ${note}`.trim()
      : lead.notes;
    const { error } = await supabase
      .from("leads")
      .update({
        follow_up_date: null,
        last_contact_date: new Date().toISOString(),
        status: lead.status === "new" ? "contacted" : lead.status,
        notes: newNotes,
      })
      .eq("id", lead.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Follow-up marked done" });
    setOpenNoteFor(null);
    setNoteText("");
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
    queryClient.invalidateQueries({ queryKey: ["leads-display"] });
  };

  const renderRow = (l: Lead, kind: "overdue" | "today" | "upcoming") => {
    const isOpen = openNoteFor === l.id;
    return (
      <div
        key={l.id}
        className={`border rounded-lg p-3 space-y-2 ${
          kind === "overdue" ? "border-rose-200 bg-rose-50/40 dark:bg-rose-900/10" : "bg-card"
        }`}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={false}
            onCheckedChange={() => {
              setOpenNoteFor(isOpen ? null : l.id);
              setNoteText("");
            }}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm truncate">{l.customer_name}</div>
              {kind === "overdue" && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </Badge>
              )}
              {kind === "today" && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Today</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="h-3 w-3" /> {l.phone}
              </a>
              {l.follow_up_date && (
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  {format(parseISO(l.follow_up_date), "dd MMM")}
                </span>
              )}
            </div>
            {l.vehicle_interest && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                Interest: {l.vehicle_interest}
              </div>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Add a note (optional) — what happened in this follow-up?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setOpenNoteFor(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => markDone(l, noteText)} className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Done
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Follow-ups
            <Badge variant="secondary" className="ml-auto">
              {leads.length}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                No follow-ups scheduled.
              </div>
            ) : (
              <>
                {groups.overdue.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Overdue ({groups.overdue.length})
                    </div>
                    {groups.overdue.map((l) => renderRow(l, "overdue"))}
                  </div>
                )}
                {groups.today.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Today ({groups.today.length})
                    </div>
                    {groups.today.map((l) => renderRow(l, "today"))}
                  </div>
                )}
                {groups.upcoming.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" /> Upcoming ({groups.upcoming.length})
                    </div>
                    {groups.upcoming.map((l) => renderRow(l, "upcoming"))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
