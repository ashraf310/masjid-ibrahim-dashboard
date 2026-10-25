import {NextRequest,NextResponse} from 'next/server';
import {bearerToken,stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
import {MAX_PRESENTATION_BYTES} from '../../../../lib/presentation-types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:NextRequest){
 const db=stagingDb();
 // Explicit opt-in after security review. No upload is enabled by adding a secret alone.
 if(!db||process.env.ENABLE_STAGING_PRESENTER_UPLOADS!=='true')return NextResponse.json({error:'Upload setup is not enabled'}, {status:503,headers});
 const token=bearerToken(req.headers.get('authorization'));
 if(!token)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data:presenter,error:authError}=await db.from('presenter_links').select('id,revoked_at').eq('token_hash',tokenDigest(token)).maybeSingle();
 if(authError)return NextResponse.json({error:'Authorization temporarily unavailable'},{status:503,headers});
 if(!presenter||presenter.revoked_at)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let body:unknown;
 try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers})}
 const b=body as Record<string,unknown>|null;
 const title=typeof b?.title==='string'?b.title.trim():'';
 const format=b?.format;
 const bytes=b?.bytes;
 if(title.length<1||title.length>180||(format!=='pptx'&&format!=='pdf')||typeof bytes!=='number'||!Number.isInteger(bytes)||bytes<1||bytes>MAX_PRESENTATION_BYTES)return NextResponse.json({error:'Invalid presentation details'},{status:400,headers});
 const {data:created,error:createError}=await db.from('presentations').insert({presenter_id:presenter.id,title,source_format:format,state:'uploading',cleanup_due_at:new Date(Date.now()+24*3600*1000).toISOString()}).select('id').single();
 if(createError){
  if(createError.code==='23505')return NextResponse.json({error:'Another presentation already occupies the system. End and clear it first.'},{status:409,headers});
  return NextResponse.json({error:'Unable to reserve presentation slot'},{status:503,headers});
 }
 const path=created.id+'/source.'+format;
 const {data:signed,error:signError}=await db.storage.from('presentation-originals').createSignedUploadUrl(path);
 if(signError||!signed){await db.from('presentations').delete().eq('id',created.id);return NextResponse.json({error:'Cannot authorize file upload'},{status:503,headers})}
 return NextResponse.json({presentationId:created.id,upload:{path,token:signed.token,signedUrl:signed.signedUrl},maxBytes:MAX_PRESENTATION_BYTES},{status:201,headers});
}
