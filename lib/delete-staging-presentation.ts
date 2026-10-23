import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';

/** Permanent cleanup; error stops deletion so it can be retried by an admin. */
export async function deletePresentationAssets(db:SupabaseClient,id:string):Promise<void>{
 const {data:item,error:lookup}=await db.from('presentations').select('id,source_format').eq('id',id).maybeSingle();
 if(lookup)throw Error('Could not load presentation for cleanup');
 if(!item)return;
 const {data:slideRows,error:slidesError}=await db.from('presentation_slides').select('image_path').eq('presentation_id',id);
 if(slidesError)throw Error('Could not locate slide assets');
 const {data:stored,error:listError}=await db.storage.from('presentation-slides').list(id,{limit:1000});
 if(listError)throw Error('Could not list slide images');
 const slidePaths=new Set<string>((slideRows||[]).map(s=>s.image_path));
 for(const obj of stored||[]){if(obj.name&&!obj.name.startsWith('.'))slidePaths.add(id+'/'+obj.name)}
 for(const batch of chunks([...slidePaths],100)){
  const {error}=await db.storage.from('presentation-slides').remove(batch);
  if(error)throw Error('Could not delete slide images');
 }
 const {data:originals,error:originalsError}=await db.storage.from('presentation-originals').list(id,{limit:1000});
 if(originalsError)throw Error('Could not list presentation originals');
 const sourcePaths=new Set<string>([id+'/source.pptx',id+'/source.pdf']);
 for(const obj of originals||[]){if(obj.name&&!obj.name.startsWith('.'))sourcePaths.add(id+'/'+obj.name)}
 for(const batch of chunks([...sourcePaths],100)){
  const {error}=await db.storage.from('presentation-originals').remove(batch);
  if(error)throw Error('Could not delete presentation originals');
 }
 // Cascade deletes related slide metadata and audience questions.
 const {error:deleted}=await db.from('presentations').delete().eq('id',id);
 if(deleted)throw Error('Could not remove presentation record and questions');
}
function chunks<T>(items:T[],size:number):T[][]{const result:T[][]=[];for(let i=0;i<items.length;i+=size)result.push(items.slice(i,i+size));return result}
