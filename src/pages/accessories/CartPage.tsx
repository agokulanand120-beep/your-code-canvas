import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AccessoriesHeader from "@/components/accessories/AccessoriesHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { formatCurrency } from "@/lib/formatters";
import { useAccessoryCart, FREE_SHIPPING_ABOVE } from "@/hooks/useAccessoryCart";

const CartPage = () => {
  const { items, setQty, remove, totals, count } = useAccessoryCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AccessoriesHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold mb-6">Your cart {count > 0 && <span className="text-muted-foreground text-base font-normal">({count} items)</span>}</h1>

        {items.length === 0 ? (
          <Card><CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/accessories"><Button>Browse accessories</Button></Link>
          </CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="space-y-3">
              {items.map((i) => (
                <Card key={i.id}>
                  <CardContent className="p-3 flex gap-3">
                    <Link to={`/accessories/${i.slug}`} className="h-24 w-24 shrink-0 rounded-lg bg-muted overflow-hidden">
                      {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/accessories/${i.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary">
                        {i.name}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-bold">{formatCurrency(i.price)}</span>
                        {i.mrp && i.mrp > i.price && (
                          <span className="text-xs text-muted-foreground line-through">{formatCurrency(i.mrp)}</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="inline-flex items-center rounded-md border">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.id, i.qty - 1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.id, i.qty + 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive gap-1.5" onClick={() => remove(i.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-right font-semibold hidden sm:block">{formatCurrency(i.price * i.qty)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="lg:sticky lg:top-20">
              <CardContent className="p-5 space-y-3">
                <h2 className="font-semibold">Order summary</h2>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                {totals.savings > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600"><span>Total savings</span><span>−{formatCurrency(totals.savings)}</span></div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{totals.shipping === 0 ? "FREE" : formatCurrency(totals.shipping)}</span>
                </div>
                {totals.shipping > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Add {formatCurrency(FREE_SHIPPING_ABOVE - totals.subtotal)} more for free shipping
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
                <Button className="w-full gap-2" size="lg" onClick={() => navigate("/accessories/checkout")}>
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <Link to="/accessories" className="block">
                  <Button variant="ghost" className="w-full">Continue shopping</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <MarketplaceFooter />
    </div>
  );
};

export default CartPage;
