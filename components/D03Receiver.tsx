'use client';
import {useEffect,useRef,useState} from 'react';
import {browserDb} from '../lib/supabase';
import type {RealtimeChannel} from '@supabase/supabase-js';
export default function D03Receiver({sessionId}:{sessionId:string}){
 const video=useRef<HTMLVideoElement>(null),[status,setStatus]=useState('Connecting to live screen…');
 useEffect(()=>{const db=browserDb();if(!db){setStatus('Streaming configuration unavailable');return}
 const id=crypto.randomUUID(),peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
 const channel:RealtimeChannel=db.channel('d03-signal-'+sessionId,{config:{broadcast:{self:false}}});let active=true;
 peer.ontrack=e=>{if(video.current){video.current.srcObject=e.streams[0];void video.current.play().catch(()=>{})}setStatus('')};
 peer.onicecandidate=e=>{if(e.candidate)void channel.send({type:'broadcast',event:'signal',payload:{kind:'ice',viewer:id,candidate:e.candidate.toJSON(),sessionId:'receiver'}})};
 channel.on('broadcast',{event:'signal'},async ({payload})=>{if(!active||payload.viewer!==id)return;
  if(payload.kind==='offer'&&payload.sdp){await peer.setRemoteDescription(payload.sdp);const answer=await peer.createAnswer();await peer.setLocalDescription(answer);void channel.send({type:'broadcast',event:'signal',payload:{kind:'answer',viewer:id,sdp:peer.localDescription}})}
  if(payload.kind==='ice'&&payload.candidate&&peer.remoteDescription)await peer.addIceCandidate(payload.candidate).catch(()=>{});
 });
 channel.subscribe(s=>{if(s==='SUBSCRIBED')void channel.send({type:'broadcast',event:'signal',payload:{kind:'join',viewer:id}});if(s==='CHANNEL_ERROR')setStatus('Live connection unavailable')});
 return()=>{active=false;peer.close();void db.removeChannel(channel)};
 },[sessionId]);
 return <div style={{width:'100%',height:'100%',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}><video ref={video} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'contain'}}/>{status&&<div style={{position:'absolute',color:'white',font:'20px Arial',textAlign:'center'}}>{status}</div>}</div>;
}
