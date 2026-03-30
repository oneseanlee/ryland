-- ============================================================
-- Fix RLS Infinite Recursion on client_assignments
-- ============================================================
-- PROBLEM: The policy "Managers and specialists can view client assignments"
-- on client_assignments references client_assignments in its EXISTS clause,
-- causing infinite recursion when RLS evaluates the policy.
--
-- ROOT CAUSE:
-- CREATE POLICY "...view client assignments" ON client_assignments
--   USING (EXISTS (SELECT 1 FROM client_assignments ca WHERE ...))
--   → Evaluating EXISTS triggers RLS on client_assignments again → infinite loop
--
-- SOLUTION:
-- 1. Remove the self-referential policy on client_assignments
-- 2. Keep simple, self-contained policies:
--    - Admins can manage all
--    - Users can view their own assignments (user_id = auth.uid())
-- 3. For other tables that need to check client access, use has_client_access()
--    which is SECURITY DEFINER and bypasses RLS
-- ============================================================
-- ============================================================
-- 1. FIX client_assignments policies (remove self-referential policy)
-- ============================================================
-- Drop the problematic self-referential policy
DROP POLICY IF EXISTS "Managers and specialists can view client assignments" ON public.client_assignments;
-- The remaining policies on client_assignments are:
-- 1. "Admins can manage all client_assignments" - uses is_admin(), no self-reference
-- 2. "Users can view own assignments" - uses user_id = auth.uid(), no self-reference
-- These are both self-contained and safe.
-- ============================================================
-- 2. Add INSERT policy for managers/specialists on client_assignments
-- ============================================================
-- Managers and specialists should be able to create assignments for clients
-- they have access to. We need to check client access without causing recursion.
-- Since has_client_access() is SECURITY DEFINER, it bypasses RLS and won't recurse.
DROP POLICY IF EXISTS "Managers and specialists can create assignments" ON public.client_assignments;
CREATE POLICY "Managers and specialists can create assignments" ON public.client_assignments FOR
INSERT TO authenticated WITH CHECK (
    public.is_admin()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND public.has_client_access(client_id)
    )
  );
-- ============================================================
-- 3. Add DELETE policy for managers/specialists on client_assignments
-- ============================================================
DROP POLICY IF EXISTS "Managers and specialists can delete assignments" ON public.client_assignments;
CREATE POLICY "Managers and specialists can delete assignments" ON public.client_assignments FOR DELETE TO authenticated USING (
  public.is_admin()
  OR (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  )
);
-- ============================================================
-- 4. Verify has_client_access function exists and is correct
-- ============================================================
-- This function is SECURITY DEFINER, so it bypasses RLS when checking
-- client_assignments, preventing recursion.
CREATE OR REPLACE FUNCTION public.has_client_access(client_id UUID) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.client_assignments
    WHERE client_assignments.client_id = has_client_access.client_id
      AND user_id = auth.uid()
  );
$$;
-- ============================================================
-- 5. Update policies on other tables to use has_client_access()
-- ============================================================
-- Instead of direct EXISTS on client_assignments, use the helper function.
-- This is cleaner and the function is already SECURITY DEFINER.
-- funding_clients
DROP POLICY IF EXISTS "Managers and specialists can view assigned clients" ON public.funding_clients;
CREATE POLICY "Managers and specialists can view assigned clients" ON public.funding_clients FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(id)
  );
DROP POLICY IF EXISTS "Managers and specialists can update assigned clients" ON public.funding_clients;
CREATE POLICY "Managers and specialists can update assigned clients" ON public.funding_clients FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(id)
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(id)
  );
-- funding_applications
DROP POLICY IF EXISTS "Managers and specialists can view assigned applications" ON public.funding_applications;
CREATE POLICY "Managers and specialists can view assigned applications" ON public.funding_applications FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert applications" ON public.funding_applications;
CREATE POLICY "Managers and specialists can insert applications" ON public.funding_applications FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can update assigned applications" ON public.funding_applications;
CREATE POLICY "Managers and specialists can update assigned applications" ON public.funding_applications FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
-- client_documents
DROP POLICY IF EXISTS "Managers and specialists can view assigned documents" ON public.client_documents;
CREATE POLICY "Managers and specialists can view assigned documents" ON public.client_documents FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert documents" ON public.client_documents;
CREATE POLICY "Managers and specialists can insert documents" ON public.client_documents FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can delete assigned documents" ON public.client_documents;
CREATE POLICY "Managers and specialists can delete assigned documents" ON public.client_documents FOR DELETE TO authenticated USING (
  (
    public.is_manager()
    OR public.is_specialist()
  )
  AND public.has_client_access(client_id)
);
-- client_tasks (these have additional conditions for assigned_to)
DROP POLICY IF EXISTS "Users can view tasks assigned to them or their clients" ON public.client_tasks;
CREATE POLICY "Users can view tasks assigned to them or their clients" ON public.client_tasks FOR
SELECT TO authenticated USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND client_id IS NOT NULL
      AND public.has_client_access(client_id)
    )
  );
DROP POLICY IF EXISTS "Users can create tasks for assigned clients" ON public.client_tasks;
CREATE POLICY "Users can create tasks for assigned clients" ON public.client_tasks FOR
INSERT TO authenticated WITH CHECK (
    public.is_admin()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND (
        client_id IS NULL
        OR public.has_client_access(client_id)
      )
    )
  );
DROP POLICY IF EXISTS "Users can update tasks assigned to them or their clients" ON public.client_tasks;
CREATE POLICY "Users can update tasks assigned to them or their clients" ON public.client_tasks FOR
UPDATE TO authenticated USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND client_id IS NOT NULL
      AND public.has_client_access(client_id)
    )
  );
-- client_activity_log
DROP POLICY IF EXISTS "Managers and specialists can view assigned client activity" ON public.client_activity_log;
CREATE POLICY "Managers and specialists can view assigned client activity" ON public.client_activity_log FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert activity logs" ON public.client_activity_log;
CREATE POLICY "Managers and specialists can insert activity logs" ON public.client_activity_log FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
-- client_notes
DROP POLICY IF EXISTS "Managers and specialists can view assigned client notes" ON public.client_notes;
CREATE POLICY "Managers and specialists can view assigned client notes" ON public.client_notes FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert client notes" ON public.client_notes;
CREATE POLICY "Managers and specialists can insert client notes" ON public.client_notes FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
-- bureau_status
DROP POLICY IF EXISTS "Managers and specialists can view assigned bureau status" ON public.bureau_status;
CREATE POLICY "Managers and specialists can view assigned bureau status" ON public.bureau_status FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert bureau status" ON public.bureau_status;
CREATE POLICY "Managers and specialists can insert bureau status" ON public.bureau_status FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can update assigned bureau status" ON public.bureau_status;
CREATE POLICY "Managers and specialists can update assigned bureau status" ON public.bureau_status FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
-- inquiry_removals
DROP POLICY IF EXISTS "Managers and specialists can view assigned inquiry removals" ON public.inquiry_removals;
CREATE POLICY "Managers and specialists can view assigned inquiry removals" ON public.inquiry_removals FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can insert inquiry removals" ON public.inquiry_removals;
CREATE POLICY "Managers and specialists can insert inquiry removals" ON public.inquiry_removals FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
DROP POLICY IF EXISTS "Managers and specialists can update assigned inquiry removals" ON public.inquiry_removals;
CREATE POLICY "Managers and specialists can update assigned inquiry removals" ON public.inquiry_removals FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND public.has_client_access(client_id)
  );
-- ============================================================
-- 6. Update storage policies to use has_client_access
-- ============================================================
-- Storage policies check client_assignments for document access
-- Using has_client_access() ensures consistency and prevents any future issues
-- Note: Storage policies can't use has_client_access directly because the path
-- parsing (split_part) is specific to storage.objects. But these policies
-- are already using SECURITY DEFINER functions (is_admin, is_manager, is_specialist)
-- and the EXISTS clause queries client_assignments which will now work correctly
-- since the client_assignments policies are fixed.
-- The storage policies don't need changes - they work because:
-- 1. They query client_assignments with a specific client_id filter
-- 2. The fixed client_assignments policies now work without recursion
-- 3. user_id = auth.uid() is the simple, non-recursive check