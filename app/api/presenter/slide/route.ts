import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db||process.env.ENABLE_STAGING_PRESENTER_UPLOADS!=='true')return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:owner,error:authError}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(authError||!owner)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const id=req.headers.get('x-presentation-id')||'';
 const number=Number(req.headers.get('x-slide-number'));
 const length=Number(req.headers.get('content-length'));
 if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isInteger(number)||number<0||number>=300||!Number.isFinite(length)||length<100||length>2*1024*1024||req.headers.get('content-type')!=='image/jpeg')
 return NextResponse.json({error:'Invalid slide details; each JPEG must be below 2 MB'},{status:400,headers});
 const {data:p,error:readError}=await db.from('presentations').select('id,state').eq('id',id).eq('presenter_id',owner.id).maybeSingle();
 if(readError||!p)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
 if(p.state!=='processing'&&p.state!=='ready')return NextResponse.json({error:'Presentation cannot accept slides in this state'},{status:409,headers});
 const bytes=new Uint8Array(await req.arrayBuffer());
 if(bytes.length!==length||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)
 return NextResponse.json({error:'Invalid JPEG'},{status:400,headers});
 const path=id+'/slide-'+String(number).padStart(4,'0')+'.jpg';
 const {error:uploadError}=await db.storage.from('presentation-slides').upload(path,bytes,{contentType:'image/jpeg',upsert:true});
 if(uploadError)return NextResponse.json({error:'Unable to store slide'},{status:503,headers});
 const {error:recordError}=await db.from('presentation_slides').upsert({presentation_id:id,slide_number:number,image_path:path},{onConflict:'presentation_id,slide_number'});
 if(recordError)return NextResponse.json({error:'Unable to register slide'},{status:503,headers});
 return NextResponse.json({ok:true,slide:number},{headers});
}
