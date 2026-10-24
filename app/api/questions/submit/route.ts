import {NextRequest,NextResponse} from 'next/server';
import {stagingDb} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db)return NextResponse.json({error:'Q&A unavailable'},{status:503,headers});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid question'},{status:400,headers})}
 const question=typeof (body as {question?:unknown})?.question==='string'?(body as {question:string}).question.trim():'';
 if(question.length<4||question.length>500||/[<>]/.test(question))return NextResponse.json({error:'Enter 4–500 characters without markup'},{status:400,headers});
 const {data:live,error:lookup}=await db.from('presentations').select('id').eq('state','live').limit(1).maybeSingle();
 if(lookup||!live)return NextResponse.json({error:'Q&A is only available during a live presentation'},{status:409,headers});
 // All submissions start in moderation. The question never appears on a TV automatically.
 const {error}=await db.from('presentation_questions').insert({presentation_id:live.id,question,status:'new'});
 if(error)return NextResponse.json({error:'Q&A is not yet configured'},{status:503,headers});
 return NextResponse.json({ok:true,message:'Question submitted for presenter review.'},{status:201,headers});
}