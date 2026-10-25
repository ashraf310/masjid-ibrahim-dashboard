import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(req:NextRequest){
 const db=stagingDb();
 if(!db)return NextResponse.json({error:'Presenter API unavailable'}, {status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));
 if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data,error}=await db.from('presenter_links').select('id,label,revoked_at').eq('token_hash',tokenDigest(token)).maybeSingle();
 if(error)return NextResponse.json({error:'Unable to verify presenter'},{status:503,headers});
 if(!data||data.revoked_at)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 return NextResponse.json({presenter:{label:data.label},capabilities:{upload:process.env.ENABLE_STAGING_PRESENTER_UPLOADS==='true',live:false}}, {headers});
}
