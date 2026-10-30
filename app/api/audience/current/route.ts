import {NextResponse} from 'next/server';
export const dynamic='force-static';
export function GET(){return NextResponse.json({state:'waiting',slideUrl:null,disabled:true},{headers:{'Cache-Control':'public, s-maxage=3600'}})}
