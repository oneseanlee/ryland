DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.commissions;
CREATE POLICY "Affiliates can view own commissions" ON public.commissions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = commissions.affiliate_id AND a.user_id = auth.uid() AND a.status = 'approved'));