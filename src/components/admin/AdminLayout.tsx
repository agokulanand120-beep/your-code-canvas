import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Shield, Store, Package, Wrench, LayoutDashboard, Home, ShoppingBag, Inbox, BarChart3, Sparkles, Car, UserPlus, LogOut, Layers, BookOpen } from "lucide-react";

const adminItems = [
  { title: "Overview", url: "/admin/marketplace", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Leads & Enquiries", url: "/admin/leads", icon: Inbox },
  { title: "Buyer Interests", url: "/admin/buyer-interests", icon: Sparkles },
  { title: "Sell Requests", url: "/admin/sell-requests", icon: Car },
  { title: "Dealer Accounts", url: "/admin/dealer-accounts", icon: UserPlus },
  { title: "Vendors", url: "/admin/vendors", icon: Store },
  { title: "Services", url: "/admin/services", icon: Wrench },
  { title: "Accessories", url: "/admin/accessories", icon: Package },
  { title: "Products Store", url: "/admin/shop", icon: ShoppingBag },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Vehicle Catalogue", url: "/admin/vehicle-catalog", icon: Layers },
  { title: "Model Pages", url: "/admin/model-pages", icon: BookOpen },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
              Admin Console
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Marketplace</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center gap-2 border-b border-border/40 bg-card px-2 sticky top-0 z-30">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground truncate">UpcurvHub Admin</span>
          <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  </SidebarProvider>
  );
};

export default AdminLayout;
