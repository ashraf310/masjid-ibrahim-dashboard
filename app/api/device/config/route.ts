import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','Pragma':'no-cache'};
/** Staging APK supplies its private pairing token. No anonymous device assignments. */
export async function GET(req:NextRequest){
 const db=stagingDb();if(!db)return NextResponse.json({error:'Staging unavailable'},{status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));
 if(!token)return NextResponse.json({error:'Device pairing required'},{status:401,headers});
 const {data,error}=await db.from('tv_devices').select('id,default_dashboard,follow_d02,d05_override,enabled').eq('device_token_hash',tokenDigest(token)).eq('enabled',true).maybeSingle();
 if(error)return NextResponse.json({error:'TV configuration unavailable'},{status:503,headers});
 if(!data)return NextResponse.json({error:'Device not authorized'},{status:403,headers});
 await db.from('tv_devices').update({last_seen_at:new Date().toISOString()}).eq('id',data.id);
 // D02 selection is advisory until the Android staging APK uses this endpoint.
 return NextResponse.json({tvId:data.id,defaultDashboard:data.default_dashboard,followD02:data.follow_d02,d05Override:data.d05_override},{headers});
}
