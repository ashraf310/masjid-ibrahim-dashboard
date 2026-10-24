import {NextRequest,NextResponse} from 'next/server';
import {stagingDb,tokenDigest} from '../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const bad=(message:string,status=400)=>NextResponse.json({error:message},{status,headers});
async function authorize(req:NextRequest,presentationId:string){
 const db=stagingDb();if(!db)return null;
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!token||!/^[a-zA-Z0-9_-]{32,128}$/.test(token))return null;
 const {data}=await db.from('presenter_links').select('id').eq('token_hash',tokenDigest(token)).is('revoked_at',null).maybeSingle();
 if(!data)return null;
 const {data:p}=await db.from('presentations').select('id').eq('id',presentationId).eq('presenter_id',data.id).maybeSingle();
 return p?db:null;
}
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('presentationId')||'';
 if(!/^[0-9a-f-]{36}$/i.test(id))return bad('Invalid presentation');
 const db=await authorize(req,id);if(!db)return bad('Unauthorized',401);
 const {data,error}=await db.from('presentation_questions').select('id,question,status,created_at').eq('presentation_id',id).order('created_at',{ascending:false}).limit(100);
 if(error)return bad('Q&A tables not installed in staging',503);
 return NextResponse.json({questions:data||[]},{headers});
}
export async function POST(req:NextRequest){
 let body:{presentationId?:string;questionId?:string;status?:string}={};
 try{body=await req.json()}catch{return bad('Invalid JSON')}
 const id=body.presentationId||'';
 if(!/^[0-9a-f-]{36}$/i.test(id))return bad('Invalid presentation');
 const db=await authorize(req,id);if(!db)return bad('Unauthorized',401);
 if(!/^[0-9a-f-]{36}$/i.test(body.questionId||'')||!['answered','hidden','new'].includes(body.status||''))return bad('Invalid moderation');
 const {error}=await db.from('presentation_questions').update({status:body.status}).eq('id',body.questionId).eq('presentation_id',id);
 if(error)return bad('Unable to moderate question',503);
 return NextResponse.json({ok:true},{headers});
}