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
 if(typeof code!=='string'||!/^[a-zA-Z0-9_-]{16}$/.test(code))return NextResponse.json({error:'Invalid presenter code'},{status:401,headers});
 // Persist failed-attempt state across serverless instances. IP is used only for throttling.
 const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim();
 const identifier=tokenDigest((ip||'unknown')+':presenter-code').slice(0,48);
 const now=new Date();
 const {data:attempt,error:attemptError}=await db.from('presenter_code_attempts').select('failures,blocked_until').eq('identifier',identifier).maybeSingle();
 if(attemptError)return NextResponse.json({error:'Code verification temporarily unavailable'},{status:503,headers});
 if(attempt?.blocked_until&&new Date(attempt.blocked_until)>now)return NextResponse.json({error:'Too many attempts. Try again later.'},{status:429,headers});
 const {data:matches,error}=await db.from('presenter_links').select('id,label').eq('code_hash',tokenDigest(code)).is('revoked_at',null).limit(1);
 if(error)return NextResponse.json({error:'Code verification unavailable'},{status:503,headers});
 if(!matches?.length){
   const failures=(attempt?.failures||0)+1;
   await db.from('presenter_code_attempts').upsert({identifier,failures:failures>=5?0:failures,blocked_until:failures>=5?new Date(now.getTime()+15*60_000).toISOString():null,updated_at:now.toISOString()});
   return NextResponse.json({error:'Incorrect or inactive presenter code'},{status:401,headers});
 }
 const presenter=matches[0];
 // Each successful entry rotates the bearer token, invalidating prior sessions.
 const token=randomBytes(32).toString('base64url');
 const {data:updated,error:updateError}=await db.from('presenter_links').update({token_hash:tokenDigest(token)}).eq('id',presenter.id).is('revoked_at',null).select('id').maybeSingle();
 if(updateError||!updated)return NextResponse.json({error:'Unable to activate presenter session'},{status:503,headers});
 await db.from('presenter_code_attempts').delete().eq('identifier',identifier);
 return NextResponse.json({token,presenter:{label:presenter.label}},{headers});
}
