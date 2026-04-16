-- 2) Fix role-checking functions to read from user_roles table (no JWT metadata fallback)
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'manager'::app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_specialist()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'specialist'::app_role
  );
$function$;

-- 3) Fix broken affiliate self-update policy
DROP POLICY IF EXISTS "Affiliates can update own contact info" ON public.affiliates;

CREATE POLICY "Affiliates can update own contact info"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND status = (SELECT a.status FROM public.affiliates a WHERE a.id = affiliates.id)
  AND upfront_commission_rate IS NOT DISTINCT FROM (SELECT a.upfront_commission_rate FROM public.affiliates a WHERE a.id = affiliates.id)
  AND backend_commission_rate IS NOT DISTINCT FROM (SELECT a.backend_commission_rate FROM public.affiliates a WHERE a.id = affiliates.id)
  AND admin_notes IS NOT DISTINCT FROM (SELECT a.admin_notes FROM public.affiliates a WHERE a.id = affiliates.id)
  AND affiliate_id = (SELECT a.affiliate_id FROM public.affiliates a WHERE a.id = affiliates.id)
);

-- 4) Lock down search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5) Add admin-only read policy for ebooks bucket (delivery still goes through service-role edge functions)
CREATE POLICY "Admins can read ebooks bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ebooks' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 6) Tighten public-insert RLS policies so they only apply to anon role (not authenticated users)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.funnel_leads;
CREATE POLICY "Anonymous can submit funnel leads"
ON public.funnel_leads FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts on assessment_leads" ON public.assessment_leads;
CREATE POLICY "Anonymous can submit assessment leads"
ON public.assessment_leads FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts on contact_submissions" ON public.contact_submissions;
CREATE POLICY "Anonymous can submit contact form"
ON public.contact_submissions FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts on partner_submissions" ON public.partner_submissions;
CREATE POLICY "Anonymous can submit partner application"
ON public.partner_submissions FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous inserts on sms_opt_ins" ON public.sms_opt_ins;
CREATE POLICY "Anonymous can submit sms opt-in"
ON public.sms_opt_ins FOR INSERT TO anon
WITH CHECK (true);