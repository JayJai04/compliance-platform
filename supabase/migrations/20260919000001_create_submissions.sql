-- ClearPath: submissions table + private ads bucket
-- One row per ad. ad_image_path links row to file in storage.

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  affiliate_name text not null,
  affiliate_email text not null,
  product text not null check (product in ('loan', 'card', 'mortgage')),
  ad_image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ai_result jsonb,
  reviewer_note text,
  reviewed_at timestamptz
);

-- Lock the table. No browser access. Only server (service_role) touches it.
alter table public.submissions enable row level security;

-- Private bucket for ad images. JPG only, 5MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ads', 'ads', false, 5242880, array['image/jpeg', 'image/jpg'])
on conflict (id) do nothing;

-- Lock the bucket. No public reads. Server only.
create policy "deny all reads"
on storage.objects for select
using (false);

create policy "deny all inserts"
on storage.objects for insert
with check (false);

create policy "deny all updates"
on storage.objects for update
using (false);

create policy "deny all deletes"
on storage.objects for delete
using (false);
