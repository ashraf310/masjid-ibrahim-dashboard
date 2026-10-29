'use client';
import {useEffect,useState} from 'react';
import {browserDb} from '../lib/supabase';
type Service='d02'|'d03';
type State={service:Service;locked:boolean;live?:boolean;expiresAt?:string|null;enabledUntil?:string|null};
export default function PresentationEmergencyControls(){
 const [items,setItems]=useState<Record<string,State|null>>({d02:null,d03:null});
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[duration,setDuration]=useState(120);
 async function request(service:Service,mode?:string){
  const db=browserDb(),session=(await db?.auth.getSession())?.data.session;
  if(!session)throw Error('Admin login required');
  const res=await fetch('/api/presenter/admin',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:mode?'service-control':'service-status',service,mode,durationMinutes:duration})});
  const data=await res.json();if(!res.ok)throw Error(data.error||'Unable to update service');
  setItems(old=>({...old,[service]:data}));return data as State;
 }
 async function act(service:Service,mode:string){
  if((mode==='lock'||mode==='disable')&&!window.confirm('Immediately stop '+(service==='d03'?'Live Presentation':'Presentation Portal')+'? Connected presentations will end.'))return;
  setBusy(true);try{await request(service,mode);setMessage('Updated '+service.toUpperCase()+': '+mode)}catch(e){setMessage(String(e))}finally{setBusy(false)}
 }
 useEffect(()=>{let active=true;const refresh=async()=>{for(const service of ['d02','d03'] as Service[]){try{if(active)await request(service)}catch(e){if(active)setMessage(String(e))}}};void refresh();return()=>{active=false}},[]);
 return <section style={{border:'1px solid #D8B26A',borderRadius:12,padding:20,marginTop:20,background:'#102e4d',color:'#fff'}}>
  <h2>Presentation Emergency Controls</h2><p>Admin-only overrides. Force Disable ends the selected service; Lock blocks new sessions until unlocked. Prayer dashboards are not changed.</p>
  <label>Emergency enable duration: <select value={duration} onChange={e=>setDuration(Number(e.target.value))}>{[30,60,120,180,240,480].map(n=><option value={n} key={n}>{n} minutes</option>)}</select></label>
  {(['d02','d03'] as Service[]).map(service=><div key={service} style={{padding:'16px 0',borderBottom:'1px solid #456'}}>
   <h3>{service==='d02'?'Presentation Portal':'Live Presentation'}</h3>
   <p>{!items[service]?'Status unavailable':items[service]?.locked?'🔴 Emergency locked':items[service]?.live?'🟢 Live':'⚪ Idle'}{items[service]?.expiresAt?' · Expires '+new Date(items[service]!.expiresAt!).toLocaleTimeString():''}</p>
   <button disabled={busy} onClick={()=>void act(service,'disable')}>Force Disable</button>{' '}
   <button disabled={busy} onClick={()=>void act(service,'lock')}>Emergency Lock</button>{' '}
   <button disabled={busy} onClick={()=>void act(service,'unlock')}>Unlock</button>{' '}
   <button disabled={busy} onClick={()=>void act(service,'enable')}>Emergency Enable</button>
  </div>)}
  <p role="status">{message}</p>
 </section>;
}
