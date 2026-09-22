import { Link, useLocation } from "react-router-dom";
import { Car, Tag, ShoppingBag, Home } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
  { to: "/marketplace/vehicles", label: "Vehicles", icon: Car, color: "text-indigo-600", bg: "bg-indigo-50" },
  { to: "/sell-vehicle", label: "Sell", icon: Tag, color: "text-emerald-600", bg: "bg-emerald-50" },
  { to: "/shop", label: "Shop", icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
];

/** Mobile bottom navigation for the public marketplace. */
const MarketplaceBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        {items.map(({ to, label, icon: Icon, color, bg }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 ${active ? color : "text-muted-foreground"}`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${active ? bg : "bg-muted"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplaceBottomNav;
