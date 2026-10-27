import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const repository='ashraf310/masjid-ibrahim-dashboard';
const files={
 production:{branch:'main',filename:'masjid-ibrahim-tv-production.apk'},
 staging:{branch:'development/multiscreen-presenter-v1',filename:'masjid-ibrahim-tv-staging.apk'}
} as const;

async function resolve(req:NextRequest,head=false){
 const channel=req.nextUrl.searchParams.get('channel');
 if(channel!=='production'&&channel!=='staging')return NextResponse.json({error:'Invalid APK channel'},{status:400,headers:{'Cache-Control':'no-store'}});
 // Never allow a staging URL to serve the production APK or vice versa.
 const project=process.env.VERCEL_PROJECT_ID;
 const allowed=project==='prj_nfxbmx6pipe5y7bCvS0QmhUL66Cy'?'production':project==='prj_TX0ZefGHlJUidnjfSMYCXIjm6NuZ'?'staging':null;
 if(allowed&&channel!==allowed)return NextResponse.json({error:'APK channel not available from this environment'},{status:404,headers:{'Cache-Control':'no-store'}});
 const {branch,filename}=files[channel];
 const api='https://api.github.com/repos/'+repository+'/contents/public/downloads/'+filename+'?ref='+encodeURIComponent(branch);
 try{
  const response=await fetch(api,{cache:'no-store',headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(response.status===404)return NextResponse.json({error:'APK not yet uploaded to GitHub'},{status:404,headers:{'Cache-Control':'no-store'}});
  if(!response.ok)return NextResponse.json({error:'Unable to verify the current GitHub APK'},{status:503,headers:{'Cache-Control':'no-store'}});
  const file=await response.json() as {type?:string;name?:string;download_url?:string|null;size?:number};
  if(file.type!=='file'||file.name!==filename||!file.download_url||!file.download_url.startsWith('https://raw.githubusercontent.com/'+repository+'/'))return NextResponse.json({error:'GitHub returned an unexpected APK reference'},{status:502,headers:{'Cache-Control':'no-store'}});
  if(head)return new NextResponse(null,{status:200,headers:{'Cache-Control':'no-store','X-APK-Source':'github-main-or-development','X-APK-Size':String(file.size||0)}});
  return NextResponse.redirect(file.download_url,{status:307,headers:{'Cache-Control':'no-store, no-cache, max-age=0','Pragma':'no-cache'}});
 }catch{return NextResponse.json({error:'GitHub APK lookup unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
export async function GET(req:NextRequest){return resolve(req);}
export async function HEAD(req:NextRequest){return resolve(req,true);}
