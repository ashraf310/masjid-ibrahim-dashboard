'use client';
import {useEffect,useRef,useState} from 'react';
type PdfModule=typeof import('pdfjs-dist');
type DocumentType=Awaited<ReturnType<PdfModule['getDocument']>['promise']>;
export default function SlideCanvas({file,page,onPageCount}:{file:File;page:number;onPageCount:(n:number)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const [doc,setDoc]=useState<DocumentType|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{let active=true;let loaded:DocumentType|null=null;setDoc(null);setError('');
 (async()=>{const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});loaded=await task.promise;
 if(!active){await loaded.destroy();return}setDoc(loaded);onPageCount(loaded.numPages);
 })().catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to read converted PDF')});
 return()=>{active=false;setDoc(null);if(loaded)void loaded.destroy()};
 },[file,onPageCount]);
 useEffect(()=>{if(!doc||!canvas||page<1||page>doc.numPages)return;let closed=false;let task:{cancel:()=>void;promise:Promise<unknown>}|null=null;
 (async()=>{const pdfPage=await doc.getPage(page);if(closed)return;
 const base=pdfPage.getViewport({scale:1});const scale=Math.min(3,Math.max(1,1920/base.width));const viewport=pdfPage.getViewport({scale});
 const el=canvas.current;if(!el)return;el.width=Math.ceil(viewport.width);el.height=Math.ceil(viewport.height);
 const context=el.getContext('2d');if(!context)return;
 task=pdfPage.render({canvas:el,canvasContext:context,viewport});await task.promise;
 })().catch(e=>{if(!closed&&(e as {name?:string})?.name!=='RenderingCancelledException')setError('Could not render slide '+page)});
 return()=>{closed=true;task?.cancel()};
 },[doc,page]);
 return <div style={{background:'#061b35',display:'flex',alignItems:'center',justifyContent:'center',height:'100%',width:'100%',overflow:'hidden'}}>
 {error?<span role="alert" style={{color:'#ffb6ab',padding:12}}>{error}</span>:<canvas ref={canvas} aria-label={'Rendered slide '+page} style={{width:'auto',height:'auto',maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>}
 </div>;
}
