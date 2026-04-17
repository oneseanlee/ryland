-- Allow affiliates to delete their own leads
CREATE POLICY "Affiliates can delete own leads"
ON public.affiliate_leads
FOR DELETE
TO authenticated
USING (affiliate_id = public.get_my_affiliate_id());

-- Allow admins to delete any lead
CREATE POLICY "Admins can delete all affiliate_leads"
ON public.affiliate_leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure related commissions are cleaned up so the delete isn't blocked or orphaned
ALTER TABLE public.commissions
DROP CONSTRAINT IF EXISTS commissions_lead_id_fkey;

ALTER TABLE public.commissions
ADD CONSTRAINT commissions_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES public.affiliate_leads(id) ON DELETE CASCADE;