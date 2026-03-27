-- Fix: Restrict affiliate self-update to contact fields only
-- Prevents affiliates from modifying their own commission rates, status, admin_notes, etc.

-- Drop the existing broad update policy
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

-- Create restricted update policy: affiliates can only update contact info
-- The WITH CHECK ensures the sensitive fields haven't been changed
CREATE POLICY "Affiliates can update own contact info" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    -- Ensure sensitive fields haven't been modified by comparing to current values
    -- This uses a subquery to get the current row values
    status = (SELECT a.status FROM public.affiliates a WHERE a.id = id)
    AND upfront_commission_rate = (SELECT a.upfront_commission_rate FROM public.affiliates a WHERE a.id = id)
    AND backend_commission_rate = (SELECT a.backend_commission_rate FROM public.affiliates a WHERE a.id = id)
    AND admin_notes IS NOT DISTINCT FROM (SELECT a.admin_notes FROM public.affiliates a WHERE a.id = id)
    AND affiliate_id = (SELECT a.affiliate_id FROM public.affiliates a WHERE a.id = id)
    AND user_id = (SELECT a.user_id FROM public.affiliates a WHERE a.id = id)
  );

-- Admin update policy remains unchanged (admins can update everything)
-- Already exists: "Admins can update all affiliates"
