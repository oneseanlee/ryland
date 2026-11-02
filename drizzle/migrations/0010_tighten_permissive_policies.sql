DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON public.inquiry_settings;
CREATE POLICY "Partners and admins can read settings" ON public.inquiry_settings FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_my_affiliate_id() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;
CREATE POLICY "Signed-in users can view resources" ON public.resources FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "All authenticated users can read banks" ON public.banks;
CREATE POLICY "Signed-in users can read banks" ON public.banks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view events" ON public.partner_events;
CREATE POLICY "Signed-in users can view events" ON public.partner_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anonymous can submit assessment leads" ON public.assessment_leads;
CREATE POLICY "Anonymous can submit assessment leads" ON public.assessment_leads FOR INSERT TO anon, authenticated
WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%' AND (phone IS NULL OR length(phone) <= 40));

DROP POLICY IF EXISTS "Anonymous can submit funnel leads" ON public.funnel_leads;
CREATE POLICY "Anonymous can submit funnel leads" ON public.funnel_leads FOR INSERT TO anon, authenticated
WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%' AND length(source) BETWEEN 1 AND 100 AND (phone IS NULL OR length(phone) <= 40));

DROP POLICY IF EXISTS "Anonymous can submit partner application" ON public.partner_submissions;
CREATE POLICY "Anonymous can submit partner application" ON public.partner_submissions FOR INSERT TO anon, authenticated
WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%' AND (phone IS NULL OR length(phone) <= 40) AND (message IS NULL OR length(message) <= 5000));

DROP POLICY IF EXISTS "Anonymous can submit sms opt-in" ON public.sms_opt_ins;
CREATE POLICY "Anonymous can submit sms opt-in" ON public.sms_opt_ins FOR INSERT TO anon, authenticated
WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(phone) BETWEEN 7 AND 40 AND length(consent_text) BETWEEN 1 AND 5000 AND (email IS NULL OR length(email) <= 320));

DROP POLICY IF EXISTS "Anonymous can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anonymous can submit contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated
WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%' AND length(subject) BETWEEN 1 AND 300 AND length(message) BETWEEN 1 AND 5000 AND (phone IS NULL OR length(phone) <= 40));