import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const fresh=(stamp:string|null)=>Boolean(stamp&&Date.now()-new Date(stamp).getTime()<15000);
export async function GET(){
 return NextResponse.json({live:false,sessionId:null,disabled:true},{headers});
 const db=stagingDb();if(!db)return NextResponse.json({error:'Backend unavailable'},{status:503,headers});
 const {data,error}=await db.from('d03_live_state').select('status,session_id,heartbeat_at').eq('id',1).maybeSingle();
 if(error)return NextResponse.json({error:'Apply the D03 staging migration'},{status:503,headers});
 return NextResponse.json({live:data?.status==='live'&&fresh(data.heartbeat_at),sessionId:data?.status==='live'&&fresh(data.heartbeat_at)?data.session_id:null},{headers});
}
export async function POST(req:NextRequest){
 return NextResponse.json({error:"Live presentation temporarily disabled"},{status:503,headers});
 const db=stagingDb();if(!db)return NextResponse.json({error:'Backend unavailable'},{status:503,headers});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({error:'Origin denied'},{status:403,headers});
 const token=bearerToken(req.headers.get('authorization'));if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:presenter}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(!presenter)return NextResponse.json({error:'Presenter revoked or unauthorized'},{status:403,headers});
 let input:{action?:string;sessionId?:string};try{input=await req.json()}catch{return NextResponse.json({error:'Bad request'},{status:400,headers})}
 const {data:current,error}=await db.from('d03_live_state').select('presenter_id,session_id,status,heartbeat_at').eq('id',1).single();
 if(error||!current)return NextResponse.json({error:'D03 migration required'},{status:503,headers});
 const isOwner=current.presenter_id===presenter.id&&current.session_id===input.sessionId;
 if(input.action==='start'){
  if(current.status==='live'&&fresh(current.heartbeat_at))return NextResponse.json({error:'Another D03 session is already active'},{status:409,headers});
  const sessionId=randomUUID();
  // Atomically claim the slot only if it is idle or its heartbeat has expired.
  // PostgreSQL rechecks this predicate for concurrent updates, so two presenters
  // cannot both acquire the same slot. No fragile timestamp equality required.
  const now=new Date();
  const staleBefore=new Date(now.getTime()-15000).toISOString();
  const {data:claimed,error:saveError}=await db.from('d03_live_state')
   .update({presenter_id:presenter.id,session_id:sessionId,status:'live',heartbeat_at:now.toISOString(),updated_at:now.toISOString()})
   .eq('id',1)
   .or(`status.eq.waiting,heartbeat_at.lt.${staleBefore}`)
   .select('session_id').maybeSingle();
  if(saveError||!claimed)return NextResponse.json({error:'Another presenter claimed this session; retry'},{status:409,headers});
  return NextResponse.json({sessionId},{headers});
 }
 if(!isOwner)return NextResponse.json({error:'Session owner mismatch'},{status:403,headers});
 if(input.action==='heartbeat'){
  const {data:updated,error:heartbeatError}=await db.from('d03_live_state').update({heartbeat_at:new Date().toISOString()}).eq('id',1).eq('status','live').eq('session_id',input.sessionId).select('session_id').maybeSingle();
  if(heartbeatError)return NextResponse.json({error:'Heartbeat failed'},{status:503,headers});
  if(!updated)return NextResponse.json({error:'Live session was ended by Admin'},{status:409,headers});
  return NextResponse.json({ok:true},{headers});
 }
 if(input.action==='stop'){
  const {error:stopError}=await db.from('d03_live_state').update({status:'waiting',presenter_id:null,session_id:null,heartbeat_at:null,updated_at:new Date().toISOString()}).eq('id',1).eq('session_id',input.sessionId);
  return NextResponse.json({ok:!stopError},{status:stopError?503:200,headers});
 }
 return NextResponse.json({error:'Unsupported action'},{status:400,headers});
}
