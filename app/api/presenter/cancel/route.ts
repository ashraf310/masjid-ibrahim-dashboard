import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db||process.env.ENABLE_STAGING_PRESENTER_UPLOADS!=='true')return NextResponse.json({error:'Cancellation unavailable'},{status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:p}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(!p)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const id=(body as {presentationId?:unknown})?.presentationId;
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid ID'},{status:400,headers});
 const {data:item}=await db.from('presentations').select('id,state').eq('id',id).eq('presenter_id',p.id).maybeSingle();
 if(!item||item.state!=='uploading')return NextResponse.json({error:'Cannot cancel this presentation'},{status:409,headers});
 const {error:removeError}=await db.storage.from('presentation-originals').remove([id+'/source.pdf',id+'/source.pptx']);
 if(removeError)return NextResponse.json({error:'Could not remove uploaded file; ask Admin to clear it'},{status:503,headers});
 const {error:deleteError}=await db.from('presentations').delete().eq('id',id).eq('state','uploading').eq('presenter_id',p.id);
 if(deleteError)return NextResponse.json({error:'Could not release reserved slot'},{status:503,headers});
 return NextResponse.json({ok:true},{headers});
}
