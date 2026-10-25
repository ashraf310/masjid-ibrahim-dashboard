'use client';
import {useEffect,useState} from 'react';
export default function ApkDownload(){
 const [state,setState]=useState<'checking'|'ready'|'missing'>('checking');
 const url='/downloads/masjid-ibrahim-tv-staging.apk';
 useEffect(()=>{
  let active=true;
  fetch(url,{method:'HEAD',cache:'no-store'}).then(r=>{if(active)setState(r.ok?'ready':'missing')}).catch(()=>{if(active)setState('missing')});
  return()=>{active=false};
 },[]);
 const available=state==='ready';
 return <section style={{background:'#112e50',border:'1px solid #365678',borderRadius:15,padding:'clamp(20px,3vw,36px)',marginTop:30}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
   <div><h2 style={{fontSize:26,margin:'0 0 8px'}}>Masjid Ibrahim TV — Staging</h2><p style={{color:'#d0dfec',margin:0}}>Android TV APK · v0.6-tv-auto-launch</p></div>
   <span style={{padding:'9px 14px',borderRadius:25,background:available?'#164f41':'#3a3944',color:available?'#c4f5db':'#f3dbab',fontWeight:700,fontSize:14}}>{state==='checking'?'Checking APK…':available?'APK available':'APK not found'}</span>
  </div>
  <p style={{lineHeight:1.6,color:'#ccdae7'}}>Verified GitHub build v0.6. Auto-launch after full TV reboot is available for testing; support varies by TV model.</p>
  {available?<a href={url} download style={{display:'inline-block',background:'#e2bd77',color:'#0a213c',textDecoration:'none',padding:'15px 22px',borderRadius:8,fontWeight:800,marginTop:12}}>Download Android TV APK</a>:state==='missing'?<div style={{padding:17,background:'#213d59',borderRadius:9,border:'1px solid #596776',color:'#f2dfbe',lineHeight:1.5}}>The APK was not found at the expected public address. Check that the file is named <code>masjid-ibrahim-tv-staging.apk</code> under <code>public/downloads</code> in the staging branch.</div>:null}
 </section>;
}
