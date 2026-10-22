'use client';
import {useEffect,useState} from 'react';
import type {PptxInfo} from '../lib/inspect-pptx';
export default function LocalPptxPresenter({file}:{file:File}){
 const [info,setInfo]=useState<PptxInfo|null>(null),[error,setError]=useState(''),[index,setIndex]=useState(0);
 useEffect(()=>{let active=true;setInfo(null);setError('');setIndex(0);
 import('../lib/inspect-pptx').then(m=>m.inspectPptx(file)).then(result=>{if(active)setInfo(result)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'PPTX processing failed')});
 return()=>{active=false};
 },[file]);
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(!info)return;const target=e.target as HTMLElement|null;
 if(target&&(/INPUT|TEXTAREA|SELECT/.test(target.tagName)||target.isContentEditable))return;
 if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setIndex(v=>Math.min(info.slides.length-1,v+1))}
 else if(e.key==='ArrowLeft'){e.preventDefault();setIndex(v=>Math.max(0,v-1))}
 };window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[info]);
 const note=info?.slides[index]?.notes||'No speaker notes on this slide.';
 return <section style={{marginTop:22,padding:22,background:'#12395c',borderRadius:12}}>
 <h2>PowerPoint Presenter View — Local Preparation</h2>
 <p style={{color:'#e0c68d'}}>Speaker notes are extracted on your laptop. Full-fidelity slide rendering requires the conversion helper; it is not installed or enabled yet.</p>
 {!info&&!error&&<p>Reading slide structure and notes...</p>}
 {error&&<p role="alert" style={{color:'#ffbbb6'}}>{error}</p>}
 {info&&<><p>{info.slides.length} slides detected</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(235px,1fr))',gap:16}}>
 <div><strong>Current slide {index+1}</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #d1af70',borderRadius:8,aspectRatio:'16/9',display:'grid',placeItems:'center',padding:12,textAlign:'center'}}>Slide image awaiting conversion</div></div>
 <div><strong>Next slide</strong><div style={{marginTop:10,background:'#061b35',border:'1px solid #4c6480',borderRadius:8,aspectRatio:'16/9',display:'grid',placeItems:'center',padding:12,textAlign:'center'}}>{index+1<info.slides.length?'Slide '+(index+2):'End of presentation'}</div></div>
 </div>
 <div style={{marginTop:16,padding:16,background:'#091f3b',borderRadius:8}}><strong>Private speaker notes</strong><p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{note}</p></div>
 <div style={{display:'flex',gap:14,alignItems:'center',marginTop:15}}>
 <button type="button" disabled={index===0} onClick={()=>setIndex(v=>Math.max(0,v-1))}>Previous</button><strong>{index+1} / {info.slides.length}</strong><button type="button" disabled={index>=info.slides.length-1} onClick={()=>setIndex(v=>Math.min(info.slides.length-1,v+1))}>Next</button></div>
 {info.warnings.length>0&&<p style={{color:'#ffcbc4'}}>{info.warnings.join('; ')}</p>}
 <p style={{color:'#bbcada',fontSize:13}}>This is a private local preparation view, not the live audience display. Slide images are intentionally not simulated or sent to TVs.</p>
 </>}
 <style jsx>{`button{background:#e2bd77;border:none;padding:11px 18px;border-radius:6;font-weight:bold;color:#081d39;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>
}