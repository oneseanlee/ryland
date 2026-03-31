import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't check until auth is done loading
    if (authLoading) {
      return;
    }

    // No user - reset state
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      checkedUserIdRef.current = null;
      return;
    }

    // Already checked for this user - skip RPC call
    if (checkedUserIdRef.current === user.id) {
      return;
    }

    const checkRole = async (retries = 2) => {
      setIsLoading(true);
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const { data, error } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });

          if (!error) {
            setIsAdmin(!!data);
            setIsLoading(false);
            checkedUserIdRef.current = user.id;
            return;
          }

          // If error and we have retries left, wait a moment for session to settle
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        } catch {
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      // All retries failed — check app_metadata only (user_metadata is user-writable)
      const metaRole = user.app_metadata?.role;
      setIsAdmin(metaRole === "admin");
      setIsLoading(false);
      checkedUserIdRef.current = user.id;
    };

    checkRole();
  }, [user?.id, authLoading]);

  return { isAdmin, isLoading };
}
