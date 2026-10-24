'use client';
import {useEffect,useState} from 'react';
import LocalPdfSlides from '../../components/LocalPdfSlides';
import LocalPptxPresenter from '../../components/LocalPptxPresenter';
import {validatePresentationFile} from '../../lib/presentation-validation';
type Session={presenter:{label:string};capabilities:{upload:boolean;live:boolean}};
export default function Presenter(){
 const [token,setToken]=useState('');
 const [code,setCode]=useState('');
 const [session,setSession]=useState<Session|null>(null);
 const [status,setStatus]=useState('Enter the access code provided by the Masjid administrator.');
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [current,setCurrent]=useState<{id:string;title:string;state:string}|null>(null);
 const [refreshKey,setRefreshKey]=useState(0);
 async function loadCurrent(secret:string){
  const response=await fetch('/api/presenter/current',{headers:{Authorization:'Bearer '+secret},cache:'no-store'});
  if(response.ok){const data=await response.json();setCurrent(data.presentation||null)}
 }
 async function replace(){
  if(!current||!token||busy)return;
  if(!window.confirm('Remove "'+current.title+'" and its files? You can upload a corrected presentation using the same link.'))return;
  setBusy(true);
  try{
   const response=await fetch('/api/presenter/current',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({id:current.id})});
   const body=await response.json();if(!response.ok)throw Error(body.error||'Cannot remove presentation');
   setCurrent(null);setFile(null);setRefreshKey(v=>v+1);
   setStatus('Previous presentation removed. Choose the correct file and upload it; your private link still works.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to replace')}finally{setBusy(false)}
 }
 async function unlock(e:React.FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setStatus('Verifying presenter code...');
  try{
   const response=await fetch('/api/presenter/code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim()}),cache:'no-store'});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Invalid code');
   const secret=result.token as string;
   const sessionResponse=await fetch('/api/presenter/session',{headers:{Authorization:'Bearer '+secret},cache:'no-store'});
   if(!sessionResponse.ok)throw Error('Unable to start presenter session');
   const active=await sessionResponse.json() as Session;
   setToken(secret);setSession(active);setCode('');setStatus('Presenter access verified.');await loadCurrent(secret);
  }catch(e){setStatus(e instanceof Error?e.message:'Could not verify code')}finally{setBusy(false)}
 }
 async function upload():Promise<string>{
  if(!file||!token||busy)throw Error('Choose a PowerPoint file before uploading.');
  if(!file.name.toLowerCase().endsWith('.pptx'))throw Error('Live presentation requires a PowerPoint (.pptx) file.');
  const validation=validatePresentationFile(file);if(!validation.ok){setStatus(validation.error);throw Error(validation.error);}
  setBusy(true);
  let reservedId:string|null=null;
  try{
   setStatus('Requesting secure upload...');
   const response=await fetch('/api/presenter/prepare',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({title:file.name.replace(/\.(pptx|pdf)$/i,''),format:validation.format,bytes:file.size})});
   const result=await response.json();
   if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'Upload authorization failed');
   reservedId=result.presentationId;
   setStatus('Uploading securely...');
   // Signed URL is specific to this file and generated server-side for this presentation.
   const put=await fetch(result.upload.signedUrl,{method:'PUT',headers:{'Content-Type':validation.format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.presentationml.presentation'},body:file});
   if(!put.ok)throw new Error('Upload failed. The presentation slot may need clearing by an administrator.');
   const done=await fetch('/api/presenter/complete',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({presentationId:result.presentationId})});
   const finished=await done.json();
   if(!done.ok)throw new Error(finished.error||'Unable to verify uploaded file');
   reservedId=null;
   setStatus('File saved privately. You may replace it before going live if you selected the wrong file.');
   await loadCurrent(token);
   return result.presentationId as string;
  }catch(e){if(reservedId){try{await fetch('/api/presenter/cancel',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({presentationId:reservedId})})}catch{}}setStatus(e instanceof Error?e.message:'Upload failed');throw e}finally{setBusy(false)}
 }
 async function ensureUploaded():Promise<string>{
  if(!file||!token)throw Error('Choose your original PowerPoint file first.');
  // Refresh the active record to avoid stale state after upload, reload, or another browser.
  const response=await fetch('/api/presenter/current',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  if(!response.ok)throw Error('Unable to verify current presentation. Please refresh and try again.');
  const details=await response.json() as {presentation:{id:string;title:string;state:string;source_format:string}|null};
  const saved=details.presentation;
  if(saved){
   setCurrent(saved);
   const expected=file.name.replace(/\.(pptx|pdf)$/i,'');
   if(saved.title!==expected||saved.source_format!=='pptx')throw Error('A different presentation is already uploaded. Use Remove / Replace Presentation at the top of the portal.');
   if(saved.state==='ended'||saved.state==='live')throw Error('This presentation is '+saved.state+'. Retrieve the existing audience link if live, or have Admin clear an ended presentation.');
   return saved.id;
  }
  return await upload();
 }
 return <main style={{background:'#081d39',color:'#f9f5ea',minHeight:'100vh',fontFamily:'Arial,sans-serif',padding:'5vw'}}><div style={{maxWidth:760,margin:'auto'}}><p style={{color:'#e3bf7e'}}>MASJID IBRAHIM · STAGING</p><h1>Presenter Portal</h1><p role="status" style={{background:'#12395c',padding:18,borderRadius:9}}>{status}</p>
 {!session&&<form onSubmit={e=>void unlock(e)} style={{background:'#12395c',padding:24,borderRadius:12}}><label htmlFor="presenter-code">Presenter access code</label><input id="presenter-code" type="password" autoComplete="off" required minLength={16} maxLength={16} value={code} onChange={e=>setCode(e.target.value.trim())} placeholder="Enter 16-character code" style={{display:'block',margin:'16px 0',padding:13,fontSize:19,width:'min(100%,420px)',boxSizing:'border-box'}}/><button disabled={busy||code.length!==16} style={{padding:14,background:'#e2bd77',color:'#091c33',border:0,borderRadius:7}}>{busy?'Verifying…':'Continue to Presenter Portal'}</button><p style={{fontSize:13}}>The presenter URL stays the same. Request an active code privately from Admin.</p></form>}
 {session&&<section style={{background:'#12395c',padding:24,borderRadius:12}}><h2>Welcome, {session.presenter.label}</h2>{current&&<div style={{padding:15,border:'1px solid #e2bd77',borderRadius:8,marginBottom:18}}><strong>Uploaded presentation: {current.title}</strong><p>Status: {current.state}</p><button type="button" disabled={busy||!['uploading','processing','ready','failed'].includes(current.state)} onClick={replace} style={{padding:'10px 14px',background:'#e2bd77',color:'#09203b',border:0,borderRadius:6,fontWeight:'bold'}}>Remove / Replace Presentation</button><p style={{fontSize:13,color:'#d4dfea'}}>Your presenter URL remains unchanged.</p></div>}{!current&&<label htmlFor="f">Choose a PowerPoint (.pptx) for live presentation (maximum 50 MB)</label>}<br/><input key={refreshKey} id="f" type="file" disabled={!!current||busy} accept=".pptx" style={{marginTop:15,maxWidth:'100%'}} onChange={e=>{const selected=e.target.files?.[0]||null;setFile(selected);if(selected){const v=validatePresentationFile(selected);setStatus(v.ok?'File ready for upload.':v.error)}}}/><br/><button type="button" onClick={()=>{void upload().catch(()=>{})}} disabled={!file||busy||!!current||!session.capabilities.upload} style={{marginTop:20,padding:'12px 20px',border:0,borderRadius:7,background:'#e2bb6e',color:'#081d39',fontWeight:'bold',opacity:(!file||busy||!session.capabilities.upload)?0.5:1}}>{busy?'Uploading...':'Upload presentation'}</button><p style={{color:'#c9d8e8'}}>Your original PowerPoint keeps notes private. Convert slides locally using the helper or select a matching exported PDF; only slide images reach staging viewers.</p></section>}
 {session&&file?.name.toLowerCase().endsWith('.pdf')&&<LocalPdfSlides file={file}/>}
 {session&&file?.name.toLowerCase().endsWith('.pptx')&&<LocalPptxPresenter file={file} presenterToken={token} presentationId={current?.id||null} ensureUploaded={ensureUploaded} onEnded={()=>{setCurrent(null);setFile(null);setRefreshKey(k=>k+1);setStatus('Presentation ended. Its stored slides, source and questions have been deleted. Select another file to begin a new session.')}}/>}
 <p style={{fontSize:13,color:'#bbcada',marginTop:35}}>Keep your presenter code private. Closing or refreshing this tab requires entering the code again. This staging application cannot control the Masjid TVs.</p></div></main>
}
