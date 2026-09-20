import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAccessoryCart } from "@/hooks/useAccessoryCart";

interface Props {
  search?: string;
  onSearch?: (v: string) => void;
}

const AccessoriesHeader = ({ search, onSearch }: Props) => {
  const { count } = useAccessoryCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> UpcurvHub
        </button>
        <Link to="/accessories" className="font-bold tracking-tight text-base sm:ml-2">
          Accessories
        </Link>

        {onSearch && (
          <div className="relative flex-1 max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search for seat covers, dash cams, car care…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link to="/accessories/cart">
            <Button variant="outline" size="sm" className="relative gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {count}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AccessoriesHeader;
