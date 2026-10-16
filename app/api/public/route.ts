import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/supabase';
import {DEFAULT_CONFIG,normalizeConfig} from '../../../lib/types';
export const dynamic='force-dynamic';
export async function GET(){const db=serverDb();if(!db)return NextResponse.json({config:DEFAULT_CONFIG,configured:false},{headers:{'Cache-Control':'no-store'}});
 const {data,error}=await db.from('display_config').select('published').eq('id',1).single();
 return NextResponse.json({config:normalizeConfig(error?DEFAULT_CONFIG:data?.published),configured:true},{headers:{'Cache-Control':'no-store'}});
}
