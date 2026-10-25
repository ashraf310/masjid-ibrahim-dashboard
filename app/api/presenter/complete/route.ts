import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db||process.env.ENABLE_STAGING_PRESENTER_UPLOADS!=='true')return NextResponse.json({error:'Upload completion unavailable'},{status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:p,error:a}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(a||!p)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers})}
 const id=(input as {presentationId?:unknown})?.presentationId;
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid presentation ID'},{status:400,headers});
 const {data:item,error:e}=await db.from('presentations').select('id,source_format,state').eq('id',id).eq('presenter_id',p.id).maybeSingle();
 if(e||!item)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
 if(item.state!=='uploading')return NextResponse.json({error:'Presentation no longer uploading'},{status:409,headers});
 const path=id+'/source.'+item.source_format;
 const {data:objects,error:listError}=await db.storage.from('presentation-originals').list(id,{limit:20});
 if(listError)return NextResponse.json({error:'Unable to verify upload'},{status:503,headers});
 const object=objects?.find(f=>f.name==='source.'+item.source_format);
 if(!object||!object.metadata?.size)return NextResponse.json({error:'Upload not found or empty'},{status:409,headers});
 const {error:updateError}=await db.from('presentations').update({state:'processing',source_path:path}).eq('id',id).eq('state','uploading');
 if(updateError)return NextResponse.json({error:'Cannot confirm uploaded file'},{status:503,headers});
 return NextResponse.json({ok:true,state:'processing',message:'Original file stored privately. Slide conversion is not yet available.'},{headers});
}
