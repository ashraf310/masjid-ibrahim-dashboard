import {randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {stagingDb,tokenDigest} from '../../../../lib/staging-presenter-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'};
export async function POST(req:NextRequest){
 const db=stagingDb();if(!db)return NextResponse.json({error:'Presenter service unavailable'},{status:503,headers});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 let input:unknown;try{input=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers})}
 const code=(input as {code?:unknown})?.code;
 if(typeof code!=='string'||!/^\d{4}$/.test(code))return NextResponse.json({error:'Invalid presenter code'},{status:401,headers});
 const {data:matches,error}=await db.from('presenter_links').select('id,label').eq('code_hash',tokenDigest(code)).is('revoked_at',null).limit(1);
 if(error)return NextResponse.json({error:'Code verification unavailable'},{status:503,headers});
 if(!matches?.length)return NextResponse.json({error:'Incorrect or inactive presenter code'},{status:401,headers});
 const presenter=matches[0];
 // Each successful entry rotates the bearer token, invalidating prior sessions.
 const token=randomBytes(32).toString('base64url');
 const {data:updated,error:updateError}=await db.from('presenter_links').update({token_hash:tokenDigest(token)}).eq('id',presenter.id).is('revoked_at',null).select('id').maybeSingle();
 if(updateError||!updated)return NextResponse.json({error:'Unable to activate presenter session'},{status:503,headers});
 return NextResponse.json({token,presenter:{label:presenter.label}},{headers});
}
