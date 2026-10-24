import {NextRequest,NextResponse} from 'next/server';
import {stagingDbStatus} from '../../../../lib/staging-presenter-server';
export const dynamic='force-dynamic';export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
async function auth(req:NextRequest){
 const {db}=stagingDbStatus();if(!db)return null;
 const email=process.env.STAGING_ADMIN_EMAIL?.trim().toLowerCase();
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!email||!token)return null;
 const {data,error}=await db.auth.getUser(token);
 return !error&&data.user?.email?.toLowerCase()===email?db:null;
}
export async function GET(req:NextRequest){
 const db=await auth(req);if(!db)return NextResponse.json({error:'Not authorized'},{status:403,headers});
 const {data,error}=await db.from('tv_devices').select('id,location,default_dashboard,follow_d02,d05_override,enabled,paired_at,last_seen_at').order('id');
 if(error)return NextResponse.json({error:'Run the staging TV migration first'},{status:503,headers});
 return NextResponse.json({devices:data},{headers});
}
export async function POST(req:NextRequest){
 const db=await auth(req);if(!db)return NextResponse.json({error:'Not authorized'},{status:403,headers});
 let input:{id?:string;default_dashboard?:string;follow_d02?:boolean;d05_override?:boolean}={};
 try{input=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers})}
 if(!/^TV0[1-6]$/.test(input.id||''))return NextResponse.json({error:'Invalid TV ID'},{status:400,headers});
 if(!['D01','D04','CAMERA','UNASSIGNED'].includes(input.default_dashboard||''))return NextResponse.json({error:'Invalid dashboard'},{status:400,headers});
 if(typeof input.follow_d02!=='boolean'||typeof input.d05_override!=='boolean')return NextResponse.json({error:'Invalid options'},{status:400,headers});
 if(input.id==='TV04'&&(input.default_dashboard!=='CAMERA'||input.follow_d02||input.d05_override))return NextResponse.json({error:'TV04 camera feed must remain uninterrupted'},{status:409,headers});
 if(input.id==='TV06')return NextResponse.json({error:'TV06 is out of scope until activated'},{status:409,headers});
 const {error}=await db.from('tv_devices').update({default_dashboard:input.default_dashboard,follow_d02:input.follow_d02,d05_override:input.d05_override,updated_at:new Date().toISOString()}).eq('id',input.id);
 if(error)return NextResponse.json({error:'Unable to save TV configuration'},{status:503,headers});
 return NextResponse.json({ok:true,note:'Configuration saved in staging database; physical TV pairing is not active yet.'},{headers});
}