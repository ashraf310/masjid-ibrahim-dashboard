import {MAX_PRESENTATION_BYTES,PresentationFormat} from './presentation-types';
export type FileCheck={ok:true;format:PresentationFormat}|{ok:false;error:string};
export function validatePresentationFile(file:{name:string;size:number;type?:string}):FileCheck{
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(ext!=='pdf'&&ext!=='pptx')return {ok:false,error:'Only PowerPoint (.pptx) and PDF files are supported.'};
 if(!Number.isFinite(file.size)||file.size<=0)return {ok:false,error:'The selected file is empty or invalid.'};
 if(file.size>MAX_PRESENTATION_BYTES)return {ok:false,error:'Files must be 50 MB or smaller.'};
 // Extensions are convenience checks; the trusted backend/local helper must inspect file signatures.
 return {ok:true,format:ext};
}
export function audienceSlideFit(width:number,height:number,containerWidth:number,containerHeight:number){
 if([width,height,containerWidth,containerHeight].some(n=>!Number.isFinite(n)||n<=0))return null;
 const factor=Math.min(containerWidth/width,containerHeight/height);
 return {width:Math.floor(width*factor),height:Math.floor(height*factor)};
}
