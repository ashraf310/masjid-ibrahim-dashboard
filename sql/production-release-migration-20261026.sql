-- PRODUCTION ONLY. NOT EXECUTED. Requires reviewed preflight, backup, explicit final release gate.
-- Idempotently prepare D03 state while preserving all existing records.
begin;
create table if not exists public.d03_live_state (
 id integer primary key check (id=1),
 presenter_id uuid null,
 session_id uuid null,
 status text not null default 'waiting' check (status in ('waiting','live')),
 heartbeat_at timestamptz null,
 updated_at timestamptz not null default now()
);
insert into public.d03_live_state(id,status) values (1,'waiting')
 on conflict (id) do nothing;
alter table public.d03_live_state enable row level security;
revoke all on public.d03_live_state from anon,authenticated;
-- Only the original named TV ID constraint is eligible for replacement.
-- Review the preflight output before executing this transaction.
do $$
declare def text;
begin
 select pg_get_constraintdef(oid) into def from pg_constraint
 where conrelid='public.tv_devices'::regclass and conname='tv_devices_id_check';
 if def is not null and def not like '%TV0[1-6]%' then
  raise exception 'Unexpected tv_devices_id_check definition: %',def;
 end if;
 if def is not null then
  execute 'alter table public.tv_devices drop constraint tv_devices_id_check';
 end if;
end $$;
alter table public.tv_devices drop constraint if exists tv_devices_id_expanded_check;
alter table public.tv_devices add constraint tv_devices_id_expanded_check
 check (id ~ '^TV(0[1-9]|[1-9][0-9])$');
commit;
-- Production gate: verify existing pairing rows preserved, app uses production Supabase,
-- and public Realtime channel authorization assessed before deploying D03.
