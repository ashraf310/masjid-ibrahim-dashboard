import {NextRequest,NextResponse} from 'next/server';
import {stagingDb} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
/** Fixed staging audience URL. Exposes only the currently LIVE slide; never notes or PPTX. */
export async function GET(req:NextRequest){
 const db=stagingDb();
 if(!db)return NextResponse.json({error:'Audience unavailable'},{status:503,headers});
 const {data:settings}=await db.from('display_config').select('published').eq('id',1).maybeSingle();
 const qaEnabled=settings?.published?.d02QaEnabled!==false;
 const qaUrl=typeof settings?.published?.d02QaUrl==='string'?settings.published.d02QaUrl:new URL('/q',req.url).toString();
 const {data:active,error:e}=await db.from('presentations').select('id,title,current_slide,total_slides').eq('state','live').limit(1).maybeSingle();
 if(e)return NextResponse.json({error:'Cannot load live state'},{status:503,headers});
 if(!active)return NextResponse.json({state:'waiting',slideUrl:null},{headers});
 const {data:slide,error:slideError}=await db.from('presentation_slides').select('image_path').eq('presentation_id',active.id).eq('slide_number',active.current_slide).maybeSingle();
 if(slideError||!slide)return NextResponse.json({error:'Slide unavailable'},{status:503,headers});
 const {data:signed,error:signError}=await db.storage.from('presentation-slides').createSignedUrl(slide.image_path,60);
 if(signError||!signed)return NextResponse.json({error:'Slide unavailable'},{status:503,headers});
 return NextResponse.json({qaEnabled,qaUrl,state:'live',presentationId:active.id,title:active.title,slide:active.current_slide,total:active.total_slides,slideUrl:signed.signedUrl},{headers});
}
