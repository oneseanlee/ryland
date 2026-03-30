-- Funding Command Center Schema
-- Core database tables, RLS policies, and seed data for the funding management system
-- ============================================================
-- 1. HELPER FUNCTIONS
-- ============================================================
-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'role') = 'admin',
    (auth.jwt()->'user_metadata'->>'role') = 'admin',
    false
  );
$$;
-- Function to check if current user is manager
CREATE OR REPLACE FUNCTION public.is_manager() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'role') = 'manager',
    (auth.jwt()->'user_metadata'->>'role') = 'manager',
    false
  );
$$;
-- Function to check if current user is specialist
CREATE OR REPLACE FUNCTION public.is_specialist() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'role') = 'specialist',
    (auth.jwt()->'user_metadata'->>'role') = 'specialist',
    false
  );
$$;
-- NOTE: has_client_access() is defined AFTER client_assignments table below
-- ============================================================
-- 2. TABLES
-- ============================================================
-- 2.1 funding_clients (Core client record)
CREATE TABLE public.funding_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  ssn_encrypted TEXT,
  mothers_maiden_name TEXT,
  home_address JSONB,
  company_name TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address JSONB,
  ein TEXT,
  duns TEXT,
  website TEXT,
  personal_income NUMERIC,
  business_revenue NUMERIC,
  monthly_deposits NUMERIC,
  funding_goal TEXT,
  current_stage TEXT NOT NULL DEFAULT 'Onboarding' CHECK (
    current_stage IN (
      'Onboarding',
      'Analysis',
      'Kickoff Call',
      'Remediation',
      'Post-Audit Check',
      'Funding Execution',
      'Closed/Funded',
      'Inquiry Removal'
    )
  ),
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  mfsn_credentials JSONB,
  nav_credentials JSONB,
  existing_checking_accounts JSONB,
  existing_credit_cards JSONB,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2.2 client_assignments
CREATE TABLE public.client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(client_id, user_id)
);
-- has_client_access — defined here, after client_assignments exists
CREATE OR REPLACE FUNCTION public.has_client_access(client_id UUID) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.client_assignments
    WHERE client_assignments.client_id = has_client_access.client_id
      AND user_id = auth.uid()
  );
$$;
-- 2.3 banks (Master bank list)
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_name TEXT,
  product_type TEXT CHECK (product_type IN ('CreditCard', 'LOC', 'TermLoan')),
  bureau_pulled TEXT CHECK (
    bureau_pulled IN ('Experian', 'Equifax', 'TransUnion')
  ),
  requires_relationship BOOLEAN DEFAULT false,
  typical_limit_min NUMERIC,
  typical_limit_max NUMERIC,
  application_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  sequence_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- 2.4 funding_applications
CREATE TABLE public.funding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  bank_id UUID REFERENCES public.banks(id),
  product_type TEXT CHECK (product_type IN ('CreditCard', 'LOC', 'TermLoan')),
  application_url TEXT,
  applied_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (
    status IN (
      'Applied',
      'Pending',
      'Approved',
      'Denied',
      'NeedsFollowUp'
    )
  ),
  approval_amount NUMERIC,
  bureau_pulled TEXT CHECK (
    bureau_pulled IN ('Experian', 'Equifax', 'TransUnion')
  ),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2.5 client_documents
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  type TEXT CHECK (
    type IN (
      'DriverLicense',
      'SSNCard',
      'TaxReturn',
      'BankStatement',
      'ArticlesOfOrganization',
      'EINLetter',
      'Other'
    )
  ),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1
);
-- 2.6 client_tasks
CREATE TABLE public.client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.funding_applications(id) ON DELETE
  SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Completed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
-- 2.7 client_activity_log
CREATE TABLE public.client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- 2.8 client_notes
CREATE TABLE public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- 2.9 bureau_status
CREATE TABLE public.bureau_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('Experian', 'Equifax', 'TransUnion')),
  inquiry_count INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  unpaused_at TIMESTAMPTZ,
  UNIQUE(client_id, bureau)
);
-- 2.10 inquiry_removals
CREATE TABLE public.inquiry_removals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.funding_clients(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('Experian', 'Equifax', 'TransUnion')),
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'InProgress', 'Completed')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT
);
-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE public.funding_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bureau_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_removals ENABLE ROW LEVEL SECURITY;
-- 3.1 funding_clients policies
-- Admins see all. Managers/Specialists see only clients assigned to them.
CREATE POLICY "Admins can manage all funding_clients" ON public.funding_clients FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned clients" ON public.funding_clients FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_clients.id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can update assigned clients" ON public.funding_clients FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_clients.id
        AND user_id = auth.uid()
    )
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_clients.id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert clients" ON public.funding_clients FOR
INSERT TO authenticated WITH CHECK (
    public.is_manager()
    OR public.is_specialist()
    OR public.is_admin()
  );
-- 3.2 client_assignments policies
-- Admins can manage all. Users can see their own assignments.
CREATE POLICY "Admins can manage all client_assignments" ON public.client_assignments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users can view own assignments" ON public.client_assignments FOR
SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Managers and specialists can view client assignments" ON public.client_assignments FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments ca
      WHERE ca.client_id = client_assignments.client_id
        AND ca.user_id = auth.uid()
    )
  );
-- 3.3 banks policies
-- All authenticated users can read. Only admins can insert/update/delete.
CREATE POLICY "All authenticated users can read banks" ON public.banks FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage banks" ON public.banks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 3.4 funding_applications policies
-- Same access pattern as funding_clients
CREATE POLICY "Admins can manage all funding_applications" ON public.funding_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned applications" ON public.funding_applications FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_applications.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert applications" ON public.funding_applications FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_applications.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can update assigned applications" ON public.funding_applications FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_applications.client_id
        AND user_id = auth.uid()
    )
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = funding_applications.client_id
        AND user_id = auth.uid()
    )
  );
-- 3.5 client_documents policies
-- Same access pattern as funding_clients
CREATE POLICY "Admins can manage all client_documents" ON public.client_documents FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned documents" ON public.client_documents FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_documents.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert documents" ON public.client_documents FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_documents.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can delete assigned documents" ON public.client_documents FOR DELETE TO authenticated USING (
  (
    public.is_manager()
    OR public.is_specialist()
  )
  AND EXISTS (
    SELECT 1
    FROM public.client_assignments
    WHERE client_assignments.client_id = client_documents.client_id
      AND user_id = auth.uid()
  )
);
-- 3.6 client_tasks policies
-- Users see tasks assigned to them + tasks for their assigned clients
CREATE POLICY "Admins can manage all client_tasks" ON public.client_tasks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users can view tasks assigned to them or their clients" ON public.client_tasks FOR
SELECT TO authenticated USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND client_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.client_assignments
        WHERE client_assignments.client_id = client_tasks.client_id
          AND user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can create tasks for assigned clients" ON public.client_tasks FOR
INSERT TO authenticated WITH CHECK (
    public.is_admin()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND (
        client_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.client_assignments
          WHERE client_assignments.client_id = client_tasks.client_id
            AND user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can update tasks assigned to them or their clients" ON public.client_tasks FOR
UPDATE TO authenticated USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND client_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.client_assignments
        WHERE client_assignments.client_id = client_tasks.client_id
          AND user_id = auth.uid()
      )
    )
  );
-- 3.7 client_activity_log policies
-- Same access pattern as funding_clients (read-only for non-admins)
CREATE POLICY "Admins can manage all client_activity_log" ON public.client_activity_log FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned client activity" ON public.client_activity_log FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_activity_log.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert activity logs" ON public.client_activity_log FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_activity_log.client_id
        AND user_id = auth.uid()
    )
  );
-- 3.8 client_notes policies
-- Same access pattern as funding_clients
CREATE POLICY "Admins can manage all client_notes" ON public.client_notes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned client notes" ON public.client_notes FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_notes.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert client notes" ON public.client_notes FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = client_notes.client_id
        AND user_id = auth.uid()
    )
  );
-- 3.9 bureau_status policies
-- Same access pattern as funding_clients
CREATE POLICY "Admins can manage all bureau_status" ON public.bureau_status FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned bureau status" ON public.bureau_status FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = bureau_status.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert bureau status" ON public.bureau_status FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = bureau_status.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can update assigned bureau status" ON public.bureau_status FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = bureau_status.client_id
        AND user_id = auth.uid()
    )
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = bureau_status.client_id
        AND user_id = auth.uid()
    )
  );
-- 3.10 inquiry_removals policies
-- Same access pattern as funding_clients
CREATE POLICY "Admins can manage all inquiry_removals" ON public.inquiry_removals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Managers and specialists can view assigned inquiry removals" ON public.inquiry_removals FOR
SELECT TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = inquiry_removals.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can insert inquiry removals" ON public.inquiry_removals FOR
INSERT TO authenticated WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = inquiry_removals.client_id
        AND user_id = auth.uid()
    )
  );
CREATE POLICY "Managers and specialists can update assigned inquiry removals" ON public.inquiry_removals FOR
UPDATE TO authenticated USING (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = inquiry_removals.client_id
        AND user_id = auth.uid()
    )
  ) WITH CHECK (
    (
      public.is_manager()
      OR public.is_specialist()
    )
    AND EXISTS (
      SELECT 1
      FROM public.client_assignments
      WHERE client_assignments.client_id = inquiry_removals.client_id
        AND user_id = auth.uid()
    )
  );
-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_funding_clients_current_stage ON public.funding_clients(current_stage);
CREATE INDEX IF NOT EXISTS idx_funding_clients_is_archived ON public.funding_clients(is_archived);
CREATE INDEX IF NOT EXISTS idx_client_assignments_user_id ON public.client_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON public.client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_funding_applications_client_id ON public.funding_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_funding_applications_status ON public.funding_applications(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_assigned_to ON public.client_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON public.client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON public.client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_id ON public.client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_bureau_status_client_id ON public.bureau_status(client_id);
-- ============================================================
-- 5. REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime
ADD TABLE public.funding_clients;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.funding_applications;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.client_tasks;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.bureau_status;
-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================
-- Re-use existing update_updated_at_column function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply updated_at triggers
CREATE TRIGGER update_funding_clients_updated_at BEFORE
UPDATE ON public.funding_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funding_applications_updated_at BEFORE
UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================
-- 7. SEED DATA FOR BANKS
-- ============================================================
INSERT INTO public.banks (
    name,
    product_name,
    product_type,
    bureau_pulled,
    requires_relationship,
    typical_limit_min,
    typical_limit_max,
    sequence_priority
  )
VALUES (
    'Chase',
    'Sapphire Preferred',
    'CreditCard',
    'Experian',
    false,
    5000,
    25000,
    1
  ),
  (
    'American Express',
    'Blue Business Plus',
    'CreditCard',
    'Experian',
    false,
    5000,
    25000,
    2
  ),
  (
    'Capital One',
    'Spark Cash',
    'CreditCard',
    'TransUnion',
    false,
    2000,
    25000,
    3
  ),
  (
    'Bank of America',
    'Business Advantage',
    'CreditCard',
    'Experian',
    true,
    5000,
    50000,
    4
  ),
  (
    'Citi',
    'Double Cash',
    'CreditCard',
    'Equifax',
    false,
    3000,
    20000,
    5
  ),
  (
    'Wells Fargo',
    'Active Cash',
    'CreditCard',
    'Experian',
    true,
    3000,
    20000,
    6
  ),
  (
    'Discover',
    'it Business',
    'CreditCard',
    'TransUnion',
    false,
    2000,
    15000,
    7
  ),
  (
    'US Bank',
    'Business Leverage',
    'CreditCard',
    'TransUnion',
    true,
    5000,
    30000,
    8
  ),
  (
    'Navy Federal',
    'Business CreditCard',
    'CreditCard',
    'Equifax',
    true,
    5000,
    50000,
    9
  ),
  (
    'Brex',
    'Business LOC',
    'LOC',
    'Experian',
    false,
    10000,
    100000,
    10
  );
-- ============================================================
-- 8. STORAGE BUCKET
-- ============================================================
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false) ON CONFLICT (id) DO NOTHING;
-- Storage RLS policies for client-documents bucket
-- Allow authenticated users with client access to upload documents
CREATE POLICY "Users can upload client documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
    bucket_id = 'client-documents'
    AND (
      public.is_admin()
      OR (
        (
          public.is_manager()
          OR public.is_specialist()
        ) -- Check if user has access to the client (path format: client_id/filename)
        AND EXISTS (
          SELECT 1
          FROM public.client_assignments ca
          WHERE ca.client_id::text = split_part(storage.objects.name, '/', 1)
            AND ca.user_id = auth.uid()
        )
      )
    )
  );
-- Allow authenticated users with client access to download documents
CREATE POLICY "Users can download client documents" ON storage.objects FOR
SELECT TO authenticated USING (
    bucket_id = 'client-documents'
    AND (
      public.is_admin()
      OR (
        (
          public.is_manager()
          OR public.is_specialist()
        )
        AND EXISTS (
          SELECT 1
          FROM public.client_assignments ca
          WHERE ca.client_id::text = split_part(storage.objects.name, '/', 1)
            AND ca.user_id = auth.uid()
        )
      )
    )
  );
-- Allow authenticated users with client access to delete documents
CREATE POLICY "Users can delete client documents" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'client-documents'
  AND (
    public.is_admin()
    OR (
      (
        public.is_manager()
        OR public.is_specialist()
      )
      AND EXISTS (
        SELECT 1
        FROM public.client_assignments ca
        WHERE ca.client_id::text = split_part(storage.objects.name, '/', 1)
          AND ca.user_id = auth.uid()
      )
    )
  )
);
-- Allow authenticated users with client access to update documents
CREATE POLICY "Users can update client documents" ON storage.objects FOR
UPDATE TO authenticated USING (
    bucket_id = 'client-documents'
    AND (
      public.is_admin()
      OR (
        (
          public.is_manager()
          OR public.is_specialist()
        )
        AND EXISTS (
          SELECT 1
          FROM public.client_assignments ca
          WHERE ca.client_id::text = split_part(storage.objects.name, '/', 1)
            AND ca.user_id = auth.uid()
        )
      )
    )
  ) WITH CHECK (
    bucket_id = 'client-documents'
    AND (
      public.is_admin()
      OR (
        (
          public.is_manager()
          OR public.is_specialist()
        )
        AND EXISTS (
          SELECT 1
          FROM public.client_assignments ca
          WHERE ca.client_id::text = split_part(storage.objects.name, '/', 1)
            AND ca.user_id = auth.uid()
        )
      )
    )
  );