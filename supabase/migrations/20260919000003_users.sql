-- Round 2: user tables for admin + marketers.
-- Locked down like submissions: RLS enabled, no policies, server-only via service_role.

create table public.admin_users (
  username text primary key,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table public.marketer_users (
  email text primary key check (email = lower(email)),
  password_hash text not null,
  affiliate_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.marketer_users enable row level security;
