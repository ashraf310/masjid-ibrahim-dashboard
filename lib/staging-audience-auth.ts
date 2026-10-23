import 'server-only';
import {createHmac,timingSafeEqual} from 'node:crypto';
export function audienceKey(id:string){
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
 if(!secret)throw Error('Audience access not configured');
 return createHmac('sha256',secret).update('masjid-staging-audience-v1:'+id).digest('base64url');
}
export function validAudienceKey(id:string, key:string){
 if(!/^[0-9a-f-]{36}$/i.test(id)||! /^[a-zA-Z0-9_-]{43}$/.test(key))return false;
 const expected=Buffer.from(audienceKey(id),'utf8'),given=Buffer.from(key,'utf8');
 return given.length===expected.length&&timingSafeEqual(given,expected);
}
