'use client';
import {useEffect,useRef,useState} from 'react';
type Audience={state:string;presentationId?:string;slide?:number;total?:number;slideUrl?:string|null};
export default function FixedAudienceScreen(){
 const root=useRef<HTMLElement>(null),last=useRef(''),lastRefresh=useRef(0);
 const [screen,setScreen]=useState<Audience>({state:'waiting'});
 const [error,setError]=useState('');
 const [fullscreen,setFullscreen]=useState(false);
 const [tvView,setTvView]=useState(false);
 const [questionsUrl,setQuestionsUrl]=useState('https://masjid-ibrahim-staging.vercel.app/questions');
 useEffect(()=>{
  setTvView(new URLSearchParams(window.location.search).get('tv')==='1');
  // A localhost URL cannot be opened from a congregant's phone. Use the public staging URL when testing locally.
  const local=['localhost','127.0.0.1'].includes(window.location.hostname);
  setQuestionsUrl((local?'https://masjid-ibrahim-staging.vercel.app':window.location.origin)+'/questions');
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
 {!tvView&&<button type="button" onClick={()=>void toggle()} style={{position:'absolute',top:12,right:12,zIndex:2,border:'1px solid #d2ac62',borderRadius:7,padding:'10px 13px',background:'#12395f',color:'#fff',opacity:fullscreen?.2:.9,cursor:'pointer'}}>{fullscreen?'Exit fullscreen':'Fullscreen ⛶'}</button>}
 {screen.state==='live'&&screen.slideUrl?
 <div style={{height:'100%',width:'100%',display:'flex',flexDirection:'column',minHeight:0}}>
  <div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
   <img src={screen.slideUrl} alt={'Live presentation slide '+((screen.slide??0)+1)} style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain'}}/>
  </div>
  <div aria-label="Ask questions during this presentation" style={{flex:'0 0 clamp(115px,15vh,180px)',boxSizing:'border-box',background:'#082B4D',borderTop:'3px solid #D8B26A',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1.8vw',padding:'10px 3vw',color:'#fff'}}>
   <div style={{minWidth:0,flex:1}}>
    <div style={{fontSize:'clamp(19px,2.1vw,39px)',fontWeight:800,color:'#D8B26A',lineHeight:1.2}}>HAVE A QUESTION?</div>
    <div style={{fontSize:'clamp(14px,1.35vw,25px)',marginTop:5}}>Scan the QR code or visit the link to submit your question.</div>
    <a href={questionsUrl} target="_blank" rel="noreferrer" style={{color:'#fff',textDecoration:'underline',textUnderlineOffset:4,fontSize:'clamp(13px,1.4vw,26px)',display:'block',marginTop:7,overflowWrap:'anywhere'}}>{questionsUrl.replace(/^https?:\/\//,'')}</a>
   </div>
   <div style={{background:'#fff',border:'5px solid #D8B26A',borderRadius:12,padding:5,flexShrink:0,width:'clamp(94px,12vh,145px)',height:'clamp(94px,12vh,145px)',boxSizing:'border-box'}}>
    <img src={'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data='+encodeURIComponent(questionsUrl)} alt={'QR code to submit questions at '+questionsUrl} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
   </div>
  </div>
 </div>:
 <div style={{textAlign:'center',padding:24}}><h1 style={{color:'#e1bc76'}}>Masjid Ibrahim</h1><p>Waiting for live presentation</p></div>}
 {error&&<p role="status" style={{position:'absolute',bottom:10,left:18,fontSize:12,color:'#f2d7a5'}}>{error}</p>}
 </main>;
}
