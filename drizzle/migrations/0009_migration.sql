create table public.fundability_assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  email text not null,
  phone text,
  marketing_consent boolean not null default false,
  sms_consent boolean not null default false,
  answers jsonb not null,
  personal_score int not null,
  business_score int not null,
  total_score int not null,
  track text not null,
  provisional boolean not null default false,
  failed text[] not null default '{}',
  unverified text[] not null default '{}',
  priorities text[] not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  utm jsonb not null default '{}'::jsonb,
  landing_url text,
  ghl_contact_id text,
  crm_status text not null default 'pending',
  crm_error text,
  booking_status text not null default 'not_booked'
);
alter table public.fundability_assessments enable row level security;
grant all on public.fundability_assessments to service_role;
create index on public.fundability_assessments (lower(email));