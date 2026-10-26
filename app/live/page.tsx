'use client';
import {useEffect,useState} from 'react';
import D03Receiver from '../../components/D03Receiver';
import FixedAudienceScreen from '../audience-live/page';
export default function Live(){
 const [session,setSession]=useState<string|null>(null);
 useEffect(()=>{let active=true;async function check(){try{const r=await fetch('/api/d03',{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(active)setSession(d.live?d.sessionId:null)}catch{}}void check();const id=setInterval(()=>void check(),2500);return()=>{active=false;clearInterval(id)}},[]);
 return session?<main style={{width:'100vw',height:'100dvh',margin:0,background:'#000'}}><D03Receiver key={session} sessionId={session}/></main>:<FixedAudienceScreen/>;
}
