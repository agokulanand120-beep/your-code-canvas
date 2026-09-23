import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DealerProfileValues = Record<string, any>;

export const emptyDealerProfile = (): DealerProfileValues => ({
  dealer_name: "",
  shop_tagline: "",
  dealer_tag: "",
  dealer_phone: "",
  whatsapp_number: "",
  dealer_email: "",
  dealer_address: "",
  dealer_gst: "",
  gmap_link: "",
  shop_logo_url: "",
  marketplace_tagline: "",
  marketplace_description: "",
  marketplace_working_hours: "",
  marketplace_badge: "",
  google_reviews_rating: "",
  google_reviews_count: "",
  google_reviews_url: "",
  managed_source_note: "",
  seo_title: "",
  seo_description: "",
  plan: "lister",
  marketplace_enabled: true,
  marketplace_status: "approved",
  marketplace_featured: false,
});

interface Props {
  value: DealerProfileValues;
  onChange: (patch: DealerProfileValues) => void;
  /** Hide fields that only make sense for admin-maintained profiles */
  showManagedNote?: boolean;
}

const DealerProfileFields = ({ value, onChange, showManagedNote = true }: Props) => {
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });
  const txt = (k: string) => value[k] ?? "";

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-semibold">Business details</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Dealer / shop name *</Label>
            <Input value={txt("dealer_name")} maxLength={150} onChange={(e) => set("dealer_name", e.target.value)} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={txt("shop_tagline")} maxLength={120} onChange={(e) => set("shop_tagline", e.target.value)} />
          </div>
          <div>
            <Label>Dealer tag (e.g. Multi-brand showroom)</Label>
            <Input value={txt("dealer_tag")} maxLength={80} onChange={(e) => set("dealer_tag", e.target.value)} />
          </div>
          <div>
            <Label>GST number</Label>
            <Input value={txt("dealer_gst")} maxLength={30} onChange={(e) => set("dealer_gst", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={txt("dealer_phone")} maxLength={20} onChange={(e) => set("dealer_phone", e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp number</Label>
            <Input value={txt("whatsapp_number")} maxLength={20} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </div>
          <div>
            <Label>Business email</Label>
            <Input type="email" value={txt("dealer_email")} maxLength={255} onChange={(e) => set("dealer_email", e.target.value)} />
          </div>
          <div>
            <Label>Working hours</Label>
            <Input value={txt("marketplace_working_hours")} maxLength={120} onChange={(e) => set("marketplace_working_hours", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input value={txt("dealer_address")} maxLength={300} onChange={(e) => set("dealer_address", e.target.value)} />
          </div>
          <div>
            <Label>Google Maps link</Label>
            <Input value={txt("gmap_link")} maxLength={500} onChange={(e) => set("gmap_link", e.target.value)} />
          </div>
          <div>
            <Label>Logo image URL</Label>
            <Input value={txt("shop_logo_url")} maxLength={500} onChange={(e) => set("shop_logo_url", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Marketplace presentation</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Marketplace tagline</Label>
            <Input value={txt("marketplace_tagline")} maxLength={160} onChange={(e) => set("marketplace_tagline", e.target.value)} />
          </div>
          <div>
            <Label>Badge (e.g. Trusted Dealer)</Label>
            <Input value={txt("marketplace_badge")} maxLength={40} onChange={(e) => set("marketplace_badge", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>About this dealer</Label>
            <Textarea rows={3} value={txt("marketplace_description")} maxLength={1500} onChange={(e) => set("marketplace_description", e.target.value)} />
          </div>
          <div>
            <Label>Google rating</Label>
            <Input type="number" step="0.1" min="0" max="5" value={txt("google_reviews_rating")} onChange={(e) => set("google_reviews_rating", e.target.value)} />
          </div>
          <div>
            <Label>Google review count</Label>
            <Input type="number" min="0" value={txt("google_reviews_count")} onChange={(e) => set("google_reviews_count", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Google reviews URL</Label>
            <Input value={txt("google_reviews_url")} maxLength={500} onChange={(e) => set("google_reviews_url", e.target.value)} />
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={value.plan ?? "lister"} onValueChange={(v) => set("plan", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lister">Lister (listing only)</SelectItem>
                <SelectItem value="complete">Complete (full suite)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marketplace status</Label>
            <Select value={value.marketplace_status ?? "approved"} onValueChange={(v) => set("marketplace_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="cursor-pointer">Show on marketplace</Label>
            <Switch checked={value.marketplace_enabled !== false} onCheckedChange={(v) => set("marketplace_enabled", v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="cursor-pointer">Feature this dealer</Label>
            <Switch checked={!!value.marketplace_featured} onCheckedChange={(v) => set("marketplace_featured", v)} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Search listing</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>SEO title</Label>
            <Input value={txt("seo_title")} maxLength={70} onChange={(e) => set("seo_title", e.target.value)} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Input value={txt("seo_description")} maxLength={160} onChange={(e) => set("seo_description", e.target.value)} />
          </div>
        </div>
      </div>

      {showManagedNote && (
        <div>
          <Label>Data source note (shown publicly)</Label>
          <Textarea
            rows={2}
            maxLength={400}
            placeholder="Information compiled from publicly available details shared by the dealer."
            value={txt("managed_source_note")}
            onChange={(e) => set("managed_source_note", e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default DealerProfileFields;
