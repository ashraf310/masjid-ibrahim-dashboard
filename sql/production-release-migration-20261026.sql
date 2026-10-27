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
-- Do not drop unknown CHECK constraints. Remove ONLY known original TV-ID whitelist.
do $$
declare id_rule record;
begin
 for id_rule in
  select conname from pg_constraint
  where conrelid='public.tv_devices'::regclass and contype='c'
    and pg_get_constraintdef(oid) like '%TV0[1-6]%'
 loop
   -- Original whitelist restriction must be reviewed against read-only preflight output.
   -- This migration deliberately aborts so it cannot silently drop unrelated constraints.
   raise exception 'Manual review required before replacing existing constraint: %', id_rule.conname;
 end loop;
end $$;
alter table public.tv_devices drop constraint if exists tv_devices_id_expanded_check;
alter table public.tv_devices add constraint tv_devices_id_expanded_check
 check (id ~ '^TV(0[1-9]|[1-9][0-9])$');
commit;
-- Production gate: verify existing pairing rows preserved, app uses production Supabase,
-- and public Realtime channel authorization assessed before deploying D03.
