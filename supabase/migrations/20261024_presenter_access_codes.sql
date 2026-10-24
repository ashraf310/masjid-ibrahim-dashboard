-- Staging only. Presenter access code is separate from the temporary bearer session.
alter table public.presenter_links add column if not exists code_hash text unique;
create table if not exists public.presenter_code_attempts (
  identifier text primary key,
  failures integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.presenter_code_attempts enable row level security;
revoke all on public.presenter_code_attempts from anon,authenticated;
