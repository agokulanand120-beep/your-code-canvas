import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, BadgePercent, ArrowRight, ShieldCheck, Timer } from "lucide-react";

type Cycle = "1" | "3";

const cycles: { id: Cycle; label: string; note?: string }[] = [
  { id: "1", label: "Monthly" },
  { id: "3", label: "3 Months", note: "Best value" },
];

const plans = [
  {
    id: "lister",
    name: "Lister",
    tagline: "Get your stock live on UpcurvHub",
    icon: Sparkles,
    accent: "blue",
    prices: { "1": 399, "3": 999 } as Record<Cycle, number>,
    monthly: 399,
    highlight: {
      title: "New to online selling? We do it all for you.",
      points: [
        "Our team creates and manages your dealer profile — photos, prices, badges",
        "We list and refresh your vehicles for you, no software skills needed",
        "Every buyer lead is instantly sent to you on WhatsApp & call",
        "Free onboarding call in Tamil/English — zero technical work at your end",
      ],
    },
    features: [
      "Unlimited marketplace listings",
      "Dealer catalogue page with your branding",
      "Vehicle photos, badges & pricing control",
      "Buyer enquiries & lead inbox",
      "Listing & catalogue analytics",
      "WhatsApp + call CTA on every vehicle",
    ],
    cta: "Start listing",
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "Run your entire dealership on one platform",
    icon: Crown,
    accent: "amber",
    popular: true,
    prices: { "1": 1199, "3": 2999 } as Record<Cycle, number>,
    monthly: 1199,
    features: [
      "Everything in Lister, plus:",
      "Sales, purchases, payments & expenses",
      "Customer & vendor management with ledgers",
      "GST-ready invoices and documents vault",
      "Enterprise reports & business dashboards",
      "Follow-ups, alerts, audit logs & team access",
    ],
    cta: "Go complete",
  },
];

const DealerPricingSection = () => {
  const [cycle, setCycle] = useState<Cycle>("3");
  const months = Number(cycle);

  return (
    <section className="container mx-auto px-3 md:px-4 py-8 md:py-14" id="pricing">
      <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold tracking-wide uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
          <BadgePercent className="h-3.5 w-3.5" /> Launch pricing for dealers
        </span>
        <h2 className="text-xl md:text-3xl font-bold text-foreground mt-3">
          Simple plans. Serious growth.
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          No commission on your sales. No setup fee. Cancel anytime — you keep every rupee you earn.
        </p>
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] md:text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3.5 py-2">
          <Timer className="h-3.5 w-3.5" />
          Launch offer ends soon · Only a limited number of dealer slots per district
        </div>

      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-7 md:mb-10">
        <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
          {cycles.map((c) => (
            <button
              key={c.id}
              onClick={() => setCycle(c.id)}
              aria-pressed={cycle === c.id}
              className={`relative px-3.5 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                cycle === c.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
              {c.note && (
                <span className="ml-1.5 text-[9px] md:text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                  {c.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const price = plan.prices[cycle];
          const original = plan.monthly * months;
          const saving = original - price;
          const pct = Math.round((saving / original) * 100);
          const Icon = plan.icon;
          const isPopular = !!plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-5 md:p-7 flex flex-col transition-all duration-300 ${
                isPopular
                  ? "bg-card border-amber-300 shadow-xl shadow-amber-500/10 md:-translate-y-1"
                  : "bg-card border-border hover:border-blue-300 hover:shadow-lg"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-3 py-1 shadow-md whitespace-nowrap">
                  Most popular
                </span>
              )}

              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                    isPopular ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-[11px] md:text-xs text-muted-foreground">{plan.tagline}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end gap-2 flex-wrap">
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground mb-1.5">
                    {months === 1 ? "/ month" : `/ ${months} months`}
                  </span>
                </div>

                {saving > 0 ? (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{original.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      {pct}% OFF · Save ₹{saving.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Billed monthly · switch to 3 months and save more
                  </p>
                )}

                {months > 1 && (
                  <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5">
                    Works out to ₹{Math.round(price / months).toLocaleString("en-IN")} / month
                  </p>
                )}

                <p className="mt-3 text-[11px] md:text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  💰 Just <b>one extra sale</b> from UpcurvHub covers ₹{(plan.monthly * 12).toLocaleString("en-IN")} —
                  a <b>full year</b> of {plan.name}. Everything after that is pure profit.
                </p>
              </div>


              {(plan as any).highlight && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5">
                  <p className="text-xs md:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    {(plan as any).highlight.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(plan as any).highlight.points.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] md:text-xs text-blue-900/90">
                        <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-foreground">
                    <Check
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        isPopular ? "text-amber-600" : "text-blue-600"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={`mt-6 inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isPopular
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                GST invoice · Free onboarding support
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs md:text-sm text-muted-foreground mt-6">
        Not sure which plan fits? Call us on{" "}
        <a href="tel:6380715292" className="font-semibold text-blue-600 hover:underline">
          63807 15292
        </a>{" "}
        — we'll help you pick.
      </p>
    </section>
  );
};

export default DealerPricingSection;
