-- Follow-up migration; run on staging before D02 timed sessions are enabled.
alter table public.presentations add column if not exists expires_at timestamptz;
