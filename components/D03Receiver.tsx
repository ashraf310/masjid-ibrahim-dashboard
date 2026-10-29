'use client';
import {useEffect,useRef,useState} from 'react';
import {browserDb} from '../lib/supabase';
import type {RealtimeChannel} from '@supabase/supabase-js';

export default function D03Receiver({sessionId}:{sessionId:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [status,setStatus]=useState('Connecting to live screen…');
 useEffect(()=>{
  const db=browserDb();
  if(!db){setStatus('Streaming configuration unavailable');return;}
  let active=true;
  let peer:RTCPeerConnection|null=null;
  let channel:RealtimeChannel|null=null;
  let retryTimer:ReturnType<typeof setTimeout>|null=null;
  let watchdog:ReturnType<typeof setInterval>|null=null;
  let attempt=0;
  let connectedAt=0;
  let lastFrameAt=0;
  let generation=0;
  const pendingIce:RTCIceCandidateInit[]=[];
  const clearRetry=()=>{if(retryTimer){clearTimeout(retryTimer);retryTimer=null;}};
  const teardown=()=>{
   if(channel){const old=channel;channel=null;void db.removeChannel(old);}
   if(peer){peer.ontrack=null;peer.onconnectionstatechange=null;peer.onicecandidate=null;peer.close();peer=null;}
   if(video.current){video.current.pause();video.current.srcObject=null;}
   pendingIce.length=0;connectedAt=0;lastFrameAt=0;
  };
  const retry=(reason:string)=>{
   if(!active||retryTimer)return;
   setStatus(reason);
   const delay=Math.min(12000,1500*Math.pow(1.6,Math.min(attempt++,5)));
   retryTimer=setTimeout(()=>{retryTimer=null;connect();},delay);
  };
  const connect=()=>{
   if(!active)return;
   generation++;
   const currentGeneration=generation;
   teardown();
   setStatus(attempt?'Reconnecting to live screen…':'Connecting to live screen…');
   const viewer=crypto.randomUUID();
   const currentPeer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
   peer=currentPeer;
   const currentChannel=db.channel('d03-signal-'+sessionId,{config:{broadcast:{self:false}}});
   channel=currentChannel;
   const isCurrent=()=>active&&generation===currentGeneration;
   currentPeer.ontrack=e=>{
    if(!isCurrent()||!video.current)return;
    const element=video.current;
    element.srcObject=e.streams[0]||new MediaStream([e.track]);
    connectedAt=Date.now();
    const startPlayback=()=>{if(!isCurrent())return;void element.play().then(()=>{if(isCurrent()){setStatus('');attempt=0;lastFrameAt=Date.now();}}).catch(()=>retry('Video playback interrupted. Reconnecting…'));};
    startPlayback();
    e.track.onended=()=>{if(isCurrent())retry('Screen share ended. Reconnecting…');};
    e.track.onmute=()=>{if(isCurrent())retry('Video interrupted. Reconnecting…');};
   };
   currentPeer.onconnectionstatechange=()=>{
    if(!isCurrent())return;
    if(currentPeer.connectionState==='failed'||currentPeer.connectionState==='closed')retry('Live connection lost. Reconnecting…');
    if(currentPeer.connectionState==='disconnected')retry('Live connection interrupted. Reconnecting…');
   };
   currentPeer.onicecandidate=e=>{
    if(e.candidate&&isCurrent())void currentChannel.send({type:'broadcast',event:'signal',payload:{kind:'ice',viewer,candidate:e.candidate.toJSON(),sessionId:'receiver'}});
   };
   currentChannel.on('broadcast',{event:'signal'},async ({payload})=>{
    if(!isCurrent()||payload.viewer!==viewer)return;
    try{
     if(payload.kind==='offer'&&payload.sdp){
      await currentPeer.setRemoteDescription(payload.sdp);
      for(const candidate of pendingIce.splice(0))await currentPeer.addIceCandidate(candidate).catch(()=>{});
      const answer=await currentPeer.createAnswer();
      await currentPeer.setLocalDescription(answer);
      if(isCurrent())void currentChannel.send({type:'broadcast',event:'signal',payload:{kind:'answer',viewer,sdp:currentPeer.localDescription}});
     }
     if(payload.kind==='ice'&&payload.candidate){
      if(currentPeer.remoteDescription)await currentPeer.addIceCandidate(payload.candidate).catch(()=>{});
      else pendingIce.push(payload.candidate);
     }
    }catch{if(isCurrent())retry('Live connection negotiation failed. Reconnecting…');}
   });
   currentChannel.subscribe(s=>{
    if(!isCurrent())return;
    if(s==='SUBSCRIBED')void currentChannel.send({type:'broadcast',event:'signal',payload:{kind:'join',viewer}});
    if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED')retry('Live signaling unavailable. Reconnecting…');
   });
   // A lost offer or stalled ICE negotiation must not leave a TV stuck indefinitely.
   setTimeout(()=>{if(isCurrent()&&currentPeer.connectionState!=='connected')retry('Waiting for live stream. Reconnecting…');},12000);
  };
  connect();
  watchdog=setInterval(()=>{
   if(!active)return;
   const element=video.current;
   if(!element)return;
   if(connectedAt&&element.readyState>=2&&!element.paused&&!element.ended){
    if(element.currentTime>0)lastFrameAt=Date.now();
   }
   if(connectedAt&&Date.now()-connectedAt>8000&&(element.paused||element.readyState<2||element.ended))retry('Playback stalled. Reconnecting…');
  },4000);
  return()=>{active=false;generation++;clearRetry();if(watchdog)clearInterval(watchdog);teardown();};
 },[sessionId]);
 return <div style={{width:'100%',height:'100%',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}><video ref={video} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'contain'}}/>{status&&<div role="status" style={{position:'absolute',color:'white',font:'20px Arial',textAlign:'center',background:'rgba(0,0,0,.55)',padding:16}}>{status}</div>}</div>;
}
