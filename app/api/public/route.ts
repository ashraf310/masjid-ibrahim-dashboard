import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/supabase';
import {DEFAULT_CONFIG,normalizeConfig} from '../../../lib/types';
import {fetchMasjidAl} from '../../../lib/masjidal';
export const dynamic='force-dynamic';
const springDay=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(name:string)=>parts.find(p=>p.type===name)?.value||'';return `${get('year')}-${get('month')}-${get('day')}`;};
export async function GET(){
 const db=serverDb();let config=DEFAULT_CONFIG;let configured=false;
 if(db){const {data,error}=await db.from('display_config').select('published').eq('id',1).single();config=normalizeConfig(error?DEFAULT_CONFIG:data?.published);configured=true;}
 const today=springDay();const tomorrow=new Date(Date.parse(today+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 let tomorrowPrayer=null as Awaited<ReturnType<typeof fetchMasjidAl>>[number]|null;
 let prayerStatus='manual';let syncError:string|null=null;
 if(config.prayer?.date!==today){
  try{
   const schedules=await fetchMasjidAl();
   const latest=schedules.find(s=>s.date===today);tomorrowPrayer=schedules.find(s=>s.date===tomorrow)||null;
   if(latest){config={...config,prayer:latest};prayerStatus='masjidal';}
   else{config={...config,prayer:null};prayerStatus='unavailable';syncError='Source has no timetable for today';}
  }catch(e){config={...config,prayer:null};prayerStatus='unavailable';syncError=e instanceof Error?e.message:'Source unavailable';}
 }
 if(!tomorrowPrayer){try{const schedules=await fetchMasjidAl();tomorrowPrayer=schedules.find(s=>s.date===tomorrow)||null;}catch{}}
 return NextResponse.json({config,configured,prayerStatus,syncError,tomorrowPrayer},{headers:{'Cache-Control':'no-store'}});
}
