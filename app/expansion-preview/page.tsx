import Link from 'next/link';
import {DISPLAY_OPTIONS} from '../../lib/presentation-types';
export const metadata={title:'Expansion Preview | Masjid Ibrahim'};
export default function ExpansionPreview(){
 if(process.env.NEXT_PUBLIC_ENABLE_EXPANSION_PREVIEW!=='true')return <main style={{padding:40,fontFamily:'Arial,sans-serif'}}><h1>Not available</h1><p>Expansion preview is disabled. Existing outdoor dashboard remains available.</p><Link href="/">Outdoor Dashboard</Link></main>;
 return <main style={{minHeight:'100vh',padding:'5vw',background:'#081d39',color:'#f8f3e5',fontFamily:'Arial,sans-serif'}}>
 <header style={{marginBottom:35,borderBottom:'2px solid #b99857',paddingBottom:20}}><h1 style={{fontSize:'clamp(28px,4vw,60px)',margin:0}}>MASJID IBRAHIM</h1><p style={{color:'#d3b16c'}}>Multi-Screen TV Selection — Staging Preview</p></header>
 <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:20}}>
 {DISPLAY_OPTIONS.map((d,i)=><article key={d.id} style={{border:'2px solid #c6a05a',borderRadius:16,padding:24,background:'#113358',minHeight:180}}>
 <div style={{fontSize:30,marginBottom:18}}>{['▣','◉','▶','＋'][i]}</div><h2>{d.name}</h2><p style={{color:'#d2dfed'}}>{d.description}</p><p style={{fontSize:12,color:'#e2bc76'}}>Preview only · Device registration required before activation</p>
 </article>)}</section>
 <p style={{marginTop:30,color:'#b9cddd'}}>The final Android TV selector will support remote navigation, per-TV saved assignments, and Admin control. None of these previews can change a live TV.</p>
 </main>
}
