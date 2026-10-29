import Link from 'next/link';

// MI-BUG004: Temporarily disable legacy D02 presenter UI.
// D03 /Live and all TV dashboard/API routes remain unchanged.
export default function PresenterDisabled() {
  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#082B4D',color:'#fff',padding:24,fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:560,textAlign:'center'}}>
        <h1 style={{color:'#D8B26A'}}>Presenter temporarily unavailable</h1>
        <p>The legacy slide presenter is temporarily disabled. Live screen sharing remains available.</p>
        <Link href="/Live" style={{color:'#D8B26A',fontWeight:700}}>Open Live Screen Sharing</Link>
      </section>
    </main>
  );
}
