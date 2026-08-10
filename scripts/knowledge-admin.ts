import path from 'node:path';
import { readFile,writeFile } from 'node:fs/promises';
import { knowledgeEngine } from '../services/knowledge/KnowledgeEngine';
import { COGNITIVE_COLLECTION_ID,KNOWLEDGE_CACHE_PATH } from '../services/knowledge/knowledgeConfig';
import { KnowledgeCache } from '../services/knowledge/KnowledgeCache';

const command=process.argv[2]??'report';
try{process.loadEnvFile(path.join(process.cwd(),'.env.local'));}catch{}

async function main(){if(command==='scan'){
  const discovery=await knowledgeEngine.discover();
  print({command,collectionId:COGNITIVE_COLLECTION_ID,...discovery});
}else if(command==='ingest'){
  const report=await knowledgeEngine.refresh();
  const remote=await publishToSupabase();
  print({command,report,remote});
}else if(command==='validate'){
  await knowledgeEngine.initialize();
  const validation=await validateCollection();
  await writeFile(path.join(KNOWLEDGE_CACHE_PATH,'validation-report.json'),JSON.stringify(validation,null,2),'utf8');
  print({command,...validation});
  if(!validation.valid)process.exitCode=1;
}else if(command==='report'){
  await knowledgeEngine.initialize();
  print({command,stats:knowledgeEngine.getStats(),report:knowledgeEngine.getReport()});
}else{
  throw new Error(`Comando desconocido: ${command}. Usa scan, ingest, validate o report.`);
}}

async function validateCollection(){
  const index=knowledgeEngine.getIndexSnapshot();
  const collectionSources=index.documents.filter(source=>source.collectionIds.includes(COGNITIVE_COLLECTION_ID));
  const active=collectionSources.filter(source=>source.isActive&&source.processingStatus==='indexed');
  const chunks=index.chunks.filter(chunk=>chunk.collectionId===COGNITIVE_COLLECTION_ID);
  const queries=[
    '¿Cómo reconoce una persona experta una situación y decide bajo presión?',
    '¿Qué diferencia existe entre análisis deliberado y reconocimiento de patrones?',
    '¿Cómo debería estructurarse un caso para apoyar decisiones futuras?',
    '¿Cómo debe usar Executive Review casos similares sin copiar soluciones fuera de contexto?',
    '¿Qué señales indican que un proyecto necesita experimentación antes que planificación detallada?',
    '¿Cómo documentar qué funcionó y qué falló después de ejecutar una intervención?',
    '¿Qué modos de pensamiento necesita un Productor Ejecutivo según tipo y etapa?',
  ];
  const queryResults=[];
  for(const query of queries){
    const hits=await knowledgeEngine.search({text:query,collectionIds:[COGNITIVE_COLLECTION_ID],purpose:'ingestion_validation',limit:5});
    queryResults.push({query,sources:[...new Set(hits.map(hit=>hit.source.title))],chunks:hits.map(hit=>hit.chunk.id),ranking:hits.map(hit=>hit.score),collection:[...new Set(hits.map(hit=>hit.chunk.collectionId))],result:hits.length?'relevant_results':'no_results',estimatedRelevance:hits.length?Math.min(1,hits[0].score/30):0});
  }
  const duplicateChecksums=findDuplicates(index.documents.filter(source=>source.checksum),'checksum');
  const duplicateUrls=findDuplicates(index.documents.filter(source=>source.canonicalUrl&&!source.canonicalUrl.startsWith('library://')),'canonicalUrl');
  const failures=index.failures.filter(failure=>failure.file.includes('investigacion_cognitiva_y_casos'));
  const checks={docx:active.filter(source=>source.documentType==='docx').length,pdf:active.filter(source=>source.documentType==='pdf').length,chunks:chunks.length,metadataOnly:collectionSources.filter(source=>source.processingStatus==='metadata_registered').length,reasoningTagged:chunks.filter(chunk=>chunk.reasoningModes.length>0).length,headingPaths:chunks.filter(chunk=>chunk.headingPath.length>0).length,checksums:chunks.filter(chunk=>Boolean(chunk.checksum)).length,failures:failures.length};
  const cacheValidation=await validateCache();
  return{valid:checks.docx===4&&checks.pdf===7&&checks.chunks>0&&checks.failures===0&&queryResults.every(result=>result.result==='relevant_results')&&cacheValidation.roundTrip,collectionId:COGNITIVE_COLLECTION_ID,sourcesDetected:collectionSources.length,sourcesIndexed:active.length,chunks:chunks.length,checks,duplicates:{checksums:duplicateChecksums,canonicalUrls:duplicateUrls},failures,queryResults,openAlex:{configured:Boolean(process.env.OPENALEX_API_KEY),keyExposed:false},cache:cacheValidation};
}

async function publishToSupabase(){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL;const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!serviceKey)return{status:'skipped',reason:'Configura SUPABASE_SERVICE_ROLE_KEY solo en el entorno administrativo para publicar el índice. El índice local sí fue actualizado.'};
  const index=knowledgeEngine.getIndexSnapshot();const headers={apikey:serviceKey,authorization:`Bearer ${serviceKey}`,'content-type':'application/json',prefer:'resolution=merge-duplicates,return=minimal'};
  const sources=index.documents.map(source=>({id:source.id,collection_id:source.collectionId,collection_ids:source.collectionIds,title:source.title,institution:source.institution,author:source.author,publication_date:source.publicationDate,year:source.year,language:source.language,topic:source.topic,subcategory:source.subcategory,jurisdiction:source.jurisdiction,source_type:source.sourceType,license:source.license,source:source.source,canonical_url:source.canonicalUrl,file:source.filePath||null,file_name:source.fileName||null,file_size:source.fileSize,page_count:source.pageCount,checksum:source.checksum||null,retrieved_at:source.retrievedAt,version:source.version,status:source.status,is_active:source.isActive,processing_status:source.processingStatus,processing_error:source.processingError,indexed_at:source.indexedAt,metadata:source.metadata,created_at:source.createdAt,updated_at:source.updatedAt}));
  await request(`${base}/rest/v1/knowledge_sources?on_conflict=id`,{method:'POST',headers,body:JSON.stringify(sources)});
  for(const source of index.documents.filter(item=>item.isActive)){
    await request(`${base}/rest/v1/knowledge_chunks?source_id=eq.${source.id}`,{method:'DELETE',headers});
    const chunks=index.chunks.filter(chunk=>chunk.sourceId===source.id).map(chunk=>({id:chunk.id,source_id:chunk.sourceId,collection_id:chunk.collectionId,heading:chunk.heading,heading_path:chunk.headingPath,section:chunk.section,section_title:chunk.sectionTitle,page:chunk.page,page_start:chunk.pageStart,page_end:chunk.pageEnd,content:chunk.content,tokens:chunk.tokenCount,topic_tags:chunk.topicTags,keywords:chunk.keywords,reasoning_modes:chunk.reasoningModes,project_types:chunk.projectTypes,project_stages:chunk.projectStages,decision_contexts:chunk.decisionContexts,jurisdictions:chunk.jurisdictions,language:chunk.language,checksum:chunk.checksum,case_data:chunk.caseData??null}));
    for(let offset=0;offset<chunks.length;offset+=250)await request(`${base}/rest/v1/knowledge_chunks?on_conflict=id`,{method:'POST',headers,body:JSON.stringify(chunks.slice(offset,offset+250))});
  }
  const events=index.ingestionReport?.events.map(event=>({file:event.file,checksum:event.checksum||null,result:event.result,chunks:event.chunks,replaced_chunks:event.replacedChunks,pages:event.pages,duration_ms:event.durationMs,message:event.message??null,created_at:event.createdAt}))??[];
  if(events.length)await request(`${base}/rest/v1/knowledge_ingestion_logs`,{method:'POST',headers,body:JSON.stringify(events)});
  return{status:'published',sources:sources.length,chunks:index.chunks.length,logs:events.length};
}

async function request(url:string,init:RequestInit){const response=await fetch(url,init);if(!response.ok)throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0,400)}`);}
function findDuplicates<T extends {id:string}>(items:T[],key:keyof T){const grouped=new Map<string,string[]>();for(const item of items){const value=String(item[key]??'');if(!value)continue;const ids=grouped.get(value)??[];ids.push(item.id);grouped.set(value,ids);}return[...grouped.entries()].filter(([,ids])=>ids.length>1).map(([value,ids])=>({value,ids}));}
async function isJsonReadable(file:string){try{JSON.parse(await readFile(file,'utf8'));return true;}catch{return false;}}
async function validateCache(){const cache=new KnowledgeCache(1);const query={projectType:'validation',projectStage:'validation',knowledgeNeed:'cache round trip',keywords:['cache'],language:'es',country:'CO',preferredYears:[],purpose:'cache_validation'};await cache.set('validation',query,[]);const value=await cache.get('validation',query);return{roundTrip:Array.isArray(value),providerCacheReadable:await isJsonReadable(path.join(KNOWLEDGE_CACHE_PATH,'provider-cache.json'))};}
function print(value:unknown){process.stdout.write(`${JSON.stringify(value,null,2)}\n`);}

void main().catch(error=>{process.stderr.write(`${error instanceof Error?error.stack:error}\n`);process.exitCode=1;});
