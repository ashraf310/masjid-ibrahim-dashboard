-- STAGING ONLY. Review before applying. No existing production tables altered.
-- This schema is intentionally private: no direct anon/authenticated client access.
create extension if not exists pgcrypto;
create table if not exists public.presenter_links (
 id uuid primary key default gen_random_uuid(),
 label text not null check (length(label) between 1 and 100),
 token_hash text not null unique,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.presentations (
 id uuid primary key default gen_random_uuid(),
 presenter_id uuid not null references public.presenter_links(id),
 title text not null check (length(title) between 1 and 180),
 source_format text not null check (source_format in ('pptx','pdf')),
 state text not null check (state in ('uploading','processing','ready','live','ended','failed','clearing')),
 current_slide integer not null default 0 check (current_slide>=0),
 total_slides integer not null default 0 check (total_slides>=0),
 qa_enabled boolean not null default false,
 qr_visible boolean not null default false,
 source_path text,
 created_at timestamptz not null default now(),
 started_at timestamptz,
 ended_at timestamptz,
 presenter_last_seen_at timestamptz,
 cleanup_due_at timestamptz
);
-- Enforce exactly one occupied presentation slot, including ended items waiting to be cleared.
create unique index if not exists exactly_one_presentation_slot on public.presentations ((true));
create table if not exists public.presentation_slides (
 presentation_id uuid not null references public.presentations(id) on delete cascade,
 slide_number integer not null check (slide_number>=0),
 image_path text not null,
 notes text, -- NEVER exposed to audience API
 primary key (presentation_id,slide_number)
);
create table if not exists public.audience_questions (
 id uuid primary key default gen_random_uuid(),
 presentation_id uuid not null references public.presentations(id) on delete cascade,
 display_name text check (length(display_name)<=80),
 question text not null check (length(question) between 1 and 1200),
 status text not null default 'new' check (status in ('new','answered','dismissed')),
 created_at timestamptz not null default now()
);
create table if not exists public.tv_devices (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 1 and 100),
 registration_hash text unique,
 default_display text not null default 'outdoor',
 participate_live boolean not null default false,
 revoked_at timestamptz,
 last_seen_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.tv_pairings (
 id uuid primary key default gen_random_uuid(),
 code_hash text not null unique,
 pending_device_id uuid not null unique,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 attempt_count integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.presentation_settings (
 id integer primary key default 1 check (id=1),
 completed_retention_days integer not null default 7 check (completed_retention_days between 1 and 90)
);
insert into public.presentation_settings (id) values (1) on conflict (id) do nothing;
alter table public.presenter_links enable row level security;
alter table public.presentations enable row level security;
alter table public.presentation_slides enable row level security;
alter table public.audience_questions enable row level security;
alter table public.tv_devices enable row level security;
alter table public.tv_pairings enable row level security;
alter table public.presentation_settings enable row level security;
-- RLS defaults to deny. All access must go via explicitly authorized server routes.
revoke all on public.presenter_links,public.presentations,public.presentation_slides,public.audience_questions,public.tv_devices,public.tv_pairings,public.presentation_settings from anon,authenticated;
