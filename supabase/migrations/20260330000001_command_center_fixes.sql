-- Command Center Bug Fixes
-- Bug 4: Add missing DELETE RLS policy on client_notes for the note author
-- Bug 6: Ensure role helper functions handle both user_roles table and JWT metadata

-- ============================================================
-- Bug 4: client_notes — allow authors (managers/specialists) to delete their own notes
-- ============================================================

CREATE POLICY "Authors can delete their own client_notes"
  ON public.client_notes
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND (public.is_manager() OR public.is_specialist())
  );

-- ============================================================
-- Bug 6: Role helper consistency
-- Re-create is_manager() and is_specialist() so they check BOTH
-- the user_roles table (source of truth) AND JWT app_metadata
-- (fast path for performance).  Admins already work via is_admin().
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Fast path: check JWT app_metadata set by the auth hook
    (auth.jwt() -> 'app_metadata' ->> 'command_center_role' = 'manager')
    OR
    -- Fallback: check user_roles table directly
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'manager'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_specialist()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Fast path: check JWT app_metadata set by the auth hook
    (auth.jwt() -> 'app_metadata' ->> 'command_center_role' = 'specialist')
    OR
    -- Fallback: check user_roles table directly
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'specialist'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Fast path: check JWT app_metadata
    (auth.jwt() -> 'app_metadata' ->> 'command_center_role' = 'admin')
    OR
    -- Fallback: check user_roles table directly
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    );
$$;
