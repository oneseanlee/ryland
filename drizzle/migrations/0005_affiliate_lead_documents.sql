CREATE TABLE public.affiliate_lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.affiliate_leads(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  ghl_uploaded_at timestamptz,
  ghl_upload_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_lead_documents_lead_idx ON public.affiliate_lead_documents(lead_id);
GRANT SELECT, INSERT ON public.affiliate_lead_documents TO authenticated;
GRANT ALL ON public.affiliate_lead_documents TO service_role;
ALTER TABLE public.affiliate_lead_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lead docs visible to owner and admins" ON public.affiliate_lead_documents FOR SELECT TO authenticated
  USING (public.is_admin() OR affiliate_id = public.get_my_affiliate_id());
CREATE POLICY "Owners attach docs to own leads" ON public.affiliate_lead_documents FOR INSERT TO authenticated
  WITH CHECK (
    ghl_uploaded_at IS NULL AND
    EXISTS (SELECT 1 FROM public.affiliate_leads l WHERE l.id = lead_id AND l.affiliate_id = affiliate_lead_documents.affiliate_id
      AND (l.affiliate_id = public.get_my_affiliate_id() OR public.is_admin()))
  );

CREATE OR REPLACE FUNCTION public.can_access_lead_document(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead uuid;
BEGIN
  IF _name IS NULL THEN RETURN FALSE; END IF;
  v_lead := ((storage.foldername(_name))[2])::uuid;
  RETURN EXISTS (
    SELECT 1 FROM public.affiliate_leads l JOIN public.affiliates a ON a.id = l.affiliate_id
    WHERE l.id = v_lead AND (storage.foldername(_name))[1] = l.affiliate_id::text
      AND (a.user_id = auth.uid() OR public.is_admin())
  );
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END; $$;
REVOKE EXECUTE ON FUNCTION public.can_access_lead_document(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_lead_document(text) TO authenticated;

CREATE POLICY "Owners and admins upload lead documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-documents' AND public.can_access_lead_document(name));
CREATE POLICY "Owners and admins view lead documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-documents' AND public.can_access_lead_document(name));