import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {stagingDbStatus,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','Pragma':'no-cache'};
export async function POST(req:NextRequest){
 const {db}=stagingDbStatus();
 if(!db)return NextResponse.json({error:'Staging unavailable'},{status:503,headers});
 const admin=process.env.STAGING_ADMIN_EMAIL?.trim().toLowerCase();
 const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]||'';
 if(!admin||!bearer)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:{user},error:authError}=await db.auth.getUser(bearer);
 if(authError||user?.email?.toLowerCase()!==admin)return NextResponse.json({error:'Unauthorized'},{status:403,headers});
 let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const {id,action}=(body||{}) as {id?:unknown;action?:unknown};
 if(typeof id!=='string'||!/^TV0[1-6]$/.test(id)||!['pair','revoke'].includes(String(action)))return NextResponse.json({error:'Invalid device action'},{status:400,headers});
 if(id==='TV04'||id==='TV06')return NextResponse.json({error:'This TV cannot be paired for presentation control'},{status:409,headers});
 // Re-pairing instantly invalidates the previous device key.
 const token=action==='pair'?randomBytes(32).toString('base64url'):null;
 const changes=token?{device_token_hash:tokenDigest(token),enabled:true,paired_at:new Date().toISOString(),last_seen_at:null,updated_at:new Date().toISOString()}:{device_token_hash:null,enabled:false,paired_at:null,last_seen_at:null,updated_at:new Date().toISOString()};
 const {data,error}=await db.from('tv_devices').update(changes).eq('id',id).select('id').maybeSingle();
 if(error||!data)return NextResponse.json({error:'Unable to save pairing. Apply staging TV migration.'},{status:503,headers});
 // Token shown ONCE to administrator; never return the stored hash.
 return NextResponse.json({ok:true,id,paired:!!token,...(token?{deviceToken:token}:{})},{headers});
}
