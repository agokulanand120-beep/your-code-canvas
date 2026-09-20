import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * RBAC surface for the "lister" plan: listing/marketplace work only.
 * Everything else (accounting, transactions, CRM back-office) is "complete" only.
 */
export const LISTER_ALLOWED_PATHS = [
  "/vehicles",
  "/leads",
  "/marketplace-hub",
  "/analytics/marketplace",
  "/analytics/public-page",
  "/alerts",
  "/settings",
];

export const isListerAllowed = (pathname: string) =>
  LISTER_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, isLoading, userRole, isLister } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLister && !isListerAllowed(location.pathname)) {
    return <Navigate to="/marketplace-hub" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
