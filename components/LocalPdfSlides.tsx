'use client';
import {useEffect,useState} from 'react';
export default function LocalPdfSlides({file}:{file:File}){
 const [url,setUrl]=useState('');
 const [page,setPage]=useState(1);
 useEffect(()=>{const objectUrl=URL.createObjectURL(file);setUrl(objectUrl);setPage(1);return()=>{URL.revokeObjectURL(objectUrl);setUrl('')}},[file]);
 const next=(step:number)=>setPage(p=>Math.max(1,p+step));
 return <section style={{border:'1px solid #b8995b',borderRadius:12,background:'#113052',padding:20,marginTop:22}}>
 <h2>PDF preview (local)</h2><p style={{color:'#d4deeb'}}>PDF remains on this laptop for preview. Use the embedded viewer's page controls for reliable page navigation.</p>
 {url&&<div style={{background:'#071b36',borderRadius:8,padding:12}}>
 <iframe title="PDF preview" src={url+'#page='+page+'&view=Fit'} style={{border:0,width:'100%',height:'min(70vh,700px)',background:'#071b36'}}/>
 </div>}
 <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginTop:15}}>
 <button onClick={()=>next(-1)} type="button" disabled={page<=1}>Previous page</button>
 <span>Requested page {page}</span>
 <button onClick={()=>next(1)} type="button">Next page</button>
 </div><p style={{color:'#bbcddd',fontSize:13}}>This browser-native preview is temporary. Some browsers may ignore requested page navigation. High-resolution synchronized slide rendering is a separate step.</p>
 <style jsx>{`button{background:#dfb973;color:#09203b;border:0;border-radius:6;padding:12px 17px;font-weight:bold;cursor:pointer}button:disabled{opacity:.45}`}</style>
 </section>;
}