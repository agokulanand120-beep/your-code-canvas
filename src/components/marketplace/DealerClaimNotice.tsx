import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Info, Loader2 } from "lucide-react";

interface Props {
  dealerUserId: string;
  dealerName?: string | null;
  sourceNote?: string | null;
  /** "dealer" = full-width banner on the dealer page, "vehicle" = compact card on a vehicle page */
  variant?: "dealer" | "vehicle";
}

const DealerClaimNotice = ({ dealerUserId, dealerName, sourceNote, variant = "dealer" }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", message: "" });

  const note =
    sourceNote?.trim() ||
    `This listing information was compiled from publicly available information shared by ${
      dealerName || "the dealer"
    }. The profile is currently maintained by the UpcurvHub team.`;

  const submit = async () => {
    if (!form.full_name.trim() || form.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Please enter your name and a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("dealer_claims").insert({
      dealer_user_id: dealerUserId,
      dealer_name: dealerName ?? null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      message: form.message.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not send your request", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    setForm({ full_name: "", phone: "", email: "", message: "" });
    toast({
      title: "Request received",
      description: "Our team will verify and contact you to hand over this profile.",
    });
  };

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 text-xs text-amber-900">
            <span className="font-semibold">Profile maintained by UpcurvHub.</span>{" "}
            <span className="text-amber-800">{note}</span>{" "}
            <button type="button" onClick={() => setOpen(true)} className="font-semibold underline underline-offset-2 hover:text-amber-700">
              Is this your business? Claim it
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim this dealer profile</DialogTitle>
            <DialogDescription>
              Share your name and number. Our team will verify ownership and hand over the account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="claim-name">Your name *</Label>
              <Input
                id="claim-name"
                value={form.full_name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="claim-phone">Phone number *</Label>
              <Input
                id="claim-phone"
                type="tel"
                value={form.phone}
                maxLength={15}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="claim-email">Email</Label>
              <Input
                id="claim-email"
                type="email"
                value={form.email}
                maxLength={255}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="claim-msg">Anything we should know?</Label>
              <Textarea
                id="claim-msg"
                rows={3}
                value={form.message}
                maxLength={500}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealerClaimNotice;
