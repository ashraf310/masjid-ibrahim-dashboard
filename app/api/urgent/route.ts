import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/supabase';
export const dynamic='force-dynamic';
export async function GET(){
 const db=serverDb();
 if(!db)return NextResponse.json({enabled:false,text:'',error:'Unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const {data,error}=await db.from('display_config').select('published').eq('id',1).single();
 if(error)return NextResponse.json({enabled:false,text:'',error:'Unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const published=data?.published as {urgentEnabled?:boolean;urgentText?:string}|null;
 const text=typeof published?.urgentText==='string'?published.urgentText.slice(0,280):'';
 return NextResponse.json({enabled:Boolean(published?.urgentEnabled&&text.trim()),text},{headers:{'Cache-Control':'no-store'}});
}
