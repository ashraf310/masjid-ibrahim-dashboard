-- Staging only. Numeric presenter PIN is hashed before it is stored.
alter table public.presenter_links add column if not exists code_hash text unique;
