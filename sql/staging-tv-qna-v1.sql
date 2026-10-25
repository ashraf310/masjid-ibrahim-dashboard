-- STAGING ONLY. Execute in staging Supabase SQL editor after review.
create table if not exists public.tv_devices (
 id text primary key check (id ~ '^TV(0[1-6])$'),
 location text not null,
 default_dashboard text not null check (default_dashboard in ('D01','D04','CAMERA','UNASSIGNED')),
 follow_d02 boolean not null default false,
 d05_override boolean not null default true,
 enabled boolean not null default false,
 device_token_hash text unique,
 paired_at timestamptz,
 last_seen_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.tv_devices enable row level security;
-- No anonymous direct database access. All operations are server-side and authenticated.
revoke all on public.tv_devices from anon,authenticated;
insert into public.tv_devices (id,location,default_dashboard,follow_d02,d05_override,enabled) values
 ('TV01','Basketball Court (Outdoor)','D01',false,true,false),
 ('TV02','Men''s Side - Near Admin Room','D04',true,true,false),
 ('TV03','Men''s Side - Middle','D04',true,true,false),
 ('TV04','Women''s Side - Continuous Camera Feed','CAMERA',false,false,false),
 ('TV05','Women''s Side - Future','D04',false,true,false),
 ('TV06','Flex Room','UNASSIGNED',false,false,false)
on conflict (id) do nothing;
create table if not exists public.presentation_questions (
 id uuid primary key default gen_random_uuid(),
 presentation_id uuid not null references public.presentations(id) on delete cascade,
 question text not null check (char_length(question) between 4 and 500),
 status text not null default 'new' check (status in ('new','answered','hidden')),
 created_at timestamptz not null default now()
);
create index if not exists presentation_questions_active_idx on public.presentation_questions(presentation_id,created_at desc);
alter table public.presentation_questions enable row level security;
revoke all on public.presentation_questions from anon,authenticated;
