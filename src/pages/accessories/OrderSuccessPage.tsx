import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AccessoriesHeader from "@/components/accessories/AccessoriesHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const OrderSuccessPage = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get("order");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AccessoriesHeader />
      <div className="container mx-auto px-4 py-16 flex-1 flex justify-center">
        <Card className="w-full max-w-lg h-fit">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">Order placed successfully</h1>
            <p className="text-muted-foreground">
              Thank you! Our team will call you shortly to confirm delivery details.
            </p>
            {orderNumber && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Order number</p>
                <p className="font-mono font-semibold tracking-wide">{orderNumber}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/accessories" className="flex-1">
                <Button variant="outline" className="w-full gap-2"><Package className="h-4 w-4" /> Continue shopping</Button>
              </Link>
              <a href="tel:6380715292" className="flex-1">
                <Button className="w-full gap-2"><Phone className="h-4 w-4" /> Call support</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      <MarketplaceFooter />
    </div>
  );
};

export default OrderSuccessPage;
