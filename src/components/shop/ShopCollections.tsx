import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ShopProductCard from "@/components/shop/ShopProductCard";
import type { ShopCollection, ShopCollectionItem, ShopProduct } from "@/lib/shopTypes";

export interface CollectionWithProducts extends ShopCollection {
  products: { product: ShopProduct; reason: string | null }[];
}

export const useShopCollections = () =>
  useQuery({
    queryKey: ["shop-collections"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CollectionWithProducts[]> => {
      const [{ data: collections }, { data: items }, { data: products }] = await Promise.all([
        supabase.from("shop_collections").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("shop_collection_items").select("*").order("sort_order"),
        supabase.from("shop_products").select("*").eq("is_active", true),
      ]);

      const byId = new Map<string, ShopProduct>(
        ((products || []) as unknown as ShopProduct[]).map((p) => [p.id, p]),
      );

      return ((collections || []) as unknown as ShopCollection[]).map((c) => ({
        ...c,
        products: ((items || []) as unknown as ShopCollectionItem[])
          .filter((i) => i.collection_id === c.id && byId.has(i.product_id))
          .map((i) => ({ product: byId.get(i.product_id)!, reason: i.reason })),
      })).filter((c) => c.products.length > 0);
    },
  });

export const CollectionSection = ({ c }: { c: CollectionWithProducts }) => (
  <section className="container mx-auto px-4 py-8 md:py-10" id={c.slug}>
    <div className="rounded-2xl md:rounded-3xl border border-border bg-card/60 p-5 md:p-8">
      <Badge variant="secondary" className="gap-1 mb-3">
        <BookOpen className="h-3 w-3" /> Buying guide
      </Badge>
      <h2 className="text-xl md:text-3xl font-bold tracking-tight">{c.title}</h2>
      {c.subtitle && <p className="mt-1 text-sm md:text-base font-medium text-primary">{c.subtitle}</p>}
      {c.intro && (
        <p className="mt-3 max-w-3xl text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
          {c.intro}
        </p>
      )}

      <ol className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {c.products.map((row, i) => (
          <li key={row.product.id} className="list-none">
            <ShopProductCard p={row.product} reason={row.reason} rank={i + 1} />
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/shop#all-products">
            See all products <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />
          Prices and stock are shown on the partner store. We may earn a commission on qualifying purchases.
        </p>
      </div>
    </div>
  </section>
);

const ShopCollections = () => {
  const { data } = useShopCollections();
  if (!data?.length) return null;
  return (
    <>
      {data.map((c) => (
        <CollectionSection key={c.id} c={c} />
      ))}
    </>
  );
};

export default ShopCollections;
