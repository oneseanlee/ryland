import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type CommandCenterRole = "admin" | "manager" | "specialist";

export function useCommandCenterRole() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [role, setRole] = useState<CommandCenterRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't check until auth is done loading
    if (authLoading) {
      return;
    }

    // No user - reset state
    if (!user) {
      setHasAccess(false);
      setRole(null);
      setIsLoading(false);
      setDbError(null);
      checkedUserIdRef.current = null;
      return;
    }

    // Already checked for this user - skip RPC call
    if (checkedUserIdRef.current === user.id) {
      return;
    }

    // Fast path: check user metadata first for admin role
    const metaRole = user.user_metadata?.role || user.app_metadata?.role;
    if (metaRole === "admin") {
      setHasAccess(true);
      setRole("admin");
      setIsLoading(false);
      setDbError(null);
      checkedUserIdRef.current = user.id;
      return;
    }

    const checkRole = async (retries = 2) => {
      setIsLoading(true);
      setDbError(null);
      const rolesToCheck: CommandCenterRole[] = ["admin", "manager", "specialist"];
      let lastError: string | null = null;
      
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Check each role in order of precedence
          for (const roleToCheck of rolesToCheck) {
            const { data, error } = await supabase.rpc("has_role", {
              _user_id: user.id,
              _role: roleToCheck,
            });

            if (error) {
              lastError = error.message;
              continue;
            }

            if (data) {
              setHasAccess(true);
              setRole(roleToCheck);
              setIsLoading(false);
              setDbError(null);
              checkedUserIdRef.current = user.id;
              return;
            }
          }

          // No role found but no errors - user simply doesn't have access
          setHasAccess(false);
          setRole(null);
          setIsLoading(false);
          setDbError(null);
          checkedUserIdRef.current = user.id;
          return;

        } catch (err) {
          lastError = err instanceof Error ? err.message : "Unknown error";
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      // All retries failed — check user_metadata as fallback
      const validRoles: CommandCenterRole[] = ["admin", "manager", "specialist"];
      if (metaRole && validRoles.includes(metaRole as CommandCenterRole)) {
        setHasAccess(true);
        setRole(metaRole as CommandCenterRole);
        setDbError(null);
      } else {
        // User is authenticated but has no valid role
        // If we had RPC errors, it might be a DB setup issue
        setHasAccess(false);
        setRole(null);
        // Only set dbError if RPC failed and user doesn't have metadata role
        if (lastError) {
          setDbError("Database role check failed. The Command Center tables may not be set up yet.");
        }
      }
      setIsLoading(false);
      checkedUserIdRef.current = user.id;
    };

    checkRole();
  }, [user?.id, authLoading]);

  return { hasAccess, role, isLoading, dbError };
}
