-- Admin impersonation audit log
CREATE TABLE IF NOT EXISTS public.admin_impersonation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_email TEXT,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.admin_impersonation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view impersonation log"
  ON public.admin_impersonation_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Inserts/updates happen via service-role edge function only; no policies for authenticated insert/update.

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_log_started_at
  ON public.admin_impersonation_log (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_log_admin
  ON public.admin_impersonation_log (admin_user_id, started_at DESC);

-- Case-insensitive uniqueness for affiliate referral slug
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliates_referral_slug_lower
  ON public.affiliates (lower(referral_slug))
  WHERE referral_slug IS NOT NULL;