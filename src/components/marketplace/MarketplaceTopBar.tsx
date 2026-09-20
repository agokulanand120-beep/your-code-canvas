import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Heart } from "lucide-react";
import useWishlist from "@/hooks/useWishlist";

interface MarketplaceTopBarProps {
  /** Show a back arrow on the left (inner pages). */
  showBack?: boolean;
  /** Slot rendered between the logo and the actions (e.g. location selector). */
  center?: ReactNode;
  /** Desktop-only nav links. */
  nav?: ReactNode;
  /** Extra action buttons rendered before the wishlist icon. */
  actions?: ReactNode;
}

/**
 * Shared marketplace top bar so the homepage, listing pages and vehicle
 * detail page all present the same persistent header.
 */
const MarketplaceTopBar = ({ showBack, center, nav, actions }: MarketplaceTopBarProps) => {
  const navigate = useNavigate();
  const { wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm">
      <div className="container mx-auto px-3 md:px-4">
        <div className="h-14 md:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-base md:text-xl font-bold text-foreground tracking-tight">UpcurvHub</span>
            </Link>
          </div>

          {center ? <div className="shrink-0">{center}</div> : null}

          {nav ? <nav className="hidden md:flex items-center gap-5">{nav}</nav> : null}

          <div className="flex items-center gap-1 shrink-0">
            {actions}
            <Link to="/marketplace/wishlist" aria-label="Wishlist" className="relative p-2">
              <Heart className="h-5 w-5 text-muted-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MarketplaceTopBar;
