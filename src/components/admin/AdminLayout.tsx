import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import AdminGuard from "./AdminGuard";
import PortalContentLoader from "@/components/portal/PortalContentLoader";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-100">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <header className="h-14 flex items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-slate-400 hover:text-slate-600">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="h-5 w-px bg-slate-200" />
                <span className="text-sm text-slate-500 hidden sm:block">
                  Admin Dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user && <NotificationBell userId={user.id} />}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-xs font-semibold text-white">
                  A
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Suspense fallback={<PortalContentLoader />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
