'use client';
import {useEffect,useRef,useState} from 'react';
type Audience={state:string;presentationId?:string;slide?:number;total?:number;slideUrl?:string|null};
export default function FixedAudienceScreen(){
 const root=useRef<HTMLElement>(null),last=useRef(''),lastRefresh=useRef(0);
 const [screen,setScreen]=useState<Audience>({state:'waiting'});
 const [error,setError]=useState('');
 const [fullscreen,setFullscreen]=useState(false);
 useEffect(()=>{
  const listener=()=>setFullscreen(Boolean(document.fullscreenElement));
  document.addEventListener('fullscreenchange',listener);
  let active=true;
  const check=async()=>{
   try{
    const response=await fetch('/api/audience/current',{cache:'no-store'});
    if(!response.ok)throw new Error('Audience feed unavailable');
    const state=await response.json() as Audience;
    if(!active)return;
    const identity=state.state+':'+(state.presentationId||'')+':'+(state.slide??-1);
    if(identity!==last.current||Date.now()-lastRefresh.current>45000){last.current=identity;lastRefresh.current=Date.now();setScreen(state);}
    setError('');
   }catch{if(active)setError('Reconnecting to staging audience feed...')}
  };
  void check();const timer=window.setInterval(()=>void check(),1500);
  return()=>{active=false;window.clearInterval(timer);document.removeEventListener('fullscreenchange',listener)};
 },[]);
 async function toggle(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen()}catch{setError('Fullscreen unavailable. Try F11.')}}
 return <main ref={root} style={{position:'relative',margin:0,width:'100vw',height:'100vh',overflow:'hidden',background:'#061831',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial,sans-serif'}}>
 <button type="button" onClick={()=>void toggle()} style={{position:'absolute',top:12,right:12,zIndex:2,border:'1px solid #d2ac62',borderRadius:7,padding:'10px 13px',background:'#12395f',color:'#fff',opacity:fullscreen?.2:.9,cursor:'pointer'}}>{fullscreen?'Exit fullscreen':'Fullscreen ⛶'}</button>
 {screen.state==='live'&&screen.slideUrl?
 <img src={screen.slideUrl} alt={'Live presentation slide '+((screen.slide??0)+1)} style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain'}}/>:
 <div style={{textAlign:'center',padding:24}}><h1 style={{color:'#e1bc76'}}>Masjid Ibrahim</h1><p>Waiting for live presentation</p></div>}
 {error&&<p role="status" style={{position:'absolute',bottom:10,left:18,fontSize:12,color:'#f2d7a5'}}>{error}</p>}
 </main>;
}
