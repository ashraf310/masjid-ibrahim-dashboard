'use client';
import {useCallback,useEffect,useState} from 'react';
import SlideCanvas from './SlideCanvas';
import type {PptxInfo} from '../lib/inspect-pptx';

/** Presenter-only preparation: speaker's original PPTX notes + its exported PDF slides.
 * No PDF or notes are broadcast, uploaded or shared from this component. */
function PresenterQuestions({token,presentationId,onClose}:{token:string;presentationId:string;onClose:()=>void}){
 const [questions,setQuestions]=useState<{id:string;question:string;status:string;created_at:string}[]>([]);
 const [position,setPosition]=useState(0);
 const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  try{
   const r=await fetch('/api/questions?presentationId='+encodeURIComponent(presentationId),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   if(!r.ok)throw Error('Questions are unavailable. Check staging Q&A setup.');
   const data=await r.json() as {questions?:{id:string;question:string;status:string;created_at:string}[]};
   setQuestions((data.questions||[]).filter(q=>q.status!=='hidden').sort((a,b)=>a.created_at.localeCompare(b.created_at)));
   setNotice('');
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to load questions')}
 },[token,presentationId]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),5000);return()=>window.clearInterval(timer)},[load]);
 useEffect(()=>{setPosition(p=>Math.min(p,Math.max(0,questions.length-1)))},[questions.length]);
 useEffect(()=>{
  const handle=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopImmediatePropagation();onClose()}else if(e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();setPosition(p=>Math.min(questions.length-1,p+1))}else if(e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();setPosition(p=>Math.max(0,p-1))}};
  window.addEventListener('keydown',handle,true);return()=>window.removeEventListener('keydown',handle,true);
 },[questions.length,onClose]);
 return <div role="dialog" aria-modal="true" aria-label="Speaker Q&A" style={{position:'fixed',inset:0,zIndex:11000,background:'#07172e',color:'#fff',padding:'clamp(18px,3vw,42px)',boxSizing:'border-box',display:'flex',flexDirection:'column',gap:24}}>
  <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
   <h2 style={{margin:0,fontSize:'clamp(22px,2.5vw,32px)',color:'#e4c07a'}}>Live Q&A</h2>
   <button type="button" onClick={onClose} style={{background:"#e2bd77",color:"#081d39",fontWeight:700,border:"none",borderRadius:6,padding:"11px 18px"}}>Back to speaker view</button>
  </header>
  <main style={{flex:'1 1 0',minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',background:'#102c4f',borderRadius:16,padding:'clamp(18px,4vw,50px)',overflowY:'auto'}}>
   {questions.length>0?<><p style={{color:'#e4c07a',fontSize:21}}>Question {position+1} of {questions.length}</p><p style={{fontSize:'clamp(22px,2.5vw,38px)',whiteSpace:'pre-wrap',lineHeight:1.4,textAlign:'center',overflowWrap:'anywhere'}}>{questions[position]?.question}</p></>:<p style={{fontSize:26}}>No questions submitted yet.</p>}
   {notice&&<p role="status">{notice}</p>}
  </main>
  <footer style={{display:'flex',alignItems:'center',justifyContent:'center',gap:22,flexWrap:'wrap'}}>
   <button type="button" disabled={position===0||!questions.length} onClick={()=>setPosition(p=>Math.max(0,p-1))}>← Previous question</button>
   <span style={{fontSize:20}}>{questions.length?position+1:0} / {questions.length}</span>
   <button type="button" disabled={!questions.length||position>=questions.length-1} onClick={()=>setPosition(p=>Math.min(questions.length-1,p+1))}>Next question →</button>
  </footer>
 </div>;
}
export default function LocalPptxPresenter({file,presenterToken,presentationId,ensureUploaded,onEnded}:{file:File;presenterToken:string;presentationId:string|null;ensureUploaded:()=>Promise<string>;onEnded:()=>void}){
 const [info,setInfo]=useState<PptxInfo|null>(null);
 const [error,setError]=useState('');
 const [index,setIndex]=useState(0);
 const [pdf,setPdf]=useState<File|null>(null);
 const [pageCount,setPageCount]=useState<number|null>(null);
 const [publishing,setPublishing]=useState(false);
 const [activeId,setActiveId]=useState<string|null>(null);
 const resolvedId=activeId||presentationId;
 const [publishMessage,setPublishMessage]=useState('');
 const [audiencePath,setAudiencePath]=useState('');
 const [liveMode,setLiveMode]=useState(false);
 const [speakerMode,setSpeakerMode]=useState(false);
 const [qaOpen,setQaOpen]=useState(false);
 async function liveAction(action:'start'|'advance'|'end'|'ready'|'link',slide?:number,total?:number,idOverride?:string){
  const targetId=idOverride||resolvedId;
  if(!targetId||!presenterToken)throw Error('Presentation upload required');
  const response=await fetch('/api/presenter/live',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+presenterToken},body:JSON.stringify({presentationId:targetId,action,slide,total})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Cannot update presentation');
  if(result.audiencePath)setAudiencePath(result.audiencePath);
  return result;
 }
 async function getAudienceLink(){
  try{await liveAction('link');setPublishMessage('Existing audience preview link restored.')}
  catch(e){setPublishMessage(e instanceof Error?e.message:'Unable to retrieve audience link')}
 }
 async function publish(){
  if(!pdf||!presenterToken||!info||pageCount!==info.slides.length)return;
  setPublishing(true);setPublishMessage('Preparing slides locally...');
  try{
   const id=await ensureUploaded();setActiveId(id);
   const pdfjs=await import('pdfjs-dist');
   pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
   const document=await pdfjs.getDocument({data:new Uint8Array(await pdf.arrayBuffer())}).promise;
   try{
    if(document.numPages!==info.slides.length)throw Error('PDF page count does not match PPTX slide count');
    if(document.numPages>300)throw Error('Maximum 300 slides for staging preview');
    for(let i=0;i<document.numPages;i++){
     setPublishMessage('Publishing slide '+(i+1)+' of '+document.numPages+'...');
     const page=await document.getPage(i+1);
     const base=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(4,2880/base.width)});
     const canvas=documentGlobalCanvas();canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');
     await page.render({canvasContext:context,viewport}).promise;
     let blob:Blob|null=null;
     for(const quality of [0.94,0.88,0.8,0.7]){blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image encoding failed')),'image/jpeg',quality));if(blob.size<=2*1024*1024)break;}
     if(!blob||blob.size>2*1024*1024)throw Error('Slide '+(i+1)+' exceeds staging size limit even after compression');
     const response=await fetch('/api/presenter/slide',{method:'POST',headers:{Authorization:'Bearer '+presenterToken,'Content-Type':'image/jpeg','X-Presentation-Id':id,'X-Slide-Number':String(i)},body:blob});
     if(!response.ok){const result=await response.json();throw Error(result.error||'Slide upload failed')}
    }
    await liveAction('ready',undefined,document.numPages,id);
    setPublishMessage('Slides ready. Open the audience preview link in another browser/device, then click Start staging presentation.');
   }finally{await document.destroy()}
  }catch(e){setPublishMessage(e instanceof Error?e.message:'Cannot publish slides')}
  finally{setPublishing(false)}
 }
 function documentGlobalCanvas(){return window.document.createElement('canvas')}
 async function start(){try{await liveAction('start');setLiveMode(true);setIndex(0);setPublishMessage('Staging presentation live. Audience sees slides only.')}catch(e){setPublishMessage(e instanceof Error?e.message:'Cannot start')}}
 async function end(){try{await liveAction('end');setLiveMode(false);setPublishMessage('Presentation ended and cleared.');onEnded()}catch(e){setPublishMessage(e instanceof Error?e.message:'Cannot end')}}

 const onPageCount=useCallback((n:number)=>setPageCount(n),[]);
 const [showAdvanced,setShowAdvanced]=useState(false);
 const [converting,setConverting]=useState(false);
 const [convertError,setConvertError]=useState('');
 async function convertAutomatically(){
  setConverting(true);setConvertError('');
  try{
   const response=await fetch('http://127.0.0.1:43871/convert',{method:'POST',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.presentationml.presentation'},body:file,cache:'no-store'});
   if(!response.ok)throw new Error((await response.text()).slice(0,250)||'Local conversion failed');
   const blob=await response.blob();if(blob.type!=='application/pdf'||blob.size<10)throw new Error('Conversion did not return a PDF');
   setPdf(new File([blob],file.name.replace(/\\.pptx$/i,'.pdf'),{type:'application/pdf'}));setIndex(0);
  }catch(e){setConvertError(e instanceof TypeError?'Local helper not reachable. Install LibreOffice and start the helper on your computer, then try again.':e instanceof Error?e.message:'Conversion failed')}
  finally{setConverting(false)}
 }
 useEffect(()=>{let active=true;setInfo(null);setError('');setIndex(0);setPdf(null);
 import('../lib/inspect-pptx').then(m=>m.inspectPptx(file)).then(result=>{if(active)setInfo(result)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'PPTX processing failed')});
 return()=>{active=false};
 },[file]);
 useEffect(()=>{setPageCount(null)},[pdf]);
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{
 if(!info?.slides.length||qaOpen)return;
 const t=e.target as HTMLElement|null;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;
 if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setIndex(v=>{const n=Math.min(info.slides.length-1,v+1);if(liveMode)void liveAction('advance',n).catch(err=>setPublishMessage(String(err)));return n})}
 if(e.key==='ArrowLeft'){e.preventDefault();setIndex(v=>{const n=Math.max(0,v-1);if(liveMode)void liveAction('advance',n).catch(err=>setPublishMessage(String(err)));return n})}
 };window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[info,liveMode,resolvedId,presenterToken,qaOpen]);
 const total=info?.slides.length||0;
 const slidesReady=Boolean(pdf&&pageCount===total&&total>0);
 const prepared=Boolean(audiencePath);
 return <section style={{marginTop:22,padding:22,background:'#12395c',borderRadius:12}}>
 <h2 style={{marginBottom:6}}>Present Your PowerPoint</h2>
 <p style={{marginTop:0,color:'#cbd9e9'}}>Follow the steps below. The audience sees slides only; your speaker notes remain private.</p>
 <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18}}>
 {['1. Prepare slides','2. Send slides to display','3. Start presenting'].map((label,i)=><span key={label} style={{border:'1px solid #d2af71',borderRadius:25,padding:'8px 12px',color:(i===0&&!slidesReady||i===1&&slidesReady&&!prepared||i===2&&prepared)?'#081d39':'#dce4ef',background:(i===0&&!slidesReady||i===1&&slidesReady&&!prepared||i===2&&prepared)?'#e2bd77':'#17334f',fontWeight:700}}>{label}</span>)}
 </div>
 {!info&&!error&&<p>Reading PowerPoint slide order and notes...</p>}
 {error&&<p role="alert" style={{color:'#ffbbb6'}}>{error}</p>}
 {info&&<><p>{total} PowerPoint slides detected</p>
 <section style={{padding:20,background:'#091f3b',borderRadius:10,marginBottom:18}}>
 <h3 style={{margin:'0 0 10px'}}>Step 1 — Prepare your slides</h3>
 <p style={{color:'#cbd9e9'}}>Convert your PowerPoint to display-quality slides. This happens on your laptop.</p>
 <button type="button" disabled={converting||liveMode} onClick={()=>void convertAutomatically()} style={{fontSize:18,padding:'15px 22px'}}>{converting?'Preparing slides…':slidesReady?'Reconvert slides':'Prepare PowerPoint slides'}</button>
 {convertError&&<p role="alert" style={{color:'#ffb8b8'}}>{convertError}</p>}
 {pdf&&<p style={{color:'#b7f0cc'}}>Slide file available: {pdf.name}</p>}
 <p role="status" style={{color:pageCount!==null&&pageCount!==total?'#ffbab0':'#c2d0e0'}}>{pageCount===null?'Slides not yet verified.':pageCount===total?'Ready: '+pageCount+' slides match your presentation.':'Slide count mismatch. Check the PowerPoint/PDF before going live.'}</p>
 <details><summary style={{cursor:'pointer',color:'#e2bd77'}}>Having trouble? Upload a PDF instead</summary><p style={{fontSize:14}}>If automatic conversion is unavailable, export your PowerPoint as a PDF and select that file below.</p><input id="companion-pdf" type="file" accept=".pdf,application/pdf" style={{display:'block',margin:'12px 0',maxWidth:'100%'}} onChange={e=>{const f=e.target.files?.[0]||null;setPdf(f&&f.name.toLowerCase().endsWith('.pdf')&&f.size<=50*1024*1024?f:null);setIndex(0)}}/></details>
 </section>
 <details style={{marginBottom:18,padding:14,background:'#102d4e',borderRadius:10}}><summary style={{cursor:'pointer',fontWeight:700}}>Optional: Review slides and speaker notes</summary> <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
 <div><strong>Current slide {index+1}</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #d1af70',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdf?<SlideCanvas file={pdf} page={index+1} onPageCount={onPageCount}/>:<span style={{padding:15,textAlign:'center'}}>Select the matching exported PDF to preview actual slide images.</span>}
 </div></div>
 <div><strong>Next slide</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #4c6480',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdf&&index+1<total?<SlideCanvas file={pdf} page={index+2} onPageCount={onPageCount}/>:<span>{index+1<total?'Slide '+(index+2):'End of presentation'}</span>}
 </div></div>
 </div>
 <div style={{marginTop:16,padding:16,background:'#091f3b',borderRadius:8}}><strong>Private speaker notes</strong><p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{info.slides[index]?.notes||'No speaker notes on this slide.'}</p></div>
  <div style={{display:'flex',gap:14,alignItems:'center',marginTop:15}}>
 <button type="button" disabled={index===0} onClick={()=>{const n=Math.max(0,index-1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Previous</button><strong>{index+1} / {total}</strong><button type="button" disabled={index>=total-1} onClick={()=>{const n=Math.min(total-1,index+1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Next</button></div>
</details>
 <section style={{padding:20,background:'#091f3b',border:'1px solid #d2af71',borderRadius:10}}>
 <h3 style={{marginTop:0}}>Step 2 — Prepare the audience display</h3>
 <p style={{color:'#cbd9e9'}}>When your slides are ready, send the display versions to the staging screen. Speaker notes stay private.</p>
 <button type="button" style={{fontSize:18,padding:'15px 22px'}} disabled={publishing||!slidesReady||liveMode} onClick={()=>void publish()}>{publishing?'Preparing audience display…':prepared?'Prepare slides again':'Prepare audience display'}</button>
 {publishMessage&&<p role="status">{publishMessage}</p>}
 {prepared&&<p><a style={{color:'#e2bd77'}} href={audiencePath} target="_blank" rel="noopener noreferrer">View audience display in a new tab</a></p>}
 <h3>Step 3 — Start presenting</h3>
 <p style={{color:'#cbd9e9'}}>Start only when you are ready for the audience to see your slides.</p>
 {!liveMode?<button type="button" style={{fontSize:20,padding:'16px 25px',background:'#e2bd77'}} disabled={!prepared||publishing} onClick={()=>void start()}>▶ Start presentation</button>:<><strong style={{color:'#a8f3bc',marginRight:12}}>● LIVE</strong><button type="button" style={{fontSize:18}} onClick={()=>setSpeakerMode(true)}>Open speaker view</button><button type="button" style={{background:'#c62828',color:'white',fontSize:18}} onClick={()=>void end()}>■ End presentation</button></>}
 {!liveMode&&prepared&&<p style={{fontSize:14}}>Speaker view opens after you start. It shows your notes and slide controls privately.</p>}
 <details style={{marginTop:20}}><summary style={{cursor:'pointer',color:'#e2bd77'}}>Advanced options and troubleshooting</summary>{presentationId&&<button type="button" onClick={()=>void getAudienceLink()}>Retrieve audience link</button>}<p style={{fontSize:13}}>Staging-only audience test. TV/PRISM broadcasting is not enabled here.</p></details>
 </section>
 {speakerMode&&<div role="dialog" aria-modal="true" aria-label="Full-screen speaker view" style={{position:'fixed',inset:0,zIndex:10000,background:'#07172e',color:'#fff',padding:20,boxSizing:'border-box',display:'flex',flexDirection:'column',gap:14}}>
 <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><strong style={{fontSize:20}}>Masjid Ibrahim · Speaker View</strong><span>Slide {index+1} of {total} {liveMode?'· LIVE (STAGING)':'· PREVIEW'}</span><div style={{display:'flex',gap:12}}>{liveMode&&resolvedId&&<button type="button" onClick={()=>setQaOpen(true)}>Open Q&A</button>}<button type="button" onClick={()=>setSpeakerMode(false)} style={{background:"#c62828",color:"#ffffff",fontWeight:700,border:"none",borderRadius:6,padding:"11px 18px"}}>Exit speaker view</button></div></header>
 <div style={{display:'grid',gridTemplateColumns:'minmax(0,3fr) minmax(240px,1fr)',gap:16,flex:'1 1 0',minHeight:0}}>
 <div style={{background:'#061b35',border:'1px solid #b99456',borderRadius:8,overflow:'hidden',minHeight:0}}>{pdf&&<SlideCanvas file={pdf} page={index+1} onPageCount={onPageCount}/>}</div>
 <div style={{display:'flex',flexDirection:'column',gap:14,minHeight:0}}>
 <div style={{flex:'0 0 36%',minHeight:0}}><strong>Next slide</strong><div style={{height:'calc(100% - 28px)',marginTop:8,background:'#061b35',borderRadius:8,overflow:'hidden'}}>{pdf&&index+1<total?<SlideCanvas file={pdf} page={index+2} onPageCount={onPageCount}/>:<div style={{padding:20}}>End of presentation</div>}</div></div>
 <div style={{flex:'1 1 0',minHeight:0,background:'#102c4f',padding:18,borderRadius:8,overflowY:'auto'}}><strong style={{color:'#e6c382'}}>Private speaker notes</strong><p style={{fontSize:'clamp(16px,1.3vw,22px)',whiteSpace:'pre-wrap',lineHeight:1.5}}>{info.slides[index]?.notes||'No notes on this slide.'}</p></div>
  </div></div>
 <footer style={{display:'flex',alignItems:'center',justifyContent:'center',gap:18}}><button type="button" disabled={index===0} onClick={()=>{const n=Math.max(0,index-1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>← Previous</button><strong>{index+1} / {total}</strong><button type="button" disabled={index>=total-1} onClick={()=>{const n=Math.min(total-1,index+1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Next →</button></footer>
 </div>}
 {speakerMode&&qaOpen&&liveMode&&resolvedId&&<PresenterQuestions token={presenterToken} presentationId={resolvedId} onClose={()=>setQaOpen(false)}/>}
 {info.warnings.length>0&&<p style={{color:'#ffcbc4'}}>{info.warnings.join('; ')}</p>}
 <p style={{color:'#bbcada',fontSize:13}}>Private laptop preview only. Slides now render page-by-page at high resolution with the original proportions. TV/PRISM broadcasting is still disabled.</p>
 </>}
 <style jsx>{`button{background:#e2bd77;border:none;padding:11px 18px;border-radius:6;font-weight:bold;color:#081d39;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>;
}
