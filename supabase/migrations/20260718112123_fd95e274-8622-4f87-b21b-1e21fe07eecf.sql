
-- 1) Revoke public/anon access from internal SECURITY DEFINER helpers.
--    These are only referenced by RLS policies and edge functions.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.is_admin()',
    'public.is_manager()',
    'public.is_specialist()',
    'public.has_role(uuid, app_role)',
    'public.has_client_access(uuid)',
    'public.get_my_affiliate_id()',
    'public.create_notification(uuid, text, text, text, text)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.email_queue_wake()',
    'public.email_queue_dispatch()',
    'public.read_email_batch(text, integer, integer)',
    'public.delete_email(text, bigint)',
    'public.enqueue_email(text, jsonb)',
    'public.protect_commission_status()',
    'public.update_updated_at_column()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Function % not found, skipping', fn;
    END;
  END LOOP;
END $$;

-- lookup_affiliate_by_ref is intentionally callable anonymously (public referral links).
-- Keep anon EXECUTE on it.
GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_ref(text) TO anon, authenticated;

-- 2) Trigger-based field lock for affiliates (replaces fragile WITH CHECK subqueries).
CREATE OR REPLACE FUNCTION public.enforce_affiliate_field_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything.
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins may not change sensitive/immutable fields on their own row.
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.upfront_commission_rate IS DISTINCT FROM OLD.upfront_commission_rate
     OR NEW.backend_commission_rate IS DISTINCT FROM OLD.backend_commission_rate
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     OR NEW.affiliate_id IS DISTINCT FROM OLD.affiliate_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.email IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Cannot modify protected affiliate fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_affiliate_field_lock_trg ON public.affiliates;
CREATE TRIGGER enforce_affiliate_field_lock_trg
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_affiliate_field_lock();

-- Simplify the UPDATE policy now that the trigger enforces field immutability.
DROP POLICY IF EXISTS "Affiliates can update own contact info" ON public.affiliates;
CREATE POLICY "Affiliates can update own contact info"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3) Explicit deny-by-default INSERT policy so no client-side path can ever
--    create affiliate rows. Only service_role (used by the partner-signup
--    edge function) bypasses RLS and can insert.
DROP POLICY IF EXISTS "No self-insert on affiliates" ON public.affiliates;
CREATE POLICY "No self-insert on affiliates"
ON public.affiliates
FOR INSERT
TO authenticated, anon
WITH CHECK (false);
