'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy} from 'pdfjs-dist';
type Props={file:File};
export default function LocalPdfSlides({file}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const doc=useRef<PDFDocumentProxy|null>(null);
 const [page,setPage]=useState(1),[total,setTotal]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;setLoading(true);setError('');setPage(1);setTotal(0);
  (async()=>{
   const pdfjs=await import('pdfjs-dist');
   pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
   const bytes=await file.arrayBuffer();
   const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise;
   if(!active){void pdf.destroy();return;}
   doc.current=pdf;setTotal(pdf.numPages);setLoading(false);
  })().catch(e=>{if(active){setLoading(false);setError(e instanceof Error?e.message:'Unable to open PDF')}});
  return()=>{active=false;const current=doc.current;doc.current=null;if(current)void current.destroy()};
 },[file]);
 useEffect(()=>{const pdf=doc.current,el=canvas.current;if(!pdf||!el||!total)return;let cancelled=false;let renderTask:{cancel:()=>void;promise:Promise<unknown>}|null=null;
  (async()=>{
   const slide=await pdf.getPage(page);if(cancelled)return;
   const base=slide.getViewport({scale:1});
   const scale=Math.min(2.5,Math.max(1.0,1920/base.width));
   const viewport=slide.getViewport({scale});
   const context=el.getContext('2d');if(!context)throw Error('Canvas not supported');
   el.width=Math.ceil(viewport.width);el.height=Math.ceil(viewport.height);
   renderTask=slide.render({canvasContext:context,canvas:el,viewport});
   await renderTask.promise;
  })().catch(e=>{if(!cancelled && (e as {name?:string})?.name!=='RenderingCancelledException')setError('Could not render this PDF page')});
  return()=>{cancelled=true;renderTask?.cancel()};
 },[page,total]);
 const change=useCallback((diff:number)=>setPage(p=>Math.min(total,Math.max(1,p+diff))),[total]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{const el=e.target as HTMLElement|null;if(el&&(/INPUT|TEXTAREA|SELECT/.test(el.tagName)||el.isContentEditable))return;
  if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();change(1)}else if(e.key==='ArrowLeft'){e.preventDefault();change(-1)}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[change]);
 return <section style={{border:'1px solid #b8995b',borderRadius:12,background:'#113052',padding:20,marginTop:22}}>
  <h2>PDF slide preview (local)</h2>
  <p style={{color:'#d4deeb'}}>This preview renders on your laptop. Publishing the converted slides to TVs is not yet enabled.</p>
  {loading&&<p>Preparing PDF pages...</p>}{error&&<p role="alert" style={{color:'#ffc0b9'}}>{error}</p>}
  {total>0&&<><div style={{aspectRatio:'16/9',background:'#071b36',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,padding:12}}>
    <canvas ref={canvas} aria-label={'PDF page '+page+' of '+total} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',width:'auto',height:'auto'}}/>
   </div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:15}}>
    <button type="button" onClick={()=>change(-1)} disabled={page===1}>Previous</button><strong>Slide {page} / {total}</strong><button type="button" onClick={()=>change(1)} disabled={page===total}>Next</button>
   </div>
   <p style={{color:'#bbcddd',fontSize:13}}>Original aspect ratio preserved. Use left/right arrow keys or Space when not typing.</p></>}
  <style jsx>{`button{background:#dfb973;color:#09203b;border:0;border-radius:6;padding:12px 17px;font-weight:bold;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>
}