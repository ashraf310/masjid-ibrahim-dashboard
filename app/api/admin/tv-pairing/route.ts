import {randomBytes, randomInt, createHmac} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {stagingDbStatus,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const {db}=stagingDbStatus();if(!db)return NextResponse.json({error:'Staging unavailable'},{status:503,headers});
 const expected=(process.env.STAGING_ADMIN_EMAIL||process.env.ADMIN_EMAIL)?.trim().toLowerCase();
 const jwt=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]||'';
 if(!expected||!jwt)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:{user},error:authError}=await db.auth.getUser(jwt);
 if(authError||user?.email?.toLowerCase()!==expected)return NextResponse.json({error:'Unauthorized'},{status:403,headers});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const {id,action}=(input||{}) as {id?:unknown;action?:unknown};
 if(typeof id!=='string'||!/^TV0[1-6]$/.test(id)||!['pair','revoke'].includes(String(action)))return NextResponse.json({error:'Invalid action'},{status:400,headers});
 if(id==='TV04'||id==='TV06')return NextResponse.json({error:'This TV is excluded from presentation pairing'},{status:409,headers});
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)return NextResponse.json({error:'Staging not configured'},{status:503,headers});
 if(action==='revoke'){
  const {error}=await db.from('tv_devices').update({device_token_hash:null,pairing_code_hash:null,pairing_code_expires_at:null,enabled:false,paired_at:null,last_seen_at:null,updated_at:new Date().toISOString()}).eq('id',id);
  return error?NextResponse.json({error:'Unable to revoke pairing'},{status:503,headers}):NextResponse.json({ok:true,id},{headers});
 }
 // One short-lived, single-use code. Existing active pairing is revoked when a new code is generated.
 for(let attempt=0;attempt<6;attempt++){
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  const hash=createHmac('sha256',key).update('staging-tv-pair:'+code).digest('hex');
  const expiresAt=new Date(Date.now()+10*60_000).toISOString();
  const {data,error}=await db.from('tv_devices').update({pairing_code_hash:hash,pairing_code_expires_at:expiresAt,device_token_hash:null,paired_at:null,last_seen_at:null,enabled:false,updated_at:new Date().toISOString()}).eq('id',id).select('id').maybeSingle();
  if(!error&&data)return NextResponse.json({ok:true,id,pairingCode:code,expiresAt},{headers});
  if(error?.code!=='23505')return NextResponse.json({error:'Apply the six-digit TV pairing migration in staging Supabase first.'},{status:503,headers});
 }
 return NextResponse.json({error:'Unable to issue unique code; retry'},{status:503,headers});
}
