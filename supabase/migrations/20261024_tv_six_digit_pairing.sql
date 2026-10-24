-- Apply in STAGING Supabase SQL editor before using six-digit TV codes.
alter table public.tv_devices add column if not exists pairing_code_hash text;
alter table public.tv_devices add column if not exists pairing_code_expires_at timestamptz;
create unique index if not exists tv_devices_pairing_code_unique on public.tv_devices(pairing_code_hash) where pairing_code_hash is not null;
