'use client';
import {useCallback,useEffect,useState} from 'react';
import SlideCanvas from './SlideCanvas';
import type {PptxInfo} from '../lib/inspect-pptx';

/** Presenter-only preparation: speaker's original PPTX notes + its exported PDF slides.
 * No PDF or notes are broadcast, uploaded or shared from this component. */
function PresenterQuestions({token,presentationId}:{token:string;presentationId:string}){
 const [questions,setQuestions]=useState<{id:string;question:string;status:string;created_at:string}[]>([]);
 const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch('/api/questions?presentationId='+encodeURIComponent(presentationId),{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error('Questions unavailable: apply staging SQL migration');setQuestions((await r.json()).questions||[]);setNotice('')}catch(e){setNotice(e instanceof Error?e.message:'Could not refresh')}},[token,presentationId]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),5000);return()=>clearInterval(timer)},[load]);
 async function moderate(id:string,status:'answered'|'hidden'|'new'){try{const r=await fetch('/api/questions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({presentationId,questionId:id,status})});if(!r.ok)throw Error('Moderation failed');void load()}catch(e){setNotice(String(e))}}
 return <section style={{background:'#0a294a',border:'1px solid #bfa46b',padding:16,borderRadius:9,marginTop:18}}><h3>Live Q&A · Presenter only</h3><p>Audience link: <a href="/questions" target="_blank" rel="noreferrer" style={{color:'#edd299'}}> /questions</a> · Questions never appear automatically on TVs.</p><button type="button" onClick={()=>void load()}>Refresh questions</button>{notice&&<p role="status">{notice}</p>}{questions.filter(q=>q.status!=='hidden').map(q=><div key={q.id} style={{borderTop:'1px solid #526e88',padding:'12px 0'}}><p style={{whiteSpace:'pre-wrap'}}>{q.question}</p><small>{q.status.toUpperCase()}</small> <button type="button" onClick={()=>void moderate(q.id,'answered')}>Mark answered</button><button type="button" onClick={()=>void moderate(q.id,'hidden')}>Hide</button></div>)}{!questions.length&&<p>No questions yet.</p>}</section>
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
   pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
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
 if(!info?.slides.length)return;
 const t=e.target as HTMLElement|null;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;
 if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setIndex(v=>{const n=Math.min(info.slides.length-1,v+1);if(liveMode)void liveAction('advance',n).catch(err=>setPublishMessage(String(err)));return n})}
 if(e.key==='ArrowLeft'){e.preventDefault();setIndex(v=>{const n=Math.max(0,v-1);if(liveMode)void liveAction('advance',n).catch(err=>setPublishMessage(String(err)));return n})}
 };window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[info,liveMode,resolvedId,presenterToken]);
 const total=info?.slides.length||0;
 return <section style={{marginTop:22,padding:22,background:'#12395c',borderRadius:12}}>
 <h2>PowerPoint Presenter View</h2>
 <button type="button" disabled={!pdf||pageCount!==total} onClick={()=>setSpeakerMode(true)}>Open full-screen speaker view</button>
 <p style={{color:'#e0c68d'}}>The PPTX provides private speaker notes. To see accurate slide graphics, run the local PowerPoint conversion helper and click Convert PPTX automatically. Manual PDF export remains a fallback. Both files stay on this laptop for this preview.</p>
 {!info&&!error&&<p>Reading PowerPoint slide order and notes...</p>}
 {error&&<p role="alert" style={{color:'#ffbbb6'}}>{error}</p>}
 {info&&<><p>{total} PowerPoint slides detected</p>
 <div style={{padding:14,background:'#091f3b',borderRadius:8,marginBottom:16}}>
 <strong>Automatic PowerPoint conversion on this laptop</strong><p style={{fontSize:13}}>Start the local presenter helper once (Python 3 and LibreOffice required), then click below. . No slides or notes are sent to a cloud conversion service.</p><button type="button" disabled={converting} onClick={()=>void convertAutomatically()}>{converting?'Converting PowerPoint...':'Convert PPTX automatically'}</button>{convertError&&<p role="alert" style={{color:'#ffb8b8'}}>{convertError}</p>}{pdf&&<p style={{color:'#b7f0cc'}}>Slide PDF prepared locally: {pdf.name}</p>}<div style={{marginTop:14}}><label htmlFor="companion-pdf"><strong>Fallback: select your manually exported PDF</strong></label></div>
 <input id="companion-pdf" type="file" accept=".pdf,application/pdf" style={{display:'block',marginTop:12,maxWidth:'100%'}} onChange={e=>{const f=e.target.files?.[0]||null;setPdf(f&&f.name.toLowerCase().endsWith('.pdf')&&f.size<=50*1024*1024?f:null);setIndex(0)}}/>
 <p style={{fontSize:13,color:pageCount!==null&&pageCount!==total?'#ffbab0':'#c2d0e0'}}>{pageCount===null?'Waiting for converted slide pages...':pageCount===total?'Verified: '+pageCount+' rendered slides match the PowerPoint notes.':'Mismatch: converted PDF has '+pageCount+' pages while PPTX has '+total+' slides. Do not present until corrected.'}</p>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
 <div><strong>Current slide {index+1}</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #d1af70',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdf?<SlideCanvas file={pdf} page={index+1} onPageCount={onPageCount}/>:<span style={{padding:15,textAlign:'center'}}>Select the matching exported PDF to preview actual slide images.</span>}
 </div></div>
 <div><strong>Next slide</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #4c6480',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdf&&index+1<total?<SlideCanvas file={pdf} page={index+2} onPageCount={onPageCount}/>:<span>{index+1<total?'Slide '+(index+2):'End of presentation'}</span>}
 </div></div>
 </div>
 <div style={{marginTop:16,padding:16,background:'#091f3b',borderRadius:8}}><strong>Private speaker notes</strong><p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{info.slides[index]?.notes||'No speaker notes on this slide.'}</p></div>
 {liveMode&&resolvedId&&<PresenterQuestions token={presenterToken} presentationId={resolvedId}/>}
 <div style={{display:'flex',gap:14,alignItems:'center',marginTop:15}}>
 <button type="button" disabled={index===0} onClick={()=>{const n=Math.max(0,index-1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Previous</button><strong>{index+1} / {total}</strong><button type="button" disabled={index>=total-1} onClick={()=>{const n=Math.min(total-1,index+1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Next</button></div>
 <section style={{marginTop:20,padding:16,border:'1px solid #d2af71',borderRadius:8}}>
 <h3>Staging audience test (not connected to Masjid TVs)</h3>
 <p style={{fontSize:13}}>Your converted slide images, but never your speaker notes, will be uploaded to private staging storage for this test.</p>
 {!presentationId&&<p role="status" style={{color:'#ffd58d'}}>When you click Prepare slides, this PPTX will be uploaded automatically if it is not already stored. Your presenter link remains unchanged.</p>}
 {presentationId&&pdf&&pageCount!==total&&<p role="status" style={{color:'#ffd58d'}}>Converted slide count does not match PowerPoint; please reconvert before publishing.</p>}
 <button type="button" disabled={publishing||!pdf||pageCount!==total||liveMode} onClick={()=>void publish()}>{publishing?'Publishing...':'Prepare slides for audience preview'}</button>
 {presentationId&&<button type="button" onClick={()=>void getAudienceLink()}>Retrieve existing audience link</button>}
 {audiencePath&&<p><a style={{color:'#e2bd77',textDecoration:'underline'}} href={audiencePath} target="_blank" rel="noopener noreferrer">Open private staging audience preview</a> — share only with test viewers.</p>}
 {audiencePath&&!liveMode&&<button type="button" disabled={publishing} onClick={()=>void start()}>Start staging presentation</button>}
 {liveMode&&<button type="button" onClick={()=>void end()}>End staging presentation</button>}
 {publishMessage&&<p role="status">{publishMessage}</p>}
 </section>
 {speakerMode&&<div role="dialog" aria-modal="true" aria-label="Full-screen speaker view" style={{position:'fixed',inset:0,zIndex:10000,background:'#07172e',color:'#fff',padding:20,boxSizing:'border-box',display:'flex',flexDirection:'column',gap:14}}>
 <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><strong style={{fontSize:20}}>Masjid Ibrahim · Speaker View</strong><span>Slide {index+1} of {total} {liveMode?'· LIVE (STAGING)':'· PREVIEW'}</span><button type="button" onClick={()=>setSpeakerMode(false)}>Exit speaker view</button></header>
 <div style={{display:'grid',gridTemplateColumns:'minmax(0,3fr) minmax(240px,1fr)',gap:16,flex:'1 1 0',minHeight:0}}>
 <div style={{background:'#061b35',border:'1px solid #b99456',borderRadius:8,overflow:'hidden',minHeight:0}}>{pdf&&<SlideCanvas file={pdf} page={index+1} onPageCount={onPageCount}/>}</div>
 <div style={{display:'flex',flexDirection:'column',gap:14,minHeight:0}}>
 <div style={{flex:'0 0 36%',minHeight:0}}><strong>Next slide</strong><div style={{height:'calc(100% - 28px)',marginTop:8,background:'#061b35',borderRadius:8,overflow:'hidden'}}>{pdf&&index+1<total?<SlideCanvas file={pdf} page={index+2} onPageCount={onPageCount}/>:<div style={{padding:20}}>End of presentation</div>}</div></div>
 <div style={{flex:'1 1 0',minHeight:0,background:'#102c4f',padding:18,borderRadius:8,overflowY:'auto'}}><strong style={{color:'#e6c382'}}>Private speaker notes</strong><p style={{fontSize:'clamp(17px,1.45vw,25px)',whiteSpace:'pre-wrap',lineHeight:1.5}}>{info.slides[index]?.notes||'No notes on this slide.'}</p></div>
 </div></div>
 <footer style={{display:'flex',alignItems:'center',justifyContent:'center',gap:18}}><button type="button" disabled={index===0} onClick={()=>{const n=Math.max(0,index-1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>← Previous</button><strong>{index+1} / {total}</strong><button type="button" disabled={index>=total-1} onClick={()=>{const n=Math.min(total-1,index+1);setIndex(n);if(liveMode)void liveAction('advance',n).catch(e=>setPublishMessage(String(e)))}}>Next →</button></footer>
 </div>}
 {info.warnings.length>0&&<p style={{color:'#ffcbc4'}}>{info.warnings.join('; ')}</p>}
 <p style={{color:'#bbcada',fontSize:13}}>Private laptop preview only. Slides now render page-by-page at high resolution with the original proportions. TV/PRISM broadcasting is still disabled.</p>
 </>}
 <style jsx>{`button{background:#e2bd77;border:none;padding:11px 18px;border-radius:6;font-weight:bold;color:#081d39;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>;
}
