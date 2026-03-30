import { Navigate } from "react-router-dom";
import { Loader2, AlertTriangle, Database } from "lucide-react";
import { useCommandCenterRole } from "@/hooks/useCommandCenterRole";
import { useAuth } from "@/hooks/useAuth";

interface CommandCenterGuardProps {
  children: React.ReactNode;
}

export default function CommandCenterGuard({ children }: CommandCenterGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: roleLoading, dbError } = useCommandCenterRole();
  const loading = authLoading || (user ? roleLoading : false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  // Show helpful error message if database tables aren't set up
  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6 text-center p-8 max-w-md">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Database className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Database Setup Required</h1>
            <p className="text-sm text-slate-500 mt-2">
              {dbError}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please run the database migration to set up the Command Center tables.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Return to Home
            </a>
            <a
              href="/portal"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Go to Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
            <p className="text-sm text-slate-500 mt-1">
              You don't have permission to access the Command Center.
            </p>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
