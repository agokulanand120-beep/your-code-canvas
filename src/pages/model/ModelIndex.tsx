import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import Seo from "@/components/Seo";
import { slugify } from "@/lib/seoSlug";
import { ALL_MODELS } from "@/data/models";
import { getBrandLogo } from "@/lib/brandLogos";
import { ChevronRight } from "lucide-react";

const SITE = "https://upcurvhub.upcurv.in";

type Row = { category: string; brand: string; model: string };

/** Directory of every model hub page: /models */
const ModelIndex = ({ category }: { category?: "cars" | "bikes" }) => {
  const { data } = useQuery({
    queryKey: ["model-index", category],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      let q = supabase.from("model_docs").select("category, brand, model").eq("is_active", true);
      if (category) q = q.eq("category", category);
      const { data } = await q.order("brand").order("model").limit(2000);
      return (data || []) as Row[];
    },
  });

  const grouped = useMemo(() => {
    const all: Row[] = [
      ...ALL_MODELS.filter((m) => !category || m.category === category).map((m) => ({
        category: m.category,
        brand: m.brand,
        model: m.model,
      })),
      ...(data || []),
    ];
    const seen = new Set<string>();
    const map = new Map<string, Row[]>();
    all.forEach((r) => {
      const key = `${r.category}/${slugify(r.brand)}/${slugify(r.model)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const list = map.get(r.brand) || [];
      list.push(r);
      map.set(r.brand, list);
    });
    return [...map.entries()]
      .map(([brand, models]) => [brand, models.sort((a, b) => a.model.localeCompare(b.model))] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, category]);

  const total = grouped.reduce((n, [, m]) => n + m.length, 0);
  const label = category === "bikes" ? "Bike" : category === "cars" ? "Car" : "Car & Bike";
  const path = category ? `/models/${category}` : "/models";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${label} Models in India — Specs, Variants, Mileage & Used Prices | UpcurvHub`}
        description={`Browse ${total}+ ${label.toLowerCase()} models in India with specifications, variants, mileage, ownership costs, buying checks and live used listings from verified dealers.`}
        path={path}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE },
              { "@type": "ListItem", position: 2, name: `${label} Models`, item: `${SITE}${path}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            numberOfItems: total,
            itemListElement: grouped
              .flatMap(([, models]) => models)
              .slice(0, 200)
              .map((m, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: `${m.brand} ${m.model}`,
                url: `${SITE}/${m.category}/${slugify(m.brand)}/${slugify(m.model)}`,
              })),
          },
        ]}
      />
      <MarketplaceTopBar />

      <main className="container mx-auto px-3 md:px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{label} Models</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {label} Models in India
        </h1>
        <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground">
          Detailed model pages with specifications, variants, mileage, features, safety, ownership
          costs and a used buying checklist — plus every matching vehicle listed by verified
          UpcurvHub dealers.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link to="/models" className="rounded-full border px-3 py-1.5 hover:bg-muted">All models</Link>
          <Link to="/models/cars" className="rounded-full border px-3 py-1.5 hover:bg-muted">Cars</Link>
          <Link to="/models/bikes" className="rounded-full border px-3 py-1.5 hover:bg-muted">Bikes</Link>
        </div>

        <div className="mt-8 space-y-8">
          {grouped.map(([brand, models]) => (
            <section key={brand}>
              <div className="flex items-center gap-2 mb-3">
                {getBrandLogo(brand) ? (
                  <img src={getBrandLogo(brand)} alt={`${brand} logo`} className="h-7 w-7 object-contain" loading="lazy" />
                ) : null}
                <h2 className="text-base md:text-lg font-semibold text-foreground">{brand} models</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {models.map((m) => (
                  <Link
                    key={`${m.category}-${m.model}`}
                    to={`/${m.category}/${slugify(m.brand)}/${slugify(m.model)}`}
                    className="rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground hover:border-primary hover:shadow-sm transition"
                  >
                    {m.brand} {m.model}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default ModelIndex;
