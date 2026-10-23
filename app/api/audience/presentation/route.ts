import {NextRequest,NextResponse} from 'next/server';
import {stagingDb} from '../../../../lib/staging-presenter-server';
import {validAudienceKey} from '../../../../lib/staging-audience-auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(req:NextRequest){
 const db=stagingDb();if(!db)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const id=req.nextUrl.searchParams.get('id')||'',key=req.nextUrl.searchParams.get('key')||'';
 if(!validAudienceKey(id,key))return NextResponse.json({error:'Not authorized'},{status:401,headers});
 const {data:p,error:e}=await db.from('presentations').select('id,title,state,total_slides,current_slide').eq('id',id).maybeSingle();
 if(e||!p)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
 if(p.state!=='live')return NextResponse.json({state:p.state==='ended'?'ended':'waiting',slideUrl:null},{headers});
 const {data:slide,error:slideError}=await db.from('presentation_slides').select('image_path').eq('presentation_id',id).eq('slide_number',p.current_slide).maybeSingle();
 if(slideError||!slide)return NextResponse.json({error:'Slide unavailable'},{status:503,headers});
 const {data:signed,error:signError}=await db.storage.from('presentation-slides').createSignedUrl(slide.image_path,120);
 if(signError||!signed)return NextResponse.json({error:'Slide unavailable'},{status:503,headers});
 // Never return speaker notes, presenter tokens, or source PPTX.
 return NextResponse.json({state:'live',title:p.title,slide:p.current_slide,total:p.total_slides,slideUrl:signed.signedUrl},{headers});
}
