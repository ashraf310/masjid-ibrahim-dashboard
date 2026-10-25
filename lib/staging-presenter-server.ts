import 'server-only';
import {createHash,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const STAGING_PROJECT_ID='prj_TX0ZefGHlJUidnjfSMYCXIjm6NuZ';
const PRODUCTION_PROJECT_ID='prj_nfxbmx6pipe5y7bCvS0QmhUL66Cy';
export function stagingDbStatus(){
 const id=process.env.VERCEL_PROJECT_ID;
 const host=process.env.VERCEL_URL||'';
 const staging=id===STAGING_PROJECT_ID||host.startsWith('masjid-ibrahim-staging-');
 const production=id===PRODUCTION_PROJECT_ID||host.startsWith('masjid-ibrahim-dashboard-');
 const local=process.env.NODE_ENV==='development'&&!id&&!host;
 if(!staging&&!production&&!local)return {db:null,reason:'PROJECT_CHECK_FAILED'};
 const url=process.env.SUPABASE_URL?.trim()||(production?process.env.NEXT_PUBLIC_SUPABASE_URL?.trim():undefined);
 const expectedUrl=production?process.env.NEXT_PUBLIC_SUPABASE_URL?.trim():process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL?.trim();
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!url)return {db:null,reason:'SUPABASE_URL_MISSING'};
 if(!url.startsWith('https://')||!url.endsWith('.supabase.co'))return {db:null,reason:'SUPABASE_URL_INVALID'};
 if(!expectedUrl||url!==expectedUrl)return {db:null,reason:'SUPABASE_ENVIRONMENT_MISMATCH'};
 if(!key)return {db:null,reason:'SUPABASE_KEY_MISSING'};
 try{return {db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),reason:null};}
 catch{return {db:null,reason:'SUPABASE_CLIENT_ERROR'};}
}
export function stagingDb(){return stagingDbStatus().db;}
export function bearerToken(header:string|null){
 if(!header||!/^Bearer [a-zA-Z0-9_-]{32,128}$/.test(header))return null;
 return header.slice(7);
}
export function tokenDigest(token:string){return createHash('sha256').update(token,'utf8').digest('hex');}
export function safeTokenHashEquals(actual:string,expected:string){
 if(!/^[a-f0-9]{64}$/.test(actual)||!/^[a-f0-9]{64}$/.test(expected))return false;
 return timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));
}
