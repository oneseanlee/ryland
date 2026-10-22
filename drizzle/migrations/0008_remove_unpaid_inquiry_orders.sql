CREATE OR REPLACE FUNCTION public.remove_unpaid_inquiry_order(_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.inquiry_orders%ROWTYPE; v_batch_status text;
BEGIN
 SELECT * INTO v_order FROM public.inquiry_orders WHERE id=_order_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
 IF auth.uid() IS NULL OR NOT (public.is_admin() OR v_order.affiliate_id=public.get_my_affiliate_id()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF v_order.checkout_batch_id IS NOT NULL THEN
   SELECT status INTO v_batch_status FROM public.checkout_batches WHERE id=v_order.checkout_batch_id FOR UPDATE;
 END IF;
 SELECT * INTO v_order FROM public.inquiry_orders WHERE id=_order_id FOR UPDATE;
 IF v_order.payment_status NOT IN ('unpaid','failed') OR v_order.service_status='completed' OR v_batch_status IN ('paid','pending_verification') THEN
   RAISE EXCEPTION 'Only unpaid, unfinished orders can be removed';
 END IF;
 IF v_order.status='cancelled' THEN RETURN false; END IF;
 UPDATE public.inquiry_orders SET status='cancelled',service_status='cancelled' WHERE id=_order_id;
 IF v_order.checkout_batch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.inquiry_orders WHERE checkout_batch_id=v_order.checkout_batch_id AND status<>'cancelled') THEN
   UPDATE public.checkout_batches SET status='cancelled' WHERE id=v_order.checkout_batch_id AND status='awaiting_payment';
 END IF;
 INSERT INTO public.inquiry_audit_log(actor_id,action,entity_type,entity_id,details)
 VALUES(auth.uid(),'unpaid_order_removed','inquiry_order',_order_id,jsonb_build_object('previous_status',v_order.status,'checkout_batch_id',v_order.checkout_batch_id));
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.remove_unpaid_inquiry_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_unpaid_inquiry_order(uuid) TO authenticated;