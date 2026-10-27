import {NextRequest,NextResponse} from 'next/server';
import {randomBytes,createHash,randomInt} from 'node:crypto';
import {stagingDbStatus} from '../../../../lib/staging-presenter-server';
import {deletePresentationAssets} from '../../../../lib/delete-staging-presentation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function authenticated(req:NextRequest){
 const {db,reason}=stagingDbStatus();
 if(!db)return {db:null,reason:reason||'STAGING_DB_UNAVAILABLE'};
 const expected=(process.env.STAGING_ADMIN_EMAIL||process.env.ADMIN_EMAIL)?.trim().toLowerCase();
 if(!expected)return {db:null,reason:'ADMIN_EMAIL_MISSING'};
 const header=req.headers.get('authorization')||'';
 if(!/^Bearer [^ ]{20,}$/.test(header))return {db:null,reason:'TOKEN_MISSING'};
 const {data,error}=await db.auth.getUser(header.slice(7));
 if(error||!data.user)return {db:null,reason:'TOKEN_INVALID'};
 if(data.user.email?.trim().toLowerCase()!==expected)return {db:null,reason:'EMAIL_NOT_AUTHORIZED'};
 return {db,reason:null};
}
export async function GET(req:NextRequest){
 const auth=await authenticated(req);if(!auth.db)return NextResponse.json({error:'Admin authorization failed',code:auth.reason},{status:403,headers});const db=auth.db;
 const {data,error}=await db.from('presenter_links').select('id,label,created_at,revoked_at').order('created_at',{ascending:false});
 if(error)return NextResponse.json({error:'Could not list presenters'},{status:503,headers});
 return NextResponse.json({presenters:data||[]},{headers});
}
export async function POST(req:NextRequest){
 const auth=await authenticated(req);if(!auth.db)return NextResponse.json({error:'Admin authorization failed',code:auth.reason},{status:403,headers});const db=auth.db;
 let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid request'},{status:400,headers});
 const input=body as Record<string,unknown>;
 if(input.action==='qa-settings'){
  const {data:row,error}=await db.from('display_config').select('published').eq('id',1).single();
  if(error||!row)return NextResponse.json({error:'Staging display configuration unavailable'},{status:503,headers});
  return NextResponse.json({enabled:row.published?.d02QaEnabled!==false,url:row.published?.d02QaUrl||'https://masjid-ibrahim-staging.vercel.app/q'},{headers});
 }
 if(input.action==='qa-update'){
  if(typeof input.enabled!=='boolean'||typeof input.url!=='string')return NextResponse.json({error:'Invalid Q&A settings'},{status:400,headers});
  let parsed:URL;try{parsed=new URL(input.url.trim())}catch{return NextResponse.json({error:'Enter a valid HTTPS question URL'},{status:400,headers})}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash||input.url.length>220)return NextResponse.json({error:'Use a public HTTPS URL, maximum 220 characters'},{status:400,headers});
  const {data:row,error:readError}=await db.from('display_config').select('published').eq('id',1).single();
  if(readError||!row)return NextResponse.json({error:'Staging display configuration unavailable'},{status:503,headers});
  const published={...(row.published||{}),d02QaEnabled:input.enabled,d02QaUrl:parsed.toString()};
  const {error}=await db.from('display_config').update({published}).eq('id',1);
  if(error)return NextResponse.json({error:'Could not save Q&A settings'},{status:503,headers});
  return NextResponse.json({ok:true,enabled:input.enabled,url:parsed.toString()},{headers});
 }
 if(input.action==='create'){
  const label=typeof input.label==='string'?input.label.trim():'';
  if(label.length<1||label.length>100)return NextResponse.json({error:'Enter presenter name (1-100 characters)'},{status:400,headers});
  // Optionally accept an admin-chosen reusable PIN; never return or store it in plaintext.
  const chosen=input.code;
  if(chosen!==undefined&&(typeof chosen!=='string'||!/^\d{4}$/.test(chosen)))return NextResponse.json({error:'Custom code must be exactly 4 digits'},{status:400,headers});
  const code=typeof chosen==='string'?chosen:String(randomInt(0,10000)).padStart(4,'0');
  const digest=createHash('sha256').update(code).digest('hex');
  const {data:duplicate,error:checkError}=await db.from('presenter_links').select('id').eq('code_hash',digest).is('revoked_at',null).limit(1);
  if(checkError)return NextResponse.json({error:'Unable to verify code uniqueness'},{status:503,headers});
  if(duplicate?.length)return NextResponse.json({error:'Code already assigned. Choose a different one.'},{status:409,headers});
  const hash=createHash('sha256').update(randomBytes(32)).digest('hex');const codeHash=digest;
  const {data,error}=await db.from('presenter_links').insert({label,token_hash:hash,code_hash:codeHash}).select('id,label,created_at,revoked_at').single();
  if(error){const missingColumn=error.code==='42703'||error.code==='PGRST204'||/code_hash|schema cache|column/i.test(error.message||'');return NextResponse.json({error:missingColumn?'Staging Supabase migration missing: add presenter_links.code_hash using supabase/migrations/20261024_presenter_access_codes.sql.':'PIN creation failed in staging database. Check presenter_links schema and database logs.',code:error.code||'DATABASE_INSERT_FAILED'},{status:503,headers});}
  const base=new URL(req.url).origin;
  return NextResponse.json({presenter:data,link:base+'/presenter',code,notice:'Share the permanent presenter URL and this code privately. The 4-digit code is displayed once.'},{status:201,headers});
 }
 if(input.action==='emergency-stop'){
  // Reset D03 and end any D02 live presentation. Does not delete files or revoke saved codes.
  const {error:d03Error}=await db.from('d03_live_state').update({status:'waiting',presenter_id:null,session_id:null,heartbeat_at:null,updated_at:new Date().toISOString()}).eq('id',1);
  if(d03Error)return NextResponse.json({error:'D03 emergency reset failed'},{status:503,headers});
  const {error:d02Error}=await db.from('presentations').update({state:'ended'}).eq('state','live');
  if(d02Error)return NextResponse.json({error:'D03 reset succeeded, but D02 reset failed'},{status:503,headers});
  return NextResponse.json({ok:true,message:'D03 and D02 live session states cleared'},{headers});
 }
 if(input.action==='status'){
  const {data,error}=await db.from('presentations').select('id,title,state,created_at,source_format').limit(1).maybeSingle();
  if(error)return NextResponse.json({error:'Unable to retrieve presentation'},{status:503,headers});
  return NextResponse.json({presentation:data||null},{headers});
 }
 if(input.action==='clear'){
  const id=typeof input.id==='string'?input.id:'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid presentation ID'},{status:400,headers});
  const {data:item,error:lookupError}=await db.from('presentations').select('id,state,source_format').eq('id',id).maybeSingle();
  if(lookupError||!item)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
  if(item.state==='live')return NextResponse.json({error:'End a live presentation before clearing'},{status:409,headers});
  try{await deletePresentationAssets(db,id)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Cleanup failed'},{status:503,headers})}
  return NextResponse.json({ok:true},{headers});
 }
 if(input.action==='purge_revoked'){
  const {data:revoked,error:listError}=await db.from('presenter_links').select('id').not('revoked_at','is',null);
  if(listError)return NextResponse.json({error:'Could not list revoked presenter links'},{status:503,headers});
  let removed=0;
  for(const presenter of revoked||[]){
   const {data:items,error:itemsError}=await db.from('presentations').select('id').eq('presenter_id',presenter.id);
   if(itemsError)return NextResponse.json({error:'Cleanup stopped while checking associated presentations',removed},{status:503,headers});
   try{for(const item of items||[])await deletePresentationAssets(db,item.id)}
   catch(e){return NextResponse.json({error:'Cleanup stopped: '+(e instanceof Error?e.message:'Could not delete presentation assets'),removed},{status:503,headers})}
   const {error:deleteError}=await db.from('presenter_links').delete().eq('id',presenter.id).not('revoked_at','is',null);
   if(deleteError)return NextResponse.json({error:'Cleanup stopped while removing revoked link',removed},{status:503,headers});
   removed++;
  }
  return NextResponse.json({ok:true,removed},{headers});
 }
 if(input.action==='revoke'){
  const id=typeof input.id==='string'?input.id:'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid presenter ID'},{status:400,headers});
  const {data:presenter,error:lookupError}=await db.from('presenter_links').select('id,revoked_at').eq('id',id).maybeSingle();
  if(lookupError)return NextResponse.json({error:'Cannot locate presenter'},{status:503,headers});
  if(!presenter)return NextResponse.json({error:'Presenter not found'},{status:404,headers});
  // Revoke first so uploads and control requests are blocked during cleanup.
  const {error:revokeError}=await db.from('presenter_links').update({revoked_at:new Date().toISOString()}).eq('id',id);
  if(revokeError)return NextResponse.json({error:'Cannot revoke presenter'},{status:503,headers});
  const {data:items,error:itemsError}=await db.from('presentations').select('id').eq('presenter_id',id);
  if(itemsError)return NextResponse.json({error:'Link revoked, but could not check presentations for cleanup'},{status:503,headers});
  try{for(const item of items||[])await deletePresentationAssets(db,item.id)}
  catch(e){return NextResponse.json({error:'Link revoked, but some presentation data remains. Retry revoke to clean it up: '+(e instanceof Error?e.message:'Cleanup failed')},{status:503,headers})}
  // Erase token hash and presenter record once child records have been removed.
  const {error:removeError}=await db.from('presenter_links').delete().eq('id',id);
  if(removeError)return NextResponse.json({error:'Presenter revoked and files cleared, but the link record could not be removed'},{status:503,headers});
  return NextResponse.json({ok:true,revoked:true,deleted:true},{headers});
 }
 return NextResponse.json({error:'Unsupported action'},{status:400,headers});
}
