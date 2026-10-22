import JSZip from 'jszip';
export type PptxInfo={slides:{number:number;notes:string}[];warnings:string[]};
function parse(xml:string){const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid PowerPoint XML');return doc}
function nodes(doc:Document,local:string){return Array.from(doc.getElementsByTagName('*')).filter(x=>x.localName===local)}
function resolvePart(base:string,target:string){
 if(target.startsWith('/'))return target.replace(/^\/+/, '');
 const segments=base.split('/');segments.pop();
 for(const piece of target.replace(/\\/g,'/').split('/')){if(piece==='..')segments.pop();else if(piece!=='.'&&piece)segments.push(piece)}
 return segments.join('/');
}
export async function inspectPptx(file:File):Promise<PptxInfo>{
 const zip=await JSZip.loadAsync(await file.arrayBuffer(),{checkCRC32:false});
 const pres=zip.file('ppt/presentation.xml');const presRels=zip.file('ppt/_rels/presentation.xml.rels');
 if(!pres||!presRels)throw Error('This is not a valid PPTX presentation.');
 const p=parse(await pres.async('string'));const relations=parse(await presRels.async('string'));
 const ridTargets=new Map(nodes(relations,'Relationship').map(n=>[n.getAttribute('Id')||'',n.getAttribute('Target')||'']));
 const ids=nodes(p,'sldId').map(n=>Array.from(n.attributes).find(a=>a.localName==='id'&&a.namespaceURI?.includes('relationships'))?.value||'');
 const slides:{number:number;notes:string}[]=[];const warnings:string[]=[];
 for(let i=0;i<ids.length;i++){
  const rel=ridTargets.get(ids[i]);if(!rel){warnings.push('Slide '+(i+1)+' could not be located');slides.push({number:i+1,notes:''});continue;}
  const part=resolvePart('ppt/presentation.xml',rel);
  const relPath=part.replace(/([^/]+)$/,'_rels/$1.rels');
  const slideRels=zip.file(relPath);
  let text='';
  if(slideRels){
   const sr=parse(await slideRels.async('string'));
   const noteRel=nodes(sr,'Relationship').find(n=>(n.getAttribute('Type')||'').endsWith('/notesSlide'));
   if(noteRel){
    const target=noteRel.getAttribute('Target')||'';
    const path=resolvePart(part,target);
    const notesXml=zip.file(path);
    if(notesXml){
     const nd=parse(await notesXml.async('string'));
     const blocks=nodes(nd,'sp');
     const parts:string[]=[];
     for(const block of blocks){
      const placeholder=nodes(block,'ph')[0];
      const kind=placeholder?.getAttribute('type');
      if(kind==='sldNum'||kind==='hdr'||kind==='ftr'||kind==='dt')continue;
      if(kind!=='body')continue;
      const paragraphs=nodes(block,'p');
      for(const para of paragraphs){
       const line=nodes(para,'t').map(t=>t.textContent||'').join('');
       if(line.trim())parts.push(line);
      }
     }
     text=parts.join('\n');
    }
   }
  }
  slides.push({number:i+1,notes:text});
 }
 return {slides,warnings};
}
