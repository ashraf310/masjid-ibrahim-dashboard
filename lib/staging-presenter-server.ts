import 'server-only';
import {createHash,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const STAGING_PROJECT_ID='prj_TX0ZefGHlJUidnjfSMYCXIjm6NuZ';
export function stagingDb(){
 const projectId=process.env.VERCEL_PROJECT_ID;
 const deploymentUrl=process.env.VERCEL_URL||'';
 // Runtime may omit VERCEL_PROJECT_ID; check trusted deployment hostname instead.
 if(projectId){if(projectId!==STAGING_PROJECT_ID)return null;}
 else if(!/^masjid-ibrahim-staging(?:-[a-z0-9-]+)?\.vercel\.app$/.test(deploymentUrl))return null;
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function bearerToken(header:string|null){
 if(!header||!/^Bearer [a-zA-Z0-9_-]{32,128}$/.test(header))return null;
 return header.slice(7);
}
export function tokenDigest(token:string){return createHash('sha256').update(token,'utf8').digest('hex');}
export function safeTokenHashEquals(actual:string,expected:string){
 if(!/^[a-f0-9]{64}$/.test(actual)||!/^[a-f0-9]{64}$/.test(expected))return false;
 return timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));
}
