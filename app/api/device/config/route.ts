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
 const [{data:d03},{data:d02},{data:active}]=await Promise.all([
  db.from('d03_live_state').select('status,heartbeat_at,expires_at,admin_locked').eq('id',1).maybeSingle(),
  db.from('presentation_service_controls').select('admin_locked').eq('service','d02').maybeSingle(),
  data.follow_d02?db.from('presentations').select('id,expires_at').eq('state','live').limit(1).maybeSingle():Promise.resolve({data:null})
 ]);
 const now=Date.now();
 const d03Live=Boolean(d03&&!d03.admin_locked&&d03.status==='live'&&d03.expires_at&&Date.parse(d03.expires_at)>now&&d03.heartbeat_at&&now-Date.parse(d03.heartbeat_at)<15000);
 const d02Live=Boolean(data.follow_d02&&!d02?.admin_locked&&active?.expires_at&&Date.parse(active.expires_at)>now);
 // Consolidated TV status: idle TVs no longer need to call D02/D03 APIs separately.
 return NextResponse.json({tvId:data.id,defaultDashboard:data.default_dashboard,followD02:data.follow_d02,d03Live,d02Live,d05Override:data.d05_override},{headers});
}
