-- Storage access for inquiry documents (path: {affiliate_id}/{order_id}/{filename})
CREATE POLICY "Affiliates and admins can view inquiry documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inquiry-documents'
  AND public.can_access_inquiry_document(name, false)
);

CREATE POLICY "Affiliates and admins can upload inquiry documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inquiry-documents'
  AND public.can_access_inquiry_document(name, false)
);

CREATE POLICY "Only drafts deletable by owners, admins always"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inquiry-documents'
  AND (
    public.is_admin()
    OR public.can_access_inquiry_document(name, true)
  )
);

GRANT EXECUTE ON FUNCTION public.can_access_inquiry_document(TEXT, BOOLEAN) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_inquiry_document(TEXT, BOOLEAN) FROM anon;