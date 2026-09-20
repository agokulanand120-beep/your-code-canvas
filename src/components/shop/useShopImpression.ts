import { useEffect, useRef } from "react";
import { trackShopEvent } from "@/lib/shopAnalytics";

/**
 * Records one impression for a product the first time its card is
 * actually visible on screen (not merely rendered below the fold).
 */
export function useShopImpression(product: { id: string; category?: string | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            trackShopEvent("impression", product);
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product.id]);

  return ref;
}
