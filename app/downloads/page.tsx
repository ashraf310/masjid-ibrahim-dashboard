import type {Metadata} from 'next';
import ApkDownload from './ApkDownload';

export const metadata:Metadata={
 title:'Downloads | Masjid Ibrahim Staging',
 description:'Download the staging Android TV app for Masjid Ibrahim digital signage.',
 robots:{index:false,follow:false}
};
export default function Downloads(){
 const panel:React.CSSProperties={background:'#112e50',border:'1px solid #365678',borderRadius:15,padding:'clamp(20px,3vw,36px)'};
 return <main style={{minHeight:'100dvh',background:'linear-gradient(140deg,#07182f,#0c2a4a)',color:'#f6f3ea',fontFamily:'Arial,sans-serif',padding:'clamp(18px,5vw,64px)'}}>
  <div style={{maxWidth:900,margin:'auto'}}>
   <p style={{letterSpacing:2,color:'#e6c27f',fontWeight:700,fontSize:13}}>MASJID IBRAHIM · STAGING</p>
   <h1 style={{fontSize:'clamp(32px,4vw,52px)',margin:'12px 0'}}>Downloads</h1>
   <p style={{color:'#c9d9e8',lineHeight:1.6,fontSize:18}}>Install and test the Masjid Ibrahim digital signage application on an Android TV. This is a staging build, not the production application.</p>
   <ApkDownload />
   <section style={{...panel,marginTop:22}}>
    <h2 style={{marginTop:0}}>Installation steps</h2>
    <ol style={{paddingLeft:24,lineHeight:2,fontSize:16,color:'#d9e4ed'}}>
     <li>Download the APK from this page when available.</li>
     <li>Transfer it to your Android TV using USB or a trusted file-transfer method.</li>
     <li>Install and launch <strong>Masjid Ibrahim TV STAGING</strong>.</li>
     <li>In <a href="/tv-management" style={{color:'#e8c67f'}}>TV Management</a>, generate a new six-digit pairing code for the appropriate TV.</li>
     <li>Enter that code on the TV within 10 minutes. The TV saves its device credential for future launches.</li>
    </ol>
    <p style={{fontSize:14,color:'#b7cad9',lineHeight:1.6}}>This APK is a debug-signed testing build. Keep your working production app installed and test on one TV first. Android may require permission to install apps from your selected source.</p>
   </section>
   <footer style={{marginTop:30,display:'flex',gap:22,flexWrap:'wrap'}}>
    <a href="/tv-management" style={{color:'#e6c27f'}}>TV Management</a>
    <a href="/presenter-management" style={{color:'#e6c27f'}}>Presenter Management</a>
    <a href="/" style={{color:'#e6c27f'}}>Staging Dashboard</a>
   </footer>
  </div>
 </main>;
}
