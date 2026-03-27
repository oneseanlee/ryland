import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import PortalSidebar from "./PortalSidebar";
import AuthGuard from "./AuthGuard";
import PortalContentLoader from "./PortalContentLoader";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { Menu } from "lucide-react";

export default function PortalLayout() {
  const { affiliate, user } = useAuth();

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <PortalSidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            {/* Top bar — white */}
            <header className="h-14 flex items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-slate-400 hover:text-slate-600">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="h-5 w-px bg-slate-200" />
                <span className="text-sm text-slate-500 hidden sm:block">
                  Welcome back{affiliate ? `, ${affiliate.full_name.split(" ")[0]}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user && <NotificationBell userId={user.id} />}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                  {affiliate?.full_name?.charAt(0) ?? "P"}
                </div>
              </div>
            </header>

            {/* Page content — light background */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Suspense fallback={<PortalContentLoader />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
