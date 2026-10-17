import {PRAYERS,PrayerSchedule,PrayerName,validHHMM} from './types';
const WIDGET='https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=adJqxqAk';
const clean=(s:string)=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const dateISO=(s:string)=>{const m=s.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/i);if(!m)return null;const dt=new Date(`${m[1]} ${m[2]}, ${m[3]} 12:00:00 GMT`);return Number.isNaN(dt.getTime())?null:dt.toISOString().slice(0,10)};
const hhmm=(s:string)=>{const m=clean(s).match(/\b(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)\b/i);if(!m)return '';let h=Number(m[1])%12;if(m[3].toUpperCase()==='PM')h+=12;return `${String(h).padStart(2,'0')}:${m[2]}`};
export function parseMasjidAl(html:string):PrayerSchedule[]{
 const headers=new Map<number,{date:string;hijri:string}>();
 for(const match of html.matchAll(/<div\b[^>]*class=["'][^"']*carousel-item[^"']*["'][^>]*id=["']top_(\d+)["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)){
  const heading=match[2].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  const hijri=match[2].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const date=heading?dateISO(clean(heading[1])):null;
  if(date&&hijri)headers.set(Number(match[1]),{date,hijri:clean(hijri[1])});
 }
 const results:PrayerSchedule[]=[];
 for(const match of html.matchAll(/<div\b[^>]*class=["'][^"']*table_div[^"']*["'][^>]*id=["']table_div_(\d+)["'][^>]*>([\s\S]*?)(?=<div\b[^>]*class=["'][^"']*table_div[^"']*["'][^>]*id=["']table_div_\d+["']|<\/div>\s*<!-- Optional JavaScript|<\/body>)/gi)){
  const header=headers.get(Number(match[1]));if(!header)continue;
  const table=match[2].match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);if(!table)continue;
  const prayers={} as PrayerSchedule['prayers'];
  for(const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
   const cells=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));
   if(cells.length<3)continue;
   const key=PRAYERS.find(n=>new RegExp(`\\b${n}\\b`,'i').test(cells[0])) as PrayerName|undefined;
   if(!key)continue;
   prayers[key]={start:hhmm(cells[1]),iqamah:hhmm(cells[2])};
  }
  if(PRAYERS.some(n=>!prayers[n]||!validHHMM(prayers[n].start)||!validHHMM(prayers[n].iqamah)))continue;
  const jumuah=new Map<number,string>();
  const list=match[2].match(/<ul\b[^>]*class=["'][^"']*testing-sec[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
  if(list)for(const li of list[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)){
   const label=clean(li[1]).match(/Jumuah\s*([12])/i);
   const time=hhmm(li[1]);if(label&&time)jumuah.set(Number(label[1]),time);
  }
  if(jumuah.size!==2)continue;
  const values=PRAYERS.map(n=>prayers[n].start).map(t=>Number(t.slice(0,2))*60+Number(t.slice(3)));
  if(values.some((n,i)=>i>0&&n<=values[i-1]))continue;
  results.push({date:header.date,hijri:header.hijri,prayers,jumuah1:jumuah.get(1)!,jumuah2:jumuah.get(2)!,source:'masjidal',verifiedAt:new Date().toISOString()});
 }
 return [...new Map(results.map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export async function fetchMasjidAl():Promise<PrayerSchedule[]>{
 const response=await fetch(WIDGET,{next:{revalidate:900},signal:AbortSignal.timeout(9000),headers:{Accept:'text/html'}});
 if(!response.ok)throw Error(`MasjidAl HTTP ${response.status}`);
 const html=await response.text();
 if(html.length>300_000)throw Error('MasjidAl widget unexpectedly large');
 const schedules=parseMasjidAl(html);
 if(schedules.length<1)throw Error('MasjidAl structure or values failed validation');
 return schedules;
}
