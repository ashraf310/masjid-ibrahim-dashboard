import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function owner(req:NextRequest){
 const db=stagingDb();if(!db)return null;
 const token=bearerToken(req.headers.get('authorization'));if(!token)return null;
 const {data,error}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 return error||!data?null:{db,presenterId:data.id};
}
export async function GET(req:NextRequest){
 const auth=await owner(req);if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data,error}=await auth.db.from('presentations').select('id,title,state,source_format').eq('presenter_id',auth.presenterId).limit(1).maybeSingle();
 if(error)return NextResponse.json({error:'Could not load presentation'},{status:503,headers});
 return NextResponse.json({presentation:data||null},{headers});
}
export async function POST(req:NextRequest){
 const auth=await owner(req);if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const id=(input as {id?:unknown})?.id;
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid presentation'},{status:400,headers});
 const {db,presenterId}=auth;
 const {data:item,error:readError}=await db.from('presentations').select('id,state,source_format').eq('id',id).eq('presenter_id',presenterId).maybeSingle();
 if(readError)return NextResponse.json({error:'Unable to load presentation'},{status:503,headers});
 if(!item)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
 if(!['uploading','processing','ready','failed'].includes(item.state))return NextResponse.json({error:'Cannot replace an active or completed presentation. End it or ask Admin to clear it.'},{status:409,headers});
 // Mark clearing first: the presenter cannot start this session while its assets are being deleted.
 const {data:locked,error:lockError}=await db.from('presentations').update({state:'clearing'}).eq('id',id).eq('presenter_id',presenterId).eq('state',item.state).select('id').maybeSingle();
 if(lockError||!locked)return NextResponse.json({error:'Presentation changed; refresh and try again'},{status:409,headers});
 const {data:slides,error:slideLookupError}=await db.from('presentation_slides').select('image_path').eq('presentation_id',id);
 if(slideLookupError)return NextResponse.json({error:'Could not inspect slides; Admin cleanup required'},{status:503,headers});
 const {error:sourceError}=await db.storage.from('presentation-originals').remove([id+'/source.pdf',id+'/source.pptx']);
 if(sourceError)return NextResponse.json({error:'Could not remove original; Admin cleanup required'},{status:503,headers});
 if(slides?.length){
  const {error:assetError}=await db.storage.from('presentation-slides').remove(slides.map(x=>x.image_path));
  if(assetError)return NextResponse.json({error:'Could not remove slides; Admin cleanup required'},{status:503,headers});
 }
 const {error:deleteError}=await db.from('presentations').delete().eq('id',id).eq('presenter_id',presenterId).eq('state','clearing');
 if(deleteError)return NextResponse.json({error:'Could not release slot; Admin cleanup required'},{status:503,headers});
 return NextResponse.json({ok:true},{headers});
}
