import {NextRequest,NextResponse} from 'next/server';
import {serverDb} from '../../../lib/supabase';
import {normalizeConfig,validHHMM} from '../../../lib/types';
export async function POST(req:NextRequest){const db=serverDb();if(!db||!process.env.ADMIN_EMAIL)return NextResponse.json({error:'Server admin not configured'},{status:503});
 const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return NextResponse.json({error:'Unauthorized'},{status:401});
 const {data:{user},error}=await db.auth.getUser(bearer.slice(7));if(error||!user||user.email?.toLowerCase()!==process.env.ADMIN_EMAIL.toLowerCase())return NextResponse.json({error:'Not authorized administrator'},{status:403});
 try{const body=await req.json();if(!['save','publish','loadPublishedFlyers','loadDraft','listUnusedFlyers','deleteUnusedFlyer'].includes(body.method))return NextResponse.json({error:'Unsupported operation'},{status:400});if(body.method==='listUnusedFlyers'||body.method==='deleteUnusedFlyer'){
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
 }if(body.method==='loadDraft'){const {data,error:readError}=await db.from('display_config').select('draft,published').eq('id',1).single();if(readError)throw readError;return NextResponse.json({draft:normalizeConfig(data?.draft),publishedFlyerCount:normalizeConfig(data?.published).flyers.length},{headers:{'Cache-Control':'no-store'}});}if(body.method==='loadPublishedFlyers'){const {data,error:readError}=await db.from('display_config').select('published').eq('id',1).single();if(readError)throw readError;return NextResponse.json({flyers:normalizeConfig(data?.published).flyers},{headers:{'Cache-Control':'no-store'}});}const config=normalizeConfig(body.config);if(config.prayer){const entries=[...Object.values(config.prayer.prayers).flatMap(t=>[t.start,t.iqamah]),config.prayer.jumuah1,config.prayer.jumuah2];if(entries.some(t=>t&&!validHHMM(t)))return NextResponse.json({error:'Invalid prayer time format'},{status:400});config.prayer={...config.prayer,source:'manual',verifiedAt:new Date().toISOString()}}
 // Always store draft and promote it to published only upon explicit publish.
 const patch=body.method==='publish'?{draft:config,published:config,published_at:new Date().toISOString()}:{draft:config};
 const {error:err}=await db.from('display_config').update(patch).eq('id',1);if(err)throw err;return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}
