import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(){return NextResponse.json({live:false,sessionId:null,disabled:true},{headers:{'Cache-Control':'no-store'}})}
export async function POST(){return NextResponse.json({error:'Live presentation temporarily disabled'},{status:503,headers:{'Cache-Control':'no-store'}})}
