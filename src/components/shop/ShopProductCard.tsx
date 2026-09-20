import { Link } from "react-router-dom";
import { Package, Star, ExternalLink, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { trackShopEvent } from "@/lib/shopAnalytics";
import { useShopImpression } from "@/components/shop/useShopImpression";
import {
  type ShopProduct, categoryLabel, discountPct, storeLabel,
} from "@/lib/shopTypes";

interface Props {
  p: ShopProduct;
  /** Editorial "why you need this" line — overrides the product's own reason. */
  reason?: string | null;
  /** Position in a curated list, shown as a rank chip. */
  rank?: number;
}

const ShopProductCard = ({ p, reason, rank }: Props) => {
  const ref = useShopImpression(p);
  const off = discountPct(Number(p.price), p.mrp);
  const why = reason ?? p.reason ?? p.short_description;

  return (
    <Card
      ref={ref}
      className="group h-full flex flex-col overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-[0_10px_34px_-16px_hsl(var(--primary)/0.4)] transition-all"
    >
      <Link to={`/shop/${p.slug}`} className="block" aria-label={p.name}>
        <div className="relative aspect-square bg-muted overflow-hidden">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={`${p.name}${p.brand ? ` by ${p.brand}` : ""} — ${categoryLabel(p.category)}`}
              loading="lazy"
              width={480}
              height={480}
              className="h-full w-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {rank != null && (
            <span className="absolute top-2 left-2 h-7 w-7 rounded-full bg-foreground/85 text-background text-xs font-bold flex items-center justify-center">
              {rank}
            </span>
          )}
          {off > 0 && (
            <Badge className={`absolute top-2 ${rank != null ? "right-2" : "left-2"} bg-emerald-600 hover:bg-emerald-600`}>
              {off}% OFF
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-3 flex flex-col gap-1.5 flex-1">
        {p.brand && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
        <Link to={`/shop/${p.slug}`}>
          <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">
            {p.name}
          </p>
        </Link>

        {why && (
          <p className="text-xs text-muted-foreground flex gap-1.5 leading-snug">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-[1px]" />
            <span className="line-clamp-3">{why}</span>
          </p>
        )}

        {p.rating != null && (
          <span className="text-xs flex items-center gap-1 text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {Number(p.rating).toFixed(1)} <Star className="h-2.5 w-2.5 fill-current" />
            </span>
            {!!p.review_count && `${p.review_count} ratings`}
          </span>
        )}

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-bold">{formatCurrency(Number(p.price))}</span>
          {p.mrp && Number(p.mrp) > Number(p.price) && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(Number(p.mrp))}</span>
          )}
        </div>

        <div className="mt-auto pt-2 space-y-1.5">
          <Button size="sm" className="w-full gap-1.5" asChild>
            <a
              href={p.buy_url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              onClick={() => trackShopEvent("click", p)}
            >
              Check Price on {storeLabel(p.merchant)} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Link
            to={`/shop/${p.slug}`}
            className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Read full review
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopProductCard;
