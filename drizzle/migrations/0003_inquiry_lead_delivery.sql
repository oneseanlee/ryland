CREATE TABLE public.inquiry_lead_delivery (
  order_id uuid PRIMARY KEY REFERENCES public.inquiry_orders(id) ON DELETE CASCADE,
  ghl_contact_id text,
  ghl_opportunity_id text,
  ghl_note_id text,
  slack_ts text,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','complete','failed')),
  document_state text NOT NULL DEFAULT 'pending',
  last_error text,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inquiry_lead_delivery TO authenticated;
GRANT ALL ON public.inquiry_lead_delivery TO service_role;
ALTER TABLE public.inquiry_lead_delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY inquiry_delivery_read ON public.inquiry_lead_delivery FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.inquiry_orders o JOIN public.affiliates a ON a.id = o.affiliate_id
    WHERE o.id = order_id AND a.user_id = auth.uid()
  )
);
CREATE FUNCTION public.claim_inquiry_delivery(_order_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.inquiry_lead_delivery SET state = 'processing', locked_until = now() + interval '5 minutes', updated_at = now()
  WHERE order_id = _order_id AND state <> 'complete' AND (locked_until IS NULL OR locked_until < now());
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_inquiry_delivery(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_inquiry_delivery(uuid) TO service_role;