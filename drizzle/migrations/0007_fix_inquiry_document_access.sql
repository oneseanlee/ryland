CREATE OR REPLACE FUNCTION public.can_access_inquiry_document(_name text, _require_draft boolean DEFAULT false)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
BEGIN
  IF _name IS NULL THEN RETURN FALSE; END IF;
  v_order_id := ((storage.foldername(_name))[2])::uuid;
  RETURN EXISTS (
    SELECT 1
    FROM public.inquiry_orders o
    JOIN public.affiliates a ON a.id = o.affiliate_id
    WHERE o.id = v_order_id
      AND (NOT _require_draft OR o.status = 'draft')
      AND (a.user_id = auth.uid() OR public.is_admin())
      AND (storage.foldername(_name))[1] = o.affiliate_id::text
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$function$;