-- Staging-only storage baseline. Run after the initial presentation schema.
-- Buckets are PRIVATE and no client RLS policies are granted.
-- Future authenticated server routes will issue narrowly scoped signed upload/download URLs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
 ('presentation-originals','presentation-originals',false,52428800,array['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[]),
 ('presentation-slides','presentation-slides',false,52428800,array['image/png','image/jpeg','image/webp']::text[])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
-- No public storage policies are defined. Do not make either bucket public.
-- Server side enforcement must authorize all files by presentation/session, including cleaned-up files.
