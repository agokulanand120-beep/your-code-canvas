import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { popularBrands, bikeBrands, brandInitials } from "@/lib/brandLogos";
import { slugify } from "@/lib/seoSlug";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const SEGMENTS: { id: string; label: string }[] = [
  { id: "popular", label: "Popular Brands" },
  { id: "premium", label: "Premium Brands" },
  { id: "luxury", label: "Luxury Brands" },
  { id: "bike", label: "Bike Brands" },
  { id: "other", label: "More Brands" },
];

const AllBrands = () => {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("");

  useEffect(() => {
    document.title = "All Car Brands — Browse Used Cars by Brand | UpcurvHub";
    setCity(sessionStorage.getItem("marketplace_city") || "");
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...popularBrands, ...bikeBrands].filter(
      (b) => !q || b.name.toLowerCase().includes(q)
    );
  }, [query]);

  const goToBrand = (name: string) => {
    sessionStorage.setItem("marketplace_brand", name);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">UpcurvHub</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">All Car Brands</h1>
          <p className="text-slate-600">
            Browse verified used cars from every brand on UpcurvHub
            {city && city !== "all" ? ` in ${city}` : ""}. Tap a brand to see live listings.
          </p>
        </div>

        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand..."
            className="pl-9 bg-white"
            aria-label="Search brands"
          />
        </div>

        {SEGMENTS.map((seg) => {
          const items = filtered.filter((b) => b.segment === seg.id);
          if (!items.length) return null;
          return (
            <section key={seg.id} className="mb-10">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{seg.label}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {items.map((brand) => (
                  <Link
                    key={brand.name}
                    to={`/marketplace/brand/${slugify(brand.name)}`}
                    onClick={() => goToBrand(brand.name)}
                    aria-label={`Browse used ${brand.name} cars`}
                    className="aspect-square bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 p-2 hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm md:text-base font-extrabold text-slate-400">
                          {brandInitials(brand.name)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                      {brand.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-slate-500">No brands match "{query}".</p>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AllBrands;
