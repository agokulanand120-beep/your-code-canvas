import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { RouteSeo } from "@/components/Seo";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import { PageSkeleton, DashboardSkeleton } from "./components/ui/page-skeleton";
import { loadVehicleCatalogOverlay } from "./lib/vehicleCatalog";

// Merge admin-managed brands/models/variants into the static catalogue once.
void loadVehicleCatalogOverlay();
import FooterPageSkeleton from "./components/marketplace/FooterPageSkeleton";
import { MarketplaceSkeleton, VehiclePageSkeleton, DealerPageSkeleton, SellVehicleSkeleton } from "./components/marketplace/ShimmerSkeleton";

// ─── Lazy-loaded pages (code-split per route) ───────────────────────
// Public marketplace
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceVehicle = lazy(() => import("./pages/marketplace/MarketplaceVehicle"));
const MarketplaceDealer = lazy(() => import("./pages/marketplace/MarketplaceDealer"));
const CompareVehicles = lazy(() => import("./pages/marketplace/CompareVehicles"));

const Wishlist = lazy(() => import("./pages/marketplace/Wishlist"));
const AllDealers = lazy(() => import("./pages/marketplace/AllDealers"));
const AllVehicles = lazy(() => import("./pages/marketplace/AllVehicles"));
const CityVehicles = lazy(() => import("./pages/marketplace/CityVehicles"));
const BrandVehicles = lazy(() => import("./pages/marketplace/BrandVehicles"));
const SellVehicle = lazy(() => import("./pages/marketplace/SellVehicle"));
const SellVehicleFormPage = lazy(() => import("./pages/marketplace/SellVehicleFormPage"));
const CarLoanPage = lazy(() => import("./pages/services/CarLoanPage"));
const InsurancePage = lazy(() => import("./pages/services/InsurancePage"));
const CarServicesPage = lazy(() => import("./pages/services/CarServicesPage"));
const MarketplaceAdmin = lazy(() => import("./pages/admin/MarketplaceAdmin"));
const AdminVendors = lazy(() => import("./pages/admin/AdminVendors"));
const AdminVendorProfile = lazy(() => import("./pages/admin/AdminVendorProfile"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminAccessories = lazy(() => import("./pages/admin/AdminAccessories"));
const ShopPage = lazy(() => import("./pages/shop/ShopPage"));
const ShopProductPage = lazy(() => import("./pages/shop/ShopProductPage"));
const AdminShopAnalytics = lazy(() => import("./pages/admin/AdminShopAnalytics"));
const AdminShop = lazy(() => import("./pages/admin/AdminShop"));
const AdminVehicleCatalog = lazy(() => import("./pages/admin/AdminVehicleCatalog"));
const AdminModelPages = lazy(() => import("./pages/admin/AdminModelPages"));
const AccessoriesPage = lazy(() => import("./pages/accessories/AccessoriesPage"));
const AccessoryProductPage = lazy(() => import("./pages/accessories/AccessoryProductPage"));
const CartPage = lazy(() => import("./pages/accessories/CartPage"));
const CheckoutPage = lazy(() => import("./pages/accessories/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/accessories/OrderSuccessPage"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminBuyerIntents = lazy(() => import("./pages/admin/AdminBuyerIntents"));
const AdminSellRequests = lazy(() => import("./pages/admin/AdminSellRequests"));
const AdminDealerAccounts = lazy(() => import("./pages/admin/AdminDealerAccounts"));
const AdminDealerDetail = lazy(() => import("./pages/admin/AdminDealerDetail"));

const AllBrands = lazy(() => import("./pages/marketplace/AllBrands"));
const ModelHub = lazy(() => import("./pages/model/ModelHub"));
const ModelIndex = lazy(() => import("./pages/model/ModelIndex"));
const PricingPage = lazy(() => import("./pages/marketplace/PricingPage"));
import AdminLayout from "./components/admin/AdminLayout";
import BuyerIntentPopup from "./components/marketplace/BuyerIntentPopup";

// Public pages
const Auth = lazy(() => import("./pages/Auth"));
const PublicVehicle = lazy(() => import("./pages/PublicVehicle"));
const DealerPublicPage = lazy(() => import("./pages/DealerPublicPage"));

// Footer pages
const AboutPage = lazy(() => import("./pages/footer/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/footer/HowItWorksPage"));
const ContactPage = lazy(() => import("./pages/footer/ContactPage"));
const FAQPage = lazy(() => import("./pages/footer/FAQPage"));
const TermsPage = lazy(() => import("./pages/footer/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/footer/PrivacyPage"));
const BlogPage = lazy(() => import("./pages/footer/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/footer/BlogPostPage"));

// Protected pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Customers = lazy(() => import("./pages/Customers"));
const Vendors = lazy(() => import("./pages/Vendors"));
const Sales = lazy(() => import("./pages/Sales"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Payments = lazy(() => import("./pages/Payments"));
const EMI = lazy(() => import("./pages/EMI"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Documents = lazy(() => import("./pages/Documents"));
const Leads = lazy(() => import("./pages/Leads"));
const Services = lazy(() => import("./pages/Services"));
const Reports = lazy(() => import("./pages/Reports"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Settings = lazy(() => import("./pages/Settings"));
const DealerMarketplaceHub = lazy(() => import("./pages/DealerMarketplaceHub"));
const MarketplaceAnalytics = lazy(() => import("./pages/MarketplaceAnalytics"));
const PublicPageAnalytics = lazy(() => import("./pages/PublicPageAnalytics"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const VehicleInspection = lazy(() => import("./pages/VehicleInspection"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
      structuralSharing: true,
    },
  },
});

// ─── Route wrapper helpers ───────────────────────────────────────────
// Fallback defaults to `null` so React reuses the previous page UI until the new
// route's own skeleton mounts — eliminates the "generic skeleton → page skeleton"
// double-loader flash on every navigation. Pass an explicit `skeleton` prop when
// a route needs an initial-load placeholder (e.g. footer pages).
const SuspenseWrap = ({ children, skeleton }: { children: React.ReactNode; skeleton?: React.ReactNode }) => (
  <Suspense fallback={skeleton ?? null}>{children}</Suspense>
);

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>
      {/* No fallback here — each page renders its own skeleton.
          Avoids the "double loader" (generic chunk loader, then page skeleton). */}
      <Suspense fallback={null}>{children}</Suspense>
    </Layout>
  </ProtectedRoute>
);

// ─── Protected route configs ─────────────────────────────────────────
const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/vehicles", element: <Vehicles /> },
  { path: "/customers", element: <Customers /> },
  { path: "/vendors", element: <Vendors /> },
  { path: "/sales", element: <Sales /> },
  { path: "/purchases", element: <Purchases /> },
  { path: "/payments", element: <Payments /> },
  { path: "/emi", element: <EMI /> },
  { path: "/expenses", element: <Expenses /> },
  { path: "/documents", element: <Documents /> },
  { path: "/leads", element: <Leads /> },
  { path: "/services", element: <Services /> },
  { path: "/reports", element: <Reports /> },
  { path: "/marketplace-hub", element: <DealerMarketplaceHub /> },
  { path: "/analytics/marketplace", element: <MarketplaceAnalytics /> },
  { path: "/analytics/public-page", element: <PublicPageAnalytics /> },
  { path: "/alerts", element: <Alerts /> },
  { path: "/settings", element: <Settings /> },
  { path: "/calendar", element: <CalendarPage /> },
  { path: "/audit-logs", element: <AuditLogs /> },
];

const App = () => (
  <ErrorBoundary>
   <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <RouteSeo />
            <BuyerIntentPopup />
            <Routes>
              {/* ── Public Marketplace ── */}
              <Route path="/" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><Marketplace /></SuspenseWrap>} />
              <Route path="/marketplace/vehicle/:vehicleId" element={<SuspenseWrap skeleton={<VehiclePageSkeleton />}><MarketplaceVehicle /></SuspenseWrap>} />
              <Route path="/marketplace/dealer/:dealerId" element={<SuspenseWrap skeleton={<DealerPageSkeleton />}><MarketplaceDealer /></SuspenseWrap>} />
              <Route path="/marketplace/compare" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><CompareVehicles /></SuspenseWrap>} />
              
              <Route path="/marketplace/wishlist" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><Wishlist /></SuspenseWrap>} />
              <Route path="/marketplace/dealers" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><AllDealers /></SuspenseWrap>} />
              <Route path="/marketplace/vehicles" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><AllVehicles /></SuspenseWrap>} />
              <Route path="/marketplace/vehicles/:citySlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><CityVehicles /></SuspenseWrap>} />
              <Route path="/marketplace/brands" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><AllBrands /></SuspenseWrap>} />
              <Route path="/marketplace/brand/:brandSlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><BrandVehicles /></SuspenseWrap>} />
              <Route path="/marketplace/brand/:brandSlug/:modelSlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><BrandVehicles /></SuspenseWrap>} />
              {/* ── Model hub pages ── */}
              <Route path="/models" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelIndex /></SuspenseWrap>} />
              <Route path="/models/cars" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelIndex category="cars" /></SuspenseWrap>} />
              <Route path="/models/bikes" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelIndex category="bikes" /></SuspenseWrap>} />
              <Route path="/pricing" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><PricingPage /></SuspenseWrap>} />
              <Route path="/cars/:brandSlug/:modelSlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelHub category="cars" /></SuspenseWrap>} />
              <Route path="/bikes/:brandSlug/:modelSlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelHub category="bikes" /></SuspenseWrap>} />
              <Route path="/commercial/:brandSlug/:modelSlug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ModelHub category="commercial" /></SuspenseWrap>} />
              <Route path="/sell-vehicle" element={<SuspenseWrap skeleton={<SellVehicleSkeleton />}><SellVehicle /></SuspenseWrap>} />
              <Route path="/sell-vehicle/form" element={<SuspenseWrap><SellVehicleFormPage /></SuspenseWrap>} />
              <Route path="/admin/marketplace" element={<SuspenseWrap><AdminLayout><MarketplaceAdmin /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/vendors" element={<SuspenseWrap><AdminLayout><AdminVendors /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/vendors/:userId" element={<SuspenseWrap><AdminLayout><AdminVendorProfile /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/leads" element={<SuspenseWrap><AdminLayout><AdminLeads /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/services" element={<SuspenseWrap><AdminLayout><AdminServices /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/analytics" element={<SuspenseWrap><AdminLayout><AdminAnalytics /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/buyer-interests" element={<SuspenseWrap><AdminLayout><AdminBuyerIntents /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/sell-requests" element={<SuspenseWrap><AdminLayout><AdminSellRequests /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/dealer-accounts" element={<SuspenseWrap><AdminLayout><AdminDealerAccounts /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/dealer-accounts/:userId" element={<SuspenseWrap><AdminLayout><AdminDealerDetail /></AdminLayout></SuspenseWrap>} />

              <Route path="/admin/accessories" element={<SuspenseWrap><AdminLayout><AdminAccessories /></AdminLayout></SuspenseWrap>} />
              <Route path="/shop" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ShopPage /></SuspenseWrap>} />
              <Route path="/shop/:slug" element={<SuspenseWrap skeleton={<MarketplaceSkeleton />}><ShopProductPage /></SuspenseWrap>} />
              <Route path="/admin/shop" element={<SuspenseWrap><AdminLayout><AdminShop /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/shop-analytics" element={<SuspenseWrap><AdminLayout><AdminShopAnalytics /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/vehicle-catalog" element={<SuspenseWrap><AdminLayout><AdminVehicleCatalog /></AdminLayout></SuspenseWrap>} />
              <Route path="/admin/model-pages" element={<SuspenseWrap><AdminLayout><AdminModelPages /></AdminLayout></SuspenseWrap>} />
              <Route path="/car-loan" element={<SuspenseWrap><CarLoanPage /></SuspenseWrap>} />
              <Route path="/insurance" element={<SuspenseWrap><InsurancePage /></SuspenseWrap>} />
              <Route path="/car-services" element={<SuspenseWrap><CarServicesPage /></SuspenseWrap>} />
              <Route path="/admin/orders" element={<SuspenseWrap><AdminLayout><AdminOrders /></AdminLayout></SuspenseWrap>} />
              <Route path="/accessories" element={<SuspenseWrap><AccessoriesPage /></SuspenseWrap>} />
              <Route path="/accessories/cart" element={<SuspenseWrap><CartPage /></SuspenseWrap>} />
              <Route path="/accessories/checkout" element={<SuspenseWrap><CheckoutPage /></SuspenseWrap>} />
              <Route path="/accessories/order-success" element={<SuspenseWrap><OrderSuccessPage /></SuspenseWrap>} />
              <Route path="/accessories/:slug" element={<SuspenseWrap><AccessoryProductPage /></SuspenseWrap>} />


              {/* ── Footer Pages ── */}
              <Route path="/about" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><AboutPage /></SuspenseWrap>} />
              <Route path="/how-it-works" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><HowItWorksPage /></SuspenseWrap>} />
              <Route path="/contact" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><ContactPage /></SuspenseWrap>} />
              <Route path="/faq" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><FAQPage /></SuspenseWrap>} />
              <Route path="/terms" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><TermsPage /></SuspenseWrap>} />
              <Route path="/privacy" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><PrivacyPage /></SuspenseWrap>} />
              <Route path="/blog" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><BlogPage /></SuspenseWrap>} />
              <Route path="/blog/:slug" element={<SuspenseWrap skeleton={<FooterPageSkeleton />}><BlogPostPage /></SuspenseWrap>} />

              {/* ── Public Catalogue / Auth ── */}
              <Route path="/auth" element={<SuspenseWrap><Auth /></SuspenseWrap>} />
              <Route path="/v/:pageId" element={<SuspenseWrap skeleton={<VehiclePageSkeleton />}><PublicVehicle /></SuspenseWrap>} />
              <Route path="/d/:pageId" element={<SuspenseWrap skeleton={<DealerPageSkeleton />}><DealerPublicPage /></SuspenseWrap>} />
              <Route path="/d/:pageId/:vehicleId" element={<SuspenseWrap skeleton={<VehiclePageSkeleton />}><PublicVehicle /></SuspenseWrap>} />
              <Route path="/catalogue/:dealerSlug" element={<SuspenseWrap skeleton={<DealerPageSkeleton />}><DealerPublicPage /></SuspenseWrap>} />
              <Route path="/catalogue/:dealerSlug/:vehicleCode" element={<SuspenseWrap skeleton={<VehiclePageSkeleton />}><PublicVehicle /></SuspenseWrap>} />

              {/* ── Protected Routes (data-isolated per user) ── */}
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={<ProtectedPage>{element}</ProtectedPage>} />
              ))}

              <Route path="/inspection/:vehicleId" element={<SuspenseWrap><VehicleInspection /></SuspenseWrap>} />
              <Route path="*" element={<SuspenseWrap><NotFound /></SuspenseWrap>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
   </HelmetProvider>
  </ErrorBoundary>
);

export default App;
