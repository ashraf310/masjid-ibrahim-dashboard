import {NextRequest,NextResponse} from 'next/server';
import {serverDb} from '../../../lib/supabase';
import {normalizeConfig,validHHMM} from '../../../lib/types';
export async function POST(req:NextRequest){const db=serverDb();const adminEmail=process.env.STAGING_ADMIN_EMAIL||process.env.ADMIN_EMAIL;if(!db||!adminEmail)return NextResponse.json({error:'Server admin not configured'},{status:503});
 const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return NextResponse.json({error:'Unauthorized'},{status:401});
 const {data:{user},error}=await db.auth.getUser(bearer.slice(7));if(error||!user)return NextResponse.json({error:'Staging authentication failed. Check that your browser Supabase URL and SUPABASE_URL refer to the same project, and sign in again.',code:'STAGING_AUTH_MISMATCH'},{status:403});if(user.email?.trim().toLowerCase()!==adminEmail.trim().toLowerCase())return NextResponse.json({error:'Signed-in account is not the configured staging administrator. Verify STAGING_ADMIN_EMAIL and sign in again.',code:'STAGING_ADMIN_EMAIL_MISMATCH'},{status:403});
 try{const body=await req.json();if(!['save','publish','loadPublishedFlyers','loadDraft','listUnusedFlyers','deleteUnusedFlyer','publishD04'].includes(body.method))return NextResponse.json({error:'Unsupported operation'},{status:400});if(body.method==='publishD04'){
  const design=body.design;
  if(design!=='premium-01'&&design!=='blue-classic')return NextResponse.json({error:'Invalid D04 design'},{status:400});
  const {data:row,error:readError}=await db.from('display_config').select('draft,published').eq('id',1).single();
  if(readError)return NextResponse.json({error:'Cannot read staging display_config: '+readError.message,code:'DISPLAY_CONFIG_READ_FAILED'},{status:503});if(!row)return NextResponse.json({error:'Staging display_config has no row with id=1. Check that SUPABASE_URL points to the initialized staging database.',code:'DISPLAY_CONFIG_ROW_MISSING'},{status:503});
  const published={...normalizeConfig(row.published),d04Design:design,d04WhatsAppUrl:normalizeConfig(body.config).d04WhatsAppUrl,d04Ticker:normalizeConfig(body.config).d04Ticker};
  const draft={...normalizeConfig(row.draft),d04Design:design,d04WhatsAppUrl:published.d04WhatsAppUrl,d04Ticker:published.d04Ticker};
  const {data:saved,error:writeError}=await db.from('display_config').update({published,draft,published_at:new Date().toISOString()}).eq('id',1).select('published').single();
  if(writeError||!saved||normalizeConfig(saved.published).d04Design!==design)return NextResponse.json({error:'Unable to verify D04 design publication'},{status:503});
  return NextResponse.json({ok:true,design,publishedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }if(body.method==='listUnusedFlyers'||body.method==='deleteUnusedFlyer'){
 const {data:row,error:readError}=await db.from('display_config').select('draft,published').eq('id',1).single();if(readError)throw readError;
 const referenced=new Set([...normalizeConfig(row?.draft).flyers,...normalizeConfig(row?.published).flyers].map(f=>{try{const u=new URL(f.url);const marker='/storage/v1/object/public/flyers/';return u.pathname.includes(marker)?decodeURIComponent(u.pathname.split(marker)[1]):null}catch{return null}}).filter((p):p is string=>Boolean(p)));
 const bucket=db.storage.from('flyers');
 if(body.method==='deleteUnusedFlyer'){
  const path=body.path;
  if(typeof path!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(path))return NextResponse.json({error:'Invalid file name'},{status:400});
  if(referenced.has(path))return NextResponse.json({error:'File is still used in draft or published TV. Remove and publish first.'},{status:409});
  const {data:matches,error:listError}=await bucket.list('',{search:path,limit:100});if(listError)throw listError;
  if(!matches?.some(f=>f.name===path))return NextResponse.json({error:'File not found in storage'},{status:404});
  const {error:deleteError}=await bucket.remove([path]);if(deleteError)throw deleteError;
  return NextResponse.json({ok:true});
 }
 const {data:objects,error:listError}=await bucket.list('',{limit:1000,sortBy:{column:'created_at',order:'desc'}});if(listError)throw listError;
 return NextResponse.json({files:(objects||[]).filter(f=>f.name&&!referenced.has(f.name)).map(f=>({name:f.name,createdAt:f.created_at}))},{headers:{'Cache-Control':'no-store'}});
 }if(body.method==='loadDraft'){const {data,error:readError}=await db.from('display_config').select('draft,published').eq('id',1).single();if(readError)return NextResponse.json({error:'Cannot load staging display_config: '+readError.message,code:'DISPLAY_CONFIG_READ_FAILED'},{status:503});return NextResponse.json({draft:normalizeConfig(data?.draft),publishedFlyerCount:normalizeConfig(data?.published).flyers.length},{headers:{'Cache-Control':'no-store'}});}if(body.method==='loadPublishedFlyers'){const {data,error:readError}=await db.from('display_config').select('published').eq('id',1).single();if(readError)throw readError;return NextResponse.json({flyers:normalizeConfig(data?.published).flyers},{headers:{'Cache-Control':'no-store'}});}const config=normalizeConfig(body.config);if(config.prayer){const entries=[...Object.values(config.prayer.prayers).flatMap(t=>[t.start,t.iqamah]),config.prayer.jumuah1,config.prayer.jumuah2];if(entries.some(t=>t&&!validHHMM(t)))return NextResponse.json({error:'Invalid prayer time format'},{status:400});config.prayer={...config.prayer,source:'manual',verifiedAt:new Date().toISOString()}}
 // On Publish, delete files removed from the live slideshow, never on an unsaved draft edit.
 // Only our own top-level flyer assets are eligible; third-party URLs are never touched.
 const ownedPath=(url:string)=>{try{
  const u=new URL(url);const base=new URL(process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const prefix='/storage/v1/object/public/flyers/';
  if(u.origin!==base.origin||!u.pathname.startsWith(prefix))return null;
  const path=decodeURIComponent(u.pathname.slice(prefix.length));
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(path)?path:null;
 }catch{return null}};
 let toDelete:string[]=[];
 if(body.method==='publish'){
  const {data:previous,error:readError}=await db.from('display_config').select('published').eq('id',1).single();
  if(readError)throw readError;
  const oldFiles=new Set(normalizeConfig(previous?.published).flyers.map(f=>ownedPath(f.url)).filter((f):f is string=>!!f));
  const keep=new Set(config.flyers.map(f=>ownedPath(f.url)).filter((f):f is string=>!!f));
  toDelete=[...oldFiles].filter(f=>!keep.has(f));
 }
 // Always store draft and promote it to published only upon explicit publish.
 const patch=body.method==='publish'?{draft:config,published:config,published_at:new Date().toISOString()}:{draft:config};
 const {error:err}=await db.from('display_config').update(patch).eq('id',1);if(err)throw err;
 let deletionWarning:string|null=null;
 if(toDelete.length){const {error:storageError}=await db.storage.from('flyers').remove(toDelete);if(storageError)deletionWarning=storageError.message;}
 return NextResponse.json({ok:true,deletedFiles:deletionWarning?0:toDelete.length,deletionWarning});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}
