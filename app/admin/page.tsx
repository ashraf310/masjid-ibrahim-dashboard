'use client';
import {useEffect,useState} from 'react';
import {browserDb} from '../../lib/supabase';
import Dashboard from '../../components/Dashboard';
import {Config,DEFAULT_CONFIG,Flyer,normalizeConfig,PRAYERS,PrayerSchedule,validHHMM} from '../../lib/types';
import type {User} from '@supabase/supabase-js';
async function optimizeFlyer(file:File):Promise<File>{
 // Keep originals that are already small; shrink camera-resolution posters for TV and thumbnails.
 if(file.size<1_200_000)return file;
 let bitmap:ImageBitmap|undefined;
 try{
  bitmap=await createImageBitmap(file);
  const maxEdge=1920;
  const scale=Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height));
  const width=Math.max(1,Math.round(bitmap.width*scale));
  const height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)return file;
  ctx.drawImage(bitmap,0,0,width,height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.84));
  return blob&&blob.size<file.size?new File([blob],file.name.replace(/\.[^.]+$/, '')+'.webp',{type:'image/webp'}):file;
 }catch{return file;}finally{bitmap?.close();}
}
const initialPrayer=():PrayerSchedule=>({date:(()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const get=(k:string)=>parts.find(x=>x.type===k)?.value||''; return `${get('year')}-${get('month')}-${get('day')}`})(),hijri:'',prayers:{Fajr:{start:'',iqamah:''},Dhuhr:{start:'',iqamah:''},Asr:{start:'',iqamah:''},Maghrib:{start:'',iqamah:''},Isha:{start:'',iqamah:''}},jumuah1:'',jumuah2:'',source:'manual',verifiedAt:''});
export default function Admin(){const db=browserDb();const [user,setUser]=useState<User|null>(null);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [cfg,setCfg]=useState<Config>(DEFAULT_CONFIG);const [tab,setTab]=useState('flyers');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [initialized,setInitialized]=useState(false);const [showPreview,setShowPreview]=useState(false);
 useEffect(()=>{if(!db){setInitialized(true);return;}db.auth.getUser().then(({data})=>{setUser(data.user);setInitialized(true)});const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(!user||!db)return;db.from('display_config').select('draft').eq('id',1).single().then(({data,error})=>{if(error)setNotice(`Configuration unavailable: ${error.message}`);else setCfg(normalizeConfig(data?.draft))})},[user?.id]);
 const notify=(x:string)=>setNotice(x);
 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;setBusy(true);const {error}=await db.auth.signInWithPassword({email,password});notify(error?error.message:'Signed in');setBusy(false);}
 async function save(publish:boolean){if(!db||!user)return;setBusy(true);let jwt=(await db.auth.getSession()).data.session?.access_token;if(!jwt){notify('Session expired; sign in again.');setBusy(false);return;}const normalized=normalizeConfig(cfg);const method=publish?'publish':'save';const res=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt}`},body:JSON.stringify({method,config:normalized})});const result=await res.json();notify(res.ok?(publish?'Published! TV will refresh within 30 seconds.':'Draft saved. Live TV has not changed.'):(result.error||'Unable to save'));setBusy(false);}
 async function upload(file:File){
 if(!db||busy)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){notify('Only JPG, PNG or WebP up to 10MB');return;}
 setBusy(true);notify('Preparing image…');
 try{
  const optimized=await optimizeFlyer(file);
  notify('Uploading image…');
  const ext=optimized.type==='image/png'?'png':optimized.type==='image/webp'?'webp':'jpg';
  const path=`${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from('flyers').upload(path,optimized,{contentType:optimized.type,upsert:false,cacheControl:'3600'});
  if(error)throw error;
  const {data}=db.storage.from('flyers').getPublicUrl(path);
  const flyer:Flyer={id:crypto.randomUUID(),title:file.name,url:data.publicUrl,enabled:true,duration:10};
  setCfg(old=>({...old,flyers:[...old.flyers,flyer]}));
  notify('Uploaded. Select Save Draft before Preview Draft, then Publish to TV.');
 }catch(error){notify('Upload failed: '+(error instanceof Error?error.message:'Please try again'))}
 finally{setBusy(false);}
}
 const updateFlyer=(id:string,change:Partial<Flyer>)=>setCfg(c=>({...c,flyers:c.flyers.map(f=>f.id===id?{...f,...change}:f)}));const move=(i:number,dir:number)=>setCfg(c=>{const flyers=[...c.flyers];const j=i+dir;if(j<0||j>=flyers.length)return c;[flyers[i],flyers[j]]=[flyers[j],flyers[i]];return {...c,flyers}});
 const setPrayer=(fn:(p:PrayerSchedule)=>PrayerSchedule)=>setCfg(c=>({...c,prayer:fn(c.prayer||initialPrayer())}));
 if(!initialized)return <main className="admin">Loading…</main>;
 if(!db)return <main className="admin"><h1>Masjid Ibrahim Admin</h1><p>Supabase is not configured yet. Add the environment variables in <code>.env.local</code> to enable login, storage and publishing.</p><a className="linkbtn" href="/">View TV design</a></main>;
 if(!user)return <main className="admin"><h1>Masjid Ibrahim · Admin Login</h1><form className="panel" onSubmit={login}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/><label>Password</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/><button disabled={busy}>Sign in</button><p className="error">{notice}</p></form></main>;
 if(showPreview)return <><Dashboard draftConfig={cfg}/><button type="button" onClick={()=>setShowPreview(false)} style={{position:'fixed',right:16,top:16,zIndex:10000,background:'#e7bd70',color:'#0b213b',font:'bold 16px Arial',border:'2px solid white',borderRadius:8,padding:'12px 18px',cursor:'pointer'}}>← Back to Admin (Draft Preview)</button></>;
 return <main className="admin"><h1>Masjid Ibrahim · Content Manager</h1><div className="top-actions"><button disabled={busy} className="secondary" onClick={()=>save(false)}>Save Draft</button><button type="button" className="secondary" onClick={()=>setShowPreview(true)}>Preview Current Draft</button><button disabled={busy} onClick={()=>save(true)}>Publish to TV</button><button className="secondary" onClick={()=>db.auth.signOut()}>Sign out</button></div><p className="note">{notice||'Draft changes do not go live until you press Publish to TV.'}</p><nav className="admin-nav">{['flyers','prayers','header','ticker','urgent','settings'].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?'':'secondary'}>{t.toUpperCase()}</button>)}</nav>
 <section className="panel">{tab==='flyers'?<><h2>Flyer slideshow</h2><p className="hint">Upload JPG, PNG or WebP, max 10 MB. Images are fitted entirely without cropping. Active flyers show in this order.</p><input type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.currentTarget.value=''}}/><div className="stack">{cfg.flyers.map((f,i)=><div className="flyer-item" key={f.id}><img alt={f.title} src={f.url} loading="lazy" decoding="async"/><div className="grow"><input aria-label="Flyer title" value={f.title} onChange={e=>updateFlyer(f.id,{title:e.target.value})}/><div className="inline"><label><input type="checkbox" checked={f.enabled} onChange={e=>updateFlyer(f.id,{enabled:e.target.checked})}/> Active</label><label>Seconds <input style={{width:76}} type="number" min={5} max={60} value={f.duration} onChange={e=>updateFlyer(f.id,{duration:Number(e.target.value)})}/></label></div></div><button className="secondary" onClick={()=>move(i,-1)}>↑</button><button className="secondary" onClick={()=>move(i,1)}>↓</button><button className="danger" onClick={()=>{if(confirm('Remove flyer from slideshow?'))setCfg(c=>({...c,flyers:c.flyers.filter(x=>x.id!==f.id)}))}}>Remove</button></div>)}</div>{!cfg.flyers.length&&<p>No flyers uploaded. TV will show welcome slide.</p>}</>:null}
 {tab==='prayers'?<><h2>Emergency prayer schedule override</h2><p className="hint">Until an approved MasjidAl data feed is available, enter verified values manually. Times must use 24-hour HH:MM input, e.g. 13:30 for 1:30 PM. Blank values remain unavailable. Jumu’ah Start values are KHUTBAH starts; their Iqamah column is deliberately blank.</p><label>Effective date (Spring, TX)</label><input type="date" value={(cfg.prayer||initialPrayer()).date} onChange={e=>setPrayer(p=>({...p,date:e.target.value}))}/><label>Hijri date (verified from MasjidAl)</label><input value={(cfg.prayer||initialPrayer()).hijri} placeholder="e.g. 5 Jumada Al-Awwal 1448" onChange={e=>setPrayer(p=>({...p,hijri:e.target.value}))}/><div className="timing-grid"><strong>PRAYER</strong><strong>START (24h)</strong><strong>IQAMAH (24h)</strong>{PRAYERS.map(n=><div key={n} style={{display:'contents'}}><strong>{n}</strong><input type="time" value={(cfg.prayer||initialPrayer()).prayers[n].start} onChange={e=>setPrayer(p=>({...p,prayers:{...p.prayers,[n]:{...p.prayers[n],start:e.target.value}}}))}/><input type="time" value={(cfg.prayer||initialPrayer()).prayers[n].iqamah} onChange={e=>setPrayer(p=>({...p,prayers:{...p.prayers,[n]:{...p.prayers[n],iqamah:e.target.value}}}))}/></div>)}<strong>Jumu’ah 1 (Khutbah)</strong><input type="time" value={(cfg.prayer||initialPrayer()).jumuah1} onChange={e=>setPrayer(p=>({...p,jumuah1:e.target.value}))}/><span>—</span><strong>Jumu’ah 2 (Khutbah)</strong><input type="time" value={(cfg.prayer||initialPrayer()).jumuah2} onChange={e=>setPrayer(p=>({...p,jumuah2:e.target.value}))}/><span>—</span></div><button className="secondary" onClick={()=>setCfg(c=>({...c,prayer:null}))}>Clear manual schedule</button></>:null}
 {tab==='header'?<><h2>Header & donation</h2><label>Campaign title</label><input value={cfg.heading} onChange={e=>setCfg(c=>({...c,heading:e.target.value}))}/><label>Campaign subtitle</label><input value={cfg.subtitle} onChange={e=>setCfg(c=>({...c,subtitle:e.target.value}))}/><label>Donation URL</label><input type="url" value={cfg.donationUrl} onChange={e=>setCfg(c=>({...c,donationUrl:e.target.value}))}/><p className="hint">Official logo is installed. Donation QR will reference the specified link. The bundled verified QR is used for the original MadinaApps link.</p></>:null}
 {tab==='ticker'?<><h2>Scrolling ticker</h2><textarea rows={6} value={cfg.ticker} onChange={e=>setCfg(c=>({...c,ticker:e.target.value}))}/><p className="hint">Continuous right-to-left marquee, automatically updated after publishing.</p></>:null}
 {tab==='urgent'?<><h2>Urgent announcement</h2><label className="inline"><input type="checkbox" checked={cfg.urgentEnabled} onChange={e=>setCfg(c=>({...c,urgentEnabled:e.target.checked}))}/> Show announcement banner on TV</label><textarea rows={4} maxLength={280} value={cfg.urgentText} onChange={e=>setCfg(c=>({...c,urgentText:e.target.value}))} placeholder="Important community announcement..."/><p className="hint">This banner is absent by default and appears only when enabled and published.</p></>:null}
 {tab==='settings'?<><h2>System settings</h2><p>TV screen: 1920 × 1080 · Spring, Texas · Time zone: America/Chicago</p><p>TV checks published content every 30 seconds. Weather refreshes every 15 minutes. Local TV cache is used when disconnected.</p><p>Public TV: <a href="/">/</a> · Draft preview: <a href="/preview">/preview</a></p><p className="hint">Supported structured MasjidAl integration is still pending. Do not represent manual timetable values as an automatically verified live feed.</p></>:null}
 </section></main>
}
