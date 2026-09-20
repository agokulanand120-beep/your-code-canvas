import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Star, Phone, Mail, Globe, MapPin, Search, CheckCircle2,
  Sparkles, ShieldCheck, Clock, IndianRupee, Building2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { formatCurrency } from "@/lib/formatters";

export type ServiceCategory = "loan" | "insurance" | "service";

export interface ServiceListing {
  id: string;
  category: string;
  provider_name: string;
  logo_url: string | null;
  title: string;
  description: string | null;
  highlights: string[] | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  tenure_min_months: number | null;
  tenure_max_months: number | null;
  processing_fee: string | null;
  max_loan_amount: number | null;
  premium_starting: number | null;
  idv_coverage: string | null;
  claim_settlement_ratio: number | null;
  cashless_garages: number | null;
  service_price_starting: number | null;
  service_types: string[] | null;
  turnaround_time: string | null;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  rating: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  category: ServiceCategory;
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  accent: string; // tailwind gradient classes
  emptyLabel: string;
}

const SUPPORT_PHONE = "6380715292";
const SUPPORT_EMAIL = "upcurvinnovations@gmail.com";

/** Key facts shown on each card, per category. */
const factsFor = (l: ServiceListing, category: ServiceCategory) => {
  if (category === "loan") {
    return [
      l.interest_rate_min != null && {
        icon: IndianRupee,
        label: "Interest",
        value: `${l.interest_rate_min}%${l.interest_rate_max ? ` – ${l.interest_rate_max}%` : ""} p.a.`,
      },
      l.tenure_max_months != null && {
        icon: Clock,
        label: "Tenure",
        value: `${l.tenure_min_months || 12} – ${l.tenure_max_months} months`,
      },
      l.max_loan_amount != null && {
        icon: Sparkles, label: "Max amount", value: formatCurrency(Number(l.max_loan_amount)),
      },
      l.processing_fee && { icon: ShieldCheck, label: "Processing fee", value: l.processing_fee },
    ];
  }
  if (category === "insurance") {
    return [
      l.premium_starting != null && {
        icon: IndianRupee, label: "Premium from", value: formatCurrency(Number(l.premium_starting)),
      },
      l.claim_settlement_ratio != null && {
        icon: ShieldCheck, label: "Claim settlement", value: `${l.claim_settlement_ratio}%`,
      },
      l.cashless_garages != null && {
        icon: Building2, label: "Cashless garages", value: `${l.cashless_garages}+`,
      },
      l.idv_coverage && { icon: Sparkles, label: "Coverage", value: l.idv_coverage },
    ];
  }
  return [
    l.service_price_starting != null && {
      icon: IndianRupee, label: "Starting at", value: formatCurrency(Number(l.service_price_starting)),
    },
    l.turnaround_time && { icon: Clock, label: "Turnaround", value: l.turnaround_time },
    l.service_types?.length && {
      icon: Sparkles, label: "Services", value: l.service_types.slice(0, 3).join(", "),
    },
  ];
};

const ServiceListingsPage = ({
  category, title, subtitle, seoTitle, seoDescription, accent, emptyLabel,
}: Props) => {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [enquiryFor, setEnquiryFor] = useState<ServiceListing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", city: "", message: "" });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["service-listings", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ServiceListing[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const cities = useMemo(
    () => [...new Set(listings.map((l) => l.city).filter(Boolean))] as string[],
    [listings],
  );

  const filtered = useMemo(() => {
    let rows = listings.filter((l) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        l.provider_name.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q);
      const matchesCity = cityFilter === "all" || l.city === cityFilter;
      return matchesSearch && matchesCity;
    });

    if (sortBy === "rating") {
      rows = [...rows].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "price") {
      const price = (l: ServiceListing) =>
        Number(l.interest_rate_min ?? l.premium_starting ?? l.service_price_starting ?? Infinity);
      rows = [...rows].sort((a, b) => price(a) - price(b));
    }
    return rows;
  }, [listings, search, cityFilter, sortBy]);

  const submitEnquiry = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("service_enquiries").insert({
      category,
      listing_id: enquiryFor?.id ?? null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      message: form.message.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Could not submit your enquiry. Please try again.");
      return;
    }
    toast.success("Enquiry submitted — our team will call you shortly.", { duration: 6000 });
    setEnquiryFor(null);
    setForm({ full_name: "", phone: "", email: "", city: "", message: "" });
  };

  const canonical = `https://upcurvhub.upcurv.in/${
    category === "loan" ? "car-loan" : category === "insurance" ? "insurance" : "car-services"
  }`;

  // Lightweight per-page head tags (crawler-visible tags live in index.html)
  useEffect(() => {
    document.title = seoTitle;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", seoDescription);
    setMeta("property", "og:title", seoTitle);
    setMeta("property", "og:description", seoDescription);
    setMeta("property", "og:url", canonical);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [seoTitle, seoDescription, canonical]);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className={`bg-gradient-to-br ${accent} text-white`}>
        <div className="container mx-auto px-4 py-10 md:py-14">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to UpcurvHub
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-white/85">{subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${SUPPORT_PHONE}`}>
              <Button variant="secondary" className="gap-2">
                <Phone className="h-4 w-4" /> Talk to an expert
              </Button>
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Button variant="outline" className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Mail className="h-4 w-4" /> Email us
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers, plans or offers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="price">Lowest price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-lg font-semibold">{emptyLabel}</p>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Leave your details and our team will get back with the best available options.
              </p>
              <Button onClick={() => setEnquiryFor({ id: "", title: "" } as ServiceListing)}>
                Request a callback
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l) => {
              const facts = factsFor(l, category).filter(Boolean) as {
                icon: any; label: string; value: string;
              }[];
              return (
                <Card key={l.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      {l.logo_url ? (
                        <img
                          src={l.logo_url}
                          alt={`${l.provider_name} logo`}
                          loading="lazy"
                          className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{l.provider_name}</p>
                          {l.is_featured && <Badge className="shrink-0">Featured</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{l.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {l.rating != null && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {Number(l.rating).toFixed(1)}
                            </span>
                          )}
                          {l.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {l.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {l.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>
                    )}

                    {facts.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {facts.map((f, i) => (
                          <div key={i} className="rounded-lg bg-muted/50 p-2">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <f.icon className="h-3 w-3" /> {f.label}
                            </p>
                            <p className="text-sm font-semibold truncate">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!!l.highlights?.length && (
                      <ul className="space-y-1">
                        {l.highlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => setEnquiryFor(l)}>
                        {l.cta_label || "Get this offer"}
                      </Button>
                      {l.contact_phone && (
                        <a href={`tel:${l.contact_phone}`} aria-label={`Call ${l.provider_name}`}>
                          <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
                        </a>
                      )}
                      {l.website_url && (
                        <a
                          href={l.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${l.provider_name} website`}
                        >
                          <Button variant="outline" size="icon"><Globe className="h-4 w-4" /></Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <MarketplaceFooter />

      {/* Enquiry dialog */}
      <Dialog open={!!enquiryFor} onOpenChange={(o) => !o && setEnquiryFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{enquiryFor?.provider_name ? `Enquire — ${enquiryFor.provider_name}` : "Request a callback"}</DialogTitle>
            <DialogDescription>
              Share your details and our team will reach out on {SUPPORT_PHONE}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-name">Full name *</Label>
              <Input id="se-name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="se-phone">Phone *</Label>
                <Input id="se-phone" inputMode="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-city">District</Label>
                <Input id="se-city" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-email">Email</Label>
              <Input id="se-email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-msg">Message</Label>
              <Textarea id="se-msg" rows={3} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnquiryFor(null)}>Cancel</Button>
            <Button onClick={submitEnquiry} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceListingsPage;
