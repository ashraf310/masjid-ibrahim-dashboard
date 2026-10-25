-- Masjid Ibrahim production upgrade after the initial 20261020 migration.
-- Execute against the existing PRODUCTION Supabase project, using SQL Editor.
-- Preserves public.display_config and all existing records.
BEGIN;
DO $$
DECLARE id_type text; rows_found boolean;
BEGIN
 SELECT data_type INTO id_type
 FROM information_schema.columns
 WHERE table_schema='public' AND table_name='tv_devices' AND column_name='id';
 IF id_type='uuid' THEN
   SELECT EXISTS (SELECT 1 FROM public.tv_devices) INTO rows_found;
   IF rows_found THEN RAISE EXCEPTION 'Legacy UUID tv_devices has data. Manual data migration required; nothing changed.'; END IF;
   IF to_regclass('public.tv_devices_legacy_initial') IS NOT NULL THEN RAISE EXCEPTION 'Archived tv_devices table already exists. Inspect before retrying.'; END IF;
   ALTER TABLE public.tv_devices RENAME TO tv_devices_legacy_initial;
 ELSIF id_type IS NOT NULL AND id_type<>'text' THEN
   RAISE EXCEPTION 'Unexpected tv_devices id type: %',id_type;
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.tv_devices (
 id text PRIMARY KEY CHECK (id ~ '^TV0[1-6]$'),
 location text NOT NULL,
 default_dashboard text NOT NULL CHECK (default_dashboard IN ('D01','D04','CAMERA','UNASSIGNED')),
 follow_d02 boolean NOT NULL DEFAULT false,
 d05_override boolean NOT NULL DEFAULT true,
 enabled boolean NOT NULL DEFAULT false,
 device_token_hash text UNIQUE,
 paired_at timestamptz,
 last_seen_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tv_devices ADD COLUMN IF NOT EXISTS pairing_code_hash text;
ALTER TABLE public.tv_devices ADD COLUMN IF NOT EXISTS pairing_code_expires_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS tv_devices_pairing_code_unique ON public.tv_devices(pairing_code_hash) WHERE pairing_code_hash IS NOT NULL;
INSERT INTO public.tv_devices (id,location,default_dashboard,follow_d02,d05_override,enabled) VALUES
 ('TV01','Basketball Court (Outdoor)','D01',false,true,false),
 ('TV02','Men''s Side - Near Admin Room','D04',true,true,false),
 ('TV03','Men''s Side - Middle','D04',true,true,false),
 ('TV04','Women''s Side - Continuous Camera Feed','CAMERA',false,false,false),
 ('TV05','Women''s Side - Future','D04',false,true,false),
 ('TV06','Flex Room','UNASSIGNED',false,false,false)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.presenter_links ADD COLUMN IF NOT EXISTS code_hash text UNIQUE;
CREATE TABLE IF NOT EXISTS public.presentation_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
 question text NOT NULL CHECK(char_length(question) BETWEEN 4 AND 500),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','answered','hidden')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS presentation_questions_active_idx ON public.presentation_questions(presentation_id,created_at DESC);
ALTER TABLE public.tv_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tv_devices,public.presentation_questions FROM anon,authenticated;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('presentation-originals','presentation-originals',false,52428800,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[]),
 ('presentation-slides','presentation-slides',false,52428800,ARRAY['image/png','image/jpeg','image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
COMMIT;
-- Inspect: SELECT id,location,default_dashboard FROM public.tv_devices ORDER BY id;
