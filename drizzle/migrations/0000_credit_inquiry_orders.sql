-- Credit Inquiry Removal ordering portal

CREATE TABLE public.inquiry_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiry_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id),
  client_id UUID REFERENCES public.inquiry_clients(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL DEFAULT 'Credit Inquiry Removal',
  bureaus TEXT[] NOT NULL DEFAULT '{}',
  add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','cart','submitted','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending_verification','paid','failed','refunded')),
  service_status TEXT NOT NULL DEFAULT 'submitted' CHECK (service_status IN ('submitted','needs_information','ready_for_review','in_progress','completed','cancelled')),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  checkout_batch_id UUID,
  permission_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  affiliate_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiry_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.inquiry_orders(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.checkout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id),
  order_count INTEGER NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','pending_verification','paid','cancelled')),
  payment_token UUID NOT NULL DEFAULT gen_random_uuid(),
  payment_ref TEXT,
  paid_at TIMESTAMPTZ,
  payment_confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiry_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  service_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_bureau_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_document_categories JSONB NOT NULL DEFAULT '["drivers_license_front","drivers_license_back","social_security_card","credit_report"]'::jsonb,
  ghl_payment_link TEXT,
  retention_days INTEGER NOT NULL DEFAULT 365,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_orders_affiliate ON public.inquiry_orders(affiliate_id);
CREATE INDEX idx_inquiry_orders_batch ON public.inquiry_orders(checkout_batch_id);
CREATE INDEX idx_inquiry_clients_affiliate ON public.inquiry_clients(affiliate_id);
CREATE INDEX idx_inquiry_documents_order ON public.inquiry_documents(order_id);
CREATE INDEX idx_checkout_batches_affiliate ON public.checkout_batches(affiliate_id);

-- Access helper for storage policies (documents stored at {affiliate_id}/{order_id}/{filename})
CREATE OR REPLACE FUNCTION public.can_access_inquiry_document(_name TEXT, _require_draft BOOLEAN DEFAULT FALSE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_order_id UUID;
BEGIN
  IF _name IS NULL THEN RETURN FALSE; END IF;
  v_order_id := to_uuid((storage.foldername(_name))[2]);
  IF v_order_id IS NULL THEN RETURN FALSE; END IF;
  IF _require_draft THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.inquiry_orders o
      JOIN public.affiliates a ON a.id = o.affiliate_id
      WHERE o.id = v_order_id
        AND o.status = 'draft'
        AND (a.user_id = auth.uid() OR public.is_admin())
        AND (storage.foldername(_name))[1] = o.affiliate_id::text
    );
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.inquiry_orders o
    JOIN public.affiliates a ON a.id = o.affiliate_id
    WHERE o.id = v_order_id
      AND (a.user_id = auth.uid() OR public.is_admin())
      AND (storage.foldername(_name))[1] = o.affiliate_id::text
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$function$;

-- Admin-only audited payment confirmation
CREATE OR REPLACE FUNCTION public.admin_confirm_batch_payment(_batch_id UUID, _payment_ref TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_affiliate_user UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can confirm payment';
  END IF;

  UPDATE public.checkout_batches
  SET status = 'paid',
      paid_at = now(),
      payment_ref = COALESCE(_payment_ref, payment_ref),
      payment_confirmed_by = auth.uid(),
      updated_at = now()
  WHERE id = _batch_id AND status <> 'paid';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.inquiry_orders
  SET payment_status = 'paid', updated_at = now()
  WHERE checkout_batch_id = _batch_id AND payment_status <> 'paid';

  INSERT INTO public.inquiry_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'payment_confirmed', 'checkout_batch', _batch_id,
          jsonb_build_object('payment_ref', _payment_ref, 'method', 'admin_manual'));

  SELECT a.user_id INTO v_affiliate_user
  FROM public.checkout_batches b
  JOIN public.affiliates a ON a.id = b.affiliate_id
  WHERE b.id = _batch_id;

  IF v_affiliate_user IS NOT NULL THEN
    PERFORM public.create_notification(
      v_affiliate_user,
      'Payment confirmed',
      'Your checkout payment has been verified. Your orders are being processed.',
      'system',
      '/portal/inquiries'
    );
  END IF;

  RETURN TRUE;
END;
$function$;

-- Audited document deletion (admin or draft-order owner)
CREATE OR REPLACE FUNCTION public.delete_inquiry_document(_doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_path TEXT;
  v_order_id UUID;
  v_is_admin BOOLEAN := public.is_admin();
  v_is_owner BOOLEAN := FALSE;
  v_is_draft BOOLEAN := FALSE;
BEGIN
  SELECT d.storage_path, d.order_id INTO v_path, v_order_id
  FROM public.inquiry_documents d
  JOIN public.inquiry_orders o ON o.id = d.order_id
  JOIN public.affiliates a ON a.id = o.affiliate_id
  WHERE d.id = _doc_id AND (a.user_id = auth.uid() OR v_is_admin);

  IF v_path IS NULL THEN RETURN FALSE; END IF;

  IF NOT v_is_admin THEN
    SELECT status = 'draft' INTO v_is_draft FROM public.inquiry_orders WHERE id = v_order_id;
    IF NOT v_is_draft THEN RETURN FALSE; END IF;
  END IF;

  DELETE FROM public.inquiry_documents WHERE id = _doc_id;
  PERFORM storage.remove_object('inquiry-documents', v_path);

  INSERT INTO public.inquiry_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'document_deleted', 'inquiry_document', _doc_id,
          jsonb_build_object('order_id', v_order_id, 'category', 'document'));

  RETURN TRUE;
END;
$function$;

GRANT SELECT, INSERT, UPDATE ON public.inquiry_clients TO authenticated;
GRANT ALL ON public.inquiry_clients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiry_orders TO authenticated;
GRANT ALL ON public.inquiry_orders TO service_role;
GRANT SELECT, INSERT ON public.inquiry_documents TO authenticated;
GRANT ALL ON public.inquiry_documents TO service_role;
GRANT SELECT ON public.checkout_batches TO authenticated;
GRANT ALL ON public.checkout_batches TO service_role;
GRANT SELECT ON public.inquiry_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inquiry_settings TO authenticated;
GRANT ALL ON public.inquiry_settings TO service_role;
GRANT SELECT ON public.inquiry_audit_log TO authenticated;
GRANT ALL ON public.inquiry_audit_log TO service_role;

ALTER TABLE public.inquiry_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates manage own clients"
ON public.inquiry_clients FOR ALL
TO authenticated
USING (affiliate_id = public.get_my_affiliate_id() OR public.is_admin())
WITH CHECK (affiliate_id = public.get_my_affiliate_id() OR public.is_admin());

CREATE POLICY "Affiliates manage own orders"
ON public.inquiry_orders FOR ALL
TO authenticated
USING (affiliate_id = public.get_my_affiliate_id() OR public.is_admin())
WITH CHECK (affiliate_id = public.get_my_affiliate_id() OR public.is_admin());

CREATE POLICY "Order docs visible to owner and admins"
ON public.inquiry_documents FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.inquiry_orders o
    WHERE o.id = inquiry_documents.order_id
      AND o.affiliate_id = public.get_my_affiliate_id()
  )
);

CREATE POLICY "Owners upload docs to own orders"
ON public.inquiry_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inquiry_orders o
    WHERE o.id = inquiry_documents.order_id
      AND o.affiliate_id = public.get_my_affiliate_id()
  )
);

CREATE POLICY "Admins manage all batches"
ON public.checkout_batches FOR SELECT
TO authenticated
USING (affiliate_id = public.get_my_affiliate_id() OR public.is_admin());

CREATE POLICY "Anyone authenticated can read settings"
ON public.inquiry_settings FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage settings"
ON public.inquiry_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins read audit log"
ON public.inquiry_audit_log FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_inquiry_clients_updated_at
BEFORE UPDATE ON public.inquiry_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inquiry_orders_updated_at
BEFORE UPDATE ON public.inquiry_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkout_batches_updated_at
BEFORE UPDATE ON public.checkout_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inquiry_settings_updated_at
BEFORE UPDATE ON public.inquiry_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.admin_confirm_batch_payment(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_batch_payment(UUID, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_inquiry_document(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_inquiry_document(UUID) TO authenticated;

COMMENT ON TABLE public.inquiry_audit_log IS 'Admin audit history: document access, deletion, and payment confirmations for the inquiry portal';
COMMENT ON COLUMN public.inquiry_settings.ghl_payment_link IS 'Static GoHighLevel payment link; cannot charge variable cart totals — totals are snapshot server-side and payment requires webhook verification or admin confirmation';