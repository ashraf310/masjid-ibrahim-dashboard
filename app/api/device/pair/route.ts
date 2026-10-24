import {randomBytes,createHmac} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb(),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!db||!key)return NextResponse.json({error:'Staging not configured'},{status:503,headers});
 let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const code=(body as {code?:unknown})?.code;
 if(typeof code!=='string'||!/^\d{6}$/.test(code))return NextResponse.json({error:'Enter a 6-digit code'},{status:400,headers});
 const digest=createHmac('sha256',key).update('staging-tv-pair:'+code).digest('hex');
 const now=new Date().toISOString();
 const {data:device,error:lookupError}=await db.from('tv_devices').select('id').eq('pairing_code_hash',digest).gt('pairing_code_expires_at',now).maybeSingle();
 if(lookupError)return NextResponse.json({error:'Unable to verify pairing code'},{status:503,headers});
 if(!device||['TV04','TV06'].includes(device.id))return NextResponse.json({error:'Invalid or expired pairing code'},{status:401,headers});
 const token=randomBytes(32).toString('base64url');
 // The conditional update ensures a code is consumed only once, including concurrent redemption attempts.
 const {data:updated,error}=await db.from('tv_devices').update({device_token_hash:tokenDigest(token),enabled:true,paired_at:now,pairing_code_hash:null,pairing_code_expires_at:null,updated_at:now}).eq('id',device.id).eq('pairing_code_hash',digest).gt('pairing_code_expires_at',now).select('id').maybeSingle();
 if(error||!updated)return NextResponse.json({error:'Code expired or already used'},{status:409,headers});
 return NextResponse.json({ok:true,tvId:device.id,deviceToken:token},{headers});
}
