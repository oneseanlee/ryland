-- ============================================================
-- Security Fixes
-- ============================================================
-- Fix 1: Affiliate UPDATE policy self-referential check
-- Fix 2: Role functions fallback to user-controllable user_metadata
-- Fix 3: Realtime channel access restriction
-- ============================================================


-- ============================================================
-- FIX 1: Affiliate UPDATE policy — broken self-referential subquery
-- ============================================================
-- BUG: The WITH CHECK subqueries used WHERE a.id = id
-- In PostgreSQL, unqualified 'id' inside the subquery resolves to 'a.id' (the alias),
-- making the condition a.id = a.id — always true — returning an arbitrary row.
-- This means the sensitive field protections (status, commission_rate, etc.) were
-- never actually enforced.
-- FIX: qualify the outer row reference as affiliates.id

DROP POLICY IF EXISTS "Affiliates can update own contact info" ON public.affiliates;

CREATE POLICY "Affiliates can update own contact info" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    -- All sensitive fields must be unchanged — compare NEW values to current DB values
    status                = (SELECT a.status                FROM public.affiliates a WHERE a.id = affiliates.id)
    AND upfront_commission_rate
                          = (SELECT a.upfront_commission_rate  FROM public.affiliates a WHERE a.id = affiliates.id)
    AND backend_commission_rate
                          = (SELECT a.backend_commission_rate  FROM public.affiliates a WHERE a.id = affiliates.id)
    AND admin_notes IS NOT DISTINCT FROM
                           (SELECT a.admin_notes             FROM public.affiliates a WHERE a.id = affiliates.id)
    AND affiliate_id      = (SELECT a.affiliate_id           FROM public.affiliates a WHERE a.id = affiliates.id)
    AND user_id           = (SELECT a.user_id                FROM public.affiliates a WHERE a.id = affiliates.id)
  );


-- ============================================================
-- FIX 2: Role functions — remove user_metadata fallback
-- ============================================================
-- BUG: is_admin/is_manager/is_specialist used COALESCE to fall back to
-- user_metadata.role when app_metadata.role is absent.
-- Users can freely update their own user_metadata via auth.updateUser(),
-- which means ANY authenticated user could grant themselves admin/manager/specialist
-- privileges, bypassing all RLS policies protecting funding_clients (SSN, DOB, etc.)
--
-- FIX: Only check app_metadata.role — this can only be written by the service role.
-- app_metadata is set server-side only (via admin API or Edge Functions with service key).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager';
$$;

CREATE OR REPLACE FUNCTION public.is_specialist()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'specialist';
$$;

-- Also update has_client_access to use the fixed role helpers (no change needed —
-- it already calls is_admin() which is now fixed above)


-- ============================================================
-- FIX 3: Realtime — restrict sensitive channel access
-- ============================================================
-- BUG: funding_clients (SSN, DOB, income), funding_applications, bureau_status,
-- client_tasks, and notifications are all published to supabase_realtime.
-- There are no RLS policies on realtime.messages, so any authenticated user
-- (including affiliates) could subscribe to command center channels and
-- receive row-change events for sensitive client data.
--
-- FIX: Enable RLS on realtime.messages and restrict topics.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Command center realtime access" ON realtime.messages;
DROP POLICY IF EXISTS "Notification realtime access"   ON realtime.messages;

-- Command center table topics: only accessible to admin/manager/specialist
CREATE POLICY "Command center realtime access"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    CASE
      -- Block command center sensitive topics for non-CC roles
      WHEN realtime.topic() LIKE ANY(ARRAY[
        'realtime:public:funding_clients%',
        'realtime:public:funding_applications%',
        'realtime:public:bureau_status%',
        'realtime:public:client_tasks%'
      ])
      THEN
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager', 'specialist')

      -- Notifications: all authenticated users allowed
      -- (row-level filtering still applies via table RLS — users only see their own rows)
      WHEN realtime.topic() LIKE 'realtime:public:notifications%'
      THEN true

      -- All other channels: allow authenticated users
      ELSE true
    END
  );
