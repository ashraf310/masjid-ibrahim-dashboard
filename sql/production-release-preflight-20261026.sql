-- PRODUCTION RELEASE PREFLIGHT: READ-ONLY. Run in PRODUCTION Supabase SQL Editor.
-- Review results and back up before any schema alteration. NO destructive SQL here.
select current_database() as database_name, now() as checked_at;
select to_regclass('public.tv_devices') as tv_devices,
       to_regclass('public.presenter_links') as presenter_links,
       to_regclass('public.d03_live_state') as d03_live_state;
select c.conname, pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid='public.tv_devices'::regclass and c.contype='c'
order by c.conname;
select column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name in ('tv_devices','presenter_links','d03_live_state')
order by table_name,ordinal_position;
-- Before using the write migration, confirm the production service-role permissions
-- and Supabase URL match the production Vercel project. NEVER copy staging data.
