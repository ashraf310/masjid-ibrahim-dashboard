-- MI-ENH-003: Timed presentation availability and independent admin emergency locks.
-- Run in STAGING Supabase SQL Editor before testing the new controls.
alter table public.d03_live_state
  add column if not exists expires_at timestamptz,
  add column if not exists admin_locked boolean not null default false,
  add column if not exists admin_enabled_until timestamptz;
create table if not exists public.presentation_service_controls (
  service text primary key check (service in ('d02')),
  admin_locked boolean not null default false,
  admin_enabled_until timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.presentation_service_controls(service) values ('d02') on conflict do nothing;
alter table public.presentation_service_controls enable row level security;
-- No anonymous table access: API uses the service-role client.
-- Expiration is checked on every D03 GET/heartbeat, not by a paid cron.

-- D02 timed presentation lifecycle (used only after Go Live is restored).
alter table public.presentations add column if not exists expires_at timestamptz;
