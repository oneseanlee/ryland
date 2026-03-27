import {
  LayoutDashboard, Users, DollarSign,
  ShoppingBag, CalendarDays, Mic2, UserCircle, LogOut
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const affiliateMainNav = [
  { title: "Dashboard", url: "/portal", icon: LayoutDashboard },
  { title: "Lead Tracker", url: "/portal/leads", icon: Users },
  { title: "Commissions", url: "/portal/commissions", icon: DollarSign },
];

const affiliateSupportNav = [
  { title: "Store", url: "/portal/resources", icon: ShoppingBag },
  { title: "Events", url: "/portal/events", icon: CalendarDays },
  { title: "Speaking", url: "/portal/speaking", icon: Mic2 },
];

const affiliateAccountNav = [
  { title: "Profile & Payouts", url: "/portal/settings", icon: UserCircle },
];

export default function PortalSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, affiliate } = useAuth();

  const isActive = (path: string) => {
    if (path === "/portal") return location.pathname === "/portal";
    return location.pathname.startsWith(path);
  };

  const renderGroup = (label: string, items: typeof affiliateMainNav) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-xs uppercase tracking-widest text-slate-500 font-medium px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={collapsed ? item.title : undefined}
              >
                <NavLink
                  to={item.url}
                  end={item.url === "/portal"}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  activeClassName="!bg-white/10 !text-white font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="!bg-slate-950 !border-r !border-slate-800"
      style={{ "--sidebar-background": "222.2 84% 4.9%", "--sidebar-foreground": "210 40% 98%", "--sidebar-border": "217.2 32.6% 17.5%" } as React.CSSProperties}
    >
      <SidebarContent className="bg-slate-950">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            RP
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">Ryland Partners</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Partner Portal</p>
            </div>
          )}
        </div>

        {/* Affiliate badge */}
        {!collapsed && affiliate && (
          <div className="mx-3 mt-3 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Affiliate ID</p>
            <p className="text-xs font-mono font-semibold text-slate-300 mt-0.5">{affiliate.affiliate_id}</p>
          </div>
        )}

        <div className="mt-3 space-y-1">
          {renderGroup("Main", affiliateMainNav)}
          {renderGroup("Support", affiliateSupportNav)}
          {renderGroup("Account", affiliateAccountNav)}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 bg-slate-950">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip={collapsed ? "Sign Out" : undefined}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
