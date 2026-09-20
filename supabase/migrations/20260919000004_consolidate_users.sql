-- Round 2 follow-up: single users table with role column.
-- Replaces admin_users + marketer_users from 20260919000003.
-- Locked down like other tables: RLS enabled, no policies, server-only via service_role.

create table public.users (
  identifier text primary key,
  role text not null check (role in ('admin', 'marketer')),
  email text,
  password_hash text not null,
  affiliate_name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

insert into public.users (identifier, role, email, password_hash, affiliate_name, created_at)
  select email, 'marketer', email, password_hash, affiliate_name, created_at
  from public.marketer_users;

insert into public.users (identifier, role, email, password_hash, created_at)
  select username, 'admin', null, password_hash, created_at
  from public.admin_users;

drop table public.marketer_users;
drop table public.admin_users;
