import {NextRequest,NextResponse} from 'next/server';
import {randomBytes,createHash} from 'node:crypto';
import {stagingDbStatus} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function authenticated(req:NextRequest){
 const {db,reason}=stagingDbStatus();
 if(!db)return {db:null,reason:reason||'STAGING_DB_UNAVAILABLE'};
 const expected=process.env.STAGING_ADMIN_EMAIL?.trim().toLowerCase();
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
 if(input.action==='create'){
  const label=typeof input.label==='string'?input.label.trim():'';
  if(label.length<1||label.length>100)return NextResponse.json({error:'Enter presenter name (1-100 characters)'},{status:400,headers});
  const secret=randomBytes(32).toString('base64url');const hash=createHash('sha256').update(secret).digest('hex');
  const {data,error}=await db.from('presenter_links').insert({label,token_hash:hash}).select('id,label,created_at,revoked_at').single();
  if(error)return NextResponse.json({error:'Cannot generate presenter link'},{status:503,headers});
  const base=new URL(req.url).origin;
  return NextResponse.json({presenter:data,link:base+'/presenter#token='+secret,notice:'Copy now: this link cannot be recovered later.'},{status:201,headers});
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
  const {data:slides,error:slidesError}=await db.from('presentation_slides').select('image_path').eq('presentation_id',id);
  if(slidesError)return NextResponse.json({error:'Unable to verify slide assets'},{status:503,headers});
  const {error:originalError}=await db.storage.from('presentation-originals').remove([id+'/source.'+item.source_format]);
  if(originalError)return NextResponse.json({error:'Cannot remove original file'},{status:503,headers});
  if(slides?.length){const {error:slideError}=await db.storage.from('presentation-slides').remove(slides.map(s=>s.image_path));if(slideError)return NextResponse.json({error:'Cannot remove converted slides'},{status:503,headers});}
  const {error:deleteError}=await db.from('presentations').delete().eq('id',id).neq('state','live');
  if(deleteError)return NextResponse.json({error:'Failed to release presentation slot'},{status:503,headers});
  return NextResponse.json({ok:true},{headers});
 }
 if(input.action==='revoke'){
  const id=typeof input.id==='string'?input.id:'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid presenter ID'},{status:400,headers});
  const {data,error}=await db.from('presenter_links').update({revoked_at:new Date().toISOString()}).eq('id',id).is('revoked_at',null).select('id').maybeSingle();
  if(error)return NextResponse.json({error:'Unable to revoke presenter'},{status:503,headers});
  return NextResponse.json({ok:true,revoked:Boolean(data)},{headers});
 }
 return NextResponse.json({error:'Unsupported action'},{status:400,headers});
}
