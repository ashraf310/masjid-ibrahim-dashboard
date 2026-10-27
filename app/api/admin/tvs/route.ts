import {NextRequest,NextResponse} from 'next/server';
import {stagingDbStatus} from '../../../../lib/staging-presenter-server';
export const dynamic='force-dynamic';export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
async function auth(req:NextRequest){
 const {db}=stagingDbStatus();if(!db)return null;
 const email=(process.env.STAGING_ADMIN_EMAIL||process.env.ADMIN_EMAIL)?.trim().toLowerCase();
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!email||!token)return null;
 const {data,error}=await db.auth.getUser(token);
 return !error&&data.user?.email?.toLowerCase()===email?db:null;
}
export async function GET(req:NextRequest){
 const db=await auth(req);if(!db)return NextResponse.json({error:'Not authorized'},{status:403,headers});
 const {data,error}=await db.from('tv_devices').select('id,location,default_dashboard,follow_d02,d05_override,enabled,paired_at,last_seen_at').order('id');
 if(error)return NextResponse.json({error:'Run the staging TV migration first'},{status:503,headers});
 return NextResponse.json({devices:data},{headers});
}
export async function POST(req:NextRequest){
 const db=await auth(req);if(!db)return NextResponse.json({error:'Not authorized'},{status:403,headers});
 let input:{action?:string;id?:string;location?:string;default_dashboard?:string;follow_d02?:boolean;d05_override?:boolean}={};
 try{input=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers})}
 if(input.action==='delete'){
  if(!/^TV(?:0[1-9]|[1-9][0-9])$/.test(input.id||''))return NextResponse.json({error:'Invalid TV ID'},{status:409,headers});
  const {data,error}=await db.from('tv_devices').delete().eq('id',input.id).select('id').maybeSingle();
  if(error)return NextResponse.json({error:'Unable to delete TV',detail:error.code},{status:503,headers});
  if(!data)return NextResponse.json({error:'TV not found'},{status:404,headers});
  return NextResponse.json({ok:true,id:data.id},{headers});
 }
 if(input.action==='add'){
  const location=typeof input.location==='string'?input.location.trim():'';
  if(!location||location.length>80)return NextResponse.json({error:'Provide a TV location (1–80 characters)'},{status:400,headers});
  const {data:existing,error:listError}=await db.from('tv_devices').select('id');
  if(listError)return NextResponse.json({error:'Unable to allocate TV ID'},{status:503,headers});
  const used=new Set((existing||[]).map(x=>x.id));
  let id='';for(let n=1;n<=99;n++){const candidate='TV'+String(n).padStart(2,'0');if(!used.has(candidate)){id=candidate;break}}
  if(!id)return NextResponse.json({error:'TV capacity reached (TV99)'},{status:409,headers});
  const {data,error}=await db.from('tv_devices').insert({id,location,default_dashboard:'D04',follow_d02:true,d05_override:false,enabled:false,updated_at:new Date().toISOString()}).select('id,location').single();
  if(error)return NextResponse.json({error:error.code==='23514'?'TV ID is blocked by an older database constraint. Run the TV expansion SQL migration in staging Supabase.':'Unable to add TV. Check the staging database schema and required defaults.',detail:error.code},{status:503,headers});
  return NextResponse.json({ok:true,device:data},{status:201,headers});
 }
 if(!/^TV(?:0[1-9]|[1-9][0-9])$/.test(input.id||''))return NextResponse.json({error:'Invalid TV ID'},{status:400,headers});
 const location=typeof input.location==='string'?input.location.trim():'';
 if(!location||location.length>80)return NextResponse.json({error:'TV location must contain 1–80 characters'},{status:400,headers});
 if(!['D01','D04','CAMERA','UNASSIGNED'].includes(input.default_dashboard||''))return NextResponse.json({error:'Invalid dashboard'},{status:400,headers});
 if(typeof input.follow_d02!=='boolean'||typeof input.d05_override!=='boolean')return NextResponse.json({error:'Invalid options'},{status:400,headers});
 const {error}=await db.from('tv_devices').update({location,default_dashboard:input.default_dashboard,follow_d02:input.follow_d02,d05_override:input.d05_override,updated_at:new Date().toISOString()}).eq('id',input.id);
 if(error)return NextResponse.json({error:'Unable to save TV configuration'},{status:503,headers});
 return NextResponse.json({ok:true,note:'Configuration saved in staging database; physical TV pairing is not active yet.'},{headers});
}