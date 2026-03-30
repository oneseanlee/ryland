import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Affiliate {
  id: string;
  affiliate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  status: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  affiliate: Affiliate | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Synchronous initial state: try to read user from localStorage immediately
    // so the very first render already has the user (prevents flash of login page)
    try {
      const storageKey = Object.keys(localStorage).find(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
      );
      if (storageKey) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.user && parsed?.access_token) {
            return {
              user: parsed.user as User,
              session: parsed as unknown as Session,
              affiliate: null,
              loading: true, // still loading — need to verify with Supabase
            };
          }
        }
      }
    } catch {
      // ignore
    }
    return { user: null, session: null, affiliate: null, loading: true };
  });

  const initializedRef = useRef(false);

  const fetchAffiliate = useCallback(async (userId: string) => {
    try {
      console.log("[Auth] Fetching affiliate for user:", userId);
      const { data, error } = await supabase
        .from("affiliates")
        .select("id, affiliate_id, full_name, email, phone, company_name, website, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Affiliate fetch error:", error.message);
        throw error;
      }
      console.log("[Auth] Affiliate result:", data ? data.affiliate_id : "null (no record found)");
      return data as Affiliate | null;
    } catch (err) {
      const errorMessage = (err as Error)?.message || String(err);
      console.error("[Auth] Affiliate fetch exception:", errorMessage);
      if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
        return null;
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      // Use getSession() — this tells Supabase SDK to load the session
      // from localStorage and set it as the active session internally.
      // This is critical: without this, RPC calls won't have auth context.
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          initializedRef.current = true;
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false,
          }));

          fetchAffiliate(session.user.id).then((affiliate) => {
            if (!cancelled) {
              setState(prev => ({ ...prev, affiliate }));
            }
          }).catch(() => {});
          return;
        }
      } catch {
        // getSession() was aborted (StrictMode) or failed
        if (cancelled) return;
      }

      // If getSession() failed but we have a user from localStorage (set in initialState),
      // try setSession() to force Supabase SDK to recognize it
      if (!cancelled && !initializedRef.current && state.user) {
        try {
          const storageKey = Object.keys(localStorage).find(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
          );
          if (storageKey) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.access_token && parsed?.refresh_token) {
                const { data } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                });
                if (!cancelled && data?.session?.user) {
                  initializedRef.current = true;
                  setState(prev => ({
                    ...prev,
                    user: data.session!.user,
                    session: data.session,
                    loading: false,
                  }));
                  fetchAffiliate(data.session!.user.id).then((affiliate) => {
                    if (!cancelled) {
                      setState(prev => ({ ...prev, affiliate }));
                    }
                  }).catch(() => {});
                  return;
                }
              }
            }
          }
        } catch {
          if (cancelled) return;
        }
      }

      // If we still have a user from initial localStorage read, keep it
      // and just mark loading as done. The session may still work for basic queries.
      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initialize();

    // Listen for subsequent auth events only (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        // Skip INITIAL_SESSION — we handle initialization above
        if (event === 'INITIAL_SESSION') return;

        const user = session?.user ?? null;
        setState(prev => ({ ...prev, user, session, loading: false }));

        if (user) {
          fetchAffiliate(user.id).then((affiliate) => {
            if (!cancelled) {
              setState(prev => ({ ...prev, affiliate }));
            }
          }).catch(() => {});
        } else {
          setState(prev => ({ ...prev, affiliate: null }));
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchAffiliate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try {
      const storageKey = Object.keys(localStorage).find(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
      );
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore
    }

    setState({ user: null, session: null, affiliate: null, loading: false });
    window.location.href = '/portal/login';
    supabase.auth.signOut().catch(() => {});
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
