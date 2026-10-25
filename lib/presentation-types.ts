/** Expansion models: no production dashboard configuration is changed. */
export type PresentationStatus='uploading'|'processing'|'ready'|'live'|'ended'|'failed'|'clearing';
export type PresentationFormat='pptx'|'pdf';
export type DisplayKind='outdoor'|'hall'|'presentation'|'future';
export type TvStatus='pending'|'paired'|'revoked';
export interface Presentation {id:string;ownerPresenterId:string;title:string;format:PresentationFormat;status:PresentationStatus;slideCount:number;currentSlide:number;qaEnabled:boolean;qrVisible:boolean;uploadedAt:string;startedAt:string|null;endedAt:string|null;}
export interface TvDevice {id:string;name:string;status:TvStatus;defaultDisplay:DisplayKind;participatesInLive:boolean;lastSeenAt:string|null;}
export const MAX_PRESENTATION_BYTES=50*1024*1024;
export const PRESENTER_DISCONNECT_MINUTES=30;
export const NEVER_STARTED_RETENTION_HOURS=24;
export const COMPLETED_RETENTION_DAYS=7;
export const DISPLAY_OPTIONS:{id:DisplayKind;name:string;description:string}[]=[
 {id:'outdoor',name:'Outdoor Dashboard',description:'Salah timings, flyers and announcements'},
 {id:'hall',name:'Inside Prayer Hall',description:'Hall information display (planned)'},
 {id:'presentation',name:'Live Presentation',description:'Synchronized audience slides (planned)'},
 {id:'future',name:'Additional Displays',description:'Future Masjid screens'},
];
