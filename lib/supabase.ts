import {createClient} from '@supabase/supabase-js';
// This branch is deployed as a separate staging project. Prefer its dedicated
// Supabase credentials; never fall back to production credentials in staging.
const stagingPublicUrl=process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL;
const stagingPublicKey=process.env.NEXT_PUBLIC_STAGING_SUPABASE_PUBLISHABLE_KEY;
const publicUrl=stagingPublicUrl||process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=stagingPublicUrl?stagingPublicKey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const configured=Boolean(publicUrl&&publicKey);
let browserClient:ReturnType<typeof createClient<any,'public',any>>|null=null;
export function browserDb(){
 if(!configured||!publicUrl||!publicKey)return null;
 if(!browserClient)browserClient=createClient(publicUrl,publicKey);
 return browserClient;
}
export function serverDb(){
 const isStaging=process.env.VERCEL_PROJECT_ID==='prj_TX0ZefGHlJUidnjfSMYCXIjm6NuZ'||(process.env.VERCEL_URL||'').startsWith('masjid-ibrahim-staging-');
 const url=isStaging?process.env.SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
