-- Run this once in the Supabase SQL editor.
create table if not exists public.display_config (
  id integer primary key default 1 check (id=1),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  published_at timestamptz
);
insert into public.display_config(id,draft,published) values(1,'{}','{}') on conflict(id) do nothing;
alter table public.display_config enable row level security;
revoke all on public.display_config from anon, authenticated;
-- Admin CRUD goes through authorized Next.js server route (service role).
-- Allow logged-in dashboard admin to read draft for preview/editor.
-- Restrict this policy by the administrator's email from JWT. Single-account design.
create policy "Only dashboard administrator reads draft" on public.display_config for select to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = lower('REPLACE_WITH_ADMIN_EMAIL'));
-- Storage bucket serves approved public flyer assets and accepts uploads only from admin.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('flyers','flyers',true,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Only dashboard admin uploads" on storage.objects for insert to authenticated with check (
 bucket_id='flyers' and lower(coalesce(auth.jwt()->>'email',''))=lower('REPLACE_WITH_ADMIN_EMAIL'));
-- Content safety: no update/delete access from public users.
