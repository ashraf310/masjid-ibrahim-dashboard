import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
import {audienceKey} from '../../../../lib/staging-audience-auth';
import {deletePresentationAssets} from '../../../../lib/delete-staging-presentation';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db||process.env.ENABLE_STAGING_PRESENTER_UPLOADS!=='true')return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:owner,error:authError}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(authError||!owner)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const b=input as {presentationId?:unknown;action?:unknown;total?:unknown;slide?:unknown};
 const id=b?.presentationId;
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Invalid presentation'},{status:400,headers});
 const {data:p,error:e}=await db.from('presentations').select('id,state,total_slides,current_slide').eq('id',id).eq('presenter_id',owner.id).maybeSingle();
 if(e||!p)return NextResponse.json({error:'Presentation not found'},{status:404,headers});
 if(b.action==='link'){
  if(!['ready','live'].includes(p.state))return NextResponse.json({error:'Presentation is '+p.state+'. Clear an ended presentation or prepare new slides first.'},{status:409,headers});
 }else if(b.action==='ready'){
  const total=b.total;
  if((p.state!=='processing'&&p.state!=='ready')||typeof total!=='number'||!Number.isInteger(total)||total<1||total>300)return NextResponse.json({error:'Invalid preparation'},{status:409,headers});
  const {data:slides,error:listError}=await db.from('presentation_slides').select('slide_number').eq('presentation_id',id);
  if(listError||!slides||slides.length!==total||slides.some((s,i)=>s.slide_number!==i)) {
   const ordered=(slides||[]).map(s=>s.slide_number).sort((a,b)=>a-b);
   if(listError||ordered.length!==total||ordered.some((n,i)=>n!==i))return NextResponse.json({error:'Slides missing or out of order'},{status:409,headers});
  }
  const {error:updateError}=await db.from('presentations').update({state:'ready',total_slides:total,current_slide:0}).eq('id',id).in('state',['processing','ready']);
  if(updateError)return NextResponse.json({error:'Unable to mark presentation ready'},{status:503,headers});
 }else if(b.action==='start'){
  if(p.state!=='ready'||p.total_slides<1)return NextResponse.json({error:'Prepare all slides before starting'},{status:409,headers});
  const {error:changeError}=await db.from('presentations').update({state:'live',started_at:new Date().toISOString(),current_slide:0}).eq('id',id).eq('state','ready');
  if(changeError)return NextResponse.json({error:'Unable to start'},{status:503,headers});
 }else if(b.action==='advance'){
  const next=b.slide;
  if(p.state!=='live'||typeof next!=='number'||!Number.isInteger(next)||next<0||next>=p.total_slides)return NextResponse.json({error:'Invalid slide change'},{status:409,headers});
  const {error:changeError}=await db.from('presentations').update({current_slide:next,presenter_last_seen_at:new Date().toISOString()}).eq('id',id).eq('state','live');
  if(changeError)return NextResponse.json({error:'Unable to change slide'},{status:503,headers});
 }else if(b.action==='end'){
  if(p.state!=='live')return NextResponse.json({error:'Presentation not live'},{status:409,headers});
  const {error:changeError}=await db.from('presentations').update({state:'ended',ended_at:new Date().toISOString()}).eq('id',id).eq('state','live');
  if(changeError)return NextResponse.json({error:'Unable to end'},{status:503,headers});
  try{await deletePresentationAssets(db,id)}catch(e){return NextResponse.json({error:'Presentation ended, but cleanup did not finish. Admin can clear remaining assets. '+(e instanceof Error?e.message:'')},{status:503,headers})}
  return NextResponse.json({ok:true,cleared:true},{headers});
 }else return NextResponse.json({error:'Invalid action'},{status:400,headers});
 const key=audienceKey(id);
 return NextResponse.json({ok:true,audiencePath:'/audience-staging?id='+encodeURIComponent(id)+'&key='+encodeURIComponent(key)},{headers});
}
