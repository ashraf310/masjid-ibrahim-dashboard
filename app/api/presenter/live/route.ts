import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function POST(){return NextResponse.json({error:'Presentation Portal temporarily disabled'},{status:503,headers:{'Cache-Control':'no-store'}})}
