'use client';
import {useEffect,useRef,useState} from 'react';
type State={state:string;slide?:number;total?:number;title?:string;slideUrl?:string|null};
export default function AudienceStaging(){
 const root=useRef<HTMLElement>(null);
 const [full,setFull]=useState(false);
 const [identity,setIdentity]=useState<{id:string;key:string}|null>(null);
 const [display,setDisplay]=useState<State>({state:'loading'});
 const [error,setError]=useState('');
 useEffect(()=>{const onChange=()=>setFull(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',onChange);return()=>document.removeEventListener('fullscreenchange',onChange)},[]);
 async function toggleFull(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen()}catch{setError('This browser does not allow fullscreen. Try F11 instead.')}}
 useEffect(()=>{const q=new URLSearchParams(location.search);const id=q.get('id')||'',key=q.get('key')||'';
 if(!id||!key){setError('A private audience preview link is required.');return}
 setIdentity({id,key});
 },[]);
 useEffect(()=>{if(!identity)return;let active=true;let lastSlide=-1;
 const check=async()=>{try{
 const response=await fetch('/api/audience/presentation?id='+encodeURIComponent(identity.id)+'&key='+encodeURIComponent(identity.key),{cache:'no-store'});
 if(!response.ok)throw new Error('Audience access unavailable');
 const data=await response.json() as State;if(!active)return;
 if(data.state==='live'){
  if(data.slide!==lastSlide){lastSlide=data.slide??-1;setDisplay(data)}
 }else{lastSlide=-1;setDisplay(data)}
 setError('');
 }catch(e){if(active)setError(e instanceof Error?e.message:'Cannot load presentation')}};
 void check();const timer=setInterval(()=>void check(),1500);
 return()=>{active=false;clearInterval(timer)};
 },[identity]);
 return <main ref={root} style={{position:'relative',width:'100vw',height:'100vh',margin:0,background:'#071a37',color:'#fff',fontFamily:'Arial,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
 <button onClick={()=>void toggleFull()} style={{position:'absolute',right:16,top:16,zIndex:5,padding:'10px 14px',background:'#173e68',color:'#fff',border:'1px solid #d7b970',borderRadius:7,cursor:'pointer',opacity:full?.4:1}}>{full?'Exit fullscreen':'Fullscreen ⛶'}</button>
 {error?<p role="alert">{error}</p>:display.state==='live'&&display.slideUrl?
 <img src={display.slideUrl} alt={'Presentation slide '+((display.slide??0)+1)} style={{display:'block',maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>:
 <div style={{textAlign:'center',padding:30}}><h2>Masjid Ibrahim · Staging</h2><p>{display.state==='ended'?'Presentation ended':'Waiting for presenter to start...'}</p></div>}
 </main>;
}
