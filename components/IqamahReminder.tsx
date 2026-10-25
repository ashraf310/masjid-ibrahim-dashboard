'use client';
import officialLogo from '../Masjid Ibrahim Logo_official_transp.png';
const arabic:Record<string,string>={Fajr:'الفجر',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء','Jumu’ah 1':'الجمعة الأولى','Jumu’ah 2':'الجمعة الثانية'};
export default function IqamahReminder({prayer,preview=false}:{prayer:string;preview?:boolean}){
 const name=prayer.startsWith('Jumu')?'JUMU’AH '+(prayer.endsWith('1')?'1':'2'):prayer.toUpperCase();
 return <main className="iqamah-screen" aria-label={prayer+' Iqamah reminder'}>
  <header className="iqamah-logo"><img src={officialLogo.src} alt="Masjid Ibrahim official logo"/></header>
  <section className="iqamah-card">
   <div className="iqamah-title"><span>{name}</span><span className="iqamah-arabic" lang="ar" dir="rtl">{arabic[prayer]||''}</span></div>
   <div className="iqamah-rule"><span>✥</span></div>
   <div className="iqamah-content"><svg className="silence-symbol" viewBox="0 0 120 120" role="img" aria-label="No phone sound"><circle cx="60" cy="60" r="51" fill="none" stroke="#ed1735" strokeWidth="9"/><rect x="42" y="26" width="35" height="66" rx="5" fill="#f0f8ff" stroke="#91c2e4" strokeWidth="5"/><path d="M51 35h17M52 83h14" stroke="#467aa5" strokeWidth="3"/><path d="M82 45q15 15 0 30M88 38q24 22 0 44" fill="none" stroke="#9cc5e7" strokeWidth="5" strokeLinecap="round"/><path d="M24 24 96 96" stroke="#ed1735" strokeWidth="10" strokeLinecap="round"/></svg><div className="message"><strong>Please turn off<br/>your cell phone</strong><p>Silence your device and prepare for prayer.</p></div></div>
   <div className="iqamah-rule"><span>✥</span></div>
   <footer>The main dashboard will return shortly.</footer>
  </section>
  {preview&&<span className="preview-mark">PREVIEW MODE — NOT LIVE</span>}
  <style jsx>{`
  .iqamah-screen{box-sizing:border-box;width:100vw;height:100dvh;min-height:450px;padding:2vh 7vw 3vh;background:repeating-linear-gradient(45deg,transparent 0 120px,#2f67bc70 121px,#2f67bc70 123px,transparent 124px 240px),repeating-linear-gradient(-45deg,transparent 0 120px,#2f67bc65 121px,#2f67bc65 123px,transparent 124px 240px),radial-gradient(ellipse at center,#0752ce,#092855 90%);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif}
  .iqamah-logo{height:13%;max-height:110px;display:flex;align-items:center;justify-content:center;padding-bottom:1vh}.iqamah-logo img{max-height:100%;max-width:145px;object-fit:contain;filter:brightness(0) invert(1)}
  .iqamah-card{width:min(100%,1250px);flex:1;max-height:78vh;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;border:3px solid #eabd6f;border-radius:clamp(18px,3vw,42px);background:linear-gradient(135deg,#07377bbd,#0651bbba);padding:2vh 5vw;text-align:center;box-sizing:border-box;box-shadow:0 3px 24px #04132b99}
  .iqamah-title{display:flex;align-items:center;justify-content:center;gap:2.5vw;font-family:Georgia,serif;font-size:clamp(29px,5vw,76px);font-weight:700;color:#f8cc80;white-space:nowrap}.iqamah-arabic{border-left:2px solid #eabd6f;padding-left:2.5vw;font-family:Arial,sans-serif;font-size:.82em}
  .iqamah-rule{display:flex;align-items:center;justify-content:center;gap:1vw;width:72%;color:#eac47b;font-size:clamp(15px,2vw,28px)}.iqamah-rule:before,.iqamah-rule:after{content:"";height:2px;flex:1;background:#eac47b}
  .iqamah-content{display:flex;align-items:center;justify-content:center;gap:3vw;text-align:left;width:100%}.silence-symbol{width:clamp(90px,13vw,210px);height:auto;flex:none}.message strong{display:block;font-size:clamp(30px,4vw,69px);line-height:1.07}.message p{font-size:clamp(16px,1.9vw,33px);margin:.8em 0 0;line-height:1.3}.iqamah-card footer{font-size:clamp(14px,1.6vw,27px)}.preview-mark{position:fixed;left:12px;bottom:10px;font-size:14px;padding:8px 12px;background:#061e39}
  @media(max-width:700px){.iqamah-screen{padding:2vh 4vw}.iqamah-title{font-size:clamp(22px,4.4vw,38px)}.iqamah-content{gap:1vw}.message strong{font-size:clamp(23px,4vw,38px)}.silence-symbol{width:26%}.iqamah-card{padding:2vh 3vw}}
  `}</style>
 </main>;
}
