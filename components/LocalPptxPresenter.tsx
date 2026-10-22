'use client';
import {useEffect,useState} from 'react';
import type {PptxInfo} from '../lib/inspect-pptx';

/** Presenter-only preparation: speaker's original PPTX notes + its exported PDF slides.
 * No PDF or notes are broadcast, uploaded or shared from this component. */
export default function LocalPptxPresenter({file}:{file:File}){
 const [info,setInfo]=useState<PptxInfo|null>(null);
 const [error,setError]=useState('');
 const [index,setIndex]=useState(0);
 const [pdf,setPdf]=useState<File|null>(null);
 const [pdfUrl,setPdfUrl]=useState('');
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
 useEffect(()=>{if(!pdf){setPdfUrl('');return}const url=URL.createObjectURL(pdf);setPdfUrl(url);return()=>URL.revokeObjectURL(url)},[pdf]);
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{
 if(!info?.slides.length)return;
 const t=e.target as HTMLElement|null;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;
 if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setIndex(v=>Math.min(info.slides.length-1,v+1))}
 if(e.key==='ArrowLeft'){e.preventDefault();setIndex(v=>Math.max(0,v-1))}
 };window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[info]);
 const total=info?.slides.length||0;
 return <section style={{marginTop:22,padding:22,background:'#12395c',borderRadius:12}}>
 <h2>PowerPoint Presenter View</h2>
 <p style={{color:'#e0c68d'}}>The PPTX provides private speaker notes. To see accurate slide graphics, run the local PowerPoint conversion helper and click Convert PPTX automatically. Manual PDF export remains a fallback. Both files stay on this laptop for this preview.</p>
 {!info&&!error&&<p>Reading PowerPoint slide order and notes...</p>}
 {error&&<p role="alert" style={{color:'#ffbbb6'}}>{error}</p>}
 {info&&<><p>{total} PowerPoint slides detected</p>
 <div style={{padding:14,background:'#091f3b',borderRadius:8,marginBottom:16}}>
 <strong>Automatic PowerPoint conversion on this laptop</strong><p style={{fontSize:13}}>Start the local presenter helper once (Python 3 and LibreOffice required), then click below. No slides or notes are sent to a cloud conversion service.</p><button type="button" disabled={converting} onClick={()=>void convertAutomatically()}>{converting?'Converting PowerPoint...':'Convert PPTX automatically'}</button>{convertError&&<p role="alert" style={{color:'#ffb8b8'}}>{convertError}</p>}{pdf&&<p style={{color:'#b7f0cc'}}>Slide PDF prepared locally: {pdf.name}</p>}<div style={{marginTop:14}}><label htmlFor="companion-pdf"><strong>Fallback: select your manually exported PDF</strong></label></div>
 <input id="companion-pdf" type="file" accept=".pdf,application/pdf" style={{display:'block',marginTop:12,maxWidth:'100%'}} onChange={e=>{const f=e.target.files?.[0]||null;setPdf(f&&f.name.toLowerCase().endsWith('.pdf')&&f.size<=50*1024*1024?f:null);setIndex(0)}}/>
 <p style={{fontSize:13,color:'#c2d0e0'}}>The slide count and ordering must match the PPTX. Automatic matching and high-resolution image conversion are not yet implemented.</p>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
 <div><strong>Current slide {index+1}</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #d1af70',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdfUrl?<iframe key={pdfUrl+':'+index} title={'Current slide '+(index+1)} src={pdfUrl+'#page='+(index+1)+'&view=Fit&toolbar=0&navpanes=0'} style={{border:0,width:'100%',height:'100%',pointerEvents:'none'}}/>:<span style={{padding:15,textAlign:'center'}}>Select the matching exported PDF to preview actual slide images.</span>}
 </div></div>
 <div><strong>Next slide</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #4c6480',borderRadius:8,aspectRatio:'16/9',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
 {pdfUrl&&index+1<total?<iframe key={pdfUrl+':'+(index+1)} title={'Next slide '+(index+2)} src={pdfUrl+'#page='+(index+2)+'&view=Fit&toolbar=0&navpanes=0'} style={{border:0,width:'100%',height:'100%',pointerEvents:'none'}}/>:<span>{index+1<total?'Slide '+(index+2):'End of presentation'}</span>}
 </div></div>
 </div>
 <div style={{marginTop:16,padding:16,background:'#091f3b',borderRadius:8}}><strong>Private speaker notes</strong><p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{info.slides[index]?.notes||'No speaker notes on this slide.'}</p></div>
 <div style={{display:'flex',gap:14,alignItems:'center',marginTop:15}}>
 <button type="button" disabled={index===0} onClick={()=>setIndex(v=>Math.max(0,v-1))}>Previous</button><strong>{index+1} / {total}</strong><button type="button" disabled={index>=total-1} onClick={()=>setIndex(v=>Math.min(total-1,v+1))}>Next</button></div>
 {info.warnings.length>0&&<p style={{color:'#ffcbc4'}}>{info.warnings.join('; ')}</p>}
 <p style={{color:'#bbcada',fontSize:13}}>Private laptop preview only. Embedded browser PDF viewers may ignore page selectors. No slide images or notes are currently synchronized to hall TVs, PRISM, or audience endpoints.</p>
 </>}
 <style jsx>{`button{background:#e2bd77;border:none;padding:11px 18px;border-radius:6;font-weight:bold;color:#081d39;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>;
}
