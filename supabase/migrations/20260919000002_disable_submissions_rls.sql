-- Turn off RLS on submissions for v1 (server-only access, no anon key in app).
alter table public.submissions disable row level security;
