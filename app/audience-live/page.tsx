'use client';
import {useEffect,useRef,useState} from 'react';
type Audience={state:string;presentationId?:string;slide?:number;total?:number;slideUrl?:string|null;qaEnabled?:boolean;qaUrl?:string};
export default function FixedAudienceScreen(){
 const root=useRef<HTMLElement>(null),last=useRef(''),lastRefresh=useRef(0);
 const [screen,setScreen]=useState<Audience>({state:'waiting'});
 const screenQa=useRef<{enabled?:boolean;url?:string}>({});
 const [error,setError]=useState('');
 const [fullscreen,setFullscreen]=useState(false);
 const [tvView,setTvView]=useState(false);
 const [questionsUrl,setQuestionsUrl]=useState('https://masjid-ibrahim-staging.vercel.app/q');
 useEffect(()=>{
  setTvView(new URLSearchParams(window.location.search).get('tv')==='1');
  // A localhost URL cannot be opened from a congregant's phone. Use the public staging URL when testing locally.
  const local=['localhost','127.0.0.1'].includes(window.location.hostname);
  setQuestionsUrl((local?'https://masjid-ibrahim-staging.vercel.app':window.location.origin)+'/q');
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
    if(identity!==last.current||Date.now()-lastRefresh.current>45000||state.qaEnabled!==screenQa.current.enabled||state.qaUrl!==screenQa.current.url){last.current=identity;lastRefresh.current=Date.now();screenQa.current={enabled:state.qaEnabled,url:state.qaUrl};setScreen(state);}
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
  {screen.qaEnabled!==false&&<div aria-label="Audience question QR" style={{position:'absolute',left:'1.4vw',bottom:'clamp(52px,6vh,78px)',zIndex:3,background:'#fff',padding:'clamp(5px,.5vw,10px)',border:'3px solid #D8B26A',borderRadius:12,boxShadow:'0 3px 16px #0008',width:'clamp(92px,9vw,154px)',aspectRatio:'1',boxSizing:'border-box'}}>
   <img src={'https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=H&margin=12&data='+encodeURIComponent(screen.qaUrl||questionsUrl)} alt={'Scan to ask a question at '+(screen.qaUrl||questionsUrl)} style={{display:'block',height:'100%',width:'100%',objectFit:'contain'}}/>
   <span aria-hidden="true" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',color:'#082B4D',fontSize:'clamp(13px,1.7vw,26px)',fontWeight:700,padding:'1px 3px',borderRadius:3,lineHeight:1.1}}>محمد</span>
  </div>}
  {screen.qaEnabled!==false&&<footer aria-label="Ask a question" style={{height:'clamp(46px,6vh,72px)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',boxSizing:'border-box',padding:'4px 15vw 4px 2vw',background:'#082B4D',borderTop:'2px solid #D8B26A',color:'#fff',fontSize:'clamp(16px,1.7vw,31px)',fontWeight:600,whiteSpace:'nowrap'}}>
   Ask a question at&nbsp;<a href={screen.qaUrl||questionsUrl} target="_blank" rel="noreferrer" style={{color:'#D8B26A',textDecoration:'none',fontWeight:800}}>{(screen.qaUrl||questionsUrl).replace(/^https?:\/\//,'')}</a>
  </footer>}
 </div>:
 <div style={{textAlign:"center",padding:24,display:"flex",flexDirection:"column",alignItems:"center",gap:22}}><img src="/masjid-ibrahim-logo.svg" alt="Masjid Ibrahim official logo" style={{width:"clamp(150px,24vw,360px)",maxHeight:"48vh",objectFit:"contain"}}/><p style={{color:"#e8c582",fontSize:"clamp(20px,2vw,34px)",margin:0}}>Waiting for live presentation</p></div>}
 {error&&<p role="status" style={{position:'absolute',bottom:10,left:18,fontSize:12,color:'#f2d7a5'}}>{error}</p>}
 </main>;
}
