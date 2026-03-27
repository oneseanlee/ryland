-- Admin Portal Enhancements: Dual Commission Rates + Admin Notes
-- Phase 1 migration

-- Step 1: Add dual commission rate columns to affiliates table
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS upfront_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS backend_commission_rate NUMERIC(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Step 2: All existing affiliates get the defaults (10% upfront, 5% backend)
-- commission_rate was previously stored in auth user_metadata, not in this table
-- The DEFAULT values on the columns handle this automatically for existing rows

-- Step 3: Standardize commission_type values
-- Existing 'referral' type records are treated as 'upfront'
UPDATE public.commissions
  SET commission_type = 'upfront'
  WHERE commission_type = 'referral';
