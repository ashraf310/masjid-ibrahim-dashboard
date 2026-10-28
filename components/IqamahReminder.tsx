'use client';
const officialLogo={src:'/masjid-ibrahim-logo-new.png'};

const arabic:Record<string,string>={Fajr:'الفجر',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء','Jumu’ah 1':'الجمعة الأولى','Jumu’ah 2':'الجمعة الثانية'};
export default function IqamahReminder({prayer,preview=false}:{prayer:string;preview?:boolean}){
 const name=prayer.startsWith('Jumu')?'JUMU’AH '+(prayer.endsWith('1')?'1':'2'):prayer.toUpperCase();
 return <main className="iqamah-screen" aria-label={prayer+' prayer announcement'}>
  <header className="iqamah-logo"><img src={officialLogo.src} alt="Official Masjid Ibrahim logo"/></header>
  <section className="iqamah-card">
   <div className="iqamah-title"><span>{name}</span><span className="iqamah-arabic" lang="ar" dir="rtl">{arabic[prayer]||''}</span></div>
   <div className="iqamah-rule"><span>✦</span></div>
   <svg className="silence-symbol" viewBox="0 0 120 120" role="img" aria-label="Please silence your mobile phone"><circle cx="60" cy="60" r="51" fill="none" stroke="#F21D3E" strokeWidth="9"/><rect x="42" y="27" width="35" height="66" rx="5" fill="#f0f8ff" stroke="#91c2e4" strokeWidth="5"/><path d="M51 35h17M52 83h14" stroke="#467aa5" strokeWidth="3"/><path d="M82 45q15 15 0 30M88 38q24 22 0 44" fill="none" stroke="#9cc5e7" strokeWidth="5" strokeLinecap="round"/><path d="M24 24 96 96" stroke="#F21D3E" strokeWidth="10" strokeLinecap="round"/></svg>
   <h1>PLEASE SILENCE ALL MOBILE DEVICES</h1>
   <div className="iqamah-callout">In the absence of the Imam, please wait 2 minutes<br className="wide-only"/> before starting the Iqamah.</div>
   <div className="iqamah-rule lower"><span>✦</span></div>
   <footer>Jazakum Allahu Khairan for your cooperation.</footer>
  </section>
  {preview&&<span className="preview-mark">PREVIEW MODE — NOT LIVE</span>}
  <style jsx>{`
  .iqamah-screen{--navy:#082B4D;--gold:#D8B26A;box-sizing:border-box;width:100vw;height:100dvh;min-height:460px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5vh 7vw 2.5vh;overflow:hidden;color:#f9f7f0;font-family:Inter,Montserrat,Arial,sans-serif;background:repeating-linear-gradient(45deg,transparent 0 115px,#6e8bb527 116px,#6e8bb527 118px,transparent 119px 232px),repeating-linear-gradient(-45deg,transparent 0 115px,#6e8bb527 116px,#6e8bb527 118px,transparent 119px 232px),radial-gradient(ellipse at 45% 25%,#103c67 0%,#082B4D 65%,#031a33 100%)}
  .iqamah-logo{height:14%;max-height:126px;display:flex;justify-content:center;align-items:center;z-index:1;margin-bottom:-.3vh}.iqamah-logo img{max-width:clamp(85px,10vw,170px);height:100%;object-fit:contain;filter:brightness(0) invert(1)}
  .iqamah-card{box-sizing:border-box;width:min(100%,1380px);max-height:81vh;flex:1;min-height:0;border:3px solid var(--gold);border-radius:clamp(20px,3vw,42px);box-shadow:0 14px 38px #0005,inset 0 1px 0 #ffffff14;background:radial-gradient(ellipse at 50% 5%,#104375 0%,#082B4D 65%,#041b32 100%);padding:3vh 4.5vw 2.2vh;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
  .iqamah-title{display:flex;align-items:center;justify-content:center;gap:2vw;font-family:Cinzel,Georgia,'Times New Roman',serif;font-weight:600;font-size:clamp(29px,4.6vw,78px);line-height:1.1;color:#efca7c;white-space:nowrap}.iqamah-arabic{font-family:Arial,sans-serif;font-size:.88em;border-left:2px solid var(--gold);padding-left:2vw}
  .iqamah-rule{width:75%;display:flex;align-items:center;gap:1.2vw;color:#e5bc6d;font-size:clamp(12px,1.6vw,26px);line-height:1}.iqamah-rule:before,.iqamah-rule:after{content:"";height:2px;flex:1;background:linear-gradient(90deg,transparent,#d8b26a,transparent)}
  .silence-symbol{height:clamp(82px,17vh,166px);width:auto;max-width:18vw;flex-shrink:1}
  .iqamah-card h1{font-family:Inter,Montserrat,Arial,sans-serif;font-size:clamp(25px,3.35vw,59px);font-weight:800;letter-spacing:.007em;line-height:1.16;white-space:nowrap;margin:0;color:#fff}
  .iqamah-callout{box-sizing:border-box;width:86%;padding:2vh 2vw;border:2px solid var(--gold);border-radius:clamp(12px,1.7vw,23px);box-shadow:0 4px 13px #0003;background:linear-gradient(160deg,#061e37,#0a3155);font-size:clamp(15px,1.73vw,30px);font-weight:600;line-height:1.38;color:#f5f7fb}
  .iqamah-rule.lower{margin:0}
  .iqamah-card footer{font-size:clamp(14px,1.5vw,28px);font-weight:600;color:#edc57b}
  .preview-mark{position:fixed;left:12px;bottom:10px;padding:8px 12px;border-radius:7px;background:#05192d;color:#fff;font-size:14px;z-index:2}
  @media(max-width:800px){.iqamah-screen{padding:1vh 3vw 2vh}.iqamah-card{padding:2vh 3vw}.iqamah-title{font-size:clamp(20px,4vw,40px)}.iqamah-card h1{font-size:clamp(18px,2.7vw,28px);white-space:normal}.iqamah-callout{width:96%;font-size:clamp(14px,2vw,20px)}.wide-only{display:none}}
  `}</style>
 </main>;
}
