'use client';
import {useState} from 'react';
import {validatePresentationFile} from '../../lib/presentation-validation';
export default function PresenterDemo(){
 const [file,setFile]=useState<{name:string;size:number}|null>(null);
 const [error,setError]=useState('');
 const [qa,setQa]=useState(false);
 const [slide,setSlide]=useState(1);
 const [qr,setQr]=useState(false);
 const [count,setCount]=useState(8);
 // This page is strictly a local mock. No credential, upload, or remote action is possible.
 return <main style={{minHeight:'100vh',padding:'4vw',background:'#081d39',color:'#f8f3e5',fontFamily:'Arial,sans-serif'}}>
 <div style={{maxWidth:1050,margin:'0 auto'}}>
 <p style={{color:'#e6ba6d',fontWeight:'bold'}}>MASJID IBRAHIM · STAGING DESIGN MOCKUP</p><h1>Presenter Portal</h1>
 <p style={{padding:12,border:'1px solid #e6ba6d',borderRadius:8}}>This is a nonfunctional interface prototype. It does not upload, store, publish, or control any presentation or TV.</p>
 <section style={{padding:20,background:'#123355',borderRadius:12,margin:'20px 0'}}><h2>Prepare presentation</h2>
 <label htmlFor="presentation-file">Select a PPTX or PDF (max 50 MB)</label><br/><input id="presentation-file" type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const result=validatePresentationFile(f);if(!result.ok){setFile(null);setError(result.error);}else{setFile({name:f.name,size:f.size});setError('');}}} style={{marginTop:12,maxWidth:'100%'}}/>
 {error&&<p role="alert" style={{color:'#ffb4ab'}}>{error}</p>}{file&&<p>Selected: {file.name} ({Math.round(file.size/1024)} KB). Conversion and uploads are not enabled.</p>}</section>
 <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
 <div style={{background:'#123355',padding:18,borderRadius:12}}><h2>Current slide · {slide}/{count}</h2><div style={{background:'#fbf8ee',color:'#123355',aspectRatio:'16/9',display:'grid',placeItems:'center',textAlign:'center',borderRadius:6,padding:12}}>Slide {slide} Preview</div><div style={{display:'flex',gap:10,marginTop:15}}><button onClick={()=>setSlide(Math.max(1,slide-1))}>Previous</button><button onClick={()=>setSlide(Math.min(count,slide+1))}>Next</button></div></div>
 <div style={{background:'#123355',padding:18,borderRadius:12}}><h2>Next slide</h2><div style={{background:'#fbf8ee',color:'#123355',aspectRatio:'16/9',display:'grid',placeItems:'center',borderRadius:6}}>Slide {Math.min(count,slide+1)} Preview</div><h3>Private speaker notes</h3><p>No notes loaded. Notes will be visible only to authorized presenters.</p></div>
 </section><section style={{padding:20,marginTop:18,background:'#123355',borderRadius:12}}><h2>Live Q&A · controls mockup</h2>
 <label><input type="checkbox" checked={qa} onChange={e=>{setQa(e.target.checked);if(!e.target.checked)setQr(false);}}/> Accept attendee questions</label><br/><label><input type="checkbox" checked={qr} disabled={!qa} onChange={e=>setQr(e.target.checked)}/> Show bottom QR banner on audience display</label><p>Status: {qa?'Q&A open (mock)':'Q&A closed (mock)'} · QR {qr?'shown':'hidden'}</p>
 <p style={{color:'#d5c4a1'}}>No real QR code, questions, session, or TV switching has been created.</p></section>
 </div><style jsx>{`button{padding:10px 15px;background:#e2bb6e;color:#081d39;font-weight:bold;border:0;border-radius:6;cursor:pointer}input{accent-color:#e2bb6e}`}</style></main>;
}
