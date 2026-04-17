
-- 1. Add referral_slug column with format + length constraint
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS referral_slug text;

-- Case-insensitive unique index (slugs treated as lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_referral_slug_lower_idx
  ON public.affiliates (lower(referral_slug))
  WHERE referral_slug IS NOT NULL;

-- Format check: 3-30 chars, lowercase letters, numbers, hyphens; must start with a letter
ALTER TABLE public.affiliates
  DROP CONSTRAINT IF EXISTS affiliates_referral_slug_format;
ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_referral_slug_format
  CHECK (referral_slug IS NULL OR referral_slug ~ '^[a-z][a-z0-9-]{2,29}$');

-- 2. Update the affiliate self-update RLS policy so they can change referral_slug
--    (existing policy locks status, commission rates, admin_notes, affiliate_id)
DROP POLICY IF EXISTS "Affiliates can update own contact info" ON public.affiliates;

CREATE POLICY "Affiliates can update own contact info"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status = (SELECT a.status FROM public.affiliates a WHERE a.id = affiliates.id)
    AND NOT (upfront_commission_rate IS DISTINCT FROM (SELECT a.upfront_commission_rate FROM public.affiliates a WHERE a.id = affiliates.id))
    AND NOT (backend_commission_rate IS DISTINCT FROM (SELECT a.backend_commission_rate FROM public.affiliates a WHERE a.id = affiliates.id))
    AND NOT (admin_notes IS DISTINCT FROM (SELECT a.admin_notes FROM public.affiliates a WHERE a.id = affiliates.id))
    AND affiliate_id = (SELECT a.affiliate_id FROM public.affiliates a WHERE a.id = affiliates.id)
  );

-- 3. Public lookup function: find affiliate by slug OR affiliate_id (case-insensitive)
--    Returns minimal info needed by the public referral landing page.
CREATE OR REPLACE FUNCTION public.lookup_affiliate_by_ref(_ref text)
RETURNS TABLE (
  affiliate_id text,
  full_name text,
  referral_slug text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.affiliate_id, a.full_name, a.referral_slug
  FROM public.affiliates a
  WHERE a.status = 'approved'
    AND (
      lower(a.referral_slug) = lower(_ref)
      OR lower(a.affiliate_id) = lower(_ref)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_ref(text) TO anon, authenticated;
