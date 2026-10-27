-- MI-FIX-006. STAGING database only. Review before running.
-- First inspect the currently installed restrictions:
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid='public.tv_devices'::regclass and contype='c';

-- Replace only legacy ID CHECK constraints explicitly listing TV01..TV06.
-- Does not modify dashboard checks, pairing security, or other device settings.
do $$
declare rule record;
begin
  for rule in
    select conname
    from pg_constraint
    where conrelid='public.tv_devices'::regclass and contype='c'
      and pg_get_constraintdef(oid) ~ 'TV0[1-6]'
      and pg_get_constraintdef(oid) ~ '\mid\M'
  loop
    execute format('alter table public.tv_devices drop constraint %I',rule.conname);
  end loop;
end $$;
alter table public.tv_devices drop constraint if exists tv_devices_id_expanded_check;
alter table public.tv_devices add constraint tv_devices_id_expanded_check
  check (id ~ '^TV(0[1-9]|[1-9][0-9])$');
-- If this migration fails, inspect whether ID is restricted by an ENUM/domain
-- or other foreign keys; do not delete or truncate existing tv_devices rows.
