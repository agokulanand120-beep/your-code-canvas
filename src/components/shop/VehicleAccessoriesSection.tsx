import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { type ShopProduct, toShopVehicleType } from "@/lib/shopTypes";

interface Props {
  /** Dealer vehicle_type value (car, bike, scooter…). */
  vehicleType?: string | null;
  /** Shown in the heading, e.g. "Creta" or "Hyundai Creta". */
  vehicleName?: string | null;
  limit?: number;
}

/**
 * "Recommended for your Creta" — accessory picks matched to the vehicle
 * being viewed, connecting vehicle discovery to ownership spend.
 */
const VehicleAccessoriesSection = ({ vehicleType, vehicleName, limit = 6 }: Props) => {
  const type = toShopVehicleType(vehicleType);

  const { data } = useQuery({
    queryKey: ["shop-products-for-vehicle", type, limit],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .contains("vehicle_types", [type])
        .order("is_featured", { ascending: false })
        .order("sort_order")
        .limit(limit);
      return (data || []) as unknown as ShopProduct[];
    },
  });

  const products = data || [];
  if (!products.length) return null;

  const heading = vehicleName
    ? `Recommended for your ${vehicleName}`
    : type === "bike"
      ? "Bike essentials"
      : "Car essentials";

  return (
    <section className="mt-8">
      <div className="rounded-2xl md:rounded-3xl border border-border bg-card/60 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <Badge variant="secondary" className="gap-1 mb-2">
              <ShoppingBag className="h-3 w-3" /> Ownership essentials
            </Badge>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">{heading}</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              The accessories owners buy first — picked for {type === "bike" ? "two-wheelers" : "cars"} like this one.
            </p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/shop">
              Shop all accessories <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {products.map((p) => (
            <ShopProductCard key={p.id} p={p} />
          ))}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Links go to our partner store. We may earn a commission on qualifying purchases at no extra cost to you.
        </p>
      </div>
    </section>
  );
};

export default VehicleAccessoriesSection;
