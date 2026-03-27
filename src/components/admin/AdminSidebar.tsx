import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  UserCheck,
  BarChart3,
  LogOut,
} from "lucide-react";


const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/portal/admin" },
  { icon: Users, label: "Affiliates", path: "/portal/admin/affiliates" },
  { icon: UserCheck, label: "Leads", path: "/portal/admin/leads" },
  { icon: DollarSign, label: "Commissions", path: "/portal/admin/commissions" },
  { icon: CreditCard, label: "Payouts", path: "/portal/admin/payouts" },
  { icon: BarChart3, label: "Reports", path: "/portal/admin/reports" },
];

export default function AdminSidebar() {
  const location = useLocation();

  const handleAdminSignOut = () => {
    try {
      localStorage.removeItem('sb-gkowxzoadsljkpdzrlue-auth-token');
    } catch {}
    window.location.href = '/portal/admin/login';
    supabase.auth.signOut().catch(() => {});
  };

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
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">Ryland Partners</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>

        <div className="mt-3">
          <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/portal/admin"
                ? location.pathname === "/portal/admin" || location.pathname === "/portal/admin/"
                : location.pathname.startsWith(item.path);
              
              return (
                <SidebarMenuItem key={item.path}>
                  <NavLink to={item.path} end={item.path === "/portal/admin"}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors data-[active=true]:bg-white/10 data-[active=true]:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 bg-slate-950">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleAdminSignOut}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
