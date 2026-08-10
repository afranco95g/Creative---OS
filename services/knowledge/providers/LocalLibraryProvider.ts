import 'server-only';
import type { KnowledgeProvider } from '../KnowledgeProvider';
import type { KnowledgeReasoningMode,ProviderKnowledgeResult,StructuredKnowledgeQuery } from '../../../types/knowledge';
import { knowledgeEngine } from '../KnowledgeEngine';
import { createClient } from '../../../lib/supabase/server';

interface DatabaseChunk {
  id:string;source_id:string;collection_id:string;heading_path:string[]|null;page_start:number|null;page_end:number|null;
  content:string;topic_tags:string[]|null;reasoning_modes:KnowledgeReasoningMode[]|null;
  knowledge_sources:{id:string;title:string;author:string|null;institution:string;year:number|null;language:string;source_type:string;canonical_url:string;license:string}|Array<{id:string;title:string;author:string|null;institution:string;year:number|null;language:string;source_type:string;canonical_url:string;license:string}>;
}

export class LocalLibraryProvider implements KnowledgeProvider{
  readonly id='local_library';
  supports(){return true;}
  async health(){
    if(process.env.NODE_ENV==='production'){
      try{const db=await createClient();const {count,error}=await db.from('knowledge_sources').select('id',{count:'exact',head:true}).eq('is_active',true).eq('status','active');return{provider:this.id,available:!error&&Boolean(count),reason:error?.message};}catch(error){return{provider:this.id,available:false,reason:error instanceof Error?error.message:'Supabase knowledge unavailable'};}
    }
    await knowledgeEngine.initialize();const stats=knowledgeEngine.getStats();return{provider:this.id,available:stats.documents>0,reason:stats.failures?`${stats.failures} documentos con error`:undefined};
  }
  async search(query:StructuredKnowledgeQuery):Promise<ProviderKnowledgeResult[]>{return process.env.NODE_ENV==='production'?this.searchSupabase(query):this.searchLocal(query);}
  async getDocument(id:string){const result=await this.search({projectType:'',projectStage:'',knowledgeNeed:id,keywords:[id],language:'es',country:'CO',preferredYears:[],purpose:'document'});return result.find(item=>item.id===id)??null;}

  private async searchLocal(query:StructuredKnowledgeQuery){
    const hits=await knowledgeEngine.search({text:[query.knowledgeNeed,...query.keywords].join(' '),topics:query.keywords,collectionIds:query.collectionIds,reasoningModes:query.reasoningModes,projectTypes:query.projectType?[query.projectType]:[],projectStages:query.projectStage?[query.projectStage]:[],decisionContexts:query.decisionContexts,projectId:query.projectId,purpose:query.purpose,limit:Number(process.env.OPENALEX_MAX_RESULTS||10)});
    return hits.map(hit=>mapLocal(hit));
  }
  private async searchSupabase(query:StructuredKnowledgeQuery){
    try{
      const db=await createClient();
      let request=db.from('knowledge_chunks').select('id,source_id,collection_id,heading_path,page_start,page_end,content,topic_tags,reasoning_modes,knowledge_sources!inner(id,title,author,institution,year,language,source_type,canonical_url,license)').eq('knowledge_sources.is_active',true).eq('knowledge_sources.status','active').limit(50);
      if(query.collectionIds?.length)request=request.in('collection_id',query.collectionIds);
      const searchTerms=[...new Set(query.keywords.map(term=>term.toLowerCase()).filter(term=>term.length>3))].slice(0,12);
      if(searchTerms.length)request=request.overlaps('keywords',searchTerms);
      const {data,error}=await request;if(error)throw error;
      return((data??[]) as unknown as DatabaseChunk[]).map(row=>mapDatabase(row,query)).sort((a,b)=>b.relevance-a.relevance).slice(0,Number(process.env.OPENALEX_MAX_RESULTS||10));
    }catch{return[];}
  }
}

function mapLocal(hit:Awaited<ReturnType<typeof knowledgeEngine.search>>[number]):ProviderKnowledgeResult{return{id:hit.chunk.id,sourceId:hit.source.id,provider:'local_library',entityType:'work',title:hit.source.title,summary:hit.chunk.text.slice(0,1600),authors:hit.source.author?[hit.source.author]:[],institution:hit.source.institution,year:hit.source.year,language:hit.source.language,topics:hit.chunk.topics,doi:null,url:hit.source.url,citedByCount:0,openAccess:true,relevance:hit.score+(hit.source.sourceType==='internal_research'?8:hit.source.collectionId==='creative_os_cognitive_research_cases'?4:0),retrievedAt:new Date().toISOString(),collectionId:hit.chunk.collectionId,headingPath:hit.chunk.headingPath,pageStart:hit.chunk.pageStart,pageEnd:hit.chunk.pageEnd,reasoningModes:hit.chunk.reasoningModes,nonTransferWarnings:hit.chunk.caseData?['Validar similitud de contexto, restricciones y etapa antes de transferir la decisión.']:[]};}
function mapDatabase(row:DatabaseChunk,query:StructuredKnowledgeQuery):ProviderKnowledgeResult{const joined=Array.isArray(row.knowledge_sources)?row.knowledge_sources[0]:row.knowledge_sources;const content=row.content.toLowerCase();const relevance=query.keywords.filter(keyword=>content.includes(keyword.toLowerCase())).length*2+(row.reasoning_modes??[]).filter(mode=>query.reasoningModes?.includes(mode)).length*6+(joined.source_type==='internal_research'?8:row.collection_id==='creative_os_cognitive_research_cases'?4:0);return{id:row.id,sourceId:row.source_id,provider:'local_library',entityType:'work',title:joined.title,summary:row.content.slice(0,1600),authors:joined.author?[joined.author]:[],institution:joined.institution,year:joined.year,language:joined.language,topics:row.topic_tags??[],doi:null,url:joined.canonical_url,citedByCount:0,openAccess:joined.source_type!=='internal_research',relevance,retrievedAt:new Date().toISOString(),collectionId:row.collection_id,headingPath:row.heading_path??[],pageStart:row.page_start,pageEnd:row.page_end,reasoningModes:row.reasoning_modes??[]};}
