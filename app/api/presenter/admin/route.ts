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
 if(input.action==='revoke'){
  const id=typeof input.id==='string'?input.id:'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid presenter ID'},{status:400,headers});
  const {data,error}=await db.from('presenter_links').update({revoked_at:new Date().toISOString()}).eq('id',id).is('revoked_at',null).select('id').maybeSingle();
  if(error)return NextResponse.json({error:'Unable to revoke presenter'},{status:503,headers});
  return NextResponse.json({ok:true,revoked:Boolean(data)},{headers});
 }
 return NextResponse.json({error:'Unsupported action'},{status:400,headers});
}
