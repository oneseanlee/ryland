import { useState, useEffect } from "react";
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
  BarChart3,
  LogOut,
  Building2,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useCommandCenterRole } from "@/hooks/useCommandCenterRole";

const menuItems = [
  { icon: LayoutDashboard, label: "Pipeline", path: "/command-center" },
  { icon: Users, label: "My Clients", path: "/command-center/my-clients" },
  { icon: BarChart3, label: "Metrics", path: "/command-center/metrics" },
];

// Manager+ only menu items
const managerMenuItems = [
  { icon: ClipboardList, label: "Inquiry Queue", path: "/command-center/inquiry-queue" },
];

export default function CommandCenterSidebar() {
  const location = useLocation();
  const { role } = useCommandCenterRole();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user email for profile section
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    fetchUser();
  }, []);

  // Admin-only menu items
  const adminMenuItems = role === "admin"
    ? [{ icon: Building2, label: "Bank Admin", path: "/command-center/bank-admin" }]
    : [];

  // Manager+ only menu items (includes admin)
  const visibleManagerItems = (role === "admin" || role === "manager")
    ? managerMenuItems
    : [];

  const handleSignOut = () => {
    try {
      localStorage.removeItem('sb-gkowxzoadsljkpdzrlue-auth-token');
    } catch { /* ignore */ }
    window.location.href = '/portal/login';
    supabase.auth.signOut().catch(() => { /* ignore */ });
  };

  const getInitial = () => {
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    return "U";
  };

  const renderNavItem = (item: { icon: React.ElementType<{ className?: string }>; label: string; path: string }) => {
    const Icon = item.icon;
    const isActive = item.path === "/command-center"
      ? location.pathname === "/command-center" || location.pathname === "/command-center/"
      : location.pathname.startsWith(item.path);

    return (
      <SidebarMenuItem key={item.path}>
        <NavLink to={item.path} end={item.path === "/command-center"} className="block">
          <SidebarMenuButton
            isActive={isActive}
            className={`
              w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-slate-400 hover:text-white hover:bg-white/5 transition-colors
              ${isActive ? "bg-white/10 text-white border-l-2 border-emerald-400 -ml-[2px] pl-[calc(0.75rem+2px)]" : ""}
            `}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </NavLink>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="!bg-slate-950 !border-r !border-slate-800"
      style={{ "--sidebar-background": "222.2 84% 4.9%", "--sidebar-foreground": "210 40% 98%", "--sidebar-border": "217.2 32.6% 17.5%" } as React.CSSProperties}
    >
      <SidebarContent className="bg-slate-950 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-emerald-500/20">
            CC
          </div>
          <div>
            <p className="text-base font-semibold text-white tracking-tight">Command Center</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Ryland Partners</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {/* OVERVIEW Section */}
          <div className="px-4 mb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Overview
            </p>
          </div>
          <SidebarMenu>
            {menuItems.map((item) => renderNavItem(item))}
          </SidebarMenu>

          {/* MANAGEMENT Section */}
          {visibleManagerItems.length > 0 && (
            <>
              <div className="border-t border-white/5 my-4 mx-3" />
              <div className="px-4 mb-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Management
                </p>
              </div>
              <SidebarMenu>
                {visibleManagerItems.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </>
          )}

          {/* ADMIN Section */}
          {adminMenuItems.length > 0 && (
            <>
              <div className="border-t border-white/5 my-4 mx-3" />
              <div className="px-4 mb-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Admin
                </p>
              </div>
              <SidebarMenu>
                {adminMenuItems.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </>
          )}
        </div>

        {/* User Profile Section */}
        <div className="border-t border-white/5 px-3 py-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {getInitial()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userEmail?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {userEmail || 'Loading...'}
              </p>
            </div>
            <Settings className="h-[18px] w-[18px] text-slate-500 shrink-0" />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 bg-slate-950 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors gap-3 px-3 py-2.5 rounded-lg"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span className="text-sm">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
