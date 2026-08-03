import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { knowledgeRetriever } from '../../../../services/knowledge/KnowledgeRetriever';
import { buildKnowledgeQuery } from '../../../../services/knowledge/KnowledgeQueryBuilder';
export const runtime='nodejs';
export async function POST(request:Request){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'No autorizado'},{status:401});const body=await request.json() as {query?:string;purpose?:string;projectId?:string};if(!body.query?.trim())return NextResponse.json({error:'Consulta requerida'},{status:400});const retrieval=await knowledgeRetriever.retrieve(buildKnowledgeQuery({message:body.query,projectId:body.projectId,purpose:body.purpose||'manual_search'}));return NextResponse.json({results:retrieval.results.slice(0,5).map(r=>({score:r.relevance,matchedBy:[r.provider],document:{id:r.id,title:r.title,institution:r.institution,year:r.year},chunk:{id:r.id,section:r.provider,page:null,text:r.summary}})),summary:retrieval.summary,providers:retrieval.providers});}
