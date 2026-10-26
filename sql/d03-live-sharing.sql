-- MI-ENH-002: run against STAGING Supabase before testing D03.
create table if not exists public.d03_live_state (
 id integer primary key check (id=1),
 presenter_id uuid null,
 session_id uuid null,
 status text not null default 'waiting' check (status in ('waiting','live')),
 heartbeat_at timestamptz null,
 updated_at timestamptz not null default now()
);
insert into public.d03_live_state(id,status) values (1,'waiting') on conflict (id) do nothing;
alter table public.d03_live_state enable row level security;
-- No client table grants or public policies: server service-role only.
revoke all on public.d03_live_state from anon,authenticated;
