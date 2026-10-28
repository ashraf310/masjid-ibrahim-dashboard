export type PrayerName = 'Fajr'|'Dhuhr'|'Asr'|'Maghrib'|'Isha';
export type Timing = {start:string; iqamah:string};
export type PrayerSchedule = {date:string; hijri:string; prayers:Record<PrayerName,Timing>; sunrise?:string; jumuah1:string; jumuah2:string; source:'manual'|'masjidal'; verifiedAt:string};
export type Flyer = {id:string; title:string; url:string; enabled:boolean; duration:number};
export type Config = {heading:string; subtitle:string; donationUrl:string; ticker:string; urgentEnabled:boolean; urgentText:string; flyers:Flyer[]; prayer:PrayerSchedule|null; d04Design?:string;d04WhatsAppUrl?:string;d04Ticker?:string;updatedAt?:string};
export const DONATE = 'https://payments.madinaapps.com/masjidibrahimtx';
export const DEFAULT_CONFIG:Config = {heading:'SUSTAIN OUR MASJID',subtitle:'Help Build Our Future',donationUrl:DONATE,ticker:'Community Announcements     •     Advertising & Sponsorship Opportunities Available     •     Support Masjid Ibrahim',urgentEnabled:false,urgentText:'',flyers:[],prayer:null,d04Design:'premium-01',d04WhatsAppUrl:'',d04Ticker:''};
export const PRAYERS:PrayerName[] = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
export function validHHMM(t:string){return /^([01]?\d|2[0-3]):[0-5]\d$/.test(t)}
export function normalizeConfig(value:unknown):Config {
 const obj = (value && typeof value==='object' ? value : {}) as Partial<Config>;
 const flyers = Array.isArray(obj.flyers) ? obj.flyers.filter((f):f is Flyer => Boolean(f&&typeof f.id==='string'&&typeof f.url==='string'&&/^https:\/\//.test(f.url))).slice(0,100).map(f=>({...f,duration:Math.min(60,Math.max(5,Number(f.duration)||10)),enabled:Boolean(f.enabled)})) : [];
 const prayer = obj.prayer && typeof obj.prayer.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.prayer.date) ? obj.prayer : null;
 return {...DEFAULT_CONFIG,heading:String(obj.heading??DEFAULT_CONFIG.heading).slice(0,120),subtitle:String(obj.subtitle??DEFAULT_CONFIG.subtitle).slice(0,180),donationUrl:/^https:\/\//.test(obj.donationUrl||'')?String(obj.donationUrl):DONATE,ticker:String(obj.ticker??DEFAULT_CONFIG.ticker).slice(0,1200),urgentEnabled:Boolean(obj.urgentEnabled),urgentText:String(obj.urgentText||'').slice(0,280),flyers,prayer,d04Design:obj.d04Design==='premium-03'?'premium-03':obj.d04Design==='blue-classic'||obj.d04Design==='cream-gold'?'blue-classic':'premium-01',d04Ticker:typeof obj.d04Ticker==='string'?obj.d04Ticker.slice(0,1200):'',d04WhatsAppUrl:typeof obj.d04WhatsAppUrl==='string'&&/^https:\/\/(chat\.whatsapp\.com|whatsapp\.com|wa\.me)\//.test(obj.d04WhatsAppUrl)?obj.d04WhatsAppUrl.slice(0,500):''};
}
