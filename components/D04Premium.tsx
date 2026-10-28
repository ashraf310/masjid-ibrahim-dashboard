'use client';
const officialLogo={src:'/masjid-ibrahim-logo-new.png'};
import {PRAYERS,type PrayerSchedule} from '../lib/types';

const names:Record<string,string>={Fajr:'الفجر',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء'};
function time(v:string){if(!v)return '—';const [h,m]=v.split(':').map(Number);return (h%12||12)+':'+String(m).padStart(2,'0')+' '+(h<12?'AM':'PM')}
function Sun({sunset=false}:{sunset?:boolean}){const c=sunset?'#f45137':'#ffac08';return <svg viewBox="0 0 84 65" width="clamp(36px,3.5vw,68px)" height="clamp(31px,2.9vw,57px)" fill="none" aria-hidden="true"><path d="M42 6v9M17 19l8 7M67 19l-8 7M7 38h10M67 38h10" stroke={c} strokeWidth="3" strokeLinecap="round"/><path d="M23 46a19 19 0 0 1 38 0Z" fill={c}/><path d="M8 49h68" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>{sunset?<><path d="M20 56h44M31 62h22" stroke={c} strokeWidth="3" strokeLinecap="round"/></>:<path d="M20 56h44" stroke={c} strokeWidth="3" strokeLinecap="round"/>}</svg>}
type Props={timeLabel:string;dateLabel:string;hijri:string;prayer:PrayerSchedule|null;name:string;countdown:string;highlight:string;tick:string;whatsappUrl:string;variant?:'premium-01'|'premium-03';};
export default function D04Premium({timeLabel,dateLabel,hijri,prayer,name,countdown,highlight,tick,whatsappUrl,variant='premium-01'}:Props){
 return <main className={"premium-d04"+(variant==='premium-03'?" design-03":"")} aria-label="D04 Premium Salah Timings">
  <div className="texture" aria-hidden="true"/>
  <aside className="left-rail">
   <div className="logo-panel"><img src={officialLogo.src} alt="Masjid Ibrahim official logo"/></div>
   <div className="whatsapp-panel">{whatsappUrl?<div className="whatsapp-qr-wrap"><img className="whatsapp-qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=H&margin=20&data=${encodeURIComponent(whatsappUrl)}`} alt="Scan to join Masjid Ibrahim WhatsApp community"/></div>:<div className="qr-placeholder" aria-label="WhatsApp QR code placeholder"><span>WHATSAPP</span><strong>QR CODE</strong><small>COMING SOON</small></div>}<b>Join Our WhatsApp<br/>Community</b></div>
  </aside>
  <section className="center-column">
   <section className="next-card"><div className="next-title"><span>NEXT IQAMAH</span></div><div className="next-main"><strong className={name==='MAGHRIB'?'long-prayer-name':undefined}>{name}</strong><b>{countdown}</b></div></section>
   <section className="prayer-table"><div className="table-head"><span>STARTS</span><span>PRAYER</span><span>IQAMAH</span></div>
    <div className="prayer-rows">{PRAYERS.map(n=><div key={n} className={'prayer-row '+(highlight===n?'active':'')}><span>{time(prayer?.prayers[n]?.start||'')}</span><b>{n.toUpperCase()}</b><b className="arabic" dir="rtl" lang="ar">{names[n]}</b><span>{time(prayer?.prayers[n]?.iqamah||'')}</span></div>)}</div>
    <div className="solar-row"><div><Sun/><span><small>SUNRISE</small><strong>{time(prayer?.sunrise||'')}</strong></span></div><div><Sun sunset/><span><small>SUNSET</small><strong>{time(prayer?.prayers.Maghrib?.start||'')}</strong></span></div></div>
   </section>
  </section>
  <aside className="right-column"><header className="datetime"><strong>{timeLabel}</strong><div><span className="calendar-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2"/></svg></span><p>{variant==='premium-03'?<><span className="hijri-primary">{hijri||'Hijri date pending'}</span><small className="gregorian-secondary">{dateLabel}</small></>:<>{dateLabel}<small>{hijri||'Hijri date pending'}</small></>}</p></div></header>
   <section className="jum-card"><h2>JUMU’AH</h2><p>FRIDAY PRAYER TIMES</p><div className="jum-divider" aria-hidden="true"><span>✦</span></div><div className="jum-time"><small>FIRST JUMU’AH</small><strong>{time(prayer?.jumuah1||'')}</strong></div><div className="jum-time"><small>SECOND JUMU’AH</small><strong>{time(prayer?.jumuah2||'')}</strong></div></section>
  </aside>
  <footer className="premium-ticker"><div className="announcement"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,width:"clamp(19px,2vw,36px)",height:"clamp(19px,2vw,36px)"}}><path d="m3 11 18-5v12L3 13z"/><path d="M7 14.2 9 21h4l-2.5-7.8"/><path d="M3 11v2"/></svg><span>COMMUNITY ANNOUNCEMENTS</span></div><div className="ticker-viewport"><div className="ticker-track"><span>{tick||'Welcome to Masjid Ibrahim'}</span><span aria-hidden="true">{tick||'Welcome to Masjid Ibrahim'}</span></div></div></footer>
 <style jsx>{`
 .premium-d04{--navy:#082b4d;--gold:#d8b26a;font-family:Inter,Montserrat,Arial,sans-serif;position:relative;isolation:isolate;display:grid;grid-template-columns:16% minmax(0,1fr) 21%;grid-template-rows:minmax(0,1fr) 9.5%;column-gap:1.1vw;box-sizing:border-box;width:100vw;height:100dvh;min-height:450px;overflow:hidden;padding:3.5vh 3.2vw 3.4vh 3.2vw;background:#f9f7f0;color:#081b43}
 .premium-d04 *{box-sizing:border-box}.texture{position:absolute;inset:0;z-index:-1;opacity:.13;background:repeating-linear-gradient(45deg,transparent 0 69px,#d2b983 70px,#d2b983 71px,transparent 72px 140px),repeating-linear-gradient(-45deg,transparent 0 69px,#d2b983 70px,#d2b983 71px,transparent 72px 140px)}
 .left-rail{grid-row:1;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:transparent;border:0;border-radius:0;padding:2vh .75vw;min-width:0;min-height:0;box-shadow:none}.logo-panel{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;}.logo-panel img{width:100%;height:100%;object-fit:contain;filter:brightness(0) saturate(100%) invert(18%) sepia(55%) saturate(1519%) hue-rotate(180deg) brightness(92%)}
 .whatsapp-panel{width:100%;min-height:34%;justify-content:center;background:#fff;border:2px solid var(--gold);border-radius:15px;padding:1.3vh .5vw;text-align:center;display:flex;align-items:center;flex-direction:column;gap:.8vh;box-shadow:0 2px 14px #0002}.whatsapp-qr-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;max-width:100%}.whatsapp-badge{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;border:2px solid #fff;box-shadow:0 1px 5px #0003}.whatsapp-qr{width:min(11vw,175px);height:auto;aspect-ratio:1;object-fit:contain;background:white;padding:0;border-radius:0;image-rendering:pixelated}.qr-placeholder{width:min(11vw,175px);min-height:clamp(140px,17vh,230px);aspect-ratio:1;border:2px dashed #bb9b58;border-radius:9px;display:flex;flex-direction:column;justify-content:center;gap:.5vh;background:#fffaf0;color:#173958}.qr-placeholder span{font-size:clamp(9px,.68vw,14px);letter-spacing:.13em}.qr-placeholder strong{font-size:clamp(15px,1.3vw,27px)}.qr-placeholder small{font-size:clamp(8px,.6vw,12px)}.whatsapp-panel>b{font-size:clamp(12px,1.05vw,21px);line-height:1.25}
 .center-column{display:flex;flex-direction:column;gap:1.4vh;min-height:0;min-width:0}.next-card{height:23%;min-height:0;flex:none;background:linear-gradient(125deg,#0d3e69,#061e39);border:3px solid var(--gold);border-radius:21px;box-shadow:0 4px 16px #001b3440;color:var(--gold);padding:.8vh 2%;display:flex;flex-direction:column;justify-content:space-around}.next-title{display:flex;gap:1vw;align-items:center;justify-content:center;font-family:Georgia,'Times New Roman',serif;font-size:clamp(17px,2.2vw,44px);font-weight:700;letter-spacing:.055em;white-space:nowrap}.next-title:before,.next-title:after{content:'';height:2px;background:var(--gold);width:10%;min-width:20px}.next-main{display:grid;grid-template-columns:44% 56%;align-items:center;text-align:center;min-width:0}.next-main strong{font-family:Georgia,'Times New Roman',serif;font-size:clamp(31px,4.3vw,88px);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.next-main b{border-left:2px solid var(--gold);font-size:clamp(36px,4.9vw,98px);font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.018em;color:white;line-height:1.14;white-space:nowrap}
 .next-main strong.long-prayer-name{font-size:clamp(31px,3.8vw,78px);padding-right:1vw}
 .prayer-table{display:flex;flex-direction:column;flex:1;min-height:0;background:#fff;border:1px solid #e8d6ad;border-radius:17px;overflow:hidden;box-shadow:0 5px 16px #082b4d27}.table-head{flex:none;display:grid;grid-template-columns:27% 45% 28%;align-items:center;text-align:center;min-height:8%;background:var(--navy);color:#fff;font-size:clamp(14px,1.45vw,29px);font-weight:750;letter-spacing:.035em}.prayer-rows{display:flex;flex-direction:column;flex:1;min-height:0;padding:0 .5vw}.prayer-row{display:grid;grid-template-columns:27% 26% 19% 28%;text-align:center;align-items:center;flex:1;min-height:0;border-bottom:1px solid #d7dde0;font-size:clamp(17px,1.87vw,39px);font-weight:750;line-height:1.2}.prayer-row:last-child{border-bottom:0}.prayer-row b{font-size:clamp(16px,1.75vw,36px)}.prayer-row .arabic{font-family:Arial,sans-serif;font-size:clamp(20px,2.05vw,41px)}.prayer-row.active{background:#fff8e8;border-left:8px solid var(--gold);border-radius:10px;color:#082b4d}.solar-row{flex:none;min-height:14%;background:#fffaf0;border-top:1px solid #e1d5c0;display:grid;grid-template-columns:1fr 1fr;align-items:center}.solar-row>div{display:flex;align-items:center;justify-content:center;gap:1.1vw}.solar-row>div+div{border-left:1px solid #c9bba2}.solar-row span{display:flex;flex-direction:column}.solar-row small{color:#61616a;font-size:clamp(13px,1.25vw,25px);font-weight:700}.solar-row strong{font-size:clamp(17px,1.85vw,36px);white-space:nowrap}
 .right-column{display:flex;flex-direction:column;min-width:0;min-height:0;gap:1.1vh}.datetime{flex:0 0 calc(23% + .3vh);min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right;padding:1.2vh .2vw .6vh;color:#081b43}.datetime>strong{display:block;font-size:clamp(38px,4.05vw,83px);line-height:1.08;font-variant-numeric:tabular-nums;white-space:nowrap}.datetime>div{display:flex;gap:.5vw;justify-content:flex-end;align-items:center}.datetime .calendar-icon{width:clamp(22px,2.15vw,42px);height:clamp(22px,2.15vw,42px);display:inline-flex;align-items:center;justify-content:center;flex:none;color:#0a3761}.datetime .calendar-icon svg{width:100%;height:100%}.datetime p{font-size:clamp(13px,1.2vw,25px);font-weight:700;text-align:left;line-height:1.3;margin:.3vh 0}.datetime small{display:block;font-size:clamp(12px,1.07vw,22px);font-weight:500;margin-top:.25vh}
 .jum-card{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(160deg,#113f66 0%,#082d50 55%,#041c36 100%);border:2px solid var(--gold);border-radius:21px;padding:2.1vh 1vw;box-shadow:0 5px 20px #001b3440;color:#fff}.mosque-symbol{font-size:clamp(24px,3vw,58px);color:var(--gold);line-height:1}.jum-card h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(26px,3vw,57px);color:#edc67d;margin:0;white-space:nowrap}.jum-card p{font-size:clamp(11px,1.05vw,22px);letter-spacing:.09em;font-weight:700;margin:0 0 .3vh}.jum-divider{display:flex;align-items:center;gap:.6vw;width:86%;color:var(--gold);font-size:clamp(12px,1.05vw,21px);margin:0 auto .4vh}.jum-divider:before,.jum-divider:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,#d8b26a,transparent)}.jum-time{display:flex;flex-direction:column;justify-content:center;width:100%;flex:1;max-height:34%;border:1px solid #cfa862;border-radius:14px;margin:.55vh 0;padding:.75vh .2vw;background:linear-gradient(130deg,#ffffff13,#ffffff05);box-shadow:inset 0 1px 0 #ffffff1a}.jum-time small{font-size:clamp(11px,1.06vw,22px);font-weight:700;letter-spacing:.08em;color:#edcf98}.jum-time strong{font-size:clamp(25px,2.55vw,50px);font-variant-numeric:tabular-nums;line-height:1.16;margin-top:.6vh;white-space:nowrap}
 .premium-ticker{grid-column:1/4;grid-row:2;align-self:stretch;margin:1.2vh -1.7vw 0 0;display:flex;align-items:center;gap:1vw;padding:0 1.2vw;background:#082b4d;border-top:3px solid var(--gold);color:#fff;overflow:hidden}.announcement{color:#eac176;display:flex;align-items:center;gap:1vw;font-size:clamp(14px,1.55vw,30px);font-family:Georgia,serif;font-weight:800;white-space:nowrap}.announcement{border-right:2px solid var(--gold);padding-right:1vw}.ticker-viewport{flex:1;overflow:hidden;contain:layout paint}.ticker-track{display:flex;width:max-content;gap:0;animation:premium-scroll 30s linear infinite;white-space:nowrap;will-change:transform;backface-visibility:hidden;transform:translate3d(0,0,0)}.ticker-track span{display:inline-block;white-space:nowrap;padding-right:120px;font:clamp(24px,1.75vw,34px) Arial,sans-serif}@keyframes premium-scroll{to{transform:translateX(-50%)}}@media(max-width:980px){.premium-d04{grid-template-columns:18% minmax(0,1fr) 22%;column-gap:.7vw}.next-title{letter-spacing:0}.next-main strong{font-size:3.7vw}.next-main b{font-size:clamp(32px,4.7vw,82px)}.jum-card h2{font-size:2.6vw}}

 /* Design 03: independent layout only. Design 01 styling and components remain intact. */
 .premium-d04.design-03{grid-template-columns:16% minmax(0,1fr) 22%;grid-template-rows:18% minmax(0,1fr) 21% 9.5%;column-gap:1vw;row-gap:.8vh;padding-top:2vh;padding-bottom:2vh}
 .design-03 .left-rail{grid-column:1;grid-row:1/4;padding-top:2vh;padding-bottom:1vh}
 .design-03 .center-column,.design-03 .right-column{display:contents}
 .design-03 .datetime{grid-column:2/4;grid-row:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 .5vw;gap:.3vh;min-height:0}
 .design-03 .datetime>strong{font-size:clamp(44px,4.8vw,92px);line-height:1.08}
 .design-03 .datetime>div{justify-content:center;align-items:center;gap:.8vw}
 .design-03 .datetime p{text-align:center;font-size:clamp(15px,1.3vw,27px);margin:0}
 .design-03 .datetime small{font-size:clamp(12px,1.05vw,22px)}
 .design-03 .prayer-table{grid-column:2;grid-row:2/4;min-height:0}
 .design-03 .jum-card{grid-column:3;grid-row:2;padding:1vh .7vw;border-radius:17px;min-height:0}
 .design-03 .jum-card h2{font-size:clamp(24px,2.6vw,51px)}
 .design-03 .jum-card p{font-size:clamp(10px,.9vw,19px)}
 .design-03 .jum-time{max-height:none;min-height:0;margin:.3vh 0;padding:.3vh .2vw}
 .design-03 .jum-time strong{font-size:clamp(22px,2.3vw,46px);margin-top:.2vh}
 .design-03 .next-card{grid-column:3;grid-row:3;width:100%;height:auto;min-height:0;padding:.6vh .4vw;border-radius:16px}
 .design-03 .next-title{font-size:clamp(15px,1.45vw,29px);letter-spacing:0}
 .design-03 .next-main{display:flex;flex-direction:column;justify-content:center;gap:.25vh}
 .design-03 .next-main strong,.design-03 .next-main strong.long-prayer-name{font-size:clamp(20px,2.1vw,43px);line-height:1.12;padding:0}
 .design-03 .next-main b{border-left:0;font-size:clamp(21px,2.3vw,47px);line-height:1.12;letter-spacing:0}
 .design-03 .prayer-row.active{background:#082b4d;color:#fff;border-left:8px solid #d8b26a;box-shadow:inset 0 0 0 2px #d8b26a}
 .design-03 .prayer-row.active b,.design-03 .prayer-row.active span{color:#fff}
 .design-03 .premium-ticker{grid-column:1/4;grid-row:4;margin-top:0}

 /* Approved Design 03 visual: navy identity rail, cream patterned canvas, gold framed highlights. */
 .premium-d04.design-03{background:#fbf8ef;grid-template-columns:17% minmax(0,1fr) 21%;grid-template-rows:19% minmax(0,1fr) 23% 9%;column-gap:1vw;row-gap:.8vh;padding:0 1vw 0 0}
 .design-03 .texture{opacity:.16;background:repeating-linear-gradient(45deg,transparent 0 85px,#d5bb87 86px,#d5bb87 87px,transparent 88px 170px),repeating-linear-gradient(-45deg,transparent 0 85px,#d5bb87 86px,#d5bb87 87px,transparent 88px 170px)}
 .design-03 .left-rail{background:linear-gradient(180deg,#082b4d,#031f3b);border-right:3px solid var(--gold);padding:2.8vh 1.3vw 2vh;grid-row:1/4;justify-content:space-around}
 .design-03 .logo-panel{flex:1;max-height:55%}.design-03 .logo-panel img{filter:brightness(0) invert(1);max-height:100%;object-fit:contain}
 .design-03 .whatsapp-panel{flex:none;min-height:0;padding:1.1vh .5vw;background:#fff;border-radius:14px;gap:.5vh}
 .design-03 .whatsapp-qr{width:min(11.4vw,210px)}
 .design-03 .whatsapp-panel>b{font-size:clamp(12px,1.03vw,21px)}
 .design-03 .datetime{grid-column:2/4;grid-row:1;background:linear-gradient(180deg,#fffdf8ee,#fff9e9dd);border-bottom:2px solid #d8b26a;margin:0 -1vw 0 0;border-radius:0 0 18px 18px}
 .design-03 .datetime>strong{font-family:Georgia,'Times New Roman',serif;font-weight:800;color:#082b4d;font-size:clamp(49px,5.1vw,103px)}
 .design-03 .datetime p{font-weight:700;color:#082b4d}
 .design-03 .prayer-table{grid-row:2/4;box-shadow:0 5px 18px #082b4d2c;border-radius:17px}
 .design-03 .table-head{min-height:11%;background:linear-gradient(120deg,#082b4d,#0b3d67);color:#edc67d}
 .design-03 .prayer-rows{padding:0 .45vw}.design-03 .prayer-row{font-size:clamp(16px,1.8vw,37px)}
 .design-03 .prayer-row.active{background:linear-gradient(100deg,#082b4d,#0a3b66);color:#fff;border:3px solid #d8b26a;border-left:8px solid #d8b26a;border-radius:13px;box-shadow:0 1px 10px #082b4d55}
 .design-03 .jum-card{grid-row:2;border:3px solid var(--gold);border-radius:19px;background:linear-gradient(150deg,#0b385d,#041d38);box-shadow:0 4px 12px #082b4d33;padding:1vh .65vw}
 .design-03 .jum-card h2{font-size:clamp(22px,2.6vw,54px)}
 .design-03 .jum-time{border:1.5px solid var(--gold);border-radius:12px}
 .design-03 .next-card{grid-row:3;border:3px solid var(--gold);background:linear-gradient(145deg,#0b3e68,#041d38);box-shadow:0 4px 12px #082b4d33}
 .design-03 .next-title{color:#edc67d;font-family:Georgia,'Times New Roman',serif}
 .design-03 .next-main strong{color:#edc67d}
 .design-03 .next-main b{color:#fff;font-variant-numeric:tabular-nums;white-space:nowrap}
 .design-03 .premium-ticker{grid-column:1/4;grid-row:4;margin:0 -1vw 0 0;padding:0 1.4vw;min-height:0}

 .header-skyline{display:none}
 .design-03 .datetime{position:relative;display:grid;grid-template-columns:45% 55%;grid-template-rows:1fr;align-items:center;justify-items:center;column-gap:0;overflow:hidden;padding:0 2vw;isolation:isolate}
 .design-03 .header-skyline{display:none}
 .design-03 .datetime::before{content:"";position:absolute;inset:0;z-index:-1;background:repeating-linear-gradient(45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),repeating-linear-gradient(-45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),linear-gradient(90deg,#fffaf2,#fff8e9)}
 .design-03 .datetime>strong{grid-column:1;font-family:Georgia,'Times New Roman',serif;font-weight:800;font-size:clamp(49px,5.1vw,103px);white-space:nowrap;line-height:1.05;text-shadow:0 1px 4px #fffdf8}
 .design-03 .datetime>div{grid-column:2;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:.8vw;min-width:0;white-space:nowrap}
 .design-03 .datetime p{font-size:clamp(14px,1.32vw,27px);line-height:1.4;text-align:left;white-space:nowrap;text-shadow:0 1px 4px #fffdf8}
 .design-03 .datetime small{font-size:clamp(12px,1.12vw,23px);font-weight:600;margin-top:.25vh}
 @media(max-width:980px){.design-03 .datetime{grid-template-columns:42% 58%;padding:0 .5vw}.design-03 .datetime>strong{font-size:clamp(40px,5.1vw,103px)}.design-03 .datetime p{font-size:1.2vw}.design-03 .datetime small{font-size:1.02vw}}

 /* Design 03 refinement: shared geometric treatment and standard numerals */
 .design-03 .left-rail{background:repeating-linear-gradient(45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),repeating-linear-gradient(-45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),linear-gradient(90deg,#fffaf2,#fff8e9);border-right:2px solid var(--gold)}
 .design-03 .logo-panel img{filter:brightness(0) saturate(100%) invert(18%) sepia(55%) saturate(1519%) hue-rotate(180deg) brightness(92%)}
 .design-03 .datetime>strong{font-family:Inter,Montserrat,Arial,sans-serif;font-weight:800;font-variant-numeric:normal;letter-spacing:0}
 .design-03 .next-main b,.design-03 .jum-time strong,.design-03 .prayer-row span,.design-03 .solar-row strong{font-family:Inter,Montserrat,Arial,sans-serif;font-variant-numeric:normal;letter-spacing:0}

 /* Design 03: perfectly matched header and identity backgrounds, Hijri-first dates */
 .design-03 .datetime{background:repeating-linear-gradient(45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),repeating-linear-gradient(-45deg,transparent 0 44px,#d8b26a24 45px,#d8b26a24 46px,transparent 47px 90px),linear-gradient(90deg,#fffaf2,#fff8e9)}
 .design-03 .datetime::before{display:none}
 .design-03 .datetime .hijri-primary{display:block;font-size:clamp(21px,1.95vw,39px);font-weight:800;line-height:1.2;color:#082b4d}
 .design-03 .datetime .gregorian-secondary{display:block;font-size:clamp(13px,1.14vw,24px);font-weight:600;line-height:1.35;margin-top:.5vh;color:#304a60}
 @media(max-width:980px){.design-03 .datetime .hijri-primary{font-size:clamp(16px,1.8vw,31px)}.design-03 .datetime .gregorian-secondary{font-size:clamp(11px,1.07vw,19px)}}
 @media(max-width:980px){.premium-d04.design-03{grid-template-columns:17% minmax(0,1fr) 23%}.design-03 .next-main b{font-size:2.1vw}.design-03 .jum-card h2{font-size:2.4vw}}
 `}</style>
 </main>
}
