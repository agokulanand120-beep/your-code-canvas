import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Car, Bike, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { popularBrands, bikeBrands as bikeBrandLogos, brandInitials } from "@/lib/brandLogos";
import { getModelsForBrand } from "@/lib/vehicleData";

const SESSION_KEY = "buyer_intent_popup_shown";
const DELAY_MS = 20_000;

/** Routes where the popup must never appear (dealer pages, vehicle detail, app/admin). */
const BLOCKED_PREFIXES = [
  "/marketplace/vehicle/",
  "/marketplace/dealer/",
  "/d/",
  "/v/",
  "/catalogue/",
  "/admin",
  "/auth",
  "/inspection/",
  "/dashboard",
  "/vehicles",
  "/customers",
  "/vendors",
  "/sales",
  "/purchases",
  "/payments",
  "/emi",
  "/expenses",
  "/documents",
  "/leads",
  "/services",
  "/reports",
  "/marketplace-hub",
  "/analytics/",
  "/alerts",
  "/settings",
  "/calendar",
  "/audit-logs",
  "/accessories/checkout",
  "/accessories/cart",
  "/accessories/order-success",
];

const isBlocked = (path: string) => BLOCKED_PREFIXES.some((p) => path.startsWith(p));

const BuyerIntentPopup = () => {
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [vehicleType, setVehicleType] = useState<"car" | "bike" | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (isBlocked(pathname)) return;
    const t = setTimeout(() => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(t);
    // Only arm the timer once per mount; blocked routes simply never arm it.
  }, [pathname]);

  useEffect(() => {
    if (!city) {
      const saved = sessionStorage.getItem("marketplace_city");
      if (saved && saved !== "all") setCity(saved);
    }
  }, [city]);

  const brandOptions = useMemo(
    () => (vehicleType === "bike" ? bikeBrandLogos : popularBrands).slice(0, 12),
    [vehicleType]
  );

  const models = useMemo(() => {
    if (!brand || !vehicleType) return [] as string[];
    return getModelsForBrand(vehicleType, brand).map((m) => m.name);
  }, [brand, vehicleType]);

  const close = () => setOpen(false);

  const submit = async () => {
    if (!fullName.trim() || phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Please enter your name and a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("buyer_intents").insert({
        full_name: fullName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 20),
        city: city.trim().slice(0, 80) || null,
        vehicle_type: vehicleType || "car",
        brand,
        model: model || null,
        source_path: pathname,
        session_id: sessionStorage.getItem("analytics_session_id") || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      toast({ title: "Could not submit", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] animate-fade-in" onClick={close} />
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border overflow-hidden animate-scale-in">
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>

          {done ? (
            <div className="p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Thank you, {fullName.split(" ")[0]}!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                We've received your interest in {brand}
                {model ? ` ${model}` : ""}. Our team will notify you as soon as a matching
                verified vehicle is listed near you.
              </p>
              <Button className="w-full" onClick={close}>Continue browsing</Button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-primary-foreground p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="h-5 w-5" />
                  <span className="text-sm font-semibold opacity-90">Find your perfect vehicle</span>
                </div>
                <h3 className="text-lg font-bold">
                  {step === 1 && "What are you looking for?"}
                  {step === 2 && "Which brand are you interested in?"}
                  {step === 3 && "Pick a model"}
                  {step === 4 && "Where should we reach you?"}
                </h3>
                <div className="flex gap-1.5 mt-3">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full ${s <= step ? "bg-white" : "bg-white/30"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5 max-h-[55vh] overflow-y-auto">
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { type: "car" as const, label: "Car", Icon: Car },
                      { type: "bike" as const, label: "Bike", Icon: Bike },
                    ]).map(({ type, label, Icon }) => (
                      <button
                        key={type}
                        onClick={() => { setVehicleType(type); setBrand(""); setModel(""); setStep(2); }}
                        className={`rounded-2xl border p-6 flex flex-col items-center gap-2 transition-all hover:border-blue-500 hover:shadow ${
                          vehicleType === type ? "border-blue-600 bg-blue-50" : "border-border"
                        }`}
                      >
                        <Icon className="h-8 w-8 text-blue-600" />
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {brandOptions.map((b) => (
                      <button
                        key={b.name}
                        onClick={() => { setBrand(b.name); setModel(""); setStep(3); }}
                        className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-all hover:border-blue-500 hover:shadow ${
                          brand === b.name ? "border-blue-600 bg-blue-50" : "border-border"
                        }`}
                      >
                        <div className="h-11 w-11 flex items-center justify-center">
                          {b.logo ? (
                            <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">{brandInitials(b.name)}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-2">
                    {models.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No preset models for {brand}. Continue to the next step.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {models.map((m) => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setStep(4); }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium text-left transition-colors hover:border-blue-500 ${
                            model === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      Interested in <span className="font-semibold text-foreground">{brand}{model ? ` ${model}` : ""}</span>
                    </div>
                    <div>
                      <Label htmlFor="bi-name">Your name *</Label>
                      <Input id="bi-name" value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div>
                      <Label htmlFor="bi-phone">Phone number *</Label>
                      <Input id="bi-phone" value={phone} maxLength={20} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
                    </div>
                    <div>
                      <Label htmlFor="bi-city">City</Label>
                      <Input id="bi-city" value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Coimbatore" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border p-4">
                {step > 1 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                ) : (
                  <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground">
                    Maybe later
                  </button>
                )}
                {step === 3 && (
                  <Button size="sm" onClick={() => setStep(4)}>Continue</Button>
                )}
                {step === 4 && (
                  <Button size="sm" onClick={submit} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Notify me
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BuyerIntentPopup;
