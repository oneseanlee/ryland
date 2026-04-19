import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "admin_impersonation_state";

interface ImpersonationState {
  admin_refresh_token: string;
  admin_access_token: string;
  target_email: string;
  started_at: number;
}

export function startImpersonationSession(
  adminAccessToken: string,
  adminRefreshToken: string,
  targetEmail: string
) {
  const state: ImpersonationState = {
    admin_access_token: adminAccessToken,
    admin_refresh_token: adminRefreshToken,
    target_email: targetEmail,
    started_at: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setState(raw ? (JSON.parse(raw) as ImpersonationState) : null);
      } catch {
        setState(null);
      }
    };
    read();
    const handler = () => read();
    window.addEventListener("storage", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus", handler);
    };
  }, []);

  const handleReturn = async () => {
    if (!state) return;
    setReturning(true);
    try {
      // Sign out current (impersonated) session
      await supabase.auth.signOut();
      // Restore admin session via stored refresh token
      const { error } = await supabase.auth.setSession({
        access_token: state.admin_access_token,
        refresh_token: state.admin_refresh_token,
      });
      if (error) {
        // Token may be expired — fall back to refresh
        const { error: refreshErr } = await supabase.auth.refreshSession({
          refresh_token: state.admin_refresh_token,
        });
        if (refreshErr) throw refreshErr;
      }
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/portal/admin";
    } catch (err) {
      console.error("Return-to-admin failed:", err);
      toast.error("Couldn't restore admin session. Please log in again.");
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/portal/admin/login";
    } finally {
      setReturning(false);
    }
  };

  if (!state) return null;

  return (
    <div className="sticky top-0 z-[100] w-full bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium flex-1 min-w-0">
          Impersonating <span className="font-bold">{state.target_email}</span> — actions are recorded in the audit log.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReturn}
          disabled={returning}
          className="bg-white text-red-700 hover:bg-red-50 gap-1.5"
        >
          {returning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          Return to admin
        </Button>
      </div>
    </div>
  );
}
