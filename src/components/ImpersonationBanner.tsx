import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Session-scoped storage (cleared when the tab closes) — never localStorage,
// so a stolen XSS payload can't lift the admin refresh token from long-lived
// cross-tab storage. Also enforce a short absolute lifetime.
const STORAGE_KEY = "admin_impersonation_state";
const MAX_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes

interface ImpersonationState {
  admin_refresh_token: string;
  admin_access_token: string;
  target_email: string;
  started_at: number;
}

function readState(): ImpersonationState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImpersonationState;
    if (!parsed?.started_at || Date.now() - parsed.started_at > MAX_LIFETIME_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
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
  // sessionStorage: tab-scoped, cleared on close. Not localStorage.
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    setState(readState());
    // Auto-clear when the max lifetime elapses even if the admin never returns.
    const interval = setInterval(() => {
      const s = readState();
      setState(s);
    }, 60_000);
    const handler = () => setState(readState());
    window.addEventListener("focus", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handler);
    };
  }, []);

  const handleReturn = async () => {
    if (!state) return;
    setReturning(true);
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.setSession({
        access_token: state.admin_access_token,
        refresh_token: state.admin_refresh_token,
      });
      if (error) {
        const { error: refreshErr } = await supabase.auth.refreshSession({
          refresh_token: state.admin_refresh_token,
        });
        if (refreshErr) throw refreshErr;
      }
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.href = "/portal/admin";
    } catch (err) {
      console.error("Return-to-admin failed:", err);
      toast.error("Couldn't restore admin session. Please log in again.");
      sessionStorage.removeItem(STORAGE_KEY);
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
